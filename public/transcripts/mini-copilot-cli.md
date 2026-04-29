# mini-copilot-cli raw conversation

Command:

```sh
just rust-demo mini-copilot-cli
```

`mini-copilot-cli` is an alias for the mini-agent loop demo.

## Message 1 - CLI -> AgentLoop

```json
{
  "prompt": "Summarize service status",
  "mode": "dry-run"
}
```

## Message 2 - AgentLoop -> Model planner

```json
{
  "conversation": [
    {
      "role": "user",
      "content": "Summarize service status"
    }
  ],
  "available_tools": [
    {
      "name": "read_file",
      "requires_file_access": true
    }
  ]
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

## Message 4 - AgentLoop -> ToolRegistry -> AgentLoop

```json
{
  "tool_result": {
    "name": "read_file",
    "content": {
      "path": "service_status.md",
      "content": "# Service status\n\npayments-api is degraded while a database failover is in progress.\n"
    }
  }
}
```

## Message 5 - AgentLoop -> CLI

```json
{
  "answer": "service_status.md says payments-api is degraded while a database failover is in progress",
  "selected_tool": {
    "name": "read_file",
    "arguments": {
      "path": "service_status.md"
    }
  }
}
```
