# Total Coverage Plan — Umbra P2P Messaging App

## Context

Umbra has ~300 existing tests (27 JS unit + 272 Rust inline + E2E suites) but large gaps in services, hooks, contexts, Ghost AI, and Rust storage. This plan establishes 100% test coverage tooling and systematically builds out ~850 new tests across 10 phases. Many tests will reveal actual bugs in untested code — that's expected and desired.

### User Decisions
- **Rust coverage**: Both cargo-tarpaulin (CI) + cargo-llvm-cov (local), unified report
- **Enforcement**: Pre-commit hook, 80% line coverage threshold
- **Scope**: App code only (UI Kit excluded)
- **WASM**: Integration tests with real WASM (separate `npm run test:integration` suite)
- **Rust scope**: umbra-core only
- **Ghost AI**: Full coverage including mocked FFmpeg + @roamhq/wrtc

### Current Test Inventory
| Category | Count | Tool |
|----------|-------|------|
| JS Unit Tests | 27 files | Jest (jest-expo) |
| Wisp UI Kit | 229 files | Vitest (OUT OF SCOPE) |
| Playwright E2E | 64 specs | Playwright |
| Detox iOS E2E | 84 tests | Detox |
| Rust inline tests | 272 `#[test]` fns | cargo test |

### Biggest Coverage Gaps
- `src/services/` — 11 files, **zero tests**
- `packages/umbra-ghost-ai/src/` — 24 files, **zero tests**
- `packages/umbra-core/src/storage/database.rs` — 7,875 LOC, **zero tests**
- `packages/umbra-core/src/storage/wasm_database.rs` — 5,650 LOC, **zero tests**
- `packages/umbra-service/src/community.ts` — 2,314 LOC, **zero tests**
- ~22 hooks and ~13 contexts with no unit tests

---

## Phase 0: Tooling & Infrastructure

### 0A. Expand Jest Coverage Config
**File:** `jest.config.js`
- Add `src/services/**/*.ts` and `packages/umbra-ghost-ai/src/**/*.ts` to `collectCoverageFrom`
- Add coverage thresholds: `coverageThreshold: { global: { lines: 80 } }`

### 0B. Rust Coverage Tooling
- Create `scripts/coverage-rust.sh` — runs `cargo llvm-cov --html` (local) and `cargo tarpaulin --out xml` (CI)
- Add `npm run test:rust:coverage` to root `package.json`
- Configure in `packages/umbra-core/`

### 0C. Pre-Commit Hook (80% Threshold)
- Install `husky` or use raw git hook at `.husky/pre-commit`
- Runs `jest --coverage --bail` → checks 80% lines
- Runs `cd packages/umbra-core && cargo llvm-cov --fail-under-lines 80`
- Blocks commit on failure

### 0D. Integration Test Suite (Real WASM)
- Create `jest.integration.config.js` pointing at `__tests__/integration/`
- No WASM mock — loads real compiled WASM
- Add `npm run test:integration` to `package.json`
- Requires `npm run build:wasm` before running

### 0E. Unified Coverage Dashboard
- Create `scripts/merge-coverage.sh` — merges Jest lcov + cargo llvm-cov lcov via `lcov -a`
- Output: `coverage/unified.lcov` + HTML report
- Add `npm run coverage:report`

---

## Phase 1: Pure Functions (Easy Wins) — ~104 tests

### 1A. SearchQueryParser (~25 tests)
**Create:** `__tests__/services/SearchQueryParser.test.ts`
**Source:** `src/services/SearchQueryParser.ts` (209 LOC)

| Function | Tests | What to verify |
|----------|-------|----------------|
| `parseSearchQuery()` | 10 | Basic text, each token type (from:, in:, before:, after:), multiple tokens, has:* flags, quoted values, empty string, mixed tokens + free text |
| `extractTokens()` | 5 | No tokens, single, multiple, case insensitivity, quoted values |
| `serializeSearchQuery()` | 5 | Text only, with filters, round-trip parse→serialize, spaces requiring quotes |
| `isEmptyQuery()` | 5 | Empty, text only, single filter, all fields, partial |

### 1B. SearchHistoryService (~12 tests)
**Create:** `__tests__/services/SearchHistoryService.test.ts`
**Source:** `src/services/SearchHistoryService.ts` (63 LOC)
**Mock:** `localStorage` via `jest.spyOn(Storage.prototype, ...)`

| Function | Tests | What to verify |
|----------|-------|----------------|
| `getSearchHistory()` | 3 | Empty, valid data, corrupted JSON |
| `addSearchQuery()` | 4 | Add first, duplicate moves to front, max 20 cap, whitespace ignored |
| `removeSearchQuery()` | 2 | Existing entry, non-existent |
| `clearSearchHistory()` | 1 | Clears all |
| Edge cases | 2 | localStorage unavailable, quota exceeded |

### 1C. SlashCommandRegistry (~10 tests)
**Create:** `__tests__/services/SlashCommandRegistry.test.ts`
**Source:** `src/services/SlashCommandRegistry.ts` (250 LOC)

| Function | Tests | What to verify |
|----------|-------|----------------|
| `getSystemCommands()` | 2 | Returns help + clear, callbacks fire |
| `GHOST_COMMANDS` | 1 | All commands have required fields |
| `isGhostBot()` | 3 | Known DID, unknown DID, null/undefined |
| `registerGhostDid()` | 2 | Register, then isGhostBot returns true |
| Structure validation | 2 | Unique IDs, valid categories |

### 1D. umbra-service helpers.ts (~15 tests)
**Create:** `__tests__/services/umbra-service-helpers.test.ts`
**Source:** `packages/umbra-service/src/helpers.ts` (95 LOC)

| Function | Tests | What to verify |
|----------|-------|----------------|
| `snakeToCamel()` | 6 | Simple, nested, array, null/undefined, deeply nested, mixed |
| `camelToSnake()` | 5 | Simple, nested, array, round-trip, acronyms |
| `wasm()` | 2 | Throws when not initialized, returns module when ready |
| `parseWasm()` | 2 | Valid JSON, promise input |

### 1E. Ghost AI crypto.ts (~15 tests)
**Create:** `__tests__/ghost-ai/crypto.test.ts`
**Source:** `packages/umbra-ghost-ai/src/crypto.ts` (187 LOC)

| Function | Tests | What to verify |
|----------|-------|----------------|
| `createIdentity()` | 3 | Valid structure, DID format, hex key strings |
| `encryptMessage()`/`decryptMessage()` | 4 | Round-trip, wrong key fails, modified AAD fails, conversation isolation |
| `computeConversationId()` | 3 | Deterministic, order-independent (A,B == B,A), uniqueness |
| `sign()` | 2 | Valid hex output, different data → different signatures |
| `uuid()` | 2 | 8-4-4-4-12 format, v4 byte |

> **Bug risk:** Crypto round-trip tests may reveal parameter mismatches between Ghost AI and Rust core encryption.

### 1F. umbra-service errors.ts (~5 tests)
**Create:** `__tests__/services/umbra-service-errors.test.ts`
**Source:** `packages/umbra-service/src/errors.ts` (107 LOC)

### 1G. Ghost AI wisp-commands.ts (~8 tests)
**Create:** `__tests__/ghost-ai/wisp-commands.test.ts`
**Source:** `packages/umbra-ghost-ai/src/handlers/wisp-commands.ts` (141 LOC)

### 1H. Ghost AI reminder.ts (~6 tests)
**Create:** `__tests__/ghost-ai/reminder.test.ts`
**Source:** `packages/umbra-ghost-ai/src/handlers/reminder.ts` (139 LOC)

### 1I. Ghost AI test-signal.ts (~8 tests)
**Create:** `__tests__/ghost-ai/test-signal.test.ts`
**Source:** `packages/umbra-ghost-ai/src/media/test-signal.ts` (253 LOC)

---

## Phase 2: Singleton Services & Registries — ~73 tests

### 2A. ShortcutRegistry (~15 tests)
**Create:** `__tests__/services/ShortcutRegistry.test.ts`
**Source:** `src/services/ShortcutRegistry.ts` (119 LOC)

| Function | Tests | What to verify |
|----------|-------|----------------|
| `register()` | 3 | Adds shortcut, returns unregister fn, unregister removes |
| `handleKeyEvent()` | 4 | Match fires handler, non-match returns false, modifier combos, meta/cmd alias |
| `getAll()` / `getAllFlat()` | 3 | Groups by pluginId, flat array, empty state |
| `parseCombo()` | 4 | Simple key, ctrl+key, multi-modifier, unknown modifier |
| `clear()` | 1 | Removes all |

### 2B. VoiceStreamBridge (~18 tests)
**Create:** `__tests__/services/VoiceStreamBridge.test.ts`
**Source:** `src/services/VoiceStreamBridge.ts` (142 LOC)

- Stream management (5): local, peer, remove, getAll, screenShare
- Participant tracking (5): add, remove, duplicate ignored, getParticipants, setParticipants
- Events (4): onChange fires on add/remove, unsubscribe works, callback error swallowed
- Signal (3): sendSignal, onSignal, emitSignal
- clear() (1): resets all state

### 2C. SearchIndexService (~20 tests)
**Create:** `__tests__/services/SearchIndexService.test.ts`
**Source:** `src/services/SearchIndexService.ts` (444 LOC)

| Function | Tests | What to verify |
|----------|-------|----------------|
| `indexMessage()` | 4 | Text, file message, deleted ignored, re-index updates |
| `removeMessage()` | 2 | Removes from indices, no-op for missing |
| `setPinned()` | 2 | Set true, set false |
| `search()` | 8 | Text match, from: filter, in: filter, before/after dates, has:file, scope=conversation, limit, empty results |
| `buildIndex()` | 2 | Indexes all messages, reports progress |
| `clear()` / `size` | 2 | Reset, document count |

### 2D. SoundEngine (~20 tests)
**Create:** `__tests__/services/SoundEngine.test.ts`
**Source:** `src/services/SoundEngine.ts` (626 LOC)
**Mock:** `AudioContext`, `HTMLAudioElement`

| Function | Tests | What to verify |
|----------|-------|----------------|
| Volume controls | 6 | Master set/get/clamp, category set/get, NaN handling |
| Mute/Enable | 4 | setMuted, isMuted, setCategoryEnabled, isCategoryEnabled |
| `setActiveTheme()` | 2 | Synth theme, audio pack theme |
| `playSound()` | 4 | Plays when enabled, skips when muted, skips when category disabled, unknown sound |
| `resumeContext()` | 2 | Resumes suspended, no-op when running |
| Constructor | 2 | Defaults correct |

---

## Phase 3: Untested Hooks — ~86 tests

### 3A. useSlashCommand (~10 tests)
**Create:** `__tests__/hooks/useSlashCommand.test.ts`
- Menu state, filtering by prefix, command execution, category grouping, bot commands

### 3B. useMention (~8 tests)
**Create:** `__tests__/hooks/useMention.test.ts`
- @ detection, autocomplete filtering, selection, cursor tracking, empty results

### 3C. useCall (~12 tests)
**Create:** `__tests__/hooks/useCall.test.ts`
- State transitions (idle→ringing→connected→ended), offer/answer, mute, camera, cleanup, timeout

### 3D. useTyping (~6 tests)
**Create:** `__tests__/hooks/useTyping.test.ts`
- Emit indicator, debounce, clear on send, multiple typers, timeout

### 3E. useCommunity / useCommunities (~10 tests)
**Create:** `__tests__/hooks/useCommunity.test.ts`
- Community list, create, join, leave, channels, members

### 3F. useVoiceChannel (~8 tests)
**Create:** `__tests__/hooks/useVoiceChannel.test.ts`
- Join/leave, participants, mute state, peer streams

### 3G. useAppUpdate (~6 tests)
**Create:** `__tests__/hooks/useAppUpdate.test.ts`
- Check update, no update, download, Tauri vs web, dismiss

### 3H. useMediaDevices (~6 tests)
**Create:** `__tests__/hooks/useMediaDevices.test.ts`
- Enumerate, select camera/mic, permission denied, device change

### 3I. Remaining hooks (~20 tests across 10 files)
- `useConnectionLink`, `useDiscovery`, `useFriendNotifications`, `useFullscreen`, `useHoverMessage`, `useProfilePopover`, `useRightPanel`, `useSpeakerDetection`, `useUploadProgress`, `useVideoEffects`
- ~2 tests each (happy path + edge case)

---

## Phase 4: Untested Contexts — ~74 tests

### 4A. CallContext (~12 tests)
**Create:** `__tests__/contexts/CallContext.test.tsx`

### 4B. VoiceChannelContext (~10 tests)
**Create:** `__tests__/contexts/VoiceChannelContext.test.tsx`

### 4C. CommunityContext (~10 tests)
**Create:** `__tests__/contexts/CommunityContext.test.tsx`

### 4D. ThemeContext (~6 tests)
**Create:** `__tests__/contexts/ThemeContext.test.tsx`

### 4E. NotificationContext (~6 tests)
**Create:** `__tests__/contexts/NotificationContext.test.tsx`

### 4F. SoundContext (~5 tests)
**Create:** `__tests__/contexts/SoundContext.test.tsx`

### 4G. ActiveConversationContext (~5 tests)
**Create:** `__tests__/contexts/ActiveConversationContext.test.tsx`

### 4H. UnifiedSearchContext (~8 tests)
**Create:** `__tests__/contexts/UnifiedSearchContext.test.tsx`

### 4I. Remaining (~12 tests across 5 files)
- FontContext, PluginContext, ProfilePopoverContext, SettingsDialogContext, ConversationsContext

---

## Phase 5: umbra-service Package — ~112 tests

### 5A. messaging.ts (~15 tests)
**Create:** `__tests__/services/umbra-service-messaging.test.ts`
**Source:** `packages/umbra-service/src/messaging.ts` (572 LOC)
- getConversations, sendMessage, decryptMessage, categorizeDecryptError, reactions, threads, file messages

### 5B. community.ts (~25 tests)
**Create:** `__tests__/services/umbra-service-community.test.ts`
**Source:** `packages/umbra-service/src/community.ts` (2,314 LOC — largest service file)
- CRUD community, channel CRUD, members, roles, invites, spaces, moderation, emoji/stickers, settings

### 5C. friends.ts + groups.ts (~15 tests)
**Create:** `__tests__/services/umbra-service-social.test.ts`
- Friend request lifecycle, block/unblock, group CRUD, member management

### 5D. sync.ts (~10 tests)
**Create:** `__tests__/services/umbra-service-sync.test.ts`
**Source:** `packages/umbra-service/src/sync.ts` (485 LOC)

### 5E. file-encryption.ts + file-transfer.ts (~12 tests)
**Create:** `__tests__/services/umbra-service-files.test.ts`

### 5F. Import parsers (~20 tests)
**Create:** `__tests__/services/umbra-service-import-parsers.test.ts`
- Discord, Signal, Slack, Telegram, WhatsApp parsers (4 tests each: valid, malformed, empty, encoding)

### 5G. Remaining service files (~15 tests)
- backup.ts, identity.ts, network.ts, notifications.ts, storage-manager.ts, relay.ts, calling.ts

---

## Phase 6: Ghost AI (Full Coverage) — ~115 tests

### 6A. Test Infrastructure
- Create `packages/umbra-ghost-ai/jest.config.js` (or add to root `projects`)
- Create mocks: `__mocks__/@roamhq/wrtc.js`, `__mocks__/ffmpeg-static.js`, `__mocks__/child_process.js`

### 6B. AudioSource (~15 tests)
**Create:** `__tests__/ghost-ai/media/audio-source.test.ts`
**Source:** `packages/umbra-ghost-ai/src/media/audio-source.ts` (555 LOC)
- AudioRingBuffer (write, read, wrap-around, available), lifecycle (start, feed, pause, resume, stop, loop), track switching, crossfade, underrun detection, diagnostics

### 6C. VideoSource (~12 tests)
**Create:** `__tests__/ghost-ai/media/video-source.test.ts`
**Source:** `packages/umbra-ghost-ai/src/media/video-source.ts` (565 LOC)
- Start/stop, resolution parsing, frame timing, loop, quality presets, FPS, buffer health

### 6D. MediaManager (~10 tests)
**Create:** `__tests__/ghost-ai/media/manager.test.ts`
**Source:** `packages/umbra-ghost-ai/src/media/manager.ts` (384 LOC)
- Config loading, audio/video listing, download caching, missing config, corrupt config

### 6E. DegradationDetector (~10 tests)
**Create:** `__tests__/ghost-ai/media/degradation-detector.test.ts`
**Source:** `packages/umbra-ghost-ai/src/media/degradation-detector.ts` (279 LOC)
- Audio/video metrics, RMS spike, underrun trigger, drift detection, buffer low, time-series cap

### 6F. RawMediaCapture (~6 tests)
**Create:** `__tests__/ghost-ai/media/capture.test.ts`

### 6G. CallHandler (~20 tests)
**Create:** `__tests__/ghost-ai/handlers/call.test.ts`
**Source:** `packages/umbra-ghost-ai/src/handlers/call.ts` (1,762 LOC — largest Ghost AI file)
- handleOffer, ICE handling, cleanup, media tracks, data channel, quality commands, track commands, multiple call rejection, timeout, error recovery

### 6H. MessageHandler (~12 tests)
**Create:** `__tests__/ghost-ai/handlers/message.test.ts`
- Decrypt + LLM forward, encrypt response, streaming, unknown sender, tutor tags, reminders, wisps, threads, errors

### 6I. Bot + Relay + Config (~12 tests)
- `__tests__/ghost-ai/bot.test.ts` — init, relay connect, friend requests, message dispatch, shutdown
- `__tests__/ghost-ai/relay.test.ts` — connect, reconnect, send/receive, heartbeat
- `__tests__/ghost-ai/config.test.ts` — defaults, env overrides, ICE parsing

### 6J. Knowledge + LLM (~10 tests)
- `__tests__/ghost-ai/knowledge/indexer.test.ts` — indexing, search, context retrieval
- `__tests__/ghost-ai/llm/ollama.test.ts` — chat completion, streaming, errors

### 6K. ContextStore (~8 tests)
**Create:** `__tests__/ghost-ai/context/store.test.ts`

---

## Phase 7: Rust (umbra-core) — ~165 new tests

### 7A. storage/database.rs (~40 new tests)
**Source:** 7,875 LOC, **0 existing tests** — single biggest coverage gap
- Table creation, CRUD for each table (identity, friends, messages, conversations, groups, community)
- Migration handling, concurrent access, transaction rollback
- Uses `tempfile` crate (already in dev-dependencies)

### 7B. storage/wasm_database.rs (~25 new tests)
**Source:** 5,650 LOC, **0 existing tests**
- Same CRUD patterns via WASM bindings, JS interop serialization
- Needs `#[cfg(target_arch = "wasm32")]` conditional compilation

### 7C. community/ module (~30 new tests)
- Only `permissions.rs` has tests (8 existing)
- **Files needing tests:** channels.rs, members.rs, roles.rs, invites.rs, messaging.rs, spaces.rs, seats.rs, moderation.rs, categories.rs, service.rs, customization.rs, threads.rs

### 7D. Expand crypto tests (+15 new)
- Key rotation, empty plaintext, max-length messages, cross-key-type ops, nonce reuse detection

### 7E. Expand storage/chunking.rs (+10 new)
- Boundary conditions (exactly chunk-sized, 0-byte, very large), hash verification, reassembly ordering

### 7F. Expand identity/ tests (+10 new)
- Profile updates, DID validation edge cases, BIP39 word list variations

### 7G. Expand friends/ + messaging/ (+15 new)
- Concurrent friend requests, message ordering, conversation ID generation

### 7H. Network module tests (+20 new)
- Connection lifecycle, reconnection, malformed packets, peer discovery mocks

---

## Phase 8: WASM Integration Tests — ~33 tests

### 8A. Setup
- Create `__tests__/integration/` directory
- Create `jest.integration.config.js` (no WASM mock, loads real compiled WASM)
- Add `npm run test:integration`

### 8B. Crypto round-trip (~10 tests)
**Create:** `__tests__/integration/crypto-roundtrip.test.ts`
- Create identity via WASM, encrypt/decrypt, key exchange, signing, shared secret

### 8C. Storage operations (~10 tests)
**Create:** `__tests__/integration/storage.test.ts`
- Create database, store/retrieve identity, friend ops, message CRUD

### 8D. Service layer integration (~8 tests)
**Create:** `__tests__/integration/service-layer.test.ts`
- UmbraService.initialize(), full message send flow, friend request lifecycle

### 8E. Ghost AI <-> Core compatibility (~5 tests)
**Create:** `__tests__/integration/ghost-core-compat.test.ts`
- Ghost encrypts → Core decrypts (and vice versa), conversation ID match, signing compat

---

## Phase 9: WebRTC State Machines — ~51 tests

### 9A. callCrypto.ts (~8 tests)
**Create:** `__tests__/services/callCrypto.test.ts`

### 9B. CallManager (~25 tests)
**Create:** `__tests__/services/CallManager.test.ts`
**Source:** `src/services/CallManager.ts` (1,255 LOC)
**Mock:** `RTCPeerConnection`, `MediaStream`, `MediaStreamTrack`
- createOffer, acceptOffer, completeHandshake, ICE, mute, camera, E2EE, stats, close, key derivation, STUN/TURN, quality, reconnection

### 9C. GroupCallManager (~18 tests)
**Create:** `__tests__/services/GroupCallManager.test.ts`
**Source:** `src/services/GroupCallManager.ts` (626 LOC)
- Multi-peer offer/answer, join/leave, mute propagation, screen share, audio levels, cleanup

---

## Phase 10: High-Logic Components — ~38 tests

### 10A. ChatInput (~10 tests)
### 10B. IncomingCallOverlay + ActiveCallPanel (~8 tests)
### 10C. CommandPalette (~8 tests)
### 10D. ChatSidebar + SidebarSearchPanel (~6 tests)
### 10E. SettingsDialog sections (~6 tests)

---

## Coverage Projection

| Phase | Tests Added | Cumulative | Expected Line Coverage |
|-------|-----------|------------|----------------------|
| Baseline | — | ~300 | ~25-30% |
| Phase 0 | — (tooling) | ~300 | ~25-30% |
| Phase 1 | +104 | ~404 | ~38-42% |
| Phase 2 | +73 | ~477 | ~46-50% |
| Phase 3 | +86 | ~563 | ~56-60% |
| Phase 4 | +74 | ~637 | ~64-68% |
| Phase 5 | +112 | ~749 | ~74-78% |
| Phase 6 | +115 | ~864 | **~80-82%** (meets 80% threshold) |
| Phase 7 | +165 | ~1,029 | ~82-85% |
| Phase 8 | +33 | ~1,062 | ~85% |
| Phase 9 | +51 | ~1,113 | ~88-90% |
| Phase 10 | +38 | ~1,151 | **~92-95%** |

**80% threshold met after Phase 6.** Phases 7-10 push toward near-complete coverage.

---

## Bug Investigation Protocol

Expect 10-20% of tests to initially fail due to actual code bugs. For each failure:

1. **Verify test correctness** — is the assertion right?
2. **Check function signature** — stale types, renamed APIs?
3. **File a bug** with: failing test, expected vs actual, root cause hypothesis
4. **Fix the bug** or create separate fix PR if non-trivial
5. **Re-run** to verify

### Common Bug Patterns to Watch For
- WASM functions returning snake_case when camelCase expected
- Crypto parameter mismatches between Ghost AI and Core
- Race conditions in async hooks (useCall, useVoiceChannel)
- localStorage edge cases (quota exceeded, private browsing)
- Date parsing inconsistencies (timezone, ISO format)
- Stale singleton state between tests (missing cleanup)

---

## Subagent Delegation

| Phase | Subagent | Verification |
|-------|----------|-------------|
| 0 | `devops-engineer` | Scripts run, hooks fire |
| 1-5, 8-10 | `frontend-engineer` | `npm test` passes, coverage target met |
| 6 | `ghost-ai-engineer` | All Ghost tests pass with mocked media |
| 7 | `backend-engineer` | `cargo test` passes, `cargo llvm-cov` >= 80% |
| After each | `qa-automated` | Full test suite green |

---

## Verification

After each phase:
1. `npm test` — all tests pass (or document known failures as bugs)
2. `npm run test:coverage` — check line coverage % increase
3. `npx tsc --noEmit` — no type errors introduced
4. For Rust phases: `cd packages/umbra-core && cargo test` + `cargo llvm-cov`
5. For integration: `npm run test:integration` after `npm run build:wasm`

Final verification:
- `npm run coverage:report` — unified dashboard shows >= 80% across JS + Rust
- Pre-commit hook blocks a commit with intentionally broken coverage
- All bug reports filed during testing are triaged
