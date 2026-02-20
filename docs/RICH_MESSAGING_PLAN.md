# Plan: Custom Emoji, Stickers, Text Effects & Formatting Toolbar

## Context

Umbra has a working community system with Discord import, real-time message sync via relay, and a component library (Wisp). The next step is rich messaging features: custom emoji per community, stickers with iMessage-style placement, text effects triggered by long-pressing send, and a formatting toolbar for rich text. These features span the full stack — Rust/WASM storage, TypeScript service layer, relay sync protocol, and React Native UI.

## Design Decisions (User-Confirmed)

- **Emoji permissions**: Members with a "Manage Emoji" role permission can upload/manage
- **Emoji limit**: 1,000 per community
- **Asset storage**: Hybrid — base64 in P2P community events for online peers + relay file endpoint as permanent backup. Peers fetch from relay if they missed the P2P broadcast.
- **Relay asset endpoint**: `POST /api/community/{id}/assets/upload` stores file to disk, returns URL like `/api/community/{id}/assets/{hash}`. Must enforce auth, size limits, content-type validation.
- **Text effects**: All 8 effects (slam, gentle, loud, invisible_ink, confetti, balloons, shake, fade_in)
- **Sticker removal**: Placer + community admins/mods can remove placed stickers
- **Sticker placement UX**: Both drag-from-picker AND message context menu → "Place Sticker"
- **Sticker limits**: 2MB max per sticker, rendered at 512×512px
- **Animation formats**: GIF + APNG + Lottie (requires `lottie-react-native`)
- **Formatting**: Full Discord-like + mentions — bold, italic, underline, strikethrough, inline code, code blocks, spoiler tags, hyperlinks, headers, lists, @user, #channel
- **Mentions toolbar**: '@' button triggers existing autocomplete system

## What Already Exists

**Built and ready to wire up:**
- DB tables: `community_emoji` and `community_stickers` in schema.rs
- Rust CRUD: `create_emoji`, `get_emoji`, `delete_emoji`, `create_sticker`, `get_stickers`, `delete_sticker` in customization.rs
- WASM FFI: `umbra_wasm_community_emoji_create/list/delete`, `umbra_wasm_community_sticker_create/list/delete`
- Wisp EmojiPicker: accepts `customEmojis?: EmojiItem[]` prop with `imageUrl` support
- Wisp EmojiManagementPanel: 4x grid with upload/delete/rename for CustomEmoji
- Wisp StickerPicker: multi-pack with tabs, grid, size variants
- Discord import captures `MappedEmoji[]` with CDN URLs
- `react-native-reanimated ~4.1.1` and `react-native-gesture-handler ~2.28.0` installed

**Gaps to fill:**
- No TypeScript service functions for emoji/sticker CRUD
- No CommunityEvent variants for emoji/sticker sync
- Discord import does NOT persist emoji/stickers to WASM DB
- No relay asset upload endpoint
- No message metadata field for text effects
- No sticker placement data model
- No markdown parsing in message rendering (plain text only)
- No formatting toolbar component
- No emoji/sticker section in CommunitySettingsDialog
- No `lottie-react-native` installed

---

## Phase 1: Custom Emoji Foundation

### 1A. Relay Asset Upload Endpoint (Rust)
- New endpoint: `POST /api/community/{communityId}/assets/upload`
  - Auth: Validate sender is a community member via existing auth middleware
  - Accept multipart form: `file` (binary) + `type` ("emoji" | "sticker") + `name`
  - Validate: content-type (image/png, image/gif, image/webp, image/apng), max size (256KB emoji, 2MB sticker)
  - Store to `DATA_DIR/community_assets/{communityId}/{sha256_hash}.{ext}`
  - Return JSON: `{ "url": "/api/community/{communityId}/assets/{hash}.{ext}", "hash": "..." }`
  - Deduplicate by hash — same file returns same URL
- New endpoint: `GET /api/community/{communityId}/assets/{filename}`
  - Serve stored file with proper Content-Type and cache headers
  - No auth required (assets are community-public; hash-based URLs are unguessable)
- Security: Rate limit uploads (10/min per user), reject non-image MIME types, max total storage per community (500MB)

**Key files:** `packages/umbra-relay/src/main.rs` (routes), new `packages/umbra-relay/src/handlers/assets.rs`

### 1B. TypeScript Service Layer
- Add `CommunityEmoji` interface to `types.ts`:
  ```
  { id, communityId, name, imageUrl, imageBase64?, animated, uploadedBy, createdAt }
  ```
- Add `createEmoji()`, `listEmoji()`, `deleteEmoji()`, `renameEmoji()` to `community.ts`
- Add `storeReceivedEmoji()` (INSERT OR IGNORE for relay-received emoji)
- Add `uploadEmojiAsset(communityId, file)` — uploads to relay, returns URL
- Expose through `UmbraService` class in `service.ts`
- Add to barrel exports in `index.ts`

**Key files:** `packages/umbra-service/src/types.ts`, `packages/umbra-service/src/community.ts`, `packages/umbra-service/src/service.ts`

### 1C. CommunityEvent Types for Emoji Sync (Hybrid P2P + Relay)
- Add to CommunityEvent union in `types.ts`:
  - `emojiCreated` — carries full CommunityEmoji record including `imageBase64` for P2P distribution + `imageUrl` as relay backup
  - `emojiDeleted` — carries communityId + emojiId
  - `emojiRenamed` — carries communityId + emojiId + newName
- On create: Upload to relay first (get URL), then broadcast event with both base64 AND relay URL
- Receiving peers: Store emoji with relay URL, optionally cache base64 locally

### 1D. Relay Sync Handlers
- When creating/deleting emoji, broadcast via `broadcastCommunityEvent()`
- Receiving side: handle new event types in community event dispatch
- On `emojiCreated` → call `storeReceivedEmoji()` to persist locally with relay-backed URL
- On `emojiDeleted` → delete from local WASM DB

### 1E. Community Settings: Emoji Management Section
- Add `'emoji'` section to CommunitySettingsDialog nav (between Audit Log and Danger Zone)
- New component: `CommunityEmojiPanel.tsx`
  - Grid display of all custom emoji with preview, name, animated badge
  - Upload button (PNG/GIF/WEBP/APNG, max 256KB for emoji)
  - Delete button per emoji with confirmation
  - Name validation: alphanumeric + underscores, 2-32 chars
  - Count display: "X / 1,000 emoji"
  - Search/filter bar
  - Role-gated: Only visible to members with "Manage Emoji" permission

### 1F. EmojiPicker Integration
- Create `useCommunityEmoji(communityId)` hook
- Transform `CommunityEmoji[]` → `EmojiItem[]` with imageUrl
- Pass as `customEmojis` prop to EmojiPicker in ChatInput
- Ensure EmojiPicker renders `<Image>` for items with `imageUrl` (may need Wisp update)

### 1G. Custom Emoji Rendering in Chat Messages
- When user selects custom emoji, insert `:emoji_name:` into message text
- New utility: `parseMessageContent()` in `utils/`
  - Parse `:custom_name:` patterns
  - Look up in community emoji map
  - Render matched patterns as inline `<Image>` components (animated for GIF/APNG)
  - Render unmatched text as `<Text>` spans
- Replace plain text rendering in ChatArea/MsgGroup with FormattedMessage component

### 1H. Discord Import: Persist Emoji
- Add emoji import phase to `createCommunityFromDiscordImport()`
- For each `structure.emojis`:
  1. Fetch image from Discord CDN
  2. Upload to relay via asset endpoint (re-host, don't depend on Discord CDN)
  3. Call `createEmoji()` with relay URL
- Update `CommunityImportProgress.phase` to include `'importing_emoji'`
- Update `CommunityImportResult` with `emojiImported: number`

**Key files:** `types.ts`, `community.ts`, `service.ts`, `CommunitySettingsDialog.tsx`, `ChatInput.tsx`, `ChatArea.tsx`, `discord-community.ts`

---

## Phase 2: Sticker System

### 2A. Sticker Packs DB Table
- Add `sticker_packs` table in schema migration (v13):
  - `id TEXT PRIMARY KEY`, `community_id TEXT`, `name TEXT`, `description TEXT`
  - `cover_sticker_id TEXT`, `created_by TEXT`, `created_at INTEGER`
- Existing `community_stickers.pack_id` already references this
- Rust CRUD: `create_sticker_pack()`, `list_sticker_packs()`, `delete_sticker_pack()`
- WASM bindings for all three

### 2B. TypeScript Service Layer
- Add `CommunitySticker` and `StickerPack` interfaces to `types.ts`
  ```
  CommunitySticker: { id, communityId, packId, name, imageUrl, imageBase64?, animated, format ('gif'|'apng'|'lottie'), uploadedBy, createdAt }
  StickerPack: { id, communityId, name, description?, coverStickerId?, createdBy, createdAt }
  ```
- Add `createSticker()`, `listStickers()`, `deleteSticker()` to `community.ts`
- Add `createStickerPack()`, `listStickerPacks()`, `deleteStickerPack()`
- Add `uploadStickerAsset(communityId, file)` — uploads to relay (2MB max, 512px)
- Expose through UmbraService

### 2C. CommunityEvent Types for Sticker Sync
- `stickerCreated` — carries full CommunitySticker record (base64 + relay URL)
- `stickerDeleted` — carries communityId + stickerId
- `stickerPackCreated` / `stickerPackDeleted`

### 2D. Sticker Messages
- Sticker-only messages use content convention: `sticker::{stickerId}`
- Rendering layer detects this pattern and renders sticker image instead of text
- New component: `StickerMessage.tsx` — renders large sticker image (512×512) in chat
- For Lottie stickers: render with `lottie-react-native` `<LottieView>`

### 2E. Sticker Picker Integration
- Add sticker button to ChatInput (next to emoji button)
- Wire Wisp StickerPicker with community stickers organized by pack
- `useCommunityStickers(communityId)` hook
- On sticker select → send message with `sticker::{stickerId}` content

### 2F. Community Settings: Sticker Management
- Add "Stickers" tab alongside Emoji in the Emoji & Stickers settings section
- Sticker upload with pack assignment (PNG/GIF/WEBP/APNG/Lottie JSON, max 2MB)
- Pack CRUD (create, rename, delete, set cover image)
- Role-gated: "Manage Emoji" permission also covers stickers

### 2G. Discord Import: Stickers
- Add `MappedSticker` interface to import types
- Fetch Discord stickers during import (from Discord CDN)
- Re-host to relay via asset endpoint
- Create default "Discord Import" sticker pack per guild
- Add sticker import phase to `createCommunityFromDiscordImport()`

### 2H. Install lottie-react-native
- `npx expo install lottie-react-native` for Lottie animation support
- Add `<LottieView>` rendering path in StickerMessage and StickerPicker

**Key files:** `types.ts`, `community.ts`, `schema.rs`, `customization.rs`, `wasm.rs`, `ChatInput.tsx`, `ChatArea.tsx`, `CommunitySettingsDialog.tsx`

---

## Phase 3: Message Formatting & Toolbar

### 3A. Full Markdown Content Format
- Messages use syntax stored as-is:
  - `**bold**`, `*italic*`, `__underline__`, `~~strikethrough~~`
  - `` `inline code` ``, ` ```code block``` `
  - `||spoiler||`
  - `[link text](url)`
  - `# Header`, `## Subheader`
  - `- list item`, `1. numbered item`
  - `> quote`
  - `@username`, `#channel-name`
  - `:custom_emoji:`
- No schema changes needed — content is still a string
- Degrades gracefully (readable in plaintext)

### 3B. Message Content Parser
- Extend `parseMessageContent()` from Phase 1G to handle all formats:
  - Bold, italic, underline, strikethrough, inline code, code blocks
  - Spoiler tags (tap/click to reveal)
  - Hyperlinks (clickable, opens in browser)
  - Headers (h1, h2 — larger/bold text)
  - Lists (bullet + numbered)
  - Block quotes (indented with left border)
  - Custom emoji `:name:` → inline images
  - @mentions → styled + tappable
  - #channel → styled + tappable
  - Nested formatting (e.g., bold + italic)
- Returns array of `React.ReactNode` with appropriate `<Text>` styling

### 3C. Formatting Toolbar Component
- New Wisp component: `FormattingToolbar`
  - Horizontal scrollable row of icon buttons:
    **Bold** | **Italic** | **Underline** | **Strikethrough** | **Code** | **Code Block** | **Spoiler** | **Link** | **Header** | **List** | **Quote** | **@** | **#**
  - Toggle state showing which formats are active at cursor position
  - `onFormat(action)` callback
  - '@' button inserts `@` character triggering existing mention autocomplete
  - '#' button inserts `#` character triggering channel autocomplete
  - 'Link' button shows mini popover for URL input

### 3D. Toolbar Integration in ChatInput
- Show toolbar as floating row above MessageInput when text is present
- `onFormat` wraps selected text (or inserts markers at cursor) with syntax
- Track text selection for wrap-selection behavior
- Toolbar auto-hides when input is empty
- Keyboard shortcuts: Cmd/Ctrl+B (bold), Cmd/Ctrl+I (italic), Cmd/Ctrl+U (underline)

### 3E. Rich Text Rendering in Chat
- Replace plain text rendering with `<FormattedMessage>` component
- Handles: all markdown formatting + custom emoji + spoilers + links
- Spoiler: renders as blurred/hidden text, tap to reveal
- Preserves message grouping and bubble layout

**Key files:** `utils/parseMessageContent.tsx` (new), `FormattingToolbar` (new Wisp component), `ChatInput.tsx`, `ChatArea.tsx`, `MsgGroup.tsx`

---

## Phase 4: iMessage-Style Text Effects

### 4A. Database Schema Migration (v13)
- Add `metadata_json TEXT` column to `community_messages` table
- Stores JSON: `{ "textEffect": "slam" }`
- Combined with Phase 2A sticker_packs table in same migration

### 4B. Rust/WASM Metadata Support
- Update `send_message()` and `store_received_message()` to accept `metadata_json`
- Update `store_community_message` and `store_community_message_if_not_exists` in DB layer
- Update message query functions to return `metadata_json`
- Update `message_to_json()` helper to include metadata
- Update WASM bindings to pass through metadata

### 4C. TypeScript Metadata Support
- Add `MessageMetadata` interface and `TextEffect` type to `types.ts`:
  ```
  TextEffect = 'slam' | 'gentle' | 'loud' | 'invisible_ink' | 'confetti' | 'balloons' | 'shake' | 'fade_in'
  MessageMetadata = { textEffect?: TextEffect }
  ```
- Add `metadata?: MessageMetadata` to `CommunityMessage` interface
- Update `sendMessage()` to accept optional metadata
- Update `storeReceivedMessage()` to persist metadata
- Add `metadata` to `communityMessageSent` relay event

### 4D. Press-and-Hold Send Button
- Add long-press handler to MessageInput send button
- New component: `TextEffectPicker` — popup menu above send button
  - Grid of effect options with name + mini preview animation
  - 8 effects: Slam, Gentle, Loud, Invisible Ink, Confetti, Balloons, Shake, Fade In
  - On select: fires `onSubmitWithEffect(text, effect)` callback
- Wire through ChatInput to `sendMessage(content, replyToId, { textEffect: effect })`

### 4E. Text Effect Animations (react-native-reanimated)
- New component: `TextEffectWrapper.tsx`
  - Wraps message content with effect animation
  - Uses `react-native-reanimated` for performant animations
  - Only plays on first render (track played message IDs in local Set)
- Effect implementations:
  - **Slam**: Scale 3x→1x with spring bounce
  - **Gentle**: Slow fade-in with upward drift
  - **Loud**: Scale pulse 1x→1.3x→1x repeated, bold text
  - **Invisible Ink**: Blur overlay, clears on tap/hover
  - **Shake**: Horizontal oscillation for 1s
  - **Fade In**: Letter-by-letter opacity animation
  - **Confetti**: Message-level effect + screen-wide particle burst
  - **Balloons**: Message-level effect + floating balloon images rising from bottom

### 4F. Screen-Wide Effects
- **Confetti**: Particle burst from message position, fills viewport
- **Balloons**: Floating balloon images rising from bottom
- Render as absolute-positioned overlay above chat ScrollView
- Auto-dismiss after 3 seconds
- State in ChatArea: `activeScreenEffect` with messageId tracking

**Key files:** `schema.rs`, `wasm.rs`, `messaging.rs`, `database.rs`, `wasm_database.rs`, `types.ts`, `community.ts`, `service.ts`, `ChatInput.tsx`, `TextEffectWrapper.tsx` (new), `TextEffectPicker.tsx` (new)

---

## Phase 5: iMessage-Style Sticker Placement

### 5A. Sticker Placements DB Table (in v13 migration)
- Add `sticker_placements` table:
  - `id TEXT PRIMARY KEY`, `message_id TEXT`, `channel_id TEXT`, `sticker_id TEXT`, `placed_by TEXT`
  - `x_offset REAL`, `y_offset REAL` (percentage 0.0–1.0 of message bubble)
  - `scale REAL DEFAULT 1.0`, `rotation REAL DEFAULT 0.0`
  - `created_at INTEGER`
- Index on `(channel_id, message_id)` for bulk loading

### 5B. Rust/WASM Layer
- `place_sticker()` → creates placement record
- `get_channel_sticker_placements(channelId)` → returns all placements for channel
- `remove_sticker_placement(placementId, requestorDid)` → deletes only if placer or admin
- WASM bindings for all three

### 5C. TypeScript Service + Events
- `StickerPlacement` interface in `types.ts`:
  ```
  { id, messageId, channelId, stickerId, placedBy, xOffset, yOffset, scale, rotation, createdAt }
  ```
- Service functions: `placeSticker()`, `getChannelStickerPlacements()`, `removeStickerPlacement()`
- CommunityEvent variants:
  - `stickerPlaced` — carries full StickerPlacement record
  - `stickerPlacementRemoved` — carries placementId

### 5D. Sticker Placement UI — Drag from Picker
- New component: `StickerOverlay.tsx`
  - Absolute-positioned layer over message list
  - Renders placed stickers at their X,Y coordinates relative to target messages
  - Uses `react-native-gesture-handler` PanGestureHandler + PinchGestureHandler + RotationGestureHandler
- Drag-from-picker flow:
  1. User opens sticker picker
  2. Long-press a sticker to enter "placement mode"
  3. Sticker attaches to finger, drag onto any message bubble
  4. Drop calculates X,Y as percentages of the message bubble bounds
  5. Pinch-to-resize and rotation while dragging
  6. Persists to DB and broadcasts via relay

### 5E. Sticker Placement UI — Context Menu
- Message long-press/right-click context menu gains "Place Sticker" option
- Opens sticker picker in placement mode targeting that specific message
- User selects sticker → it appears centered on the message
- Can then drag to adjust position, pinch to resize, rotate

### 5F. Sync
- On sticker placed: broadcast `stickerPlaced` event
- Receiving side: store locally and render in overlay
- Load placements when entering a channel via `getChannelStickerPlacements()`
- Removal permission: placer DID or community admin role

**Key files:** `schema.rs`, `customization.rs`, `wasm.rs`, `types.ts`, `community.ts`, `StickerOverlay.tsx` (new), `HoverBubble.tsx`, `ChatArea.tsx`

---

## Phase 6: Polish & Integration

### 6A. Custom Emoji in Reactions
- Update reaction system to support custom emoji (use existing `is_custom` flag in `community_reactions`)
- Reaction picker shows custom emoji alongside unicode
- Render custom emoji reactions as small images

### 6B. Emoji/Sticker Autocomplete
- Typing `:` in message input triggers autocomplete dropdown
- Shows matching custom emoji (with image preview) as user types
- Tab/Enter to insert `:emoji_name:`
- Also works for channel autocomplete with `#`

### 6C. Performance Optimization
- Lazy-load custom emoji images in picker (progressive loading)
- Cache sticker placements per channel (invalidate on event)
- Virtualize emoji grid for large collections (up to 1,000 emoji)
- Debounce sticker placement broadcasts
- Image caching with content-hash based keys

### 6D. Accessibility
- Alt text for custom emoji images (`:emoji_name:`)
- Screen reader announcements for text effects ("Message sent with slam effect")
- Keyboard navigation for formatting toolbar
- Spoiler text accessible: screen reader announces "spoiler" and content

---

## Implementation Order

```
Phase 1 (Emoji)  →  Phase 3 (Formatting)  →  Phase 2 (Stickers)  →  Phase 4 (Effects)  →  Phase 5 (Placement)  →  Phase 6 (Polish)
```

Rationale: Phase 1 and 3 share the message parser. Phase 2 builds on Phase 1's patterns. Phase 4 needs schema migration (combined with Phase 2A). Phase 5 is the most complex gesture work.

Note: The v13 schema migration spans Phases 2A (sticker_packs), 4A (metadata_json), and 5A (sticker_placements) — all combined into one migration.

---

## Verification

1. **Custom Emoji**: Upload emoji in settings → appears in picker → insert in chat → renders as inline image → syncs to other members via relay
2. **Discord Import**: Import Discord server → emoji re-hosted to relay → appear in settings and picker
3. **Stickers**: Create sticker pack → upload stickers → send sticker message → renders at 512px → Lottie stickers animate
4. **Formatting**: Type `**bold**` → toolbar shows bold active → message renders bold → spoiler tags work → links clickable
5. **Text Effects**: Long-press send → pick "slam" → message arrives with slam animation → plays once → confetti fills screen
6. **Sticker Placement**: Drag sticker from picker onto message → persists position → pinch to resize → syncs to other members → survives page reload → removable by placer/admin
7. **Relay Assets**: Upload emoji → file stored on relay → accessible via GET endpoint → hash-based dedup works
8. **TypeScript**: `npx tsc --noEmit` passes
9. **WASM**: `cargo check --target wasm32-unknown-unknown` passes
