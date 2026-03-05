# `umbra-test` — TUI Test Runner for Umbra Monorepo

## Context

Running tests across the Umbra monorepo involves 4 different frameworks (Detox, Playwright, Jest, Rust) with different commands, configs, and dependencies. The goal is a single TUI tool that lets you browse all tests in a tree, select them with checkboxes, run them, and watch live output — without leaving the terminal.

## Design Decisions (from Q&A)

- **Layout**: Split pane — left tree, right live output
- **Theme**: Catppuccin Mocha
- **Status bar**: Always visible with counts + keybind hints
- **Output**: Live streaming line-by-line, per-test history on click
- **Discovery**: Auto-scan `__tests__/` + `packages/*/`, auto-refresh via filesystem watcher
- **Hierarchy**: Type (Detox/Playwright/Jest/Rust) > Folder > File
- **Execution**: Sequential only, auto-manage Metro + relay for Detox sync tests
- **Navigation**: Vim (j/k/h/l) + arrow keys, `/` to search, `?` for help
- **Selection**: Space=toggle, `a`=select all in category, `A`=all, `c`=clear, Enter on category=run all
- **Detox**: Prompt for ios.debug vs ios.release each run
- **Persistence**: Remember last selection + recent runs in `.umbra-test-state.json`
- **Config**: `.umbra-test.toml` for custom paths, env vars, relay config
- **Platform**: Cross-platform (Detox hidden on Linux)
- **Binary**: `umbra-test`, launched via `npm run test:tui`

## Package Location

`packages/umbra-testing/` — standalone Rust binary, no dependency on umbra-core. Follows the same independent `Cargo.toml` pattern as other packages (no workspace).

## Module Structure

```
packages/umbra-testing/
├── Cargo.toml
└── src/
    ├── main.rs              # tokio main, terminal init, event loop
    ├── tui.rs               # Terminal lifecycle (from umbra-cli pattern)
    ├── event.rs             # AppEvent enum + EventHandler
    ├── config.rs            # .umbra-test.toml loading
    ├── theme.rs             # Catppuccin Mocha color constants
    ├── app/
    │   ├── mod.rs           # App struct, handle_key, tick
    │   ├── types.rs         # TestType, TestStatus, TreeNode, FlatNode, etc.
    │   ├── input.rs         # Key handling per mode (Normal/Search/Help/DetoxPrompt)
    │   └── selection.rs     # Toggle, select-all, clear, category ops
    ├── discovery/
    │   ├── mod.rs           # Orchestrator: scan all, build tree
    │   ├── detox.rs         # Scan __tests__/e2e-ios/ for .test.ts
    │   ├── playwright.rs    # Scan __tests__/e2e/ for .spec.ts
    │   ├── jest.rs          # Scan __tests__/ (exclude e2e dirs) for .test.ts
    │   ├── rust.rs          # Find Cargo.toml packages with tests
    │   └── watcher.rs       # notify crate filesystem watcher
    ├── runner/
    │   ├── mod.rs           # Sequential execution coordinator
    │   ├── process.rs       # Subprocess spawn, stdout/stderr streaming, kill
    │   ├── detox.rs         # Detox commands + Metro/relay lifecycle
    │   ├── playwright.rs    # Playwright commands
    │   ├── jest.rs          # Jest commands
    │   ├── rust.rs          # cargo test commands
    │   └── output.rs        # Per-test buffer, error detection, screenshot paths
    ├── ui/
    │   ├── mod.rs           # Layout split, render dispatch
    │   ├── tree.rs          # Left pane: test tree with icons/selection
    │   ├── output_pane.rs   # Right pane: live output + history
    │   ├── status_bar.rs    # Bottom bar: counts + keybind hints
    │   ├── help_overlay.rs  # ? toggle: keybinding reference
    │   ├── detox_prompt.rs  # Modal: ios.debug vs ios.release
    │   ├── search_bar.rs    # / search filter
    │   └── recent_runs.rs   # Recent runs section at top of tree
    └── state/
        ├── mod.rs           # Persistence module
        └── persistence.rs   # .umbra-test-state.json read/write
```

## Key Data Types

```rust
enum TestType { Detox, Playwright, Jest, Rust }
enum TestStatus { Idle, Queued, Running, Passed, Failed, Cancelled }
enum InputMode { Normal, Search, DetoxPrompt, Help }
enum PaneFocus { Tree, Output }

struct TreeNode {
    id: String,           // "detox/auth/account-creation.test.ts"
    label: String,        // "account-creation.test.ts"
    kind: NodeKind,       // Category | Folder | TestFile { path, test_type } | RustPackage
    children: Vec<TreeNode>,
    expanded: bool,
    selected: bool,
    status: TestStatus,
    depth: usize,
}

struct App {
    tree: Vec<TreeNode>,
    visible_nodes: Vec<FlatNode>,  // flattened for rendering
    cursor: usize,
    selected: HashSet<String>,
    run_queue: VecDeque<String>,
    running_test: Option<String>,
    live_output: Vec<OutputLine>,
    output_history: HashMap<String, TestOutput>,
    // ... counts, UI state, config, persistence
}
```

## Test Commands Generated

| Type | Command |
|------|---------|
| Detox | `npx detox test -c {ios.debug\|ios.release} {path}` |
| Playwright | `npx playwright test --config=__tests__/e2e/playwright.config.ts {path}` |
| Jest | `npx jest {path}` |
| Rust | `cargo test -p {package_name}` |

## Keybindings

| Key | Action |
|-----|--------|
| `j`/`k` or ↑/↓ | Navigate tree |
| `h`/`l` or ←/→ | Collapse/expand |
| `Space` | Toggle selection |
| `Enter` | Run selected (or run category) |
| `a` | Select all in category |
| `A` | Select all |
| `c` | Clear selection |
| `r` | Re-run failed |
| `Tab` | Switch pane focus |
| `/` | Search mode |
| `?` | Help overlay |
| `o` | Open screenshot (output pane) |
| `Ctrl+C` | Cancel running test |
| `Ctrl+C` x2 | Quit |
| `q` | Quit |

## UI Layout

```
┌─────────────────────┬──────────────────────────────────┐
│ Recent Runs         │ Live Output                      │
│ [✓ 5/5] 2m ago     │                                  │
│ ────────────────    │ Running: account-creation.test.ts │
│ ▾ Detox             │                                  │
│   ▾ auth            │ > Creating account...            │
│     ✓ account-cr..  │ > Waiting for auth screen        │
│     ✗ account-im..  │ > PASS T1.1.1                    │
│     ○ pin-lock      │ > PASS T1.1.2                    │
│   ▸ social          │ > FAIL T1.1.3                    │
│   ▸ settings        │   Expected: visible              │
│ ▸ Playwright        │   Received: not found            │
│ ▸ Jest              │                                  │
│ ▸ Rust              │                                  │
├─────────────────────┴──────────────────────────────────┤
│ 3 selected  1 running  2 ✓  1 ✗  │ ?=help /=search    │
└────────────────────────────────────────────────────────┘
```

## Dependencies

```toml
[package]
name = "umbra-testing"
version = "0.1.0"
edition = "2021"
description = "TUI test runner for the Umbra monorepo"

[[bin]]
name = "umbra-test"
path = "src/main.rs"

[dependencies]
ratatui = "0.29"
crossterm = "0.28"
tokio = { version = "1", features = ["rt-multi-thread", "sync", "macros", "time", "process", "io-util"] }
color-eyre = "0.6"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
toml = "0.8"
notify = "7"
glob = "0.3"
strip-ansi-escapes = "0.2"
chrono = { version = "0.4", features = ["clock"] }
open = "5"
regex = "1"
unicode-width = "0.2"
```

## Existing Code to Reuse

- `packages/umbra-cli/src/tui.rs` — Terminal init/restore pattern (copy directly)
- `packages/umbra-cli/src/event.rs` — Event handler pattern (extend with test events)
- `packages/umbra-cli/src/app/mod.rs` — State machine, key dispatch pattern
- `scripts/run-sync-test.sh` — Relay/Metro lifecycle logic to port to Rust

## Configuration File

`.umbra-test.toml` at project root:

```toml
[paths]
detox_dir = "__tests__/e2e-ios"
playwright_dir = "__tests__/e2e"
jest_root = "__tests__"
rust_packages = "packages"
jest_exclude = ["e2e-ios", "e2e"]

[detox]
default_config = "ios.debug"
always_prompt = true

[relay]
auto_start = true
binary_path = "packages/umbra-relay/target/release/umbra-relay"
port = 9090

[env]
EXPO_PUBLIC_RELAY_URL = "http://localhost:9090"
```

## State Persistence

`.umbra-test-state.json` at project root:

```json
{
  "last_selection": ["detox/auth/account-creation.test.ts"],
  "recent_runs": [
    {
      "timestamp": 1709500000,
      "test_ids": ["detox/auth/account-creation.test.ts"],
      "passed": 5,
      "failed": 1,
      "total": 6,
      "duration_secs": 120.5
    }
  ],
  "detox_config": "ios.release"
}
```

## Implementation Milestones

### Milestone 1: Skeleton + Tree View
Create the binary, discover all tests, render the tree with navigation. No execution yet.
- `Cargo.toml`, `main.rs`, `tui.rs`, `event.rs`, `theme.rs`, `config.rs`
- `app/mod.rs`, `app/types.rs`, `app/input.rs`
- `discovery/` (all scanners)
- `ui/mod.rs`, `ui/tree.rs`, `ui/output_pane.rs` (empty), `ui/status_bar.rs`

### Milestone 2: Selection + Execution
Multi-select with Space/a/A/c, run with Enter, live output streaming, Detox config prompt, Ctrl+C cancel.
- `app/selection.rs`
- `runner/` (all modules)
- `ui/output_pane.rs` (live streaming), `ui/detox_prompt.rs`
- Update status bar with live counts, tree with pass/fail icons

### Milestone 3: Polish + Features
Search, help overlay, per-test output history, recent runs, persistence, screenshot open, re-run failed.
- `ui/help_overlay.rs`, `ui/search_bar.rs`, `ui/recent_runs.rs`
- `state/` (persistence)
- `discovery/watcher.rs` (auto-refresh)

### Milestone 4: Auto-managed Processes + Hardening
Metro/relay lifecycle for Detox sync tests, cross-platform guards, error handling, npm script.
- `runner/detox.rs` (Metro + relay management)
- Platform checks (`cfg!(target_os)`)
- Add `test:tui` to root `package.json`

## Verification

1. `cargo build -p umbra-testing` compiles
2. `cargo run -p umbra-testing` from repo root shows test tree with all 4 categories
3. Navigate with j/k, expand/collapse with h/l
4. Select Jest tests, Enter to run, see live output
5. Select Playwright tests, run, verify pass/fail icons
6. Select Detox tests, get config prompt, run
7. `/` filters tree, `?` shows help, `r` re-runs failed
8. Quit and relaunch — last selection restored
