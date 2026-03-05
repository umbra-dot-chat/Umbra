#!/bin/bash
#
# Run ALL two-device E2E test pairs sequentially.
#
# Each pair runs two simulator processes in parallel, then moves to the next.
# This is the comprehensive two-device test runner.
#
# Usage:
#   ./scripts/run-two-device-all.sh
#
# Individual pairs:
#   ./scripts/run-two-device-test.sh   — Friend request flow
#   ./scripts/run-dm-test.sh           — DM conversation flow
#   ./scripts/run-send-recv-test.sh    — Sending/receiving messages
#

set -euo pipefail
cd "$(dirname "$0")/.."

SYNC_FILE="/tmp/umbra-e2e-sync.json"
RESULTS=()
PASS_COUNT=0
FAIL_COUNT=0

# ── Helper function to run a test pair ─────────────────────────────────────────
run_pair() {
  local NAME="$1"
  local FILE_A="$2"
  local FILE_B="$3"
  local LOG_A="/tmp/umbra-e2e-${NAME}-a.log"
  local LOG_B="/tmp/umbra-e2e-${NAME}-b.log"

  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  Running: $NAME"
  echo "═══════════════════════════════════════════════════════"
  echo "  User A → $FILE_A"
  echo "  User B → $FILE_B"
  echo ""

  # Clean sync state
  echo "{}" > "$SYNC_FILE"

  # Start User A
  npx detox test \
    --configuration ios.release \
    "$FILE_A" \
    --headless \
    > "$LOG_A" 2>&1 &
  local PID_A=$!

  sleep 2

  # Start User B
  npx detox test \
    --configuration ios.release.userB \
    "$FILE_B" \
    --headless \
    > "$LOG_B" 2>&1 &
  local PID_B=$!

  # Wait for both
  local SA=0 SB=0
  wait $PID_A || SA=$?
  wait $PID_B || SB=$?

  if [ $SA -eq 0 ] && [ $SB -eq 0 ]; then
    RESULTS+=("  ✅ $NAME")
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    RESULTS+=("  ❌ $NAME (A=$SA, B=$SB)")
    FAIL_COUNT=$((FAIL_COUNT + 1))
    [ $SA -ne 0 ] && echo "  --- User A log (last 15 lines) ---" && tail -15 "$LOG_A"
    [ $SB -ne 0 ] && echo "  --- User B log (last 15 lines) ---" && tail -15 "$LOG_B"
  fi
}

echo "═══════════════════════════════════════════════════════"
echo "  Two-Device E2E Test Suite"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  Running all test pairs sequentially."
echo "  Each pair uses iPhone 17 Pro + iPhone 17 Pro Max."

# ── Test Pair 1: Friend Request ──────────────────────────────────────────────
run_pair "friend-request" \
  "__tests__/e2e-ios/two-device/friend-two-device-a.test.ts" \
  "__tests__/e2e-ios/two-device/friend-two-device-b.test.ts"

# ── Test Pair 2: DM Conversation ─────────────────────────────────────────────
run_pair "dm-conversation" \
  "__tests__/e2e-ios/two-device/dm-conversation-device-a.test.ts" \
  "__tests__/e2e-ios/two-device/dm-conversation-device-b.test.ts"

# ── Test Pair 3: Sending / Receiving ─────────────────────────────────────────
run_pair "send-receive" \
  "__tests__/e2e-ios/two-device/sending-messages.test.ts" \
  "__tests__/e2e-ios/two-device/receiving-messages.test.ts"

# ── Test Pair 4: Message Types ───────────────────────────────────────────────
run_pair "message-types" \
  "__tests__/e2e-ios/two-device/message-types.test.ts" \
  "__tests__/e2e-ios/two-device/dm-counterpart-device-b.test.ts"

# ── Test Pair 5: Edit / Delete / Reply ───────────────────────────────────────
run_pair "edit-delete-reply" \
  "__tests__/e2e-ios/two-device/edit-delete-reply.test.ts" \
  "__tests__/e2e-ios/two-device/dm-counterpart-device-b.test.ts"

# ── Test Pair 6: File Attachments ────────────────────────────────────────────
run_pair "file-attachments" \
  "__tests__/e2e-ios/two-device/file-attachments.test.ts" \
  "__tests__/e2e-ios/two-device/dm-counterpart-device-b.test.ts"

# ── Test Pair 7: Recovery Sync ───────────────────────────────────────────────
run_pair "recovery-sync" \
  "__tests__/e2e-ios/two-device/recovery-sync-device-a.test.ts" \
  "__tests__/e2e-ios/two-device/recovery-sync-device-b.test.ts"

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Summary: $PASS_COUNT passed, $FAIL_COUNT failed"
echo "═══════════════════════════════════════════════════════"
for r in "${RESULTS[@]}"; do
  echo "$r"
done
echo "═══════════════════════════════════════════════════════"
echo ""

exit $FAIL_COUNT
