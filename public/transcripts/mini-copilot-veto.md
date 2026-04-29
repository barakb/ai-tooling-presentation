# mini-copilot-veto raw conversation

Command:

```sh
just rust-demo mini-copilot-veto
```

## Message 1 - CLI -> Agent

```json
{
  "prompt": "Summarize service_status.md",
  "policy": {
    "veto_file_access": true
  }
}
```

## Message 2 - Agent -> Model planner

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

## Message 3 - Model planner -> Agent

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

## Message 4 - Policy -> Agent

```json
{
  "decision": "deny",
  "reason": "User vetoed local file access before read_file could run.",
  "blocked_tool": {
    "name": "read_file",
    "arguments": {
      "path": "service_status.md"
    }
  }
}
```

## Message 5 - Agent -> CLI

```json
{
  "error": {
    "code": "file_access_denied",
    "message": "Access denied before executing read_file."
  },
  "tool_was_executed": false
}
```
