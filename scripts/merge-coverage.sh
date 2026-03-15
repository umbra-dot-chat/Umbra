#!/bin/bash
# Merge JS + Rust coverage into unified report
set -e

echo "=== Running JS coverage ==="
npx jest --coverage --coverageReporters=lcov --coverageDirectory=coverage/js

echo "=== Running Rust coverage ==="
cd packages/umbra-core
cargo llvm-cov --lcov --output-path ../../coverage/rust.lcov 2>/dev/null || echo "cargo-llvm-cov not installed, skipping Rust coverage"
cd ../..

echo "=== Merging coverage ==="
if command -v lcov &> /dev/null; then
  lcov -a coverage/js/lcov.info -a coverage/rust.lcov -o coverage/unified.lcov 2>/dev/null || echo "Merge failed, check lcov installation"
  genhtml coverage/unified.lcov -o coverage/html 2>/dev/null || echo "HTML generation failed"
  echo "Coverage report: coverage/html/index.html"
else
  echo "lcov not installed. JS coverage: coverage/js/lcov.info, Rust coverage: coverage/rust.lcov"
fi
