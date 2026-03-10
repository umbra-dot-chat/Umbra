# Commit Conventions — Per-Agent Attribution

## The Rules

1. **<100 lines per commit.** If your diff exceeds 200 lines, split it.
2. **3-10 commits per feature.** Plan your commits upfront.
3. **Commit after every passing test** (ratchet effect — lock in progress).
4. **No Co-Authored-By headers.** Each agent commits under its own scope.
5. **End-of-session commits are mandatory.** Never leave uncommitted work.
6. **Type-check before every commit.** `npx tsc --noEmit` must pass.

## Commit Message Format

```
type(scope): subject    ← under 50 chars, imperative mood

Body explaining WHY, not just WHAT. One sentence is fine.
```

## Types

| Type | When |
|------|------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Adding or updating tests |
| `docs` | Documentation changes |
| `chore` | Build, config, dependency changes |

## Scopes by Agent

| Agent | Allowed Scopes |
|-------|---------------|
| frontend-engineer | `frontend`, `ui`, `router`, `context`, `hook`, `settings` |
| mobile-engineer | `mobile`, `ios`, `android`, `detox`, `native-module` |
| backend-engineer | `core`, `relay`, `cli`, `wasm`, `testing`, `crypto` |
| ghost-ai-engineer | `ghost-ai`, `media`, `webrtc`, `audio`, `video` |
| ux-designer | `ux`, `a11y`, `spacing`, `contrast` |
| devops-engineer | `deploy`, `infra`, `ci`, `server` |

## Examples

```bash
# Frontend
feat(frontend): add dark mode toggle to settings dialog
fix(ui): correct responsive breakpoint for tablet layout
refactor(hook): simplify useCallStats return type

# Mobile
feat(mobile): add haptic feedback to message send
fix(ios): resolve camera permission crash on iOS 19
test(detox): add E2E test for video call flow

# Backend
feat(core): implement group key rotation protocol
fix(relay): handle WebSocket reconnection on network change
refactor(wasm): optimize WASM bundle size with wee_alloc

# Ghost AI
fix(ghost-ai): add backpressure to audio ring buffer
feat(media): support VP9 codec negotiation
test(webrtc): add real-pipeline loopback test for 1080p

# UX Designer
fix(ux): normalize settings row spacing to 16px gap
fix(contrast): use text.secondary for muted labels on surface
refactor(ux): swap raw buttons for SegmentedControl in call panel

# DevOps
chore(deploy): update Ghost AI deploy script for new server
fix(infra): add systemd restart policy for ghost-en service
```

## Anti-Patterns

- **Giant commits**: "feat(frontend): implement entire settings page" (500 lines) — split this
- **Vague messages**: "fix stuff" or "update code" — describe what and why
- **Bundled changes**: Mixing a bug fix and a feature in one commit — separate them
- **Wrong scope**: Frontend engineer using `fix(ghost-ai):` — stay in your lane
