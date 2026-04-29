# http agent-loop raw conversation

Command:

```sh
just http-demo agent-loop
```

## Message 1 - Client -> HTTP server

```http
POST /demo/agent-loop HTTP/1.1
Host: 127.0.0.1:3000
```

## Message 2 - HTTP server -> AgentLoop

```json
{
  "prompt": "Summarize service status",
  "mode": "dry-run"
}
```

## Message 3 - AgentLoop -> Model planner

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
    "content": "# Service status\n\npayments-api is degraded while a database failover is in progress.\n"
  }
}
```

## Message 7 - AgentLoop -> HTTP server -> Client

```json
{
  "answer": "service_status.md says payments-api is degraded while a database failover is in progress",
  "selected_tool": {
    "name": "read_file",
    "arguments": {
      "path": "service_status.md"
    }
  },
  "tool_result": {
    "name": "read_file",
    "content": {
      "path": "service_status.md"
    }
  }
}
```
