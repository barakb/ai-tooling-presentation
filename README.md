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
- Rust examples: [`examples/rust/README.md`](examples/rust/README.md)

## GitHub Pages

The slide deck is configured to publish to:

```text
https://barakb.github.io/ai-tooling-presentation/
```

Enable GitHub Pages for GitHub Actions in the repository settings if it is not already enabled.
