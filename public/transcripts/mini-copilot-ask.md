# mini-copilot-ask raw messages

Command:

```sh
just rust-demo mini-copilot-ask
```

This is the raw message flow shown on slide `#/12/11`. The demo is deterministic and asks the local mini-agent to answer a question about `service_status.md`.

## Message 1 - CLI request to the local agent

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

## Message 2 - Policy allows local file access

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

## Message 3 - Agent selects the scoped file tool

```json
{
  "selected_tool": {
    "name": "read_file",
    "arguments": {
      "path": "service_status.md"
    }
  }
}
```

## Message 4 - ToolRegistry validates the workspace read

```json
{
  "workspace_access": {
    "requested_path": "service_status.md",
    "scope": "examples/rust/fixtures/workspace",
    "checks": [
      "canonicalize",
      "stay_under_workspace_root"
    ],
    "operation": "read"
  }
}
```

## Message 5 - Workspace returns file content

```json
{
  "tool_result": {
    "name": "read_file",
    "content": {
      "path": "service_status.md",
      "content": "# Service status\n\npayments-api is degraded while a database failover is in progress.\n\n- Current latency: 420 ms\n- Next update: 15 minutes\n- Customer impact: checkout retries may be slower than normal\n"
    }
  }
}
```

## Message 6 - Agent returns the final CLI JSON

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
