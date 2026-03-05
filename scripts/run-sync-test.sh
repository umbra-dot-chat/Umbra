#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# run-sync-test.sh
#
# Runs the Detox sync E2E tests with a local relay server.
# Starts the relay binary, configures Metro to point at it, runs tests,
# then cleans up on exit.
#
# Usage:
#   ./scripts/run-sync-test.sh [--release]
#
# Options:
#   --release   Use ios.release configuration (default: ios.debug)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RELAY_BIN="$PROJECT_DIR/packages/umbra-relay/target/release/umbra-relay"
RELAY_PORT=9090
RELAY_PID=""
METRO_PID=""
DETOX_CONFIG="ios.debug"

# Parse args
for arg in "$@"; do
  case "$arg" in
    --release) DETOX_CONFIG="ios.release" ;;
  esac
done

# ── Cleanup on exit ───────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "🧹 Cleaning up..."
  if [[ -n "$RELAY_PID" ]] && kill -0 "$RELAY_PID" 2>/dev/null; then
    echo "   Stopping relay (PID $RELAY_PID)"
    kill "$RELAY_PID" 2>/dev/null || true
    wait "$RELAY_PID" 2>/dev/null || true
  fi
  if [[ -n "$METRO_PID" ]] && kill -0 "$METRO_PID" 2>/dev/null; then
    echo "   Stopping Metro (PID $METRO_PID)"
    kill "$METRO_PID" 2>/dev/null || true
    wait "$METRO_PID" 2>/dev/null || true
  fi
  # Kill any lingering processes on the relay port
  lsof -ti:"$RELAY_PORT" 2>/dev/null | xargs kill 2>/dev/null || true
  echo "   Done."
}
trap cleanup EXIT INT TERM

cd "$PROJECT_DIR"

# ── Check relay binary ────────────────────────────────────────────────────────
if [[ ! -x "$RELAY_BIN" ]]; then
  echo "Relay binary not found at $RELAY_BIN"
  echo "Building relay..."
  (cd packages/umbra-relay && cargo build --release)
  if [[ ! -x "$RELAY_BIN" ]]; then
    echo "ERROR: Failed to build relay binary"
    exit 1
  fi
fi

# ── Kill any existing processes on ports ──────────────────────────────────────
echo "Checking for existing processes on port $RELAY_PORT and 8081..."
lsof -ti:"$RELAY_PORT" 2>/dev/null | xargs kill 2>/dev/null || true
lsof -ti:8081 2>/dev/null | xargs kill 2>/dev/null || true
sleep 1

# ── Start local relay ────────────────────────────────────────────────────────
echo "Starting local relay on port $RELAY_PORT..."
RELAY_PORT="$RELAY_PORT" "$RELAY_BIN" --port "$RELAY_PORT" &
RELAY_PID=$!
sleep 1

# Wait for relay to be ready
echo "Waiting for relay health check..."
for i in $(seq 1 30); do
  if curl -sf "http://localhost:$RELAY_PORT/health" >/dev/null 2>&1; then
    echo "Relay is ready (http://localhost:$RELAY_PORT)"
    break
  fi
  if ! kill -0 "$RELAY_PID" 2>/dev/null; then
    echo "ERROR: Relay process died"
    exit 1
  fi
  sleep 1
done

if ! curl -sf "http://localhost:$RELAY_PORT/health" >/dev/null 2>&1; then
  echo "ERROR: Relay did not start within 30 seconds"
  exit 1
fi

# ── Start Metro with relay URL env var ────────────────────────────────────────
if [[ "$DETOX_CONFIG" == ios.debug* ]]; then
  echo "Starting Metro bundler with EXPO_PUBLIC_RELAY_URL=http://localhost:$RELAY_PORT..."
  EXPO_PUBLIC_RELAY_URL="http://localhost:$RELAY_PORT" npx expo start --port 8081 --clear &>/dev/null &
  METRO_PID=$!

  # Wait for Metro to be ready
  echo "Waiting for Metro bundler..."
  for i in $(seq 1 60); do
    if curl -sf "http://localhost:8081/status" 2>/dev/null | grep -q "packager-status:running"; then
      echo "Metro is ready (http://localhost:8081)"
      break
    fi
    sleep 2
  done

  if ! curl -sf "http://localhost:8081/status" 2>/dev/null | grep -q "packager-status:running"; then
    echo "ERROR: Metro did not start within 120 seconds"
    exit 1
  fi
fi

# ── Clear old artifacts ──────────────────────────────────────────────────────
rm -rf __tests__/e2e-ios/artifacts 2>/dev/null || true

# ── Boot simulator and bring to foreground ───────────────────────────────────
# Detox uses iPhone 17 Pro — boot it explicitly so the GUI window is visible.
SIM_UDID=$(applesimutils --list --byType "iPhone 17 Pro" --maxResults 1 2>/dev/null \
  | grep '"udid"' | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
if [[ -n "$SIM_UDID" ]]; then
  echo "Booting simulator $SIM_UDID (iPhone 17 Pro)..."
  xcrun simctl boot "$SIM_UDID" 2>/dev/null || true
fi
open -a Simulator
sleep 2

# ── Run Detox tests ──────────────────────────────────────────────────────────
echo ""
echo "Running Detox sync tests (config: $DETOX_CONFIG)..."
echo "================================================="
echo ""

npx detox test \
  -c "$DETOX_CONFIG" \
  __tests__/e2e-ios/sync/sync-full-flow.test.ts \
  --cleanup

echo ""
echo "Tests complete!"
