set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

install:
  npm install

slides:
  npm run dev

build-slides:
  npm run build

preview:
  npm run preview

curl-demo name="01-basic-chat":
  #!/usr/bin/env bash
  set -euo pipefail
  case "{{name}}" in
    list)
      printf '%s\n' \
        "OpenAI curl demos:" \
        "  01-basic-chat" \
        "  02-tool-schema" \
        "  03-tool-result-roundtrip"
      ;;
    01-basic-chat|02-tool-schema|03-tool-result-roundtrip)
      bash "examples/curl/{{name}}.sh"
      ;;
    *)
      echo "Unknown curl demo: {{name}}" >&2
      echo "Run: just curl-demo list" >&2
      exit 1
      ;;
  esac

curl-dry-run name="01-basic-chat":
  #!/usr/bin/env bash
  set -euo pipefail
  case "{{name}}" in
    list)
      just curl-demo list
      ;;
    01-basic-chat|02-tool-schema|03-tool-result-roundtrip)
      bash "examples/curl/{{name}}.sh" --dry-run
      ;;
    *)
      echo "Unknown curl dry-run demo: {{name}}" >&2
      echo "Run: just curl-dry-run list" >&2
      exit 1
      ;;
  esac

rust-build:
  cargo build --manifest-path examples/rust/Cargo.toml

rust-test:
  cargo test --manifest-path examples/rust/Cargo.toml

rust-demo name="genai-tool-basic":
  #!/usr/bin/env bash
  set -euo pipefail
  case "{{name}}" in
    list)
      printf '%s\n' \
        "Rust demos:" \
        "  genai-tool-basic           dry-run rust-genai tool schema request" \
        "  genai-tool-roundtrip       dry-run rust-genai tool result round trip" \
        "  genai-tool-basic-live      live rust-genai tool schema request" \
        "  genai-tool-roundtrip-live  live rust-genai tool result round trip" \
        "  mini-copilot-agent-loop    dry-run mini-agent loop" \
        "  mini-copilot-hooks         dry-run hook trace" \
        "  mini-copilot-ask           dry-run local file question" \
        "  mini-copilot-veto          dry-run expected user veto" \
        "  mini-copilot-http          start dry-run HTTP server" \
        "  mini-copilot-cli           alias for mini-copilot-agent-loop"
      ;;
    genai-tool-basic)
      cargo run --manifest-path examples/rust/Cargo.toml -p genai-tool-basic -- --dry-run
      ;;
    genai-tool-roundtrip)
      cargo run --manifest-path examples/rust/Cargo.toml -p genai-tool-roundtrip -- --dry-run
      ;;
    genai-tool-basic-live)
      cargo run --manifest-path examples/rust/Cargo.toml -p genai-tool-basic
      ;;
    genai-tool-roundtrip-live)
      cargo run --manifest-path examples/rust/Cargo.toml -p genai-tool-roundtrip
      ;;
    mini-copilot-agent-loop|mini-copilot-cli)
      cargo run --manifest-path examples/rust/Cargo.toml -p mini-copilot-cli -- --dry-run demo agent-loop
      ;;
    mini-copilot-hooks)
      cargo run --manifest-path examples/rust/Cargo.toml -p mini-copilot-cli -- --dry-run demo hooks
      ;;
    mini-copilot-ask)
      cargo run --manifest-path examples/rust/Cargo.toml -p mini-copilot-cli -- --dry-run ask "Summarize service_status.md"
      ;;
    mini-copilot-veto)
      set +e
      cargo run --manifest-path examples/rust/Cargo.toml -p mini-copilot-cli -- --dry-run --veto-file-access ask "Summarize service_status.md"
      status=$?
      set -e
      if [[ "$status" -eq 0 ]]; then
        echo "Expected the veto demo to deny file access, but it succeeded." >&2
        exit 1
      fi
      echo "Veto demo denied file access as expected."
      ;;
    mini-copilot-http)
      cargo run --manifest-path examples/rust/Cargo.toml -p mini-copilot-http -- --dry-run
      ;;
    *)
      echo "Unknown Rust demo: {{name}}" >&2
      echo "Run: just rust-demo list" >&2
      exit 1
      ;;
  esac

rust-http:
  just rust-demo mini-copilot-http

http-demo name="list":
  #!/usr/bin/env bash
  set -euo pipefail
  base_url="http://127.0.0.1:3000"
  case "{{name}}" in
    list)
      printf '%s\n' \
        "HTTP demos (start server first with: just rust-demo mini-copilot-http):" \
        "  health" \
        "  agent-loop" \
        "  hooks" \
        "  ask" \
        "  veto"
      ;;
    health)
      curl -sS "$base_url/health"
      printf '\n'
      ;;
    agent-loop)
      curl -sS -X POST "$base_url/demo/agent-loop"
      printf '\n'
      ;;
    hooks)
      curl -sS -X POST "$base_url/demo/hooks"
      printf '\n'
      ;;
    ask)
      curl -sS "$base_url/ask" \
        -H 'Content-Type: application/json' \
        -d '{"prompt":"Summarize service_status.md"}'
      printf '\n'
      ;;
    veto)
      curl -sS "$base_url/ask" \
        -H 'Content-Type: application/json' \
        -d '{"prompt":"Summarize service_status.md","veto_file_access":true}'
      printf '\n'
      ;;
    *)
      echo "Unknown HTTP demo: {{name}}" >&2
      echo "Run: just http-demo list" >&2
      exit 1
      ;;
  esac

check:
  bash scripts/check.sh
