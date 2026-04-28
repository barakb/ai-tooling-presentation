use genai::chat::{Tool, ToolResponse};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::fmt::{Display, Formatter};
use std::fs;
use std::path::{Component, Path, PathBuf};

pub type Result<T> = std::result::Result<T, AgentError>;

#[derive(Debug)]
pub enum AgentError {
    InvalidArguments(String),
    InvalidPath(String),
    Io(std::io::Error),
    UnknownTool(String),
}

impl Display for AgentError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            AgentError::InvalidArguments(message) => write!(f, "invalid arguments: {message}"),
            AgentError::InvalidPath(path) => {
                write!(f, "path is outside the scoped workspace: {path}")
            }
            AgentError::Io(err) => write!(f, "io error: {err}"),
            AgentError::UnknownTool(name) => write!(f, "unknown tool: {name}"),
        }
    }
}

impl std::error::Error for AgentError {}

impl From<std::io::Error> for AgentError {
    fn from(value: std::io::Error) -> Self {
        AgentError::Io(value)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum HookPoint {
    BeforeModel,
    AfterModel,
    BeforeTool,
    AfterTool,
    OnError,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct HookEvent {
    pub point: HookPoint,
    pub hook: String,
    pub message: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct Transcript {
    pub events: Vec<HookEvent>,
}

impl Transcript {
    pub fn record(
        &mut self,
        point: HookPoint,
        hook: impl Into<String>,
        message: impl Into<String>,
    ) {
        self.events.push(HookEvent {
            point,
            hook: hook.into(),
            message: message.into(),
        });
    }
}

pub trait Hook: Send + Sync {
    fn name(&self) -> &'static str;
    fn call(&self, point: HookPoint, message: &str, transcript: &mut Transcript) -> Result<()>;
}

#[derive(Debug, Default)]
pub struct TraceHook;

impl Hook for TraceHook {
    fn name(&self) -> &'static str {
        "trace"
    }

    fn call(&self, point: HookPoint, message: &str, transcript: &mut Transcript) -> Result<()> {
        transcript.record(point, self.name(), message);
        Ok(())
    }
}

#[derive(Default)]
pub struct HookRegistry {
    hooks: Vec<Box<dyn Hook>>,
}

impl HookRegistry {
    pub fn with_default_hooks() -> Self {
        let mut registry = Self::default();
        registry.add(TraceHook);
        registry
    }

    pub fn add(&mut self, hook: impl Hook + 'static) {
        self.hooks.push(Box::new(hook));
    }

    pub fn emit(&self, point: HookPoint, message: &str, transcript: &mut Transcript) -> Result<()> {
        for hook in &self.hooks {
            hook.call(point.clone(), message, transcript)?;
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ToolCall {
    pub name: String,
    pub arguments: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ToolResult {
    pub name: String,
    pub content: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AgentResponse {
    pub answer: String,
    pub selected_tool: ToolCall,
    pub tool_result: ToolResult,
    pub transcript: Transcript,
}

#[derive(Debug, Clone)]
pub struct ToolRegistry {
    root: PathBuf,
}

impl ToolRegistry {
    pub fn new(root: impl Into<PathBuf>) -> Result<Self> {
        let root = root.into();
        if !root.exists() {
            fs::create_dir_all(&root)?;
        }
        let root = fs::canonicalize(root)?;
        Ok(Self { root })
    }

    pub fn schemas(&self) -> Vec<Value> {
        vec![
            json!({
                "name": "list_files",
                "description": "List files in the scoped demo workspace.",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "additionalProperties": false
                }
            }),
            json!({
                "name": "read_file",
                "description": "Read a UTF-8 text file from the scoped demo workspace.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": { "type": "string" }
                    },
                    "required": ["path"],
                    "additionalProperties": false
                }
            }),
            json!({
                "name": "write_file",
                "description": "Write a UTF-8 text file inside the scoped demo workspace.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": { "type": "string" },
                        "content": { "type": "string" }
                    },
                    "required": ["path", "content"],
                    "additionalProperties": false
                }
            }),
        ]
    }

    pub fn genai_tools(&self) -> Vec<Tool> {
        self.schemas()
            .into_iter()
            .filter_map(|schema| {
                let name = schema.get("name")?.as_str()?.to_string();
                let description = schema.get("description")?.as_str()?.to_string();
                let parameters = schema.get("parameters")?.clone();
                Some(
                    Tool::new(name)
                        .with_description(description)
                        .with_schema(parameters),
                )
            })
            .collect()
    }

    pub fn execute(&self, call: &ToolCall) -> Result<ToolResult> {
        match call.name.as_str() {
            "list_files" => self.list_files(),
            "read_file" => {
                let path = required_string(&call.arguments, "path")?;
                self.read_file(path)
            }
            "write_file" => {
                let path = required_string(&call.arguments, "path")?;
                let content = required_string(&call.arguments, "content")?;
                self.write_file(path, content)
            }
            other => Err(AgentError::UnknownTool(other.to_string())),
        }
    }

    fn list_files(&self) -> Result<ToolResult> {
        let mut files = Vec::new();
        collect_files(&self.root, &self.root, &mut files)?;
        files.sort();
        Ok(ToolResult {
            name: "list_files".to_string(),
            content: json!({ "files": files }),
        })
    }

    fn read_file(&self, relative_path: &str) -> Result<ToolResult> {
        let path = self.scoped_existing_path(relative_path)?;
        let content = fs::read_to_string(path)?;
        Ok(ToolResult {
            name: "read_file".to_string(),
            content: json!({
                "path": relative_path,
                "content": content
            }),
        })
    }

    fn write_file(&self, relative_path: &str, content: &str) -> Result<ToolResult> {
        let path = self.scoped_write_path(relative_path)?;
        if path.exists() && fs::symlink_metadata(&path)?.file_type().is_symlink() {
            return Err(AgentError::InvalidPath(relative_path.to_string()));
        }
        fs::write(path, content)?;
        Ok(ToolResult {
            name: "write_file".to_string(),
            content: json!({
                "path": relative_path,
                "bytes": content.len()
            }),
        })
    }

    fn scoped_path(&self, relative_path: &str) -> Result<PathBuf> {
        let path = Path::new(relative_path);
        if path.as_os_str().is_empty() || path.is_absolute() {
            return Err(AgentError::InvalidPath(relative_path.to_string()));
        }

        for component in path.components() {
            match component {
                Component::Normal(_) | Component::CurDir => {}
                Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                    return Err(AgentError::InvalidPath(relative_path.to_string()));
                }
            }
        }

        Ok(self.root.join(path))
    }

    fn scoped_existing_path(&self, relative_path: &str) -> Result<PathBuf> {
        let path = self.scoped_path(relative_path)?;
        let canonical = fs::canonicalize(&path)?;

        if !canonical.starts_with(&self.root) {
            return Err(AgentError::InvalidPath(relative_path.to_string()));
        }

        Ok(canonical)
    }

    fn scoped_write_path(&self, relative_path: &str) -> Result<PathBuf> {
        let path = self.scoped_path(relative_path)?;
        let relative = path
            .strip_prefix(&self.root)
            .map_err(|_| AgentError::InvalidPath(relative_path.to_string()))?;
        let mut current = self.root.clone();
        let mut components = relative.components().peekable();

        while let Some(component) = components.next() {
            let is_final = components.peek().is_none();
            if is_final {
                break;
            }

            current.push(component.as_os_str());

            if current.exists() {
                let metadata = fs::symlink_metadata(&current)?;
                if metadata.file_type().is_symlink() || !metadata.is_dir() {
                    return Err(AgentError::InvalidPath(relative_path.to_string()));
                }

                let canonical = fs::canonicalize(&current)?;
                if !canonical.starts_with(&self.root) {
                    return Err(AgentError::InvalidPath(relative_path.to_string()));
                }
            } else {
                fs::create_dir(&current)?;
            }
        }

        Ok(path)
    }
}

pub struct Agent {
    hooks: HookRegistry,
    tools: ToolRegistry,
}

impl Agent {
    pub fn new(workspace: impl Into<PathBuf>) -> Result<Self> {
        Ok(Self {
            hooks: HookRegistry::with_default_hooks(),
            tools: ToolRegistry::new(workspace)?,
        })
    }

    pub fn ask(&self, prompt: &str) -> Result<AgentResponse> {
        let mut transcript = Transcript::default();

        self.hooks.emit(
            HookPoint::BeforeModel,
            &format!("planning tool call for prompt: {prompt}"),
            &mut transcript,
        )?;

        let selected_tool = plan_tool_call(prompt);

        self.hooks.emit(
            HookPoint::AfterModel,
            &format!("dry-run model selected tool: {}", selected_tool.name),
            &mut transcript,
        )?;

        self.hooks.emit(
            HookPoint::BeforeTool,
            &format!("validating and executing tool: {}", selected_tool.name),
            &mut transcript,
        )?;

        let tool_result = match self.tools.execute(&selected_tool) {
            Ok(result) => result,
            Err(err) => {
                self.hooks
                    .emit(HookPoint::OnError, &err.to_string(), &mut transcript)?;
                return Err(err);
            }
        };

        self.hooks.emit(
            HookPoint::AfterTool,
            &format!("tool result captured: {}", tool_result.name),
            &mut transcript,
        )?;

        let answer = summarize_result(prompt, &tool_result);

        Ok(AgentResponse {
            answer,
            selected_tool,
            tool_result,
            transcript,
        })
    }

    pub fn genai_tools(&self) -> Vec<Tool> {
        self.tools.genai_tools()
    }
}

pub fn as_genai_tool_response(call_id: impl Into<String>, result: &ToolResult) -> ToolResponse {
    ToolResponse::new(call_id.into(), result.content.to_string())
}

fn plan_tool_call(prompt: &str) -> ToolCall {
    let lower = prompt.to_lowercase();

    if lower.contains("write") || lower.contains("create") {
        return ToolCall {
            name: "write_file".to_string(),
            arguments: json!({
                "path": "notes/agent-summary.md",
                "content": "Generated by the mini-agent dry-run demo.\n"
            }),
        };
    }

    if lower.contains("read") || lower.contains("summarize") || lower.contains("status") {
        return ToolCall {
            name: "read_file".to_string(),
            arguments: json!({ "path": "service_status.md" }),
        };
    }

    ToolCall {
        name: "list_files".to_string(),
        arguments: json!({}),
    }
}

fn summarize_result(prompt: &str, result: &ToolResult) -> String {
    match result.name.as_str() {
        "read_file" => {
            let path = result
                .content
                .get("path")
                .and_then(Value::as_str)
                .unwrap_or("file");
            let content = result
                .content
                .get("content")
                .and_then(Value::as_str)
                .unwrap_or("");
            format!(
                "Dry-run answer for '{prompt}': {path} says {}",
                first_sentence(content)
            )
        }
        "write_file" => {
            let path = result
                .content
                .get("path")
                .and_then(Value::as_str)
                .unwrap_or("file");
            format!("Dry-run answer for '{prompt}': wrote {path} inside the scoped workspace.")
        }
        "list_files" => {
            format!("Dry-run answer for '{prompt}': listed files in the scoped workspace.")
        }
        _ => format!("Dry-run answer for '{prompt}': tool result received."),
    }
}

fn first_sentence(content: &str) -> String {
    content
        .lines()
        .find(|line| !line.trim().is_empty() && !line.starts_with('#'))
        .unwrap_or("the file is empty")
        .trim()
        .trim_end_matches('.')
        .to_string()
}

fn required_string<'a>(value: &'a Value, field: &str) -> Result<&'a str> {
    value
        .get(field)
        .and_then(Value::as_str)
        .ok_or_else(|| AgentError::InvalidArguments(format!("missing string field '{field}'")))
}

fn collect_files(root: &Path, current: &Path, files: &mut Vec<String>) -> Result<()> {
    for entry in fs::read_dir(current)? {
        let entry = entry?;
        let path = entry.path();
        let metadata = fs::symlink_metadata(&path)?;

        if metadata.file_type().is_symlink() {
            continue;
        }

        if metadata.is_dir() {
            collect_files(root, &path, files)?;
        } else if metadata.is_file() {
            let relative = path
                .strip_prefix(root)
                .map_err(|_| AgentError::InvalidPath(path.display().to_string()))?;
            files.push(relative.display().to_string());
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_parent_directory_paths() {
        let temp = tempfile::tempdir().expect("tempdir");
        let registry = ToolRegistry::new(temp.path()).expect("registry");
        let call = ToolCall {
            name: "read_file".to_string(),
            arguments: json!({ "path": "../secret.txt" }),
        };

        let err = registry
            .execute(&call)
            .expect_err("path should be rejected");
        assert!(matches!(err, AgentError::InvalidPath(_)));
    }

    #[test]
    fn lists_files_inside_scoped_workspace() {
        let temp = tempfile::tempdir().expect("tempdir");
        fs::write(temp.path().join("a.txt"), "a").expect("write fixture");
        fs::create_dir_all(temp.path().join("nested")).expect("nested");
        fs::write(temp.path().join("nested/b.txt"), "b").expect("write nested fixture");

        let registry = ToolRegistry::new(temp.path()).expect("registry");
        let result = registry
            .execute(&ToolCall {
                name: "list_files".to_string(),
                arguments: json!({}),
            })
            .expect("list files");

        assert_eq!(result.content["files"], json!(["a.txt", "nested/b.txt"]));
    }

    #[test]
    fn agent_records_hook_events() {
        let temp = tempfile::tempdir().expect("tempdir");
        fs::write(
            temp.path().join("service_status.md"),
            "payments-api is degraded.",
        )
        .expect("fixture");

        let agent = Agent::new(temp.path()).expect("agent");
        let response = agent.ask("Summarize status").expect("response");

        let points: Vec<_> = response
            .transcript
            .events
            .iter()
            .map(|event| event.point.clone())
            .collect();

        assert_eq!(
            points,
            vec![
                HookPoint::BeforeModel,
                HookPoint::AfterModel,
                HookPoint::BeforeTool,
                HookPoint::AfterTool
            ]
        );
    }

    #[cfg(unix)]
    #[test]
    fn rejects_symlink_escape_on_read() {
        use std::os::unix::fs::symlink;

        let temp = tempfile::tempdir().expect("tempdir");
        let outside = tempfile::tempdir().expect("outside tempdir");
        fs::write(outside.path().join("secret.txt"), "secret").expect("outside fixture");
        symlink(outside.path(), temp.path().join("leak")).expect("symlink");

        let registry = ToolRegistry::new(temp.path()).expect("registry");
        let err = registry
            .execute(&ToolCall {
                name: "read_file".to_string(),
                arguments: json!({ "path": "leak/secret.txt" }),
            })
            .expect_err("symlink should be rejected");

        assert!(matches!(err, AgentError::InvalidPath(_)));
    }
}
