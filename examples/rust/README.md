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
just rust-demo list
just rust-demo genai-tool-basic
just rust-demo genai-tool-roundtrip
just rust-demo mini-copilot-agent-loop
just rust-demo mini-copilot-hooks
just rust-demo mini-copilot-ask
```

## Veto demo

This command simulates a user denying local file access before the `read_file` tool can run. The underlying CLI returns a denial error; the `just` recipe treats that expected denial as a successful demo.

```sh
just rust-demo mini-copilot-veto
```

## Live rust-genai demos

```sh
export OPENAI_API_KEY=...
export OPENAI_MODEL=gpt-4.1-mini

just rust-demo genai-tool-basic-live
just rust-demo genai-tool-roundtrip-live
```

## HTTP mini-agent

Start the dry-run server in one terminal:

```sh
just rust-demo mini-copilot-http
```

Then run endpoint demos from another terminal:

```sh
just http-demo list
just http-demo health
just http-demo agent-loop
just http-demo hooks
just http-demo ask
just http-demo veto
```

The mini-agent uses a scoped fixture workspace so file tools cannot read or write outside `examples/rust/fixtures/workspace`.
