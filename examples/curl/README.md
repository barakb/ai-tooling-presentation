# OpenAI REST examples with curl

These examples show the raw OpenAI Chat Completions flow behind tool calling.

Each script supports:

- `--dry-run` to print the request payload without making a network call.
- Live mode when `OPENAI_API_KEY` is set.
- `OPENAI_MODEL` override, defaulting to `gpt-4.1-mini`.

## Run dry-run examples

```sh
just curl-dry-run 01-basic-chat
just curl-dry-run 02-tool-schema
just curl-dry-run 03-tool-result-roundtrip
```

## Run live examples

```sh
export OPENAI_API_KEY=...
export OPENAI_MODEL=gpt-4.1-mini

just curl-demo 01-basic-chat
just curl-demo 02-tool-schema
just curl-demo 03-tool-result-roundtrip
```

## What each example teaches

| Script | Purpose |
| --- | --- |
| `01-basic-chat.sh` | Minimal model request without tools. |
| `02-tool-schema.sh` | Sends a tool schema and asks the model to request a tool call. |
| `03-tool-result-roundtrip.sh` | Shows the second half of the loop: host returns a tool result and asks for the final answer. |

The output can vary by model. The important structure is whether the response contains normal assistant text, a `tool_calls` array, or final text grounded in a tool result.
