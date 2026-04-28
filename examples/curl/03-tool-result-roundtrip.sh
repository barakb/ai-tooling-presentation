#!/usr/bin/env bash
set -euo pipefail

MODEL="${OPENAI_MODEL:-gpt-4.1-mini}"
DRY_RUN=0

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

payload="$(cat <<JSON
{
  "model": "${MODEL}",
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
            "arguments": "{\\"service\\":\\"payments-api\\"}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "call_demo_status",
      "name": "get_service_status",
      "content": "{\\"service\\":\\"payments-api\\",\\"status\\":\\"degraded\\",\\"latency_ms\\":420,\\"incident\\":\\"database failover in progress\\",\\"next_update_minutes\\":15}"
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
            "service": { "type": "string" }
          },
          "required": ["service"],
          "additionalProperties": false
        }
      }
    }
  ],
  "tool_choice": "none",
  "temperature": 0.1
}
JSON
)"

if [[ "${DRY_RUN}" == "1" ]]; then
  printf '%s\n' "${payload}"
  exit 0
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is required for live mode. Use --dry-run to print the payload." >&2
  exit 1
fi

curl -sS https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${OPENAI_API_KEY}" \
  -d "${payload}"
