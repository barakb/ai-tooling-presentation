# Requirements

This repository is a teaching artifact for explaining LLM tooling to an R&D audience.

## Goals

1. Build a Reveal.js slide deck in this repository.
2. Include runnable OpenAI REST API examples using `curl`.
3. Include runnable Rust examples using [`rust-genai`](https://github.com/jeremychone/rust-genai).
4. Start the presentation by reviewing the GitHub Copilot SDK agent loop:
   - <https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md>
5. Explain hooks and concrete real-world hook use cases:
   - <https://github.com/github/copilot-sdk/blob/main/docs/features/hooks.md>
6. Teach LLM tool-calling from the bottom up:
   - What the model receives.
   - What a tool schema looks like.
   - What a tool call looks like.
   - What the host application must execute.
   - How a tool result is returned to the model.
7. Compare the tool-calling flavor for OpenAI, Anthropic Claude, and Google Gemini.
8. Demonstrate OpenAI tool calling with REST requests and `curl`.
9. Demonstrate the same ideas in Rust with `rust-genai`.
10. Build a mini GitHub Copilot-style API in Rust with:
   - An agent loop.
   - Hooks.
   - Safe demo tools.
   - CLI and HTTP API entry points.
11. Make the slides visually pleasing, easy to understand, and clear for a mixed R&D audience.
12. Document how to install and run everything.
13. Use `just` to automate common commands.
14. Publish the slides with GitHub Pages.

## Confirmed implementation choices

1. Use Vite, Reveal.js, and TypeScript for the slide deck.
2. Use one Rust workspace with multiple crates for Rust demos.
3. Make OpenAI examples runnable.
4. Cover Anthropic Claude and Google Gemini as slide-level syntax comparisons.
5. Add deterministic dry-run/mock mode for demos so checks do not require API keys.
6. Use GitHub Pages for slide publishing.
