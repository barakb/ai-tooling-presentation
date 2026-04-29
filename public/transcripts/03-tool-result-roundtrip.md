# 03-tool-result-roundtrip raw conversation

Command:

```sh
just curl-dry-run 03-tool-result-roundtrip
```

This is the full model/tool conversation behind slide `#/12/4`. The runnable dry-run prints the continuation request, and this file expands it into the whole sequence: model asks for a tool, host runs it, host sends the tool result back, model returns the final answer.

## Message 1 - Host -> OpenAI

```json
{
  "model": "gpt-4.1-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a site reliability assistant. Use tools when service status is needed."
    },
    {
      "role": "user",
      "content": "Is the payments-api service healthy right now?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_service_status",
        "description": "Return current health information for an internal service.",
        "parameters": {
          "type": "object",
          "properties": {
            "service": {
              "type": "string"
            }
          },
          "required": [
            "service"
          ],
          "additionalProperties": false
        }
      }
    }
  ],
  "tool_choice": "auto",
  "temperature": 0.1
}
```

## Message 2 - OpenAI -> Host

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_demo_status",
            "type": "function",
            "function": {
              "name": "get_service_status",
              "arguments": "{\"service\":\"payments-api\"}"
            }
          }
        ]
      }
    }
  ]
}
```

## Message 3 - Host -> Tool

```json
{
  "name": "get_service_status",
  "arguments": {
    "service": "payments-api"
  }
}
```

## Message 4 - Tool -> Host

```json
{
  "service": "payments-api",
  "status": "degraded",
  "latency_ms": 420,
  "incident": "database failover in progress",
  "next_update_minutes": 15
}
```

## Message 5 - Host -> OpenAI

```json
{
  "model": "gpt-4.1-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a site reliability assistant. Summarize tool results for engineers."
    },
    {
      "role": "user",
      "content": "Is the payments-api service healthy right now?"
    },
    {
      "role": "assistant",
      "content": null,
      "tool_calls": [
        {
          "id": "call_demo_status",
          "type": "function",
          "function": {
            "name": "get_service_status",
            "arguments": "{\"service\":\"payments-api\"}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "call_demo_status",
      "name": "get_service_status",
      "content": "{\"service\":\"payments-api\",\"status\":\"degraded\",\"latency_ms\":420,\"incident\":\"database failover in progress\",\"next_update_minutes\":15}"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_service_status",
        "description": "Return current health information for an internal service.",
        "parameters": {
          "type": "object",
          "properties": {
            "service": {
              "type": "string"
            }
          },
          "required": [
            "service"
          ],
          "additionalProperties": false
        }
      }
    }
  ],
  "tool_choice": "none",
  "temperature": 0.1
}
```

## Message 6 - OpenAI -> Host

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "payments-api is currently degraded. The incident is a database failover in progress, latency is about 420 ms, and the next update is expected in 15 minutes."
      }
    }
  ]
}
```
