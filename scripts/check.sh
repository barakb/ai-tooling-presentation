#!/usr/bin/env bash
set -euo pipefail

npm run typecheck
npm run build

bash -n scripts/check.sh
bash -n examples/curl/*.sh

cargo fmt --manifest-path examples/rust/Cargo.toml --all -- --check
cargo test --manifest-path examples/rust/Cargo.toml
