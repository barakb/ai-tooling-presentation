# mini-copilot-hooks raw conversation

Command:

```sh
just rust-demo mini-copilot-hooks
```

## Message 1 - CLI -> AgentLoop

```json
{
  "prompt": "Show the hook trace for a service status question",
  "mode": "dry-run"
}
```

## Message 2 - AgentLoop -> TraceHook

```json
{
  "point": "before_model",
  "hook": "trace",
  "message": "planning tool call for prompt: Show the hook trace for a service status question"
}
```

## Message 3 - Model planner -> AgentLoop

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

## Message 4 - AgentLoop -> TraceHook

```json
{
  "point": "after_model",
  "hook": "trace",
  "message": "dry-run model selected tool: read_file"
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

## Message 6 - AgentLoop -> ToolRegistry

```json
{
  "name": "read_file",
  "arguments": {
    "path": "service_status.md"
  }
}
```

## Message 7 - ToolRegistry -> AgentLoop

```json
{
  "name": "read_file",
  "content": {
    "path": "service_status.md",
    "content": "# Service status\n\npayments-api is degraded while a database failover is in progress.\n"
  }
}
```

## Message 8 - AgentLoop -> TraceHook -> CLI

```json
{
  "transcript": {
    "events": [
      {
        "point": "before_model",
        "hook": "trace",
        "message": "planning tool call for prompt: Show the hook trace for a service status question"
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
