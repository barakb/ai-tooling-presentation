use axum::extract::State;
use axum::http::StatusCode;
use axum::routing::{get, post};
use axum::{Json, Router};
use clap::Parser;
use mini_copilot_core::{Agent, AgentPolicy, AgentResponse};
use serde::Deserialize;
use serde_json::{Value, json};
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;

#[derive(Debug, Parser)]
#[command(about = "HTTP API for the mini Copilot-style agent demo")]
struct Args {
    #[arg(long, default_value = "127.0.0.1:3000")]
    bind: SocketAddr,

    #[arg(long, default_value = "examples/rust/fixtures/workspace")]
    workspace: PathBuf,

    #[arg(long, help = "Keep execution deterministic and offline")]
    dry_run: bool,
}

#[derive(Clone)]
struct AppState {
    workspace: Arc<PathBuf>,
    dry_run: bool,
}

#[derive(Debug, Deserialize)]
struct AskRequest {
    prompt: String,
    #[serde(default)]
    veto_file_access: bool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();
    let state = AppState {
        workspace: Arc::new(args.workspace),
        dry_run: args.dry_run,
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/ask", post(ask))
        .route("/demo/agent-loop", post(demo_agent_loop))
        .route("/demo/hooks", post(demo_hooks))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(args.bind).await?;
    eprintln!("mini-copilot-http listening on http://{}", args.bind);
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health(State(state): State<AppState>) -> Json<Value> {
    Json(json!({
        "status": "ok",
        "mode": if state.dry_run { "dry-run" } else { "deterministic" }
    }))
}

async fn ask(
    State(state): State<AppState>,
    Json(request): Json<AskRequest>,
) -> Result<Json<AgentResponse>, (StatusCode, Json<Value>)> {
    run_agent(
        &state,
        &request.prompt,
        AgentPolicy {
            veto_file_access: request.veto_file_access,
        },
    )
    .map(Json)
    .map_err(api_error)
}

async fn demo_agent_loop(
    State(state): State<AppState>,
) -> Result<Json<AgentResponse>, (StatusCode, Json<Value>)> {
    run_agent(
        &state,
        "Summarize the service status file",
        AgentPolicy::default(),
    )
    .map(Json)
    .map_err(api_error)
}

async fn demo_hooks(
    State(state): State<AppState>,
) -> Result<Json<AgentResponse>, (StatusCode, Json<Value>)> {
    run_agent(
        &state,
        "Read service status and show hook trace",
        AgentPolicy::default(),
    )
    .map(Json)
    .map_err(api_error)
}

fn run_agent(
    state: &AppState,
    prompt: &str,
    policy: AgentPolicy,
) -> mini_copilot_core::Result<AgentResponse> {
    let agent = Agent::new((*state.workspace).clone())?;
    agent.ask_with_policy(prompt, policy)
}

fn api_error(err: mini_copilot_core::AgentError) -> (StatusCode, Json<Value>) {
    (
        StatusCode::BAD_REQUEST,
        Json(json!({
            "error": err.to_string()
        })),
    )
}
