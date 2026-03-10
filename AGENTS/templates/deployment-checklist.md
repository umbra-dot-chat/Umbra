# Deployment Checklist Template

## Deploying: [WHAT] to [WHERE]

### Pre-Deploy

- [ ] `npx tsc --noEmit` passes (zero type errors)
- [ ] `npm test` passes (zero regressions)
- [ ] Changes committed to git (or stashed intentionally)
- [ ] Know the rollback plan
- [ ] Reviewed changes: `git diff` looks correct

### Deploy

- [ ] Built: `npx tsc`
- [ ] Synced: `rsync -avz dist/ root@SERVER:/opt/PATH/dist/`
- [ ] Restarted: `ssh root@SERVER "systemctl restart SERVICE"`
- [ ] Verified startup: `ssh root@SERVER "sleep 2 && journalctl -u SERVICE -n 15"`

### Post-Deploy Verification

- [ ] No crash/error in startup logs
- [ ] Real-pipeline voice test >= 80/100, 0 underruns
- [ ] Real-pipeline video test >= 80/100, 0 drops
- [ ] Log inspection clean (no ERROR/WARN/overflow/underrun)
- [ ] Client preview loads without console errors

### If Something Breaks

1. Check logs: `journalctl -u SERVICE -n 50`
2. Identify the error
3. If critical: rollback immediately (redeploy from clean git state)
4. If minor: fix forward, re-deploy, re-test

### Sign-Off

- [ ] All verification steps passed
- [ ] Updated `AGENTS/history/` with session notes
- [ ] Notified user of deployment status
