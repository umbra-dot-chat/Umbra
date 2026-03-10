# Feature Implementation Template

## Feature: [TITLE]

### Goal

> One sentence: what does this feature do for the user?

### Verification Criteria (Define BEFORE Coding)

> How will you PROVE this works? Agents can't see/hear/touch — define machine-verifiable checks.

| Criteria | How to Check | Pass Condition |
|----------|-------------|----------------|
| Types compile | `npx tsc --noEmit` | Zero errors |
| No console errors | `preview_console_logs(level: 'error')` | Empty |
| UI renders correctly | `preview_snapshot` | Expected elements present |
| Styles correct | `preview_inspect('.selector', ['color', 'padding'])` | Expected values |
| API works | `preview_network` | No failed requests |
| Tests pass | `npm test -- path/to/test` | All pass |

### Design Decisions

| Decision | Options Considered | Chosen | Why |
|----------|-------------------|--------|-----|
| State management | Context vs hook vs service | Context | Matches existing patterns |
| Component placement | New file vs extend existing | Extend | Avoids file bloat |

### Commit Plan (Small, Frequent Commits)

> Plan your commits UPFRONT. Each step should be independently committable and testable.
> Target: <100 lines per commit. Test after each commit.

| Order | Commit Description | Files | Est. Lines |
|-------|-------------------|-------|------------|
| 1 | Add types/interfaces | types.ts | ~30 |
| 2 | Add core logic/hook | useFeature.ts | ~60 |
| 3 | Add UI component | Feature.tsx | ~80 |
| 4 | Wire into existing screens | ExistingScreen.tsx | ~20 |
| 5 | Add tests | Feature.test.ts | ~50 |

### Implementation Order

> Start with the lowest-risk change that enables testing early.

1. [ ] **Step 1** — Types/interfaces (enables type-checking immediately)
   - Commit after this step
   - Verify: `npx tsc --noEmit`
2. [ ] **Step 2** — Core logic (business logic, hooks, services)
   - Commit after this step
   - Verify: `npx tsc --noEmit` + unit tests
3. [ ] **Step 3** — UI integration
   - Commit after this step
   - Verify: `preview_snapshot` + `preview_console_logs`
4. [ ] **Step 4** — Polish and edge cases
   - Commit after this step
   - Verify: full verification criteria table above
5. [ ] **Step 5** — Final verification loop
   - Run ALL verification criteria at least twice
   - Record results in the iteration table below

### Verification Iterations

> Minimum 2 full passes. Record every iteration.

| Iteration | Checks Run | Issues Found | Fixes Applied | Commit |
|-----------|-----------|--------------|---------------|--------|
| 1 | Types, snapshot, console | Missing import | Fixed in X.tsx | abc1234 |
| 2 | Types, snapshot, console, styles | None | — | Shipped |

### Testing Plan

- [ ] Type-check passes (`npx tsc --noEmit`)
- [ ] No console errors in preview
- [ ] Accessibility snapshot shows expected structure
- [ ] CSS properties match design (via `preview_inspect`)
- [ ] Unit tests added for new logic
- [ ] If WebRTC: real-pipeline test passes >= 80/100
- [ ] If UI: responsive check at mobile/tablet/desktop viewports

### Rollback Plan

> If this feature breaks something, how do we revert safely?
> With frequent commits, rollback = `git revert [commit]` for the specific change.

### Dependencies

> External packages, API changes, server changes needed?
