#!/bin/bash
#
# Run two-device recovery & settings sync E2E tests in parallel.
#
# Device A runs on iPhone 17 Pro (ios.release)
# Device B runs on iPhone 17 Pro Max (ios.release.userB)
#
# Device A creates an account, captures the seed phrase, changes settings,
# then Device B imports the account and verifies DID and settings synced.
#
# Usage:
#   ./scripts/run-recovery-sync-test.sh
#

set -euo pipefail
cd "$(dirname "$0")/.."

SYNC_FILE="/tmp/umbra-e2e-sync.json"
LOG_A="/tmp/umbra-e2e-recovery-a.log"
LOG_B="/tmp/umbra-e2e-recovery-b.log"

# Clean sync state
echo "{}" > "$SYNC_FILE"

echo "═══════════════════════════════════════════════════════"
echo "  Recovery & Settings Sync E2E Test"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  Device A → iPhone 17 Pro      (ios.release)"
echo "  Device B → iPhone 17 Pro Max  (ios.release.userB)"
echo "  Sync     → $SYNC_FILE"
echo ""
echo "  Logs:"
echo "    Device A → $LOG_A"
echo "    Device B → $LOG_B"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""

# Run both test processes in parallel
echo "[Runner] Starting Device A on iPhone 17 Pro..."
npx detox test \
  --configuration ios.release \
  __tests__/e2e-ios/two-device/recovery-sync-device-a.test.ts \
  --headless \
  > "$LOG_A" 2>&1 &
PID_A=$!

# Small delay to let Device A start and reset the sync file
sleep 2

echo "[Runner] Starting Device B on iPhone 17 Pro Max..."
npx detox test \
  --configuration ios.release.userB \
  __tests__/e2e-ios/two-device/recovery-sync-device-b.test.ts \
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
  echo "  Device A: ✅ PASS"
else
  echo "  Device A: ❌ FAIL (exit code $STATUS_A)"
  echo ""
  echo "  --- Device A log (last 30 lines) ---"
  tail -30 "$LOG_A"
  echo ""
fi

if [ $STATUS_B -eq 0 ]; then
  echo "  Device B: ✅ PASS"
else
  echo "  Device B: ❌ FAIL (exit code $STATUS_B)"
  echo ""
  echo "  --- Device B log (last 30 lines) ---"
  tail -30 "$LOG_B"
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
