# genai-tool-basic-live raw conversation

Command:

```sh
just rust-demo genai-tool-basic-live
```

This is the live version of `genai-tool-basic`. The exact provider response can vary, but the message boundaries are the same.

## Message 1 - Rust host -> genai

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Is payments-api healthy right now?"
    }
  ],
  "tools": [
    {
      "name": "get_service_status",
      "description": "Return current health information for an internal service.",
      "schema": {
        "type": "object",
        "properties": {
          "service": {
            "type": "string"
          }
        },
        "required": [
          "service"
        ]
      }
    }
  ]
}
```

## Message 2 - genai -> OpenAI

```json
{
  "model": "gpt-4.1-mini",
  "messages": [
    {
      "role": "user",
      "content": "Is payments-api healthy right now?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_service_status",
        "parameters": {
          "type": "object",
          "properties": {
            "service": {
              "type": "string"
            }
          },
          "required": [
            "service"
          ]
        }
      }
    }
  ]
}
```

## Message 3 - OpenAI -> genai

```json
{
  "role": "assistant",
  "content": null,
  "tool_calls": [
    {
      "id": "call_live_status",
      "type": "function",
      "function": {
        "name": "get_service_status",
        "arguments": "{\"service\":\"payments-api\"}"
      }
    }
  ]
}
```

## Message 4 - genai -> Rust host

```json
{
  "tool_calls": [
    {
      "id": "call_live_status",
      "name": "get_service_status",
      "arguments": {
        "service": "payments-api"
      }
    }
  ]
}
```
