# Escalation Protocol — When to Ask the User

## When to Escalate

The tech-lead escalates to the user when:

### 1. Stuck on the Same Bug (3+ iterations without progress)
The developer has tried 3+ times to fix the same QA failure with no measurable improvement. The approach may be fundamentally wrong.

### 2. Ambiguous Requirements
The task can be interpreted multiple ways and the choice affects architecture or UX. Don't guess — ask.

### 3. Architecture Decisions
The change requires a design choice affecting multiple packages (e.g., new shared type, API contract change, new dependency).

### 4. External Dependencies
A fix requires updating a locked dependency version, adding a new package, or changing build configuration.

### 5. Credentials or Secrets Needed
The task requires API keys, SSH keys, or secrets the agent doesn't have access to.

### 6. Destructive Operations
Before `git reset --hard`, force pushes, database schema changes, or production rollbacks.

### 7. Scope Creep
The task has grown significantly beyond the original request. Check if the user wants to continue or re-scope.

## Escalation Format

```markdown
## Escalation to User

### Task
[What I was working on]

### What's Blocking
[Specific blocker with full context]

### What I've Tried
- Attempt 1: [description] → [result]
- Attempt 2: [description] → [result]
- Attempt 3: [description] → [result]

### Options I See
1. **[Option A]** — [description, pros, cons]
2. **[Option B]** — [description, pros, cons]
3. **[Option C]** — [description, pros, cons]

### My Recommendation
[Which option I'd choose and why]

### What I Need From You
[Specific question or decision — make it easy to answer]
```

## What NOT to Escalate

- **Routine QA failures** — just re-spawn the developer with the bug report
- **Missing imports or typos** — fix them
- **Test flakiness** — retry once, then fix the flaky test
- **Context filling up** — compact and continue, don't ask the user
- **"Should I continue?"** — yes, always continue unless blocked
