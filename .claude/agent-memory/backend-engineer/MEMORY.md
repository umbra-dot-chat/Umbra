# Backend Engineer Memory

## umbra-debug TUI
- **Location**: `packages/umbra-debug/` — standalone binary, no umbra-core dependency
- **Pattern**: Copies ratatui/crossterm patterns from `packages/umbra-cli/`
- **Deps**: ratatui 0.29, crossterm 0.28, tokio-tungstenite 0.24, clap 4, dirs 6
- **WebSocket**: Port 9999 default, multi-client, receives TraceEvent JSON
- **Tabs**: Dashboard, All, WASM, SQL, Net, Mem, Err, Analysis, Browser, Log, Compare, Replay (12 tabs)
- **Store**: `~/.umbra/debug-logs/` with 20-session JSONL rotation
- **CLI query mode**: `umbra-debug query --last-crash|--memory-suspects|--hot-functions|--grep|--tail|--memory-timeline|--slow-wasm N|--render-storms|--state-changes CTX|--timeline HH:MM HH:MM|--errors-only|--budget-violations`
- **CLI compare mode**: `umbra-debug --compare session1.jsonl session2.jsonl`
- **Build**: `cargo check` / `cargo clippy` from `packages/umbra-debug/`
- **Clippy**: Use `is_some_and()` instead of `map_or(false, ...)` (newer Rust idiom)

## umbra-core Architecture
- **wasm.rs**: `packages/umbra-core/src/ffi/wasm.rs` — ~13K lines, 300 `#[wasm_bindgen]` FFI exports
- **Module gate**: `#![cfg(feature = "wasm")]` — file only compiles for wasm32 target with `wasm` feature
- **State**: `OnceCell<Arc<RwLock<WasmState>>>` global singleton
- **Tracing**: `tracing-wasm` for browser console (WARN level), or `BridgeSubscriber` (INFO level) when `debug-trace` enabled
- **tracing_bridge.rs**: Ring buffer subscriber (VecDeque<TraceEvent>, cap 5000), also logs to browser console on WASM
- **flush_trace_events()**: `umbra_wasm_flush_trace_events()` drains ring buffer as JSON array; returns `"[]"` when debug-trace disabled
- **Features**: `wasm`, `ffi`, `verbose-logging`, `debug-trace`
- **No workspace Cargo.toml** — each package builds independently
- **umbra-trace-macro**: proc macro crate at `packages/umbra-trace-macro/` providing `#[trace_ffi]`
- **323 tests** pass in umbra-core (native), 4 doc-tests ignored

## Cross-compilation Notes
- `cargo check --target wasm32-unknown-unknown --features wasm` verifies WASM build
- `cargo check --features debug-trace` works on native (wasm.rs cfg-gated out)
- Proc macros compile on host regardless of `--target`

## Relay Architecture
- **State**: `RelayState` in `packages/umbra-relay/src/state.rs` uses `Arc<DashMap<...>>` for concurrent state
- **Offline queue**: `offline_queue: Arc<DashMap<String, Vec<OfflineMessage>>>` keyed by DID
- **Protocol**: `ServerMessage` / `ClientMessage` enums in `protocol.rs`, JSON-over-WebSocket with `#[serde(tag = "type", rename_all = "snake_case")]`
- **Handler**: `handler.rs` routes `ClientMessage` variants to handler functions
- **Stats endpoint**: `/stats` in `main.rs`, uses `serde_json::json!()` macro
- **Federation**: Optional relay-to-relay mesh via `federation.rs`
- **OfflineMessage** already derives `Clone` (needed for `.to_vec()` on chunks)

## Key Patterns
- Add `#[serde(default)]` to new fields in protocol enums for backward compatibility
- DashMap iteration: `.iter()` returns refs, use `.key().clone()` / `.value().len()`
- `send_to_client` returns bool indicating whether delivery succeeded
- Tests use `mpsc::unbounded_channel()` to capture sent messages

## Debug Endpoint (Relay)
- `/debug?token=<secret>` WebSocket endpoint in `debug.rs`
- Auth via `UMBRA_DEBUG_TOKEN` env var (403 if unset, 401 if wrong)
- `DebugState` stored as `Option<DebugState>` on `RelayState`
- `state.emit_debug(fn_name, arg_bytes, extra_json)` broadcasts to debug clients
- Events: client_connect, client_disconnect, msg_route, msg_queue, msg_dequeue, queue_size
- Periodic queue_size snapshot every 5s (spawned in main.rs)
- Tests: avoid env var manipulation (race conditions in parallel) -- use direct struct construction

## Build Commands
- `cargo check` / `cargo test` / `cargo clippy` from `packages/umbra-relay/`
- 28 pre-existing warnings (dead code in discovery/oauth modules) -- not ours to fix
- All 90 tests should pass (85 original + 5 debug)

## Dashboard Tab (debug-tui)
- **File**: `packages/umbra-debug/src/ui/dashboard_tab.rs`
- Three-row layout: sparklines | tables | status
- Top: Heap Memory, Render Rate, Events/sec sparklines (60s window)
- Middle: Hot Functions (top 5), Memory Suspects (top 5), Active Errors (last 3)
- Bottom: Budget Status, Web Vitals (INP/CLS/LCP/FCP), Session info
- Default tab when launching umbra-debug

## Breakpoint System (debug-tui)
- **File**: `packages/umbra-debug/src/ui/breakpoint.rs`
- Conditions: `render>N`, `heap>N`, `wasm>Nms`, `error`, `cat:level`
- App fields: `breakpoints`, `bp_paused`, `bp_pause_reason`, `bp_input_mode`, `bp_input`, `bp_pause_index`, `bp_step_one`
- Keys: `b`=add breakpoint, `Space`=resume, `n`=step, `c`=continue
- Breakpoint check happens in `handle_ws_event` before `ingest_event`
- 7 unit tests for condition parsing

## Compare Tab (debug-tui)
- **Files**: `store/compare.rs` (logic), `ui/compare_tab.rs` (UI)
- `SessionComparison` struct: summary, memory_diff, render_rate_diff, event_freq_diff, new_errors, wasm_regressions
- Two-column layout: Session A metrics left, Session B right, event freq table, regressions below
- Colors: red for regressions, green for improvements, cyan for A, magenta for B
- `C` keybinding loads comparison from two most recent sessions
- `--compare path1 path2` enters comparison mode directly

## Concurrent Agent Hazards
- Other agents may modify `app.rs` and `ui/mod.rs` concurrently
- Always re-read files before editing (stale file errors common)
- Watch for incomplete Tab additions (mod.rs references without Tab enum variant)

## Commit Style
- Format: `feat(relay):` / `fix(relay):` for relay changes
- Keep under 100 lines per commit
