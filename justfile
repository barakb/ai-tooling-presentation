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
  bash examples/curl/{{name}}.sh

curl-dry-run name="01-basic-chat":
  bash examples/curl/{{name}}.sh --dry-run

rust-build:
  cargo build --manifest-path examples/rust/Cargo.toml

rust-test:
  cargo test --manifest-path examples/rust/Cargo.toml

rust-demo name="genai-tool-basic":
  if [[ "{{name}}" == "mini-copilot-cli" ]]; then \
    cargo run --manifest-path examples/rust/Cargo.toml -p mini-copilot-cli -- --dry-run demo agent-loop; \
  else \
    cargo run --manifest-path examples/rust/Cargo.toml -p {{name}} -- --dry-run; \
  fi

rust-http:
  cargo run --manifest-path examples/rust/Cargo.toml -p mini-copilot-http -- --dry-run

check:
  bash scripts/check.sh
