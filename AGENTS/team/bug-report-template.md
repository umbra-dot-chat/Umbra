# Bug Report Template

> Used by qa-automated and qa-manual to report failures back to the tech-lead.
> The tech-lead passes this to the relevant developer when re-spawning.

```markdown
## Bug Report

**Reporter**: qa-automated | qa-manual
**Severity**: blocker | major | minor | cosmetic
**Target Developer**: frontend-engineer | mobile-engineer | backend-engineer | ghost-ai-engineer
**QA Iteration**: [number — how many times this bug has been through the loop]

### What Failed
[Specific test name, check type, or verification step that failed]

### Expected Result
[What SHOULD have happened]

### Actual Result
[What ACTUALLY happened — include exact error messages, test scores, CSS values, etc.]

### Reproduction
[Exact commands to reproduce, or the test/check to re-run]

### Relevant Files
[File paths likely involved in the fix — help the developer narrow scope]

### Prior Fix Attempts (if iteration > 1)
[What was tried in previous iterations and WHY it didn't work.
 This prevents the developer from trying the same failed approach again.]

### Suggested Investigation
[Optional: where the QA agent thinks the root cause might be, based on error messages]
```

## Examples

### Example: Type Error (qa-automated)

```markdown
## Bug Report

**Reporter**: qa-automated
**Severity**: blocker
**Target Developer**: frontend-engineer
**QA Iteration**: 1

### What Failed
Tier 1 type-check: `npx tsc --noEmit`

### Expected Result
Zero type errors

### Actual Result
```
src/components/settings/SettingsDialog.tsx(42,15): error TS2339:
Property 'statsOverlay' does not exist on type 'DeveloperSettings'.
```

### Reproduction
```bash
npx tsc --noEmit
```

### Relevant Files
- src/components/settings/SettingsDialog.tsx:42
- src/hooks/useDeveloperSettings.ts (type definition)

### Prior Fix Attempts
N/A (first iteration)
```

### Example: Visual Bug (qa-manual)

```markdown
## Bug Report

**Reporter**: qa-manual
**Severity**: major
**Target Developer**: frontend-engineer
**QA Iteration**: 2

### What Failed
Check 1: Structural verification (preview_snapshot)

### Expected Result
Settings dialog should show a "Stats Overlay" toggle in the Developer section

### Actual Result
preview_snapshot shows the Developer section but no toggle element.
The heading "Developer" is present at ref_42, but no toggle/switch follows it.

### Reproduction
1. Start preview server
2. Navigate to Settings
3. Open Developer section
4. preview_snapshot — toggle is missing

### Relevant Files
- src/components/modals/SettingsDialog.tsx (the settings UI)
- src/hooks/useDeveloperSettings.ts (the hook providing the toggle state)

### Prior Fix Attempts
Iteration 1: Developer added the toggle but used wrong component name.
The import was `Toggle` but Wisp exports it as `Switch`.
Developer fixed the import but the toggle still doesn't render.
```
