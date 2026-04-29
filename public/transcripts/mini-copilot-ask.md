# mini-copilot-ask raw conversation

Command:

```sh
just rust-demo mini-copilot-ask
```

This is the model/tool conversation shown on slide `#/12/11`. The demo uses a deterministic dry-run planner, but the shape mirrors a model asking the host to read a local file.

## Message 1 - CLI -> Agent

```json
{
  "command": "just rust-demo mini-copilot-ask",
  "argv": [
    "mini-copilot-cli",
    "--dry-run",
    "ask",
    "Summarize service_status.md"
  ],
  "prompt": "Summarize service_status.md"
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
      "description": "Read a file from the scoped workspace.",
      "requires_file_access": true,
      "parameters": {
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

## Message 3 - Model planner -> Agent

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

## Message 4 - Agent policy -> Agent

```json
{
  "policy": {
    "tool": "read_file",
    "requires_file_access": true,
    "veto_file_access": false,
    "decision": "allow"
  }
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
    "content": "# Service status\n\npayments-api is degraded while a database failover is in progress.\n\n- Current latency: 420 ms\n- Next update: 15 minutes\n- Customer impact: checkout retries may be slower than normal\n"
  }
}
```

## Message 7 - Agent -> Model planner

```json
{
  "conversation": [
    {
      "role": "user",
      "content": "Summarize service_status.md"
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

## Message 8 - Model planner -> Agent -> CLI

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
      "path": "service_status.md",
      "content": "# Service status\n\npayments-api is degraded while a database failover is in progress.\n\n- Current latency: 420 ms\n- Next update: 15 minutes\n- Customer impact: checkout retries may be slower than normal\n"
    }
  },
  "transcript": {
    "events": [
      {
        "point": "before_model",
        "hook": "trace",
        "message": "planning tool call for prompt: Summarize service_status.md"
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
        "point": "before_tool",
        "hook": "trace",
        "message": "validating and executing tool: read_file"
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
