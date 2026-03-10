# Slash Command System Handoff

## What Was Done

Implemented a robust slash command system for the Umbra chat app. When users type `/` in the message input, an autocomplete menu appears showing available commands grouped by category (System, Ghost, Plugin).

### New Files Created
- `src/hooks/useSlashCommand.ts` — Hook that detects `/` at start of input, filters commands by query, manages active index state
- `src/components/chat/SlashCommandMenu.tsx` — Autocomplete dropdown UI component with category grouping, hover/keyboard nav, themed styling
- `src/services/SlashCommandRegistry.ts` — Central registry with system commands (help, clear), Ghost bot commands (all 15 /ghost commands), ghost bot DID detection via `isGhostBot()`

### Modified Files
- `src/components/chat/ChatInput.tsx` — Integrated slash commands alongside existing @mention system. Added `friendDid` and `onClearChat` props. Keyboard handler now supports both slash menu and mention menu (slash takes priority). Tab key fills command without sending, Enter selects and sends.
- `src/contexts/PluginContext.tsx` — Added `pluginSlashCommands` state, `slashCommandsRef`, `updateSlashCommands()`, and `registerSlashCommand` on the service bridge. Cleanup on plugin disable/uninstall.
- `packages/umbra-plugin-sdk/src/types.ts` — Added `PluginSlashCommand` interface and `registerSlashCommand()` method to `PluginAPI`
- `packages/umbra-plugin-sdk/src/index.ts` — Exported `PluginSlashCommand` type
- `packages/umbra-plugin-runtime/src/sandbox.ts` — Added `registerSlashCommand` to `ServiceBridge` interface and sandboxed API with permission check
- `app/(main)/index.tsx` — Passes `friendDid` prop to `<ChatInput>`

### Architecture
Commands come from 3 sources:
1. **System commands** — always available: `/help`, `/clear`
2. **Ghost commands** — shown when `isGhostBot(friendDid)` is true. All 15 /ghost commands (status, help, tracks, play, next, pause, resume, videos, play-video, next-video, upgrade, downgrade, end, files, send). These are `sendAsMessage: true` so selecting them fills and sends the message.
3. **Plugin commands** — registered via `api.registerSlashCommand()` in plugin activate(). Stored per-plugin, cleaned up on disable/uninstall.

Ghost DID detection: `KNOWN_GHOST_DIDS` Set in `SlashCommandRegistry.ts` with the Ghost EN DID `did:key:z6MkhSo7UBSqfsnF6dM2iw5qbPbKoKBHQ6XnAGGMo7XV5Fyd`. Can be extended via `registerGhostDid()`.

## What Still Needs Testing

1. **Visual test** — Start the dev server (`npx expo start --web`) from the MAIN repo (not a worktree!) and verify:
   - Type `/` in chat input → slash command menu appears with System commands
   - Open a conversation with Ghost → type `/` → menu shows both System and Ghost categories
   - Arrow keys navigate, Enter selects, Escape closes, Tab fills without sending
   - Ghost commands like `/ghost help` get sent as messages
   - System commands like `/clear` execute locally

2. **TypeScript** — All our files pass `tsc --noEmit`. Pre-existing test file errors are unrelated.

3. **Edge cases to verify**:
   - Slash menu closes when text no longer starts with `/`
   - Mention system still works (type `@` after some text)
   - Slash and mention don't conflict (slash only triggers at start of message)

## Other Pending Work From Previous Session

- **Video call 4K/buffering improvements** were deployed to server 45.77.149.94 but not yet tested via the app
- The BBB 4K download to the server resulted in a 0-byte file (failed download)
- Server has: tears-of-steel-4k.mp4 (true 4K), bbb.mp4/sintel.mp4/elephants-dream.mp4 (720p)
- Video source now uses `-stream_loop -1`, GPU decoding, 90-frame buffer, 30-frame pre-buffer

## Key Config
- Ghost server: 45.77.149.94 (SSH key: ~/.ssh/id_ed25519)
- Ghost DID: did:key:z6MkhSo7UBSqfsnF6dM2iw5qbPbKoKBHQ6XnAGGMo7XV5Fyd
- The user explicitly said: **"please never work from a work tree again"** — always build/deploy from main repo
