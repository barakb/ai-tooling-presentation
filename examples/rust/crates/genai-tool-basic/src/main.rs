use genai::Client;
use genai::chat::{ChatMessage, ChatRequest, Tool};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let model = std::env::var("OPENAI_MODEL").unwrap_or_else(|_| "gpt-4.1-mini".to_string());
    let dry_run = std::env::args().any(|arg| arg == "--dry-run");

    let schema = json!({
        "type": "object",
        "properties": {
            "service": {
                "type": "string",
                "description": "The internal service name, for example payments-api."
            }
        },
        "required": ["service"],
        "additionalProperties": false
    });

    if dry_run {
        println!(
            "{}",
            serde_json::to_string_pretty(&json!({
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": "Is the payments-api service healthy right now?"
                    }
                ],
                "tools": [
                    {
                        "name": "get_service_status",
                        "description": "Return current health information for an internal service.",
                        "schema": schema
                    }
                ],
                "note": "Dry-run only. Live mode sends the same schema through rust-genai."
            }))?
        );
        return Ok(());
    }

    if std::env::var("OPENAI_API_KEY").is_err() {
        return Err(
            "OPENAI_API_KEY is required for live mode. Pass --dry-run for offline output.".into(),
        );
    }

    let tool = Tool::new("get_service_status")
        .with_description("Return current health information for an internal service.")
        .with_schema(schema);

    let request = ChatRequest::new(vec![ChatMessage::user(
        "Is the payments-api service healthy right now?",
    )])
    .with_tools(vec![tool]);

    let client = Client::default();
    let response = client.exec_chat(model, request, None).await?;
    let tool_calls = response.into_tool_calls();

    if tool_calls.is_empty() {
        println!("Model returned no tool calls.");
    } else {
        println!("Tool calls requested by model:");
        for call in tool_calls {
            println!("function: {}", call.fn_name);
            println!("arguments: {}", call.fn_arguments);
        }
    }

    Ok(())
}
