#!/bin/bash
# Quick script to check Ghost AI logs
PASS_FILE=$(mktemp)
trap "rm -f '$PASS_FILE'" EXIT
printf '%s' 'b3V]!Dxk+x4BxXcX' > "$PASS_FILE"
sshpass -f "$PASS_FILE" ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 root@45.77.149.94 "journalctl -u ghost-en --no-pager -n ${1:-80} --since '${2:-5 min ago}'"
