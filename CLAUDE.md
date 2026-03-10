# Umbra — P2P Encrypted Messaging App

Read `AGENTS/ONBOARDING.md` for full project context (packages, stack, commands).

## Non-Negotiable Rules

1. **Commit frequently.** <100 lines per commit. Commit after every passing test. Format: `type(scope): subject`.
2. **Test iteratively.** Agents can't see/hear/touch. Use preview_snapshot, preview_inspect, console logs, network checks, real-pipeline tests. Minimum 2 verification cycles.
3. **Type-check before every commit.** `npx tsc --noEmit` must pass.

## Stack Rules

- **UI**: ALL components use `@coexist/wisp-react-native`. Never `StyleSheet.create()`.
- **Colors**: `useTheme()` → `colors.background.canvas`, `colors.text.primary`, etc.
- **Crypto**: ALL crypto in `umbra-core` (Rust). Never implement crypto in JavaScript.
- **Hooks**: 49 hooks in `src/hooks/`. Check before creating new ones.
- **Contexts**: 19 contexts in `src/contexts/`. Check before creating new ones.

## Agent Team — USE THIS

You have specialized subagents in `.claude/agents/`. **Use them for all non-trivial tasks.** Act as the tech-lead: explore the codebase, then delegate to the right specialist via the Agent tool.

### When to Spawn Subagents

- **Any UI work** → spawn `frontend-engineer`
- **iOS/Android platform work** → spawn `mobile-engineer`
- **Rust (core, relay, CLI, WASM)** → spawn `backend-engineer`
- **Ghost AI bot (WebRTC, FFmpeg)** → spawn `ghost-ai-engineer`
- **UI/UX review (spacing, contrast, workflows)** → spawn `ux-designer`
- **After any dev completes** → spawn `qa-automated` then `qa-manual`
- **Deployment needed** → spawn `devops-engineer`

### The Workflow (Follow This Every Time)

1. **Explore** the codebase to understand the task (Grep, Glob, Read)
2. **Spawn** the right developer subagent with task + file paths + verification criteria
3. **Spawn `qa-automated`** to run tests on the developer's changes
4. **Spawn `qa-manual`** to verify UI with preview tools
5. **Spawn `ux-designer`** for UI changes (spacing, contrast, workflow review)
6. If QA or UX fails → write a bug report → re-spawn the developer → repeat 3-6
7. If deploy needed → spawn `devops-engineer`

Read `AGENTS/team/orchestration.md` for full routing details and `AGENTS/team/qa-workflow.md` for the QA pipeline.

## Key Commands

```bash
npx tsc --noEmit               # Type-check (run before EVERY commit)
npm run web                    # Expo dev server
npm test                       # Jest unit tests
npm run test:e2e               # Playwright E2E
```

## Reference

- `AGENTS/rules/always.md` — Full rule set (33 rules)
- `AGENTS/rules/before-commit.md` — Pre-commit checklist
- `AGENTS/rules/before-deploy.md` — Pre-deploy checklist
- `AGENTS/TESTING_PLAYBOOK.md` — Iterative verification guide
- `AGENTS/domain/` — Domain-specific knowledge (load just-in-time)
