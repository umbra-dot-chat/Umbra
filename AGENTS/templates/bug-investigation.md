# Bug Investigation Template

## Bug: [TITLE]

### Symptoms

- What the user sees/reports (the agent CANNOT see this — describe precisely)
- When it happens (immediately, after N seconds, intermittently, under load)
- Platform/environment details
- Severity: blocks usage / degraded experience / cosmetic

### Reproduction Steps

1. Step-by-step reproduction
2. Include exact commands if applicable
3. Note any prerequisites (server state, config, etc.)
4. Note what the agent CAN verify vs what only the user can observe

### Verification Strategy

> Define HOW you'll know the bug is fixed BEFORE you start coding.
> Since agents can't see/hear/touch, specify machine-verifiable criteria.

| Check | Tool | Pass Criteria |
|-------|------|---------------|
| No JS errors | `preview_console_logs(level: 'error')` | Returns empty |
| No server errors | `journalctl \| grep ERROR` | Returns empty |
| Test score | `loopback-test --real-pipeline` | Score >= 80/100 |
| Structure correct | `preview_snapshot` | Expected elements present |
| API responses | `preview_network(filter: 'failed')` | No failed requests |

### Investigation Log

> Document hypotheses chronologically. Each step is a commit checkpoint.

**Hypothesis 1: [Description]**
- What I checked:
- What I found:
- Conclusion:
- **Commit:** `abc1234` (if changes were made)

**Hypothesis 2: [Description]**
- What I checked:
- What I found:
- Conclusion:
- **Commit:** `def5678` (if changes were made)

### Root Cause

> One paragraph explaining WHY the bug exists, not just WHAT it is.
> Include: what code path triggers it, why the existing code was wrong, why existing tests didn't catch it.

### Fix

> What was changed and why. One commit per logical fix.

```
abc1234  path/to/file.ts    — Description of change
def5678  path/to/file2.ts   — Description of related change
```

### Verification Results (Iterative)

> Run verification at LEAST twice. Record each iteration.

| Iteration | Test | Score/Result | Issue Found | Action |
|-----------|------|-------------|-------------|--------|
| 1 | Voice loopback | 78/100 | Buffer drain | Adjusted threshold |
| 2 | Voice loopback | 99/100 | Clean | Passed |
| 1 | Console errors | 2 errors | Missing import | Fixed import |
| 2 | Console errors | 0 errors | Clean | Passed |

### Prevention

> What would prevent this CLASS of bug in the future?

- [ ] New test added? (Describe what it covers)
- [ ] New rule added to `rules/`? (What rule?)
- [ ] Domain doc updated? (What was added?)
- [ ] Architecture change needed? (What?)

### Lessons Learned

> What should future agents know about this area of the codebase?
> Add to the relevant `domain/` file.
