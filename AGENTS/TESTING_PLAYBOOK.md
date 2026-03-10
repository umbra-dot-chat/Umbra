# Testing Playbook — Strict Iterative Verification

## The Hard Truth

**You are an agent. You cannot see the screen. You cannot hear audio. You cannot feel lag.** The user can. Every time you ship without thorough verification, you're gambling that your code works in ways you literally cannot perceive.

The gap between "code looks right" and "code works right" is where bugs live. Your job is to close that gap with machine-verifiable checks, run them iteratively, and improve results across iterations.

## The Iterative Verification Loop

This is the core workflow. It is non-negotiable.

```
┌─────────────────────────────────────────────────┐
│                                                  │
│  1. DEFINE verification criteria (before coding) │
│  2. WRITE code                                   │
│  3. COMMIT (small, atomic)                       │
│  4. TEST with every available tool               │
│  5. CHECK results — did everything pass?         │
│         │                                        │
│     ┌───┴───┐                                    │
│     │  NO   │──→ 6. FIX issues                   │
│     └───────┘   7. COMMIT the fix                │
│         │       8. RE-TEST (go to step 4)        │
│     ┌───┴───┐                                    │
│     │  YES  │──→ 9. Can results IMPROVE?         │
│     └───────┘        │                           │
│               ┌──────┴──────┐                    │
│               │   MAYBE     │──→ Investigate,    │
│               └─────────────┘    iterate once    │
│               ┌──────┴──────┐    more            │
│               │    NO       │──→ 10. SHIP IT     │
│               └─────────────┘                    │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Minimum 2 full verification cycles before shipping. 3+ for complex changes.**

## Verification Tools — What to Use When

### Structural Verification (Content & Elements)

**Tool:** `preview_snapshot` (accessibility tree)

**Best for:** Verifying text content, element presence, component structure, roles, labels. This is more reliable than screenshots for confirming "is the button there?"

### Style Verification (CSS Properties)

**Tool:** `preview_inspect(selector, styles)`

**Best for:** Verifying specific CSS values — colors, fonts, spacing, dimensions. MORE accurate than screenshots for visual properties.

### Visual Sanity Check (Overall Look)

**Tool:** `preview_screenshot`

**Best for:** "Does this look roughly right?" — layout issues, major visual breakage. Do NOT rely on screenshots for precise colors, fonts, or spacing (use `preview_inspect` for those).

### Runtime Error Detection

**Tool:** `preview_console_logs(level: 'error')`

**Best for:** Catching silent JavaScript errors that break functionality invisibly. Run after EVERY UI change.

### Network Verification

**Tool:** `preview_network(filter: 'failed')`

**Best for:** Catching broken API calls, failed asset loads, CORS issues. Run after any change that touches data fetching or API calls.

### Server-Side Error Detection

**Tool:** `journalctl` grep for error patterns

**Best for:** Server-side errors invisible to the client. Catches ring buffer overflow, frame size mismatch, encoding failures.

```bash
ssh root@SERVER "journalctl -u SERVICE --since '5 min ago' | \
  grep -E 'ERROR|WARN|overflow|underrun|byteLength|drop'"
```

### Responsive Layout

**Tool:** `preview_resize(preset: 'mobile'|'tablet'|'desktop')`

**Best for:** Verifying layout doesn't break at different viewport sizes. Run after any layout change.

### Interaction Testing

**Tool:** `preview_click` / `preview_fill` → then `preview_snapshot`

**Best for:** Verifying buttons, inputs, and forms. Click/fill, then snapshot to confirm the resulting state.

## Test Tiers (Ordered by Priority)

### Tier 1: Type-Check (ALWAYS — Every Commit)

```bash
npx tsc --noEmit                                    # Main app
cd packages/umbra-ghost-ai && npx tsc --noEmit      # Ghost AI
```

If types fail, nothing else matters. Fix types first. Commit after they pass.

### Tier 2: Console & Network (ALWAYS — After UI Changes)

```
preview_console_logs(level: 'error')    → Must return empty
preview_network(filter: 'failed')       → Must return empty
```

Silent errors are the most dangerous. These catch them.

### Tier 3: Structural Verification (ALWAYS — After UI Changes)

```
preview_snapshot → Expected elements exist, text content correct
preview_inspect  → CSS values match design intent
```

### Tier 4: Real-Pipeline Tests (REQUIRED — WebRTC Changes)

```bash
# Voice
ssh root@45.77.149.94 "cd /opt/ghost-ai && \
  node dist/loopback-test.js --real-pipeline --type voice --duration 15 --media-dir ./data/media"

# Video
ssh root@45.77.149.94 "cd /opt/ghost-ai && \
  node dist/loopback-test.js --real-pipeline --type video --duration 15 --media-dir ./data/media"
```

**Pass criteria:**
- Score >= 80/100 (target 90+)
- 0 underruns (audio) — any underrun = backpressure bug
- 0 dropped frames (video) — any drop = buffer/timing bug
- Buffer health: audio 2-4s, video 50-80%

**Why real-pipeline, not synthetic:**
Synthetic tests generate frames in JavaScript, bypassing FFmpeg, ring buffers, backpressure, and system ffmpeg selection. We've seen synthetic tests score 97/100 while production calls were completely broken. Synthetic tests are supplementary only.

### Tier 5: Log Inspection (REQUIRED — After Every Deploy)

```bash
ssh root@45.77.149.94 "journalctl -u ghost-en --no-pager --since '5 min ago' | \
  grep -E 'ERROR|WARN|overflow|underrun|byteLength|drop'"
```

Must return empty. Known error patterns:

| Error | Root Cause | How to Fix |
|-------|-----------|------------|
| `Expected a .byteLength of X, not Y` | Resolution mismatch after video switch | Clear `lastFrame` in `switchVideo()` |
| `Ring buffer overflow` | FFmpeg outpacing consumer | Check backpressure (pause/resume) |
| `GPU acceleration not available` | Using ffmpeg-static | Check `resolveFfmpegPath()` |

### Tier 6: Unit Tests

```bash
npm test                    # All unit tests
npm test -- path/to/file    # Single file
```

### Tier 7: E2E Tests

```bash
npm run test:e2e            # Playwright
```

## The Iteration Record

Track every verification iteration. This proves rigor and catches regressions.

| Iteration | Tests Run | Score/Result | Issue Found | Fix Applied | Commit |
|-----------|----------|-------------|-------------|-------------|--------|
| 1 | Types + snapshot | 2 type errors | Missing import | Added import | abc1234 |
| 2 | Types + snapshot + console | 1 console error | Undefined ref | Added null check | def5678 |
| 3 | Full suite | All pass | None | — | Shipped |

## Ghost AI Full Deploy + Test Sequence

```bash
# 1. Build (commit first if not already)
cd packages/umbra-ghost-ai && npx tsc --noEmit && npx tsc

# 2. Deploy
rsync -avz dist/ root@45.77.149.94:/opt/ghost-ai/dist/
ssh root@45.77.149.94 "systemctl restart ghost-en"

# 3. Verify startup
ssh root@45.77.149.94 "sleep 2 && journalctl -u ghost-en --no-pager -n 15"

# 4. Voice test — ITERATION 1
ssh root@45.77.149.94 "cd /opt/ghost-ai && \
  node dist/loopback-test.js --real-pipeline --type voice --duration 15 --media-dir ./data/media"
# Record score. If <80: fix. If 80-89: try to improve. If 90+: proceed.

# 5. Video test — ITERATION 1
ssh root@45.77.149.94 "cd /opt/ghost-ai && \
  node dist/loopback-test.js --real-pipeline --type video --duration 15 --media-dir ./data/media"

# 6. Log inspection
ssh root@45.77.149.94 "journalctl -u ghost-en --no-pager --since '5 min ago' | \
  grep -E 'ERROR|WARN|overflow|underrun|byteLength|drop'"

# 7. If issues: fix, commit, re-deploy, re-test (ITERATION 2)
# 8. If clean: record results. Deploy complete.
```

**All steps must pass. Iterate until they do.**

## Common Gotchas

1. **Synthetic tests lie.** They scored 97/100 while production was broken. Always use `--real-pipeline`.
2. **FFmpeg is 1000x faster than real-time.** Without backpressure, buffers fill instantly.
3. **`lastFrame` must be null after video switch.** Different resolution = different `byteLength` = crash.
4. **System ffmpeg has GPU, ffmpeg-static doesn't.** Verify which is being used.
5. **`setInterval` drifts under load.** Use drift-compensating `setTimeout` for media timing.
6. **Console errors are invisible to users.** Users see "it doesn't work." Agents see the error in the console.
7. **One passing test doesn't mean it works.** Run it twice. Run related tests. Check from different angles.
8. **Screenshots lie about CSS.** Use `preview_inspect` for exact color/font/spacing values, not screenshots.
