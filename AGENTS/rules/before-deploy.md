# Before Deploy Checklist

This is the MINIMUM bar for deploying to any server. Every step is required. No shortcuts.

## Ghost AI Bot (45.77.149.94)

### Pre-Deploy Gates

- [ ] `npx tsc --noEmit` passes — zero type errors
- [ ] `npx tsc` builds successfully to `dist/`
- [ ] All changes committed to git (know your rollback point)
- [ ] `git log --oneline -5` — recent commits make sense, no WIP on main
- [ ] Rollback plan documented: "If broken, redeploy commit [hash]"

### Deploy Steps

```bash
rsync -avz dist/ root@45.77.149.94:/opt/ghost-ai/dist/
ssh root@45.77.149.94 "systemctl restart ghost-en"
```

### Post-Deploy Verification (ALL REQUIRED — No Exceptions)

**Step 1: Verify Startup**
- [ ] `ssh root@45.77.149.94 "sleep 2 && journalctl -u ghost-en --no-pager -n 15"` — no crash, no errors
- [ ] "NVIDIA GPU acceleration available" appears in startup logs

**Step 2: Real-Pipeline Voice Test**
- [ ] Score >= 80/100
- [ ] 0 underruns
- [ ] Buffer health: 2-4 seconds
```bash
ssh root@45.77.149.94 "cd /opt/ghost-ai && \
  node dist/loopback-test.js --real-pipeline --type voice --duration 15 --media-dir ./data/media"
```

**Step 3: Real-Pipeline Video Test**
- [ ] Score >= 80/100
- [ ] 0 dropped frames
- [ ] Buffer health: 50-80% full
```bash
ssh root@45.77.149.94 "cd /opt/ghost-ai && \
  node dist/loopback-test.js --real-pipeline --type video --duration 15 --media-dir ./data/media"
```

**Step 4: Log Inspection**
- [ ] Returns EMPTY (no matches)
```bash
ssh root@45.77.149.94 "journalctl -u ghost-en --no-pager --since '5 min ago' | \
  grep -E 'ERROR|WARN|overflow|underrun|byteLength|drop'"
```

**Step 5: Iterate if Needed**
- If any test scores below 90/100, investigate WHY and attempt to improve. Don't settle for barely passing.
- If scores improved, re-deploy and re-test. Iterate up to 3 times.
- If scores haven't improved after 3 iterations, document findings and discuss with user.

### If Any Step Fails

1. Check error logs: `journalctl -u ghost-en --no-pager -n 50`
2. If critical regression: rollback IMMEDIATELY
   ```bash
   git checkout LAST_GOOD_COMMIT -- dist/
   rsync -avz dist/ root@45.77.149.94:/opt/ghost-ai/dist/
   ssh root@45.77.149.94 "systemctl restart ghost-en"
   ```
3. Fix the issue locally
4. Re-run the FULL deploy sequence from the top
5. Document the failure and root cause in `AGENTS/history/`

## Frontend Deploy

### Pre-Deploy Gates

- [ ] `npx tsc --noEmit` passes
- [ ] `preview_snapshot` shows expected content
- [ ] `preview_console_logs(level: 'error')` returns empty
- [ ] `preview_network(filter: 'failed')` returns empty
- [ ] Responsive check: mobile, tablet, desktop viewports

### Post-Deploy

- [ ] Production URL loads without errors
- [ ] Core flows work (chat, calls, settings)
- [ ] No visual regressions (screenshot comparison)

## Absolute Rules

- **It is unacceptable to deploy without running real-pipeline tests.** Synthetic tests are not sufficient.
- **It is unacceptable to deploy with type errors.** `tsc --noEmit` must pass.
- **It is unacceptable to deploy uncommitted code.** Commit first so rollback is possible.
- **It is unacceptable to skip log inspection.** Silent errors are the most dangerous bugs.
