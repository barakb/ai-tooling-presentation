# http ask raw conversation

Command:

```sh
just http-demo ask
```

## Message 1 - Client -> HTTP server

```http
POST /ask HTTP/1.1
Host: 127.0.0.1:3000
Content-Type: application/json

{"prompt":"Summarize service_status.md"}
```

## Message 2 - HTTP server -> Agent

```json
{
  "prompt": "Summarize service_status.md",
  "policy": {
    "veto_file_access": false
  }
}
```

## Message 3 - Agent -> Model planner

```json
{
  "conversation": [
    {
      "role": "user",
      "content": "Summarize service_status.md"
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

## Message 4 - Model planner -> Agent

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

## Message 5 - Agent -> ToolRegistry

```json
{
  "name": "read_file",
  "arguments": {
    "path": "service_status.md"
  }
}
```

## Message 6 - ToolRegistry -> Agent

```json
{
  "name": "read_file",
  "content": {
    "path": "service_status.md",
    "content": "# Service status\n\npayments-api is degraded while a database failover is in progress.\n"
  }
}
```

## Message 7 - Agent -> HTTP server -> Client

```json
{
  "answer": "Dry-run answer for 'Summarize service_status.md': service_status.md says payments-api is degraded while a database failover is in progress",
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
