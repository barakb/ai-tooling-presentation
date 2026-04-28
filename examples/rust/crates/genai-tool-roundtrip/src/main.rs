use genai::Client;
use genai::chat::{ChatMessage, ChatRequest, Tool, ToolCall, ToolResponse};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let model = std::env::var("OPENAI_MODEL").unwrap_or_else(|_| "gpt-4.1-mini".to_string());
    let dry_run = std::env::args().any(|arg| arg == "--dry-run");

    let schema = json!({
        "type": "object",
        "properties": {
            "service": { "type": "string" }
        },
        "required": ["service"],
        "additionalProperties": false
    });

    let synthetic_tool_result = json!({
        "service": "payments-api",
        "status": "degraded",
        "latency_ms": 420,
        "incident": "database failover in progress",
        "next_update_minutes": 15
    });

    if dry_run {
        println!(
            "{}",
            serde_json::to_string_pretty(&json!({
                "model": model,
                "conversation": [
                    { "role": "user", "content": "Is the payments-api service healthy right now?" },
                    {
                        "role": "assistant",
                        "tool_call": {
                            "call_id": "call_demo_status",
                            "name": "get_service_status",
                            "arguments": { "service": "payments-api" }
                        }
                    },
                    {
                        "role": "tool",
                        "tool_call_id": "call_demo_status",
                        "content": synthetic_tool_result
                    }
                ],
                "note": "Dry-run only. Live mode sends this synthetic tool exchange through rust-genai."
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

    let messages = vec![
        ChatMessage::user("Is the payments-api service healthy right now?"),
        ChatMessage::assistant(vec![ToolCall {
            call_id: "call_demo_status".to_string(),
            fn_name: "get_service_status".to_string(),
            fn_arguments: json!({ "service": "payments-api" }),
            thought_signatures: None,
        }]),
        ChatMessage::from(ToolResponse::new(
            "call_demo_status".to_string(),
            synthetic_tool_result.to_string(),
        )),
    ];

    let request = ChatRequest::new(messages).with_tools(vec![tool]);
    let client = Client::default();
    let response = client.exec_chat(model, request, None).await?;

    println!(
        "{}",
        response
            .first_text()
            .unwrap_or("Model returned no final text.")
    );

    Ok(())
}
