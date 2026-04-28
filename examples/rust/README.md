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

## Dry-run demos

```sh
cargo run --manifest-path examples/rust/Cargo.toml -p genai-tool-basic -- --dry-run
cargo run --manifest-path examples/rust/Cargo.toml -p genai-tool-roundtrip -- --dry-run
cargo run --manifest-path examples/rust/Cargo.toml -p mini-copilot-cli -- --dry-run demo agent-loop
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
curl -sS http://127.0.0.1:3000/ask \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Summarize service_status.md"}'
```

The mini-agent uses a scoped fixture workspace so file tools cannot read or write outside `examples/rust/fixtures/workspace`.
