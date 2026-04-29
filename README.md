# AI Tooling Presentation

Slides and runnable examples for teaching LLM tool calling, agent loops, hooks, and a mini Copilot-style agent implementation.

## What is included

- A Reveal.js deck built with Vite and TypeScript.
- OpenAI REST examples that can be run with `curl`.
- Rust examples using [`rust-genai`](https://github.com/jeremychone/rust-genai).
- A small Rust mini-agent with an agent loop, hooks, safe demo tools, a CLI, and an HTTP API.
- `just` commands for common workflows.
- GitHub Pages deployment for the slide deck.

## Requirements

- Node.js and npm.
- Rust and Cargo.
- [`just`](https://github.com/casey/just).
- `curl` for REST demos.
- Optional: `OPENAI_API_KEY` for live OpenAI calls.

## Quick start

```sh
just install
just slides
```

The local slide server is powered by Vite. Use:

```sh
just build-slides
```

to build the static deck.

## Presenter flow

Use this sequence for a live walkthrough:

1. Start the slides with `just slides` and open the local Vite URL.
2. Present the mental model slides: why tooling matters, the agent loop, hooks, and concrete hook examples.
3. Move down from the provider comparison slide to show the full OpenAI, Claude, and Gemini JSON message shapes.
4. Run `just curl-dry-run 03-tool-result-roundtrip` while presenting the OpenAI REST flow. Switch to `just curl-demo 03-tool-result-roundtrip` only when `OPENAI_API_KEY` has quota.
5. Move down from the rust-genai slide to inspect the linked `genai` source files and provider adapters.
6. Run the Rust dry-run demos, then show the mini-agent local-file and veto slides.
7. Finish with `just check` to show the repository has deterministic, non-network validation.

## Demo commands

```sh
just curl-dry-run 01-basic-chat
just curl-dry-run 02-tool-schema
just curl-dry-run 03-tool-result-roundtrip
just rust-demo genai-tool-basic
just rust-demo genai-tool-roundtrip
just rust-demo mini-copilot-cli
just check
```

For live OpenAI demos:

```sh
export OPENAI_API_KEY=...
export OPENAI_MODEL=gpt-4.1-mini
just curl-demo 02-tool-schema
```

## Documentation

- Requirements: [`REQUIREMENTS.md`](REQUIREMENTS.md)
- Curl examples: [`examples/curl/README.md`](examples/curl/README.md)
- Curl expected output shapes: [`examples/curl/expected-output/README.md`](examples/curl/expected-output/README.md)
- Rust examples: [`examples/rust/README.md`](examples/rust/README.md)

## Troubleshooting

| Symptom | Meaning | Fix |
| --- | --- | --- |
| `OPENAI_API_KEY is required for live mode` | The script is running live but no key is exported. | Export `OPENAI_API_KEY` or use `just curl-dry-run <name>`. |
| `model_not_found` | `OPENAI_MODEL` is set to a model unavailable to the key/project. | `export OPENAI_MODEL=gpt-4.1-mini` or unset `OPENAI_MODEL` to use the script default. |
| `insufficient_quota` | The key/project reached quota or billing is not enabled. | Use dry-run mode, fix billing/quota, or switch `OPENAI_API_KEY` to a project with quota. |
| `just: command not found` | The `just` command runner is missing. | Install [`just`](https://github.com/casey/just), or run the underlying commands shown in `justfile`. |
| `npm: command not found` or Node build errors | Node.js/npm is missing or dependencies are not installed. | Install Node.js, then run `just install`. |
| `cargo: command not found` | Rust/Cargo is missing. | Install Rust from <https://rustup.rs/>, then run `just rust-test`. |
| GitHub Pages shows an old slide version | Pages deploy may still be running or browser cache is serving an old asset. | Check the `Deploy slides` workflow, then open the URL with `?v=<commit-sha>`. |

## Glossary

| Term | Meaning in this repo |
| --- | --- |
| Agent loop | The host-controlled cycle: user prompt, model response, optional tool call, host execution, tool result, final answer. |
| Host | The application code that calls the model, validates arguments, runs tools, enforces policy, and returns results. |
| Tool schema | JSON schema plus name/description that tells the model which tool can be requested and what arguments are expected. |
| Tool call | Model output asking the host to run a named tool with arguments. |
| Tool result | Host-produced data returned to the model after the tool runs. |
| Hook | A control point before/after model or tool steps where tracing, policy, confirmation, or error handling can run. |
| Tool registry | Host-side catalog of available tools, schemas, and execution functions. |
| Veto | User or policy denial before a tool executes; in the mini-agent demo it prevents local file reads before content is accessed. |

## GitHub Pages

The slide deck is configured to publish to:

```text
https://barakb.github.io/ai-tooling-presentation/
```

Enable GitHub Pages for GitHub Actions in the repository settings if it is not already enabled.
