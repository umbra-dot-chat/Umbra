# Umbra Development Team — Agent Roles

## Architecture

One **tech-lead** orchestrates specialized subagents. The tech-lead runs as the main conversation (`claude --agent tech-lead`). All other agents are spawned by the tech-lead as subagents.

```
User → tech-lead (orchestrator)
         ├── frontend-engineer    (web + desktop UI)
         ├── mobile-engineer      (iOS/Android)
         ├── backend-engineer     (Rust core/relay/CLI)
         ├── ghost-ai-engineer    (Node.js WebRTC bot)
         ├── ux-designer          (UI/UX consistency + workflows)
         ├── qa-automated         (test suites)
         ├── qa-manual            (preview verification)
         └── devops-engineer      (deploy + servers)
```

## Role Summaries

### tech-lead
The orchestrator. Receives tasks from the user, explores the codebase to understand scope, routes to the right developer(s), manages the QA feedback loop, and escalates when stuck. Never writes code directly — always delegates.

### frontend-engineer
Owns web and desktop UI. Expo Router routes, React components, Wisp UI integration, contexts, hooks, responsive layouts, Tauri desktop views. Primary files: `app/`, `src/components/`, `src/contexts/`, `src/hooks/`, `src/services/`.

### mobile-engineer
Owns iOS and Android platform code. Expo native modules (expo-umbra-core, expo-video-effects), Detox E2E tests, EAS builds, platform-specific APIs. Primary files: `modules/`, `__tests__/e2e-ios/`.

### backend-engineer
Owns Rust infrastructure. umbra-core (crypto, networking, storage), umbra-relay (P2P server), umbra-cli (TUI), umbra-wasm (browser bridge), umbra-testing. Primary files: `packages/umbra-core/`, `packages/umbra-relay/`, `packages/umbra-cli/`, `packages/umbra-wasm/`.

### ghost-ai-engineer
Owns the Ghost AI bot. WebRTC calls, FFmpeg media pipeline, @roamhq/wrtc, audio/video processing, ring buffers, backpressure, loopback testing. Primary files: `packages/umbra-ghost-ai/`.

### ux-designer
UI/UX specialist. Audits screens for consistent whitespace, correct Wisp component usage, color contrast (WCAG AA), interaction patterns, and user workflow logic. Makes small targeted visual fixes (<20 lines) or writes detailed specs for frontend-engineer to implement. Runs spacing, color, and responsive audits via preview tools.

### qa-automated
Runs test suites. Jest unit tests, Playwright E2E, Detox mobile, Ghost AI real-pipeline loopback tests, TypeScript type-checking. Reports structured pass/fail results. Never fixes bugs.

### qa-manual
Manual verification. Uses preview tools: accessibility snapshots, DOM inspection, CSS property checks, console error monitoring, network request validation, responsive layout testing, screenshot visual sanity. Never fixes bugs.

### devops-engineer
Deployment and infrastructure. rsync deploys, systemctl service management, SSH to servers, server monitoring, log inspection, rollback procedures. Owns `scripts/deploy.sh` and server infrastructure.

## Workflow Documents

- `orchestration.md` — How the tech-lead routes tasks and manages subagents
- `qa-workflow.md` — The QA pipeline and pass/fail criteria
- `bug-report-template.md` — Structured format for QA→developer bug reports
- `escalation-protocol.md` — When and how to escalate to the user
- `commit-conventions.md` — Per-agent commit attribution rules
- `cross-cutting-tasks.md` — Decision framework for multi-domain tasks
