# Expected output notes

Model wording can vary. Validate the response shape rather than exact text.

## `01-basic-chat.sh`

Expected shape:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "..."
      }
    }
  ]
}
```

## `02-tool-schema.sh`

Expected shape:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "tool_calls": [
          {
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

## `03-tool-result-roundtrip.sh`

Expected shape:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "payments-api is degraded ..."
      }
    }
  ]
}
```
