# Agent Memory System

## How It Works

Each agent has `memory: project` in its `.claude/agents/` definition. This creates a persistent memory file at:

```
.claude/agent-memory/<agent-name>/MEMORY.md
```

The first 200 lines of `MEMORY.md` are automatically injected into the agent's context at startup. This means agents accumulate knowledge across sessions.

## What Each Agent Stores

| Agent | Memory Contents |
|-------|----------------|
| tech-lead | Routing decisions, iteration counts, task patterns, escalation history |
| frontend-engineer | Component locations, hook patterns, Wisp gotchas, CSS selectors |
| mobile-engineer | Platform-specific quirks, build configs, Detox patterns, EAS notes |
| backend-engineer | Rust API patterns, crypto implementation notes, libp2p config, WASM quirks |
| ghost-ai-engineer | Pipeline tuning values, buffer sizes, wrtc API notes, FFmpeg flags |
| qa-automated | Flaky test patterns, test command variations, timing-sensitive tests |
| qa-manual | CSS selectors for key components, viewport breakpoints, common failure patterns |
| devops-engineer | Server state, deploy history, rollback procedures, monitoring commands |

## Memory Hygiene

- **Keep under 200 lines.** Everything after line 200 is NOT auto-loaded.
- **Organize by topic, not chronologically.** Group related findings together.
- **Update, don't append.** If a finding replaces an older one, edit the existing entry.
- **Remove outdated entries.** If a bug was fixed and the workaround is no longer needed, delete it.

## Shared vs Private Knowledge

| Type | Location | Who Writes | Who Reads |
|------|----------|-----------|-----------|
| Private agent memory | `.claude/agent-memory/<name>/MEMORY.md` | The agent itself | Only that agent |
| Shared domain knowledge | `AGENTS/domain/` | Any agent (via tech-lead) | All agents |
| Session history | `AGENTS/history/` | Tech-lead | All agents |

When an agent discovers something important that OTHER agents should know, the tech-lead promotes it from private memory to the appropriate shared `AGENTS/domain/` file.
