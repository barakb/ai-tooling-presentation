# http veto raw conversation

Command:

```sh
just http-demo veto
```

## Message 1 - Client -> HTTP server

```http
POST /ask HTTP/1.1
Host: 127.0.0.1:3000
Content-Type: application/json

{"prompt":"Summarize service_status.md","veto_file_access":true}
```

## Message 2 - HTTP server -> Agent

```json
{
  "prompt": "Summarize service_status.md",
  "policy": {
    "veto_file_access": true
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

## Message 5 - Policy -> Agent

```json
{
  "decision": "deny",
  "reason": "User vetoed local file access before read_file could run.",
  "tool_was_executed": false
}
```

## Message 6 - HTTP server -> Client

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
```

```json
{
  "error": "Access denied before executing read_file."
}
```
