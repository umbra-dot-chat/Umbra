# Session Handoff Template

> Copy this template to `AGENTS/history/YYYY-MM-DD-topic.md` at the end of each session.
> Keep it under 100 lines. A future agent reads this in 10 seconds.

## Session: [DATE] — [TOPIC]

### Commits Made This Session

> List every commit hash + message. This is the primary record of work done.

```
abc1234 fix(ghost-ai): add backpressure to audio ring buffer
def5678 fix(ghost-ai): clear lastFrame on video switch
ghi9012 test(ghost-ai): add real-pipeline loopback test
```

### What Was Done

- Bullet list of completed changes
- Include file paths modified
- Note test results with scores

### What's In Progress (Uncommitted)

- Any partially completed work (should be rare — commit often!)
- Where you stopped and why
- Branch name if on a feature branch

### What's Next

1. Priority-ordered next steps
2. Any prerequisites or blockers
3. Estimated complexity (trivial / moderate / complex)

### Key Findings

> Non-obvious discoveries that future agents MUST know.
> Example: "FFmpeg decodes MP3 1000x faster than real-time — backpressure is mandatory."

### Test Results

```
Voice real-pipeline: 99.2/100, 0 underruns
Video real-pipeline: 92.5/100, 0 drops
Log inspection: clean
Type-check: passes
```

### Verification Iterations

> How many test cycles did you run? What improved between iterations?
> Example: "Iteration 1: 78/100 — found buffer sizing issue. Iteration 2: 92/100 — fixed, shipped."

| Iteration | Score | Issue Found | Fix Applied |
|-----------|-------|-------------|-------------|
| 1 | 78/100 | Buffer overflow | Added backpressure |
| 2 | 92/100 | Clean | Shipped |

### Warnings for Next Agent

> Anything that could trip up the next session:
> - Server in unusual state?
> - Known flaky behavior?
> - Dependency quirk?
> - Areas that need more testing?
