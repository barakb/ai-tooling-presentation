# mini-copilot-agent-loop raw conversation

Command:

```sh
just rust-demo mini-copilot-agent-loop
```

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
      "requires_file_access": true,
      "arguments_schema": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string"
          }
        },
        "required": [
          "path"
        ]
      }
    }
  ]
}
```

## Message 3 - Model planner -> AgentLoop

```json
{
  "role": "assistant",
  "content": null,
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

## Message 4 - AgentLoop -> Hooks

```json
{
  "point": "before_tool",
  "hook": "trace",
  "message": "requesting approval for tool: read_file"
}
```

## Message 5 - AgentLoop -> ToolRegistry

```json
{
  "name": "read_file",
  "arguments": {
    "path": "service_status.md"
  }
}
```

## Message 6 - ToolRegistry -> AgentLoop

```json
{
  "name": "read_file",
  "content": {
    "path": "service_status.md",
    "content": "# Service status\n\npayments-api is degraded while a database failover is in progress.\n\n- Current latency: 420 ms\n- Next update: 15 minutes\n- Customer impact: checkout retries may be slower than normal\n"
  }
}
```

## Message 7 - AgentLoop -> Model planner

```json
{
  "conversation": [
    {
      "role": "user",
      "content": "Summarize service status"
    },
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
    },
    {
      "role": "tool",
      "tool_call_id": "call_read_status",
      "name": "read_file",
      "content": "# Service status\n\npayments-api is degraded while a database failover is in progress.\n\n- Current latency: 420 ms\n- Next update: 15 minutes\n- Customer impact: checkout retries may be slower than normal\n"
    }
  ]
}
```

## Message 8 - Model planner -> AgentLoop -> CLI

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
