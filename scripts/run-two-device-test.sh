#!/bin/bash
#
# Run two-device friend request E2E tests in parallel.
#
# User A runs on iPhone 17 Pro (ios.release)
# User B runs on iPhone 17 Pro Max (ios.release.userB)
#
# They coordinate via /tmp/umbra-e2e-sync.json.
#
# Usage:
#   ./scripts/run-two-device-test.sh
#

set -euo pipefail
cd "$(dirname "$0")/.."

SYNC_FILE="/tmp/umbra-e2e-sync.json"
LOG_A="/tmp/umbra-e2e-user-a.log"
LOG_B="/tmp/umbra-e2e-user-b.log"

# Clean sync state
echo "{}" > "$SYNC_FILE"

echo "═══════════════════════════════════════════════════════"
echo "  Two-Device Friend Request E2E Test"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  User A → iPhone 17 Pro      (ios.release)"
echo "  User B → iPhone 17 Pro Max  (ios.release.userB)"
echo "  Sync   → $SYNC_FILE"
echo ""
echo "  Logs:"
echo "    User A → $LOG_A"
echo "    User B → $LOG_B"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""

# Run both test processes in parallel
echo "[Runner] Starting User A on iPhone 17 Pro..."
npx detox test \
  --configuration ios.release \
  __tests__/e2e-ios/two-device/friend-two-device-a.test.ts \
  --headless \
  > "$LOG_A" 2>&1 &
PID_A=$!

# Small delay to let User A start and reset the sync file
sleep 2

echo "[Runner] Starting User B on iPhone 17 Pro Max..."
npx detox test \
  --configuration ios.release.userB \
  __tests__/e2e-ios/two-device/friend-two-device-b.test.ts \
  --headless \
  > "$LOG_B" 2>&1 &
PID_B=$!

echo "[Runner] Both processes started (PID A=$PID_A, PID B=$PID_B)"
echo "[Runner] Waiting for completion..."
echo ""

# Wait for both processes
STATUS_A=0
STATUS_B=0

wait $PID_A || STATUS_A=$?
wait $PID_B || STATUS_B=$?

# Print results
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Results"
echo "═══════════════════════════════════════════════════════"

if [ $STATUS_A -eq 0 ]; then
  echo "  User A: ✅ PASS"
else
  echo "  User A: ❌ FAIL (exit code $STATUS_A)"
  echo ""
  echo "  --- User A log (last 20 lines) ---"
  tail -20 "$LOG_A"
  echo ""
fi

if [ $STATUS_B -eq 0 ]; then
  echo "  User B: ✅ PASS"
else
  echo "  User B: ❌ FAIL (exit code $STATUS_B)"
  echo ""
  echo "  --- User B log (last 20 lines) ---"
  tail -20 "$LOG_B"
  echo ""
fi

echo "═══════════════════════════════════════════════════════"

# Sync file final state
echo ""
echo "Sync file final state:"
cat "$SYNC_FILE"
echo ""

# Exit with combined status
exit $((STATUS_A + STATUS_B))
