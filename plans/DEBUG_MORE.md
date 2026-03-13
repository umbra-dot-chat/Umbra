# Umbra Debug Infrastructure — Full-Stack Observability Plan

## Context

Phases 0-8 of the StressTest3 crash logging are **complete**. We now have 15 log categories, TUI streaming, trace buffer, 48/142 components tracked, WASM call tracing, _dispatchEvent timing, and a TUI Log tab. But coverage is still partial: 109 remaining `console.*` calls, 35/50 hooks missing dbg, 94/142 components without render tracking, no Rust→JS bridge, no state diffing, no Web Vitals, no debug tests.

This plan extends Umbra's debug system from "crash investigation tool" to **full-stack observability platform** with 18 phases.

---

## Phase 1: Finish console.* Migration (~55 calls in 8 files)

**Service layer** (37 calls):
- `packages/umbra-service/src/service.ts` — 29 error handlers → `_dbg()?.error?.()`
- `packages/umbra-service/src/messaging.ts` — 7 relay/decrypt errors → `_dbg()?.warn?.()`

**App routes** (15 calls):
- `app/(main)/community/[communityId].tsx` (6), `app/(main)/index.tsx` (5), `app/(main)/files.tsx` (2), `app/(main)/call-diagnostics.tsx` (1), `app/_layout.tsx` (1)

**Components** (2 calls):
- `src/components/chat/ChatInput.tsx` (1), `src/utils/parseMessageContent.tsx` (1)

Pattern: Replace `console.error(msg, err)` → `dbg.error('category', msg, { error: err?.message }, SRC)`

---

## Phase 2: Remaining Hooks → dbg (35 hooks)

Add `import { dbg } from '@/utils/debug'` + `const SRC = 'useXxx'` to all 35 hooks.

**Priority hooks** (significant logic, need entry/exit logging):
`useCall`, `useConversations`, `useSharedFolders`, `useDiscovery`, `useMediaDevices`, `useCommandPalette`, `useMessageNotifications`, `useInstanceDetection`, `useSlashCommand`, `useTyping`

**Simple hooks** (render tracking + error logging only):
`useAnimatedToggle`, `useIsMobile`, `useFullscreen`, `useHoverMessage`, `useProfilePopover`, `useRightPanel`, `useSound`, `useCallSettings`, `useCommunities`, `useCommunityFiles`, `useConnectionLink`, `useDeveloperSettings`, `useDmFiles`, `useFriendNotifications`, `useMention`, `useNativeVideoEffects`, `useNotificationListener`, `usePendingInvite`, `usePlatformMedia`, `useStorageManager`, `useUploadProgress`, `useVideoFilters`, `useWalletFlow`, `useActiveConversationData`, `useAllCustomEmoji`

---

## Phase 3: Remaining Contexts → dbg (5 contexts)

- `ActiveConversationContext.tsx` — conversation switch logging
- `CommunityContext.tsx` — community join/leave/channel switch
- `HelpContext.tsx` — help panel state changes
- `ProfilePopoverContext.tsx` — popover show/hide
- `SettingsDialogContext.tsx` — settings open/close/tab switch

---

## Phase 4: Remaining Component Render Tracking (~94 components)

Add `if (__DEV__) dbg.trackRender('ComponentName')` to all components in:
- `src/components/community/` — channels, settings, invite panels (~25 components)
- `src/components/discovery/` — opt-in, linked accounts (~6 components)
- `src/components/friends/` — friend list items, suggestions (~5 components)
- `src/components/guide/` — guide content pages (~15 components)
- `src/components/auth/` — remaining auth flow components (~8 components)
- `src/components/call/` — remaining call components (~5 components)
- `src/components/chat/` — remaining chat components (~5 components)
- `app/` — route components without tracking (~10 components)
- `src/components/ui/` — utility components (~15 components)

---

## Phase 5: Rust→JS Logging Bridge

**Problem**: umbra-core has `tracing = "0.1"` + `debug-trace` feature but no subscriber sends events to JS.

**Implementation**:
1. **`packages/umbra-core/src/tracing_bridge.rs`** (new): Custom `tracing::Subscriber` that writes events to a thread-safe ring buffer (`VecDeque<TraceEvent>`, 5000 entries)
2. **`packages/umbra-wasm/src/lib.rs`**: Expose `flush_trace_events() -> JsValue` via `#[wasm_bindgen]` — drains ring buffer, returns JSON array
3. **`packages/umbra-wasm/tracer.ts`**: Poll `flush_trace_events()` every 500ms when debug is active. Feed events into existing WebSocket → TUI pipeline
4. **Enable `debug-trace` feature** in wasm build profile for dev builds

**What becomes visible**: All `tracing::info!()`, `tracing::warn!()`, `tracing::error!()` calls in Rust crypto, storage, networking — decoded, timestamped, and streamed to TUI.

---

## Phase 6: State Change Tracking — `useTrackedState<T>`

**File**: `src/hooks/useTrackedState.ts` (new, ~80 lines)

```typescript
function useTrackedState<T>(contextName: string, fieldName: string, initialValue: T) {
  const [value, rawSet] = useState(initialValue);
  const set = useCallback((next: T | ((prev: T) => T)) => {
    rawSet(prev => {
      const resolved = typeof next === 'function' ? (next as Function)(prev) : next;
      if (__DEV__) dbg.debug('state', `${contextName}.${fieldName}`, shallowDiff(prev, resolved), SRC);
      return resolved;
    });
  }, [contextName, fieldName]);
  return [value, set] as const;
}
```

**Apply to critical contexts**:
- `AuthContext` — identity, PIN state, wallet flow stage
- `CallContext` — call state, participants, media tracks
- `UmbraContext` — init stage, preferences, service readiness
- `ConversationsContext` — conversation list, active conversation
- `ActiveConversationContext` — active ID, search state

**Helper**: `shallowDiff(a, b)` returns `{ added: [], removed: [], changed: [] }` for objects, or `{ old, new }` for primitives.

---

## Phase 7: Web Vitals Integration

**File**: `src/utils/debug.ts` (~60 lines added)

Add `_startWebVitals()` method called from constructor:
- **INP** via `PerformanceObserver({ type: 'event', durationThreshold: 40 })`
- **CLS** via `PerformanceObserver({ type: 'layout-shift' })`
- **LCP** via `PerformanceObserver({ type: 'largest-contentful-paint' })`
- **FCP** via `PerformanceObserver({ type: 'paint' })`

Store latest values in instance fields. Include in:
- Heartbeat payload → TUI Browser tab
- CrashVitals → localStorage → Sentry enrichment
- `__debug.webVitals()` console command

---

## Phase 8: React Profiler Integration

**File**: `app/_layout.tsx` — Wrap root with `<Profiler id="App" onRender={onAppRender}>`

**File**: `src/utils/debug.ts` — Add `onProfilerRender(id, phase, actualDuration, baseDuration, startTime, commitTime)`:
- Feed into `tracePerf('render', ...)` for TUI visibility
- Warn on slow commits: `if (actualDuration > 16) dbg.warn('perf', 'Slow commit...')`
- Track per-component-id stats: avg duration, max duration, mount vs update counts

**Optional selective wrapping**: Also wrap `ChatArea`, `ActiveCallPanel` subtrees for per-subtree breakdown.

---

## Phase 9: Network Message-Level Tracing

**File**: `packages/umbra-service/src/network.ts`

Wrap relay `send()` and incoming message handlers:
```
const t0 = performance.now();
const size = JSON.stringify(payload).length;
await relay.send(payload);
const dur = performance.now() - t0;
_dbg()?.tracePerf?.('network', `relay.send type=${type} size=${size}B dur=${dur}ms`, dur, SRC);
```

**Track per-event-type stats** (accumulated in module-level Map):
- `ChatMessage`: count, totalBytes, avgLatency, maxLatency
- `GroupMessage`, `FriendRequest`, `KeyRotation`, `TypingIndicator`, etc.
- Expose via `_dbg()?.info?.('network', 'relay stats', relayStats, SRC)` on 30s timer

**File**: `packages/umbra-debug/src/ui/net_tab.rs` — Add per-event-type breakdown table below existing network events.

---

## Phase 10: Debug Test Suite

**File**: `__tests__/utils/debug.test.ts` (new, ~250 lines)

Tests:
1. **RingBuffer**: push, overflow wraps, entries() returns all, clear() empties
2. **Log levels**: setLevel('warn') suppresses trace/debug/info
3. **Categories**: enable/disable toggles console output
4. **Render tracking**: trackRender() increments, renderCounts() returns map
5. **Trace buffer**: tracePerf() writes to traceRing, traceStats() aggregates
6. **Source filter**: filterSource('Chat') only outputs matching
7. **CrashVitals**: heartbeat populates heap, domNodes, renderRate
8. **TUI streaming**: _sendLogToTui() formats as TraceEvent JSON
9. **Chrome trace export**: exportChromeTrace() produces valid Chrome trace format
10. **Long task detection**: PerformanceObserver integration (mock)

---

## Phase 11: Storage Operation Audit Log

**File**: `packages/umbra-service/src/storage-manager.ts`

Wrap OPFS bridge operations:
```
const t0 = performance.now();
const result = await bridge.read(key);
const dur = performance.now() - t0;
_dbg()?.tracePerf?.('service', `opfs.read key=${key} size=${result?.length ?? 0}B dur=${dur}ms`, dur, SRC);
```

Track in heartbeat: `storageOpsPerSec`, `storageBytesPerSec`

**File**: `packages/umbra-service/src/opfs-bridge.ts` — Same pattern for direct OPFS calls.

---

## Phase 12: Performance Budget Alerts

**File**: `src/utils/debug.ts` (~50 lines)

Add `PerfBudget` config:
```typescript
interface PerfBudgets {
  renderMs: number;     // default 16 — warn if component render > threshold
  wasmMs: number;       // default 100 — warn if WASM call > threshold
  heapPct: number;      // default 80 — warn if heap usage > threshold
  messageSizeBytes: number; // default 1_000_000 — warn if message > threshold
  renderRatePerSec: number; // default 60 — warn if component renders/sec > threshold
}
```

- `__debug.setBudgets({ renderMs: 10, wasmMs: 50 })` — configure
- `__debug.budgets()` — show current budgets
- Check in `_log()` and `tracePerf()` — emit `dbg.warn('perf', 'BUDGET EXCEEDED: ...')` + send to TUI
- TUI shows budget violations with red highlight

---

## Phase 13: Enhanced Crash Reports

**File**: `packages/umbra-debug/src/crash_report.rs`

Add sections:
1. **State Snapshot** — Last known context values (from state change log entries)
2. **Network Timeline** — Last 30s of relay events with sizes/latency
3. **Render Storm Report** — Components exceeding 100 renders in crash window
4. **WASM Call Chain** — Last 50 WASM calls with timing + memory delta
5. **Structured Log Context** — Last 200 log entries (from Log tab data)
6. **Budget Violations** — All perf budget violations in crash window

Format: Extended markdown with collapsible sections.

---

## Phase 14: TUI Dashboard Tab

**File**: `packages/umbra-debug/src/ui/dashboard_tab.rs` (new, ~200 lines)

Layout (3 columns):
```
┌─────────────────┬─────────────────┬─────────────────┐
│  Heap Memory    │  Render Rate    │  Events/sec     │
│  ▁▂▃▅▇█▇▅▃▂▁   │  ▁▁▂▅▇█▃▁▁▁▂   │  ▁▂▃▃▃▃▃▃▂▁▁   │
│  82MB / 4GB     │  45/sec         │  120/sec        │
├─────────────────┼─────────────────┼─────────────────┤
│  Hot Functions  │  Mem Suspects   │  Active Errors  │
│  1. decrypt 50/s│  1. getMsg +2MB │  TypeError: x   │
│  2. parse  30/s │  2. render +1MB │  WASM: decode   │
│  3. render 20/s │  3. fetch  +500K│                 │
├─────────────────┴─────────────────┴─────────────────┤
│  Budget Status: ✓ render  ✓ wasm  ✗ heap (83%)     │
│  Web Vitals: INP=45ms CLS=0.02 LCP=1.2s FCP=0.8s   │
│  Clients: 1 connected | Session: 5m 23s             │
└─────────────────────────────────────────────────────┘
```

Keybindings: `r` refresh, `1`-`3` expand column, `b` toggle budget overlay

---

## Phase 15: TUI Conditional Breakpoints

**File**: `packages/umbra-debug/src/ui/breakpoint.rs` (new, ~150 lines)
**File**: `packages/umbra-debug/src/app.rs` (modify)

Breakpoint system:
- `b` key opens breakpoint dialog
- Conditions: `render.rate > N`, `heap > NMB`, `wasm.dur > Nms`, `error`, `category:level`
- When condition met: pause event ingestion, flash status bar, show marker in event stream
- `Space` to resume, `n` for next event, `c` to continue until next breakpoint
- Breakpoints persist in session config

---

## Phase 16: TUI Event Replay / Time-Travel

**File**: `packages/umbra-debug/src/ui/replay_tab.rs` (new, ~400 lines)
**File**: `packages/umbra-debug/src/store/replay.rs` (new, ~200 lines)

Features:
- Load any saved session from `~/.umbra/debug-logs/`
- Forward/backward navigation with `→`/`←` keys
- Speed control: `1`/`2`/`5`/`0` for 1x/2x/5x/10x
- Event filtering during replay (same filters as Log tab)
- State reconstruction: rebuild render counts, memory timeline, error list at each step
- Bookmark events with `m` key for quick navigation
- Search within replay with `/`

---

## Phase 17: TUI Dependency Graph / Event Chain Tab

**File**: `packages/umbra-debug/src/ui/deps_tab.rs` (new, ~250 lines)

Visualize causal chains:
```
relay.onMessage
  └─ _dispatchEvent('message.received')
       ├─ useMessages.handleEvent()
       │    └─ flushPendingMessages()
       │         └─ ChatArea render
       │              └─ parseMessageContent (x50)
       └─ useNetwork.handleEvent()
            └─ sendAck()
```

Build graph from:
- `_dispatchEvent` entries (event type → listener names)
- Render tracking (parent → child renders within same frame)
- WASM call chains (JS caller → WASM function)

Keybindings: `Enter` expand/collapse node, `f` filter by subtree, `t` toggle timing

---

## Phase 18: TUI Session Comparison + CLI Queries

### 18A. Session Comparison Tab

**File**: `packages/umbra-debug/src/ui/compare_tab.rs` (new, ~200 lines)

Side-by-side diff of two sessions:
- Memory growth comparison (sparklines)
- Render rate comparison
- Event frequency diff (what increased/decreased)
- New errors in later session
- WASM timing regression detection

Load with: `umbra-debug --compare <session1> <session2>` or `C` key in TUI

### 18B. CLI Query Commands

**File**: `packages/umbra-debug/src/store/query.rs` (extend)

New commands:
- `umbra-debug query --slow-wasm 50ms` — WASM calls exceeding threshold
- `umbra-debug query --render-storms` — Components with >100 renders/sec
- `umbra-debug query --state-changes AuthContext` — State diffs for a context
- `umbra-debug query --timeline 12:00 12:05` — Events in time range
- `umbra-debug query --errors-only` — All error/fatal entries
- `umbra-debug query --budget-violations` — All perf budget violations

---

## Constraints

- All JS logging gated by `__DEV__` for production tree-shaking
- Hot-path instrumentation uses `dbg.tracePerf()` (no console, no object alloc)
- Service layer uses `_dbg()?.xxx?.()` bridge (optional chaining, can't import debug.ts)
- Ring buffer: 500 entries. Trace buffer: 2000 entries. Rust bridge buffer: 5000 entries
- All timing: `performance.now()`, never `Date.now()`
- Rust TUI reuses existing TraceEvent wire format where possible
- Mobile debugging skipped (web/desktop focus)
- No new dependencies — use built-in PerformanceObserver, React Profiler, tracing crate

## Verification

1. `npx tsc --noEmit` after each phase
2. `npm test` — all tests pass including new debug test suite
3. Open any chat with `__debug.enableAll()` + `__debug.connectToTui(9999)`
4. Full message flow visible: ChatInput → WASM encrypt → relay send → relay receive → WASM decrypt → Rust tracing events → event dispatch → useMessages batch → state diff → ChatArea render → React Profiler commit → parseMessageContent
5. TUI Dashboard shows heap, render rate, events/sec sparklines + Web Vitals
6. Set breakpoint `render.rate > 50`, trigger render storm, verify pause
7. Load saved session in Replay tab, step through events
8. Run `umbra-debug query --slow-wasm 50ms` and verify output
9. Compare two sessions in Compare tab
10. Send crash report and verify all enriched sections present
11. `__debug.budgets()` shows current thresholds, violations appear in TUI

## Implementation Order (18 phases, ~15 commits each for gaps, ~3-5 per new feature)

**Week 1 — Complete gaps**:
Phase 1 (console migration) → Phase 2 (hooks) → Phase 3 (contexts) → Phase 4 (render tracking)

**Week 2 — Core new features**:
Phase 5 (Rust bridge) → Phase 6 (state tracking) → Phase 7 (Web Vitals) → Phase 8 (React Profiler)

**Week 3 — Observability**:
Phase 9 (network tracing) → Phase 10 (debug tests) → Phase 11 (storage audit) → Phase 12 (perf budgets)

**Week 4 — TUI + Advanced**:
Phase 13 (crash reports) → Phase 14 (dashboard) → Phase 15 (breakpoints) → Phase 16 (replay) → Phase 17 (dep graph) → Phase 18 (compare + CLI)
