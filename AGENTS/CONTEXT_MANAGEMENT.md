# Context Management — Compaction, Commits & Handoffs

## The Core Problem

Claude's context window is finite. Every file read, command output, and message consumes tokens. When context fills up, Claude auto-compacts — summarizing the conversation to free space. **Anything not written to disk may be lost.**

The two defenses: **write to files** and **commit to git**.

## Golden Rules

1. **Write state to disk, not memory.** If it matters, put it in a file.
2. **Commit frequently.** Git commits are permanent checkpoints. Context windows are ephemeral.
3. **Load just-in-time.** Don't read 10 files upfront. Read the one you need when you need it.
4. **Use subagents for exploration.** They run in separate context windows and return summaries.
5. **`/clear` between unrelated tasks.** Don't let chat context bleed across domains.
6. **Compact with intent.** Use `/compact Focus on the video pipeline changes` to guide what's preserved.

## Git as Your Safety Net

### The Ratchet Pattern

```
Write code → Tests pass → COMMIT → (progress locked in forever)
                              ↓
                Write more code → Tests pass → COMMIT → ...
```

Each commit is a ratchet click. Progress only moves forward. If the next change breaks something, you revert ONE commit, not an entire session's work.

### Why Giant Diffs Kill Productivity

| Problem | With Frequent Commits | With Giant Diffs |
|---------|----------------------|------------------|
| Bug introduced | `git bisect` finds exact commit in seconds | Manual search through hundreds of lines |
| Context compacted | Work is committed — nothing lost | Uncommitted changes may be forgotten |
| Session crashes | All committed work survives | Everything since last commit is lost |
| Code review | Small, reviewable chunks | Overwhelming wall of changes |
| Rollback needed | Revert the one bad commit | Lose everything or cherry-pick manually |

### Commit Triggers

Commit immediately when ANY of these are true:

- A logical unit of work is complete
- Tests pass for changes you just made
- You're about to switch tasks
- You've added a new file
- You're at a stable checkpoint before a risky operation
- **You're ending a session (MANDATORY)**

**Target: <100 lines per commit. 3-10 commits per feature.**

## Pre-Compaction Checklist

Before context gets full (or before manually compacting), ensure:

- [ ] All changes committed to git
- [ ] Modified files list documented (in commit messages)
- [ ] Any discovered bugs/gotchas written to relevant `domain/` file
- [ ] Test commands and their results captured
- [ ] Current task state clear: what's done, what's next, what's blocked

## Compaction Protocol

### Automatic Compaction (Context Full)

Claude auto-compacts when approaching limits. To control what survives:

1. **CLAUDE.md always survives** — it's re-read from disk after compaction
2. **Git commits always survive** — they're on disk, not in context
3. **Conversation history gets summarized** — specific code snippets may be lost
4. **File contents are NOT retained** — you must re-read files after compaction

### Manual Compaction

```
/compact Focus on [specific area]
```

Examples:
- `/compact Focus on the audio backpressure changes and test results`
- `/compact Focus on the plugin SDK API changes`
- `/compact Preserve the deployment steps and server state`

### Targeted Rewind

Use `Esc + Esc` or `/rewind` to:
1. Select a message checkpoint
2. Choose "Summarize from here"
3. This keeps early context intact while summarizing recent exploration

### The `/clear` Habit

After 2 failed correction attempts → `/clear` and rewrite the prompt from scratch. A clean session with a better prompt almost always outperforms a long session with accumulated corrections.

## The Two-Context-Window Pattern

For work spanning multiple sessions:

**Session 1 (Initializer):**
1. Understand the task
2. Write a plan in `AGENTS/history/`
3. Start implementation, committing at every checkpoint
4. Write a handoff file before ending

**Session 2+ (Continuation):**
1. Read `git log --oneline -20` to see what was done
2. Read the handoff file from `AGENTS/history/`
3. Read relevant `AGENTS/domain/` file
4. Continue from where the last session left off
5. Commit at every checkpoint
6. Update the handoff file

## Session Handoff Protocol

### Step 1: Commit Everything

```bash
git add [specific files] && git commit -m "type(scope): description of final state"
```

**Never leave uncommitted work at session end.** If the work isn't ready to commit, stash it with a descriptive message.

### Step 2: Write the Handoff File

Use `templates/session-handoff.md`. Save to:
```
AGENTS/history/YYYY-MM-DD-brief-topic.md
```

Include: commits made, test results, what's next, warnings.

### Step 3: Update Domain Knowledge

If you discovered something important, update the relevant `domain/` file. This is how institutional knowledge accumulates across sessions.

### Step 4: Leave Breadcrumbs

At the end of your session, output:
- What was completed (with commit hashes)
- What's in progress
- What the next agent should start with
- Any blockers or warnings

## Starting a New Session

### Read Order (~30 seconds total)

1. `AGENTS/ONBOARDING.md` — refresh on project structure
2. `AGENTS/history/` — check for recent sessions in your area (read latest 1-2)
3. The relevant `AGENTS/domain/` file — deep knowledge for your task
4. `git log --oneline -20` — see recent commits

### Context Budget

| Content | Tokens | Priority |
|---------|--------|----------|
| ONBOARDING.md | ~800 | Always load |
| Relevant domain file | ~1,000 | Always load |
| Recent history file | ~500 | Load if exists |
| Active source files | ~3,000-5,000 | Load as needed |
| Command outputs | ~2,000 | Keep minimal |
| Conversation | Remaining | The actual work |

**Leave at least 60% of context for actual work.** If onboarding + file reads consume 40%+, you've loaded too much.

## Subagent Strategy

Use subagents to preserve main context:

```
# Good: Subagent explores, reports summary
Agent(type="Explore", prompt="Find all files that import AudioSource")

# Bad: Manually reading 15 files to find the right one
Read(file1) → Read(file2) → Read(file3) → ...
```

### When to Use Subagents

- **Codebase exploration** — "Find all uses of X" or "How does Y work?"
- **Research** — "What's the current state of Z in the codebase?"
- **Validation** — "Run tests and report results" (background agent)

### When NOT to Use Subagents

- **Simple file reads** — Just use Read directly
- **Single grep** — Just use Grep directly
- **The actual implementation** — You need main context for coordinated edits

## Memory Hierarchy

| Tier | Location | When Loaded | Survives Compaction |
|------|----------|-------------|---------------------|
| Always-on | CLAUDE.md, `.claude/rules/` | Every session | Yes (re-read from disk) |
| On-demand | `AGENTS/domain/`, skills | When relevant | No (re-read from disk) |
| Permanent | Git commits | Always available | Yes (on disk) |
| Session-only | Conversation context | Current session | Summarized on compaction |
| Ephemeral | Tool outputs | Current turn | Lost unless written to file |
