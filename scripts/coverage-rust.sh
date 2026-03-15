#!/bin/bash
# Run Rust coverage with cargo-llvm-cov (local) or cargo-tarpaulin (CI)
set -e

cd packages/umbra-core

if [ "$CI" = "true" ]; then
  echo "=== CI mode: using cargo-tarpaulin ==="
  cargo tarpaulin --out xml --output-dir ../../coverage/
else
  echo "=== Local mode: using cargo-llvm-cov ==="
  cargo llvm-cov --html --output-dir ../../coverage/rust-html
  cargo llvm-cov --lcov --output-path ../../coverage/rust.lcov
  echo "Rust coverage report: coverage/rust-html/index.html"
fi
