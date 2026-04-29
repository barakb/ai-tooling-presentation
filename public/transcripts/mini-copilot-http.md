# mini-copilot-http raw conversation

Command:

```sh
just rust-demo mini-copilot-http
```

## Message 1 - Terminal -> just

```json
{
  "command": "just rust-demo mini-copilot-http"
}
```

## Message 2 - just -> Axum server process

```json
{
  "command": "cargo run --manifest-path examples/rust/Cargo.toml -p mini-copilot-http -- --dry-run",
  "bind": "127.0.0.1:3000",
  "mode": "dry-run"
}
```

## Message 3 - Axum server -> Terminal

```json
{
  "status": "listening",
  "address": "127.0.0.1:3000",
  "available_routes": [
    "GET /health",
    "POST /ask",
    "POST /demo/agent-loop",
    "POST /demo/hooks"
  ]
}
```
