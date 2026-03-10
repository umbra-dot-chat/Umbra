# Session History

This directory contains session summaries from agent work on Umbra. Each file captures:
- What was done
- What was learned
- What the next agent should know

## Naming Convention

```
YYYY-MM-DD-brief-topic.md
```

Examples:
- `2026-03-10-webrtc-audio-video-fixes.md`
- `2026-03-11-plugin-sdk-v2.md`
- `2026-03-12-community-channels.md`

## How to Write a Good Session Summary

Use `AGENTS/templates/session-handoff.md` as your starting template.

**Keep it under 100 lines.** A future agent reads this in 10 seconds. Be concise.

**Focus on:**
1. What files were modified and why
2. Bugs found and their root causes
3. Non-obvious discoveries ("I expected X but found Y")
4. What's left to do

**Skip:**
- Detailed code snippets (the agent can read the files)
- Full command outputs (summarize results instead)
- Conversation history (that's what context compaction is for)

## Reading History as a New Agent

1. `ls -t AGENTS/history/` — most recent first
2. Read the latest 1-2 files in your task area
3. Don't read everything — just what's relevant to your current task
