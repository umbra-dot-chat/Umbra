# Before Commit Checklist

## When to Commit

Commit immediately when ANY of these are true:

- A logical unit of work is complete (one feature, one bug fix, one refactor)
- Tests pass for changes you just made (ratchet effect — lock in progress)
- You're about to switch tasks or investigate something different
- You've added a new file or module
- You're at a stable checkpoint before a risky operation
- You're ending a session (MANDATORY — never leave uncommitted work)

**Target: <100 lines per commit. 3-10 commits per feature. One bug = one commit.**

## Required Checks (Every Commit)

- [ ] `npx tsc --noEmit` passes (type-check the relevant package)
- [ ] `git diff --staged` reviewed — no debug code, no `console.log`, no hardcoded secrets
- [ ] Commit message is descriptive: WHAT changed AND WHY
- [ ] No `.env` files, API keys, credentials, or secrets in staged files
- [ ] Only files related to this logical change are staged (no accidental `git add -A`)

## Commit Message Format

```
type(scope): subject    ← under 50 chars, imperative mood

Body explaining WHY, not just WHAT. One sentence is fine.
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
Scopes: `ghost-ai`, `frontend`, `plugin-sdk`, `plugin-runtime`, `relay`, `core`

Examples:
- `fix(ghost-ai): add backpressure to prevent ring buffer overflow`
- `feat(frontend): add call stats overlay to active call panel`
- `refactor(plugin-sdk): simplify slash command registration API`

## Domain-Specific Checks

### Ghost AI (packages/umbra-ghost-ai/)

- [ ] `cd packages/umbra-ghost-ai && npx tsc --noEmit`
- [ ] If audio changes: backpressure still intact (pause >80%, resume <50%)
- [ ] If video changes: `lastFrame = null` still in `switchVideo()`
- [ ] If command handlers changed: resolution caps applied with `Math.min()`
- [ ] If FFmpeg path changed: system ffmpeg still preferred over ffmpeg-static

### Frontend (src/, app/)

- [ ] Only Wisp components used (zero `StyleSheet.create()`)
- [ ] Colors via `useTheme()`, not hardcoded hex/rgb values
- [ ] `preview_snapshot` shows expected content structure
- [ ] `preview_console_logs(level: 'error')` returns empty
- [ ] If layout changed: responsive check at mobile/tablet/desktop

### Plugins (packages/umbra-plugin-*)

- [ ] SDK backwards compatibility preserved (no breaking type changes)
- [ ] Existing plugins still compile against updated SDK
- [ ] Slash command registration API unchanged (or migration path provided)

## Anti-Patterns — Never Do These

- **Bundling unrelated changes** in one commit. One logical change = one commit.
- **"WIP" commits on shared branches.** WIP is fine on feature branches only.
- **Committing broken code.** If tests don't pass, don't commit. Fix first.
- **Giant 500+ line commits.** If you're here, you waited too long. Split retroactively with `git add -p`.
- **Amending published commits.** Create new commits. History is immutable once pushed.
