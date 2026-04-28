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
              "type": "string",
              "description": "The service name, for example payments-api."
            }
          },
          "required": ["service"],
          "additionalProperties": false
        }
      }
    }
  ],
  "tool_choice": "auto",
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
