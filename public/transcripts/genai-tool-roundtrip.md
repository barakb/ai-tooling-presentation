# genai-tool-roundtrip raw conversation

Command:

```sh
just rust-demo genai-tool-roundtrip
```

## Message 1 - Rust host receives model tool intent

```json
{
  "role": "assistant",
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

## Message 2 - Rust host -> Tool

```json
{
  "name": "get_service_status",
  "arguments": {
    "service": "payments-api"
  }
}
```

## Message 3 - Tool -> Rust host

```json
{
  "service": "payments-api",
  "status": "degraded",
  "latency_ms": 420,
  "incident": "database failover in progress"
}
```

## Message 4 - Rust host -> genai

```json
{
  "tool_response": {
    "call_id": "call_demo_status",
    "name": "get_service_status",
    "content": {
      "service": "payments-api",
      "status": "degraded",
      "latency_ms": 420,
      "incident": "database failover in progress"
    }
  }
}
```

## Message 5 - genai -> Model provider

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Is payments-api healthy right now?"
    },
    {
      "role": "assistant",
      "tool_calls": [
        {
          "id": "call_demo_status",
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
      "content": "{\"service\":\"payments-api\",\"status\":\"degraded\",\"latency_ms\":420,\"incident\":\"database failover in progress\"}"
    }
  ]
}
```

## Message 6 - Model provider -> Rust host

```json
{
  "role": "assistant",
  "content": "payments-api is degraded because a database failover is in progress; current latency is around 420 ms."
}
```
