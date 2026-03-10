# AGENTS — Umbra Agent Onboarding & Context Hub

## What This Is

This directory is the single source of truth for any Claude agent (or human developer) working on Umbra. It contains:

- **Onboarding docs** that get an agent productive in minutes, not hours
- **Domain knowledge** organized by subsystem so agents only load what they need
- **Templates** for common workflows (bug investigation, feature implementation, handoffs)
- **Session history** so agents can learn from past debugging sessions
- **Rules** that enforce quality gates before commits and deploys

## How to Use This Directory

### For a New Agent Session

1. **Read `ONBOARDING.md`** — 2-minute overview of the project, packages, and conventions
2. **Read the relevant `domain/` file** for your task area (e.g., `webrtc-media-pipeline.md` for Ghost AI work)
3. **Check `history/`** for recent sessions in the same area — saves re-discovering known bugs
4. **Use a `templates/` file** to structure your work (handoff, bug investigation, etc.)

### For Context Compaction

When your context window fills up, use `CONTEXT_MANAGEMENT.md` for the compaction protocol. The key principle: **write state to disk before compacting** so the next context window starts informed.

### For Handoffs Between Sessions

Use `templates/session-handoff.md` to write a structured summary. Drop it in `history/` with a date-prefixed filename. The next agent reads it and picks up where you left off.

## Directory Map

```
AGENTS/
├── README.md                      # You are here
├── ONBOARDING.md                  # Quick-start for new agents
├── CONTEXT_MANAGEMENT.md          # Context compaction & handoff protocol
├── ARCHITECTURE_MAP.md            # Compact project architecture reference
├── TESTING_PLAYBOOK.md            # How to test changes across the monorepo
├── DEPLOYMENT_GUIDE.md            # How to deploy each package
├── domain/                        # Domain-specific deep knowledge
│   ├── webrtc-media-pipeline.md   # Ghost AI, video/audio, FFmpeg, wrtc
│   ├── plugin-system.md           # Plugin SDK, runtime, sandbox
│   ├── crypto-identity.md         # Rust core, encryption, DID
│   ├── expo-frontend.md           # React Native, Expo, Wisp UI
│   └── relay-networking.md        # Relay server, P2P, networking
├── templates/                     # Reusable workflow templates
│   ├── session-handoff.md         # Session transition template
│   ├── bug-investigation.md       # Debugging session template
│   ├── feature-implementation.md  # New feature plan template
│   └── deployment-checklist.md    # Pre/post deployment checklist
├── history/                       # Session logs & learnings
│   └── YYYY-MM-DD-topic.md       # Date-prefixed session summaries
└── rules/                         # Quality gates & guardrails
    ├── always.md                  # Always-active rules
    ├── before-commit.md           # Pre-commit checklist
    └── before-deploy.md           # Pre-deploy checklist
```

## Design Principles

1. **Just-in-time loading** — Don't read everything. Load the onboarding doc + the domain file for your task.
2. **Disk over memory** — Write findings to files. Context windows are ephemeral; files are permanent.
3. **Signal over noise** — Every line in these docs should pass the test: "Would removing this cause an agent to make a mistake?"
4. **Progressive disclosure** — Onboarding is ~100 lines. Domain docs go deeper. History has the full story.
5. **Templates reduce variance** — Use them. Structured output from one session becomes structured input for the next.
