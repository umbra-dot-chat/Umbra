# QA Workflow — Automated + Manual Verification

## The Pipeline

```
Developer commits changes
         ↓
  ┌──────────────┐
  │ qa-automated  │  Type-check → Unit → E2E → Loopback → Logs
  └──────┬───────┘
         ↓
     All pass?
     │        │
    YES      NO → Bug report → tech-lead → developer (iterate)
     ↓
  ┌──────────────┐
  │  qa-manual    │  Snapshot → Inspect → Console → Network → Responsive
  └──────┬───────┘
         ↓
     All pass?
     │        │
    YES      NO → Bug report → tech-lead → developer (iterate)
     ↓
   SHIP IT
```

## qa-automated: Test Tiers

Run in order. Stop on first tier failure (no point running E2E if types don't compile).

### Tier 1: Type-Check (ALWAYS)
```bash
npx tsc --noEmit                                          # Main app
cd packages/umbra-ghost-ai && npx tsc --noEmit            # Ghost AI (if changed)
cd packages/umbra-plugin-sdk && npx tsc --noEmit          # Plugin SDK (if changed)
```
**Pass**: Zero errors.

### Tier 2: Unit Tests (ALWAYS)
```bash
npm test                      # All Jest tests
npm test -- --changedSince=HEAD~5  # Only tests affected by recent commits
```
**Pass**: All pass, no regressions.

### Tier 3: E2E Tests (if UI changed)
```bash
npm run test:e2e              # Playwright
```
**Pass**: All scenarios pass.

### Tier 4: Mobile Tests (if mobile changed)
```bash
npm run detox:build && npm run detox:test
```
**Pass**: All test cases pass.

### Tier 5: Real-Pipeline Tests (if Ghost AI changed)
```bash
ssh root@45.77.149.94 "cd /opt/ghost-ai && \
  node dist/loopback-test.js --real-pipeline --type voice --duration 15 --media-dir ./data/media"
ssh root@45.77.149.94 "cd /opt/ghost-ai && \
  node dist/loopback-test.js --real-pipeline --type video --duration 15 --media-dir ./data/media"
```
**Pass**: Score >= 80/100, 0 underruns, 0 drops.

### Tier 6: Log Inspection (if deployed)
```bash
ssh root@45.77.149.94 "journalctl -u ghost-en --no-pager --since '5 min ago' | \
  grep -E 'ERROR|WARN|overflow|underrun|byteLength|drop'"
```
**Pass**: Returns empty.

## qa-manual: Verification Checks

Run ALL applicable checks. Minimum 2 full cycles.

### Check 1: Structural (ALWAYS for UI changes)
```
preview_snapshot(serverId)
```
**Pass**: Expected elements present, correct text content, correct roles/labels.

### Check 2: Style (if CSS/layout changed)
```
preview_inspect(serverId, '.selector', ['color', 'padding', 'font-size', 'gap'])
```
**Pass**: Computed CSS values match design intent.

### Check 3: Console Errors (ALWAYS)
```
preview_console_logs(serverId, level: 'error')
```
**Pass**: Returns empty (zero errors).

### Check 4: Network (if API/data changes)
```
preview_network(serverId, filter: 'failed')
```
**Pass**: No failed requests.

### Check 5: Responsive (if layout changed)
```
preview_resize(serverId, preset: 'mobile')   → preview_snapshot
preview_resize(serverId, preset: 'tablet')   → preview_snapshot
preview_resize(serverId, preset: 'desktop')  → preview_snapshot
```
**Pass**: Layout correct at all three viewports.

### Check 6: Interaction (if interactive elements added)
```
preview_click(serverId, '.new-button')  → preview_snapshot (verify state change)
preview_fill(serverId, '.new-input', 'test value') → preview_snapshot
```
**Pass**: State changes as expected after interaction.

### Check 7: Visual Sanity (final check)
```
preview_screenshot(serverId)
```
**Pass**: No obvious visual breakage. (Supplementary — don't rely on this for precise values.)

## Report Format

Both QA agents return a structured report:

```markdown
## QA Report: [automated|manual]

### Overall: PASS | FAIL

### Results
| Check | Result | Details |
|-------|--------|---------|
| Type-check | PASS | 0 errors |
| Unit tests | PASS | 47/47 pass |
| Console errors | FAIL | 2 errors: "Cannot read property 'x' of undefined" in SettingsDialog.tsx:42 |

### Failures (if any)
[Use bug-report-template.md format for each failure]
```

## Iteration Tracking

The tech-lead tracks iterations per bug:

| Iteration | Developer | QA Result | Bug Description |
|-----------|-----------|-----------|-----------------|
| 1 | frontend-engineer | FAIL (qa-automated) | Type error in SettingsDialog |
| 2 | frontend-engineer | FAIL (qa-manual) | Toggle missing from snapshot |
| 3 | frontend-engineer | PASS | All checks clean |
