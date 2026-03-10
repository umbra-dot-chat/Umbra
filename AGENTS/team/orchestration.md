# Orchestration — How the Tech-Lead Works

## Task Intake

When the user gives a task, the tech-lead follows this sequence:

### Step 1: Explore

Before routing, understand what's involved:

```bash
# Identify affected files
Grep for relevant keywords
Glob for file patterns
Read key files to understand current state
```

### Step 2: Classify & Route

| Task Type | Routing |
|-----------|---------|
| Frontend only (UI, components, hooks) | → `frontend-engineer` |
| Mobile only (native modules, platform) | → `mobile-engineer` |
| Rust only (crypto, relay, CLI) | → `backend-engineer` |
| Ghost AI only (WebRTC, media, bot) | → `ghost-ai-engineer` |
| Deploy required | → developer first, then `devops-engineer` |
| Bug fix from QA | → relevant developer with bug report context |
| Cross-cutting | → see `cross-cutting-tasks.md` |

### Step 3: Spawn Subagent

Use the `Agent` tool with a comprehensive prompt:

```
Agent(
  subagent_type: "general-purpose",
  description: "frontend task: add settings toggle",
  prompt: """
    ## Task
    [Clear description]

    ## Context
    Read AGENTS/ONBOARDING.md first, then AGENTS/domain/expo-frontend.md.

    Key files to review:
    - src/components/settings/SettingsDialog.tsx (existing settings UI)
    - src/contexts/DeveloperSettingsContext.tsx (state management)

    ## Verification Criteria
    - npx tsc --noEmit passes
    - preview_snapshot shows the new toggle
    - preview_console_logs(level: 'error') returns empty
    - Toggle changes state correctly

    ## Commit Instructions
    - Commit after every passing test (<100 lines per commit)
    - Format: feat(frontend): add dark mode toggle to settings
    - Do NOT use Co-Authored-By headers

    ## Bug Context (if applicable)
    [Include structured bug report from QA if this is a re-spawn]
  """
)
```

### Step 4: QA Pipeline

After the developer subagent completes:

1. **Spawn `qa-automated`** with context about what changed:
   ```
   "Run verification for frontend changes. Files modified: [list].
   Read AGENTS/TESTING_PLAYBOOK.md. Run Tier 1 (type-check) and Tier 2 (console/network).
   Report structured pass/fail per AGENTS/team/qa-workflow.md."
   ```

2. **If automated passes → spawn `qa-manual`**:
   ```
   "Verify UI changes visually. Files modified: [list].
   Start the preview server if needed. Run snapshot, inspect, console, responsive checks.
   Report structured pass/fail per AGENTS/team/qa-workflow.md."
   ```

3. **If either QA fails → write bug report → re-spawn developer**:
   Use `AGENTS/team/bug-report-template.md` format. Include:
   - What failed and why
   - Prior fix attempts (if any)
   - Iteration number

### Step 5: Completion

When both QA agents pass:
1. Summarize completed work to the user
2. List commits made
3. Update agent memory with routing decisions
4. If deploy needed, spawn `devops-engineer`

## State Management

The tech-lead tracks:
- **Current task**: What the user asked for
- **Iteration count per bug**: How many times QA has rejected this specific issue
- **Subagent results**: Summary of what each subagent returned
- **Commit log**: What commits were made this session

Write critical state to agent memory (`MEMORY.md`) so it survives compaction.

## Context Compaction

When context fills (unlimited iterations):
1. Write current task state, iteration count, and subagent results to memory
2. Use `/compact Focus on [current task and QA state]`
3. After compaction, re-read memory to restore state
4. Continue the QA loop from where you left off

## Parallel Subagent Execution

When running multiple subagents in parallel (e.g., frontend + ghost-ai for independent changes):
- Use `run_in_background: true` for the second agent
- Wait for both to complete before spawning QA
- QA runs once covering ALL changes
