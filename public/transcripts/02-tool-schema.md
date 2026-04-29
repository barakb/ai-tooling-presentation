# 02-tool-schema raw conversation

Command:

```sh
just curl-dry-run 02-tool-schema
```

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

## Message 3 - Host -> Terminal

```json
{
  "tool_calls": [
    {
      "id": "call_demo_status",
      "name": "get_service_status",
      "arguments": {
        "service": "payments-api"
      }
    }
  ],
  "note": "The host has not executed the tool yet."
}
```
