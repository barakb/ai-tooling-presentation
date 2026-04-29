# Rust examples

This workspace contains Rust demos for the presentation.

## Crates

| Crate | Purpose |
| --- | --- |
| `genai-tool-basic` | Sends a tool schema through `rust-genai` and shows the model-requested tool call. |
| `genai-tool-roundtrip` | Demonstrates the second half of the tool loop with a synthetic tool call and tool response. |
| `mini-copilot-core` | Reusable mini-agent loop, hook registry, safe tools, and tests. |
| `mini-copilot-cli` | CLI surface for the mini-agent. |
| `mini-copilot-http` | HTTP API surface for the mini-agent. |

## Mini-agent teaching model

The core crate intentionally names the same concepts used in the slides:

| Concept | Where to look | Role |
| --- | --- | --- |
| `Conversation` | `mini-copilot-core/src/lib.rs` | Carries the user's prompt into the loop. |
| `AgentLoop` | `mini-copilot-core/src/lib.rs` | Runs planning, hooks, policy checks, tool execution, and summarization. |
| `HookContext` | `mini-copilot-core/src/lib.rs` | Describes each hook event before it is recorded in the transcript. |
| `HookRegistry` | `mini-copilot-core/src/lib.rs` | Calls registered hooks at each loop point. |
| `ToolRegistry` | `mini-copilot-core/src/lib.rs` | Exposes schemas and executes scoped file tools. |
| `Transcript` | `mini-copilot-core/src/lib.rs` | Captures visible hook events for demos and tests. |

## Dry-run demos

```sh
cargo run --manifest-path examples/rust/Cargo.toml -p genai-tool-basic -- --dry-run
cargo run --manifest-path examples/rust/Cargo.toml -p genai-tool-roundtrip -- --dry-run
cargo run --manifest-path examples/rust/Cargo.toml -p mini-copilot-cli -- --dry-run demo agent-loop
cargo run --manifest-path examples/rust/Cargo.toml -p mini-copilot-cli -- --dry-run demo hooks
```

## Veto demo

This command intentionally exits with a non-zero status because the simulated user denies local file access before the `read_file` tool can run:

```sh
cargo run --manifest-path examples/rust/Cargo.toml -p mini-copilot-cli -- --dry-run --veto-file-access ask "Summarize service_status.md"
```

## Live rust-genai demos

```sh
export OPENAI_API_KEY=...
export OPENAI_MODEL=gpt-4.1-mini

cargo run --manifest-path examples/rust/Cargo.toml -p genai-tool-basic
cargo run --manifest-path examples/rust/Cargo.toml -p genai-tool-roundtrip
```

## HTTP mini-agent

```sh
cargo run --manifest-path examples/rust/Cargo.toml -p mini-copilot-http -- --dry-run
curl -sS http://127.0.0.1:3000/health
curl -sS -X POST http://127.0.0.1:3000/demo/agent-loop
curl -sS -X POST http://127.0.0.1:3000/demo/hooks
curl -sS http://127.0.0.1:3000/ask \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Summarize service_status.md"}'
curl -sS http://127.0.0.1:3000/ask \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Summarize service_status.md","veto_file_access":true}'
```

The mini-agent uses a scoped fixture workspace so file tools cannot read or write outside `examples/rust/fixtures/workspace`.
