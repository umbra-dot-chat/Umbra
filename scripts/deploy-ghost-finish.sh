#!/bin/bash
# Finish Ghost AI deployment — runs npm install, updates systemd config, restarts service
# Used when rsync upload succeeded but SSH commands failed

set -euo pipefail

GHOST_HOST="45.77.149.94"
GHOST_PATH="/opt/ghost-ai"
GHOST_SERVICE="ghost-en"

# Write password to temp file to avoid shell escaping issues
PASS_FILE=$(mktemp)
trap "rm -f '$PASS_FILE'" EXIT
printf '%s' 'b3V]!Dxk+x4BxXcX' > "$PASS_FILE"

SSH_CMD="sshpass -f $PASS_FILE ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30"

echo "=== Step 1: npm install ==="
$SSH_CMD root@$GHOST_HOST "cd $GHOST_PATH && npm install --production 2>&1 | tail -10"

echo ""
echo "=== Step 2: Update systemd config (WISP_COUNT=12) ==="
$SSH_CMD root@$GHOST_HOST "mkdir -p /etc/systemd/system/$GHOST_SERVICE.service.d && cat > /etc/systemd/system/$GHOST_SERVICE.service.d/wisps.conf << 'CONF'
[Service]
Environment=WISPS_ENABLED=true
Environment=WISP_COUNT=12
Environment=WISP_MODEL=llama3.2:1b
CONF
"

echo ""
echo "=== Step 3: Reload and restart ==="
$SSH_CMD root@$GHOST_HOST "systemctl daemon-reload && systemctl restart $GHOST_SERVICE"

echo ""
echo "=== Step 4: Verify ==="
sleep 3
STATUS=$($SSH_CMD root@$GHOST_HOST "systemctl is-active $GHOST_SERVICE" || true)
echo "Service status: $STATUS"

if [[ "$STATUS" == "active" ]]; then
    echo ""
    echo "=== Startup logs ==="
    $SSH_CMD root@$GHOST_HOST "journalctl -u $GHOST_SERVICE --no-pager -n 30"
    echo ""
    echo "✓ Ghost AI deployed and running with 12 wisps!"
else
    echo ""
    echo "✗ Service failed to start. Logs:"
    $SSH_CMD root@$GHOST_HOST "journalctl -u $GHOST_SERVICE --no-pager -n 30"
    exit 1
fi
