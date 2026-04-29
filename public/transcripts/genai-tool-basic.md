# genai-tool-basic raw conversation

Command:

```sh
just rust-demo genai-tool-basic
```

## Message 1 - CLI -> Rust host

```json
{
  "command": "genai-tool-basic --dry-run",
  "prompt": "Is payments-api healthy right now?"
}
```

## Message 2 - Rust host -> genai

```json
{
  "chat_request": {
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
}
```

## Message 3 - genai -> Model provider

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

## Message 4 - Model provider -> genai

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
  ]
}
```

## Message 5 - Rust host -> Terminal

```json
{
  "requested_tool": "get_service_status",
  "arguments": {
    "service": "payments-api"
  }
}
```
