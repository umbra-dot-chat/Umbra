# Agent Onboarding — Umbra in 2 Minutes

## Two Non-Negotiable Rules

Before anything else, internalize these. They override everything.

### 1. Commit Frequently — No Giant Diffs

**Target: <100 lines per commit. 3-10 commits per feature.** Commit after every logical unit of work, after every passing test, and ALWAYS before ending a session. Git is your safety net — every commit is a checkpoint you can rollback to. Giant diffs are undebuggable, unreviewable, and lose work when context compacts.

### 2. Test Iteratively — You Have No Eyes, Ears, or Hands

**You cannot see the screen. You cannot hear audio. You cannot feel lag.** The user can. Close the gap with machine-verifiable checks: accessibility snapshots, DOM inspection, console error monitoring, network request validation, real-pipeline tests. Run verification at LEAST twice. Iterate to improve results, don't settle for "barely passing."

See `TESTING_PLAYBOOK.md` for the full iterative verification loop.

---

## What Is Umbra?

Umbra is a **private, peer-to-peer encrypted messaging app** with voice/video calls, communities, plugins, and an AI companion bot. It runs on iOS, Android, Web, macOS, Windows, and Linux.

## Monorepo Package Map

| Package | Language | What It Does |
|---------|----------|-------------|
| `umbra-core` | Rust | Cryptography (X25519, AES-256-GCM, Ed25519), networking, storage |
| `umbra-service` | TypeScript | API layer over core — the bridge between Rust and JS |
| `umbra-wasm` | Rust→WASM | Browser backend for umbra-core |
| `umbra-relay` | Rust | P2P relay server for NAT traversal |
| `umbra-ghost-ai` | Node.js | AI companion bot with WebRTC voice/video calls |
| `umbra-plugin-sdk` | TypeScript | Plugin development kit (types, hooks, utilities) |
| `umbra-plugin-runtime` | TypeScript | Sandboxed plugin execution environment |
| `umbra-cli` | Rust | Command-line interface |
| `umbra-test-bot` | TypeScript | E2E test bot |
| `umbra-bridge-bot` | TypeScript | Cross-platform bridge |

## Frontend Stack

- **Expo SDK 54** + React 19 + React Native 0.81
- **Expo Router v6** — file-based routing in `app/`
- **@coexist/wisp-react-native** — ALL UI components (zero custom StyleSheet)
- **Tauri** for desktop (Rust shell around web view)
- Dark mode default, three-panel layout on desktop

## Key Directories

```
app/          → Expo Router routes (tabs, modals)
src/          → Main app code (components, contexts, hooks, services)
packages/     → 13 core packages (see table above)
plugins/      → User-installable plugins
modules/      → Expo native modules (expo-umbra-core, expo-video-effects)
docs/         → Architecture docs, feature plans, testing guides
scripts/      → Build, deploy, patch scripts
__tests__/    → E2E and unit tests
AGENTS/       → THIS directory — agent onboarding, domain knowledge, templates
```

## Essential Commands

```bash
# Development
npm run web                    # Start Expo dev server (web)
npx expo start                 # Start Expo dev server (all platforms)
npm run patch                  # Sync local Wisp UI changes

# Type-Check (run before EVERY commit)
npx tsc --noEmit               # Main app
cd packages/umbra-ghost-ai && npx tsc --noEmit  # Ghost AI

# Testing
npm test                       # Unit tests (Jest)
npm run test:e2e               # E2E tests (Playwright)

# Ghost AI Deploy (on server 45.77.149.94)
cd packages/umbra-ghost-ai
npx tsc --noEmit && npx tsc   # Build
rsync -avz dist/ root@45.77.149.94:/opt/ghost-ai/dist/
ssh root@45.77.149.94 "systemctl restart ghost-en"
# Then run real-pipeline tests — see TESTING_PLAYBOOK.md
```

## Conventions

- **UI**: Always use Wisp components. Never `StyleSheet.create()`.
- **Colors**: Access via `useTheme()` → `colors.background.canvas`, `colors.text.primary`, etc.
- **State**: React Context providers in `src/contexts/`. No Redux.
- **Hooks**: 49 custom hooks in `src/hooks/`. Check before creating new ones.
- **Plugins**: Register via `api.registerSlashCommand()` in plugin SDK.
- **Crypto**: All handled in Rust core. Never roll your own in JS.
- **Commits**: Small, frequent, descriptive. `type(scope): subject` format.

## What to Read Next

Pick the domain file that matches your task:
- Working on calls/video/audio? → `domain/webrtc-media-pipeline.md`
- Working on plugins? → `domain/plugin-system.md`
- Working on encryption/identity? → `domain/crypto-identity.md`
- Working on the UI? → `domain/expo-frontend.md`
- Working on networking/relay? → `domain/relay-networking.md`

Then read `rules/always.md` for the full rule set.

## Multi-Agent Team

Umbra uses a **tech company-style agent team**. Run `claude --agent tech-lead` to activate.

```
tech-lead (orchestrator)
  ├── frontend-engineer    → web + desktop UI (Expo, Wisp, Router)
  ├── mobile-engineer      → iOS/Android (native modules, Detox)
  ├── backend-engineer     → Rust (core, relay, CLI, WASM)
  ├── ghost-ai-engineer    → Node.js WebRTC bot (FFmpeg, wrtc)
  ├── qa-automated         → test suites (Jest, Playwright, loopback)
  ├── qa-manual            → preview verification (snapshot, inspect, console)
  └── devops-engineer      → deployment (rsync, SSH, monitoring)
```

See `team/README.md` for full role descriptions and `team/orchestration.md` for the workflow.
