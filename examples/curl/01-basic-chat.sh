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
      "content": "You explain LLM tooling to software engineers in concise language."
    },
    {
      "role": "user",
      "content": "In one sentence, what is an LLM tool call?"
    }
  ],
  "temperature": 0.2
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
