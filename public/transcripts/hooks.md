# http hooks raw conversation

Command:

```sh
just http-demo hooks
```

## Message 1 - Client -> HTTP server

```http
POST /demo/hooks HTTP/1.1
Host: 127.0.0.1:3000
```

## Message 2 - HTTP server -> AgentLoop

```json
{
  "prompt": "Show hook trace",
  "mode": "dry-run"
}
```

## Message 3 - AgentLoop -> TraceHook

```json
{
  "point": "before_model",
  "hook": "trace",
  "message": "planning tool call for prompt: Show hook trace"
}
```

## Message 4 - Model planner -> AgentLoop

```json
{
  "role": "assistant",
  "tool_calls": [
    {
      "id": "call_read_status",
      "name": "read_file",
      "arguments": {
        "path": "service_status.md"
      }
    }
  ]
}
```

## Message 5 - AgentLoop -> TraceHook

```json
{
  "point": "before_tool",
  "hook": "trace",
  "message": "requesting approval for tool: read_file"
}
```

## Message 6 - AgentLoop -> ToolRegistry -> TraceHook

```json
{
  "point": "after_tool",
  "hook": "trace",
  "message": "tool result captured: read_file"
}
```

## Message 7 - HTTP server -> Client

```json
{
  "transcript": {
    "events": [
      {
        "point": "before_model",
        "hook": "trace",
        "message": "planning tool call for prompt: Show hook trace"
      },
      {
        "point": "after_model",
        "hook": "trace",
        "message": "dry-run model selected tool: read_file"
      },
      {
        "point": "before_tool",
        "hook": "trace",
        "message": "requesting approval for tool: read_file"
      },
      {
        "point": "after_tool",
        "hook": "trace",
        "message": "tool result captured: read_file"
      }
    ]
  }
}
```
