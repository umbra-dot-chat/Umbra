# Umbra Feature Gaps — February 23, 2026

Comprehensive audit of every feature area. Each section lists what works, what's partially implemented, and what's missing entirely.

---

## Table of Contents

1. [Files & Storage](#1-files--storage)
2. [Communities](#2-communities)
3. [Messaging & DMs](#3-messaging--dms)
4. [Voice & Video](#4-voice--video)
5. [Identity & Account](#5-identity--account)
6. [Plugins](#6-plugins)
7. [Network & Relay](#7-network--relay)
8. [Crypto & Encryption](#8-crypto--encryption)
9. [Search](#9-search)
10. [Notifications](#10-notifications)
11. [Mobile Parity](#11-mobile-parity)

---

## 1. Files & Storage

### Working

- File chunking and reassembly (WASM `chunk_file`, `reassemble_file`)
- File encryption per-chunk (AES-256-GCM with ECDH key derivation)
- DM file metadata CRUD (`uploadDmFile`, `getDmFiles`, `deleteDmFile`, `moveDmFile`)
- Community file metadata CRUD (`uploadFile`, `getFiles`, `deleteFile`, `createFolder`)
- File channel UI (web drag-and-drop, file listing, folder navigation)
- Storage usage tracking with breakdown by context (community, DM, shared folders, cache)
- Smart cleanup (stale transfers, orphaned chunks, old cache)
- Auto-cleanup rules (max storage 2 GB default, transfer age 7 days, cache age 24 hours)
- File transfer state machine (initiate, accept, pause, resume, cancel)
- Key fingerprinting and verification
- Re-encryption flag system for key rotation

### Gaps

| Gap | Severity | Details |
|-----|----------|---------|
| **P2P file download** | Critical | Files show "P2P file download coming soon" — only local reassembly works, no fetching from peers |
| **Mobile file picker** | Critical | `utils/filePicker.ts` returns `null` on mobile — TODO says "Integrate with expo-document-picker" |
| **Actual chunk transmission** | Critical | Transfer state machine exists but no code sends/receives actual bytes over WebRTC or relay |
| **WebRTC DataChannel** | High | No WebRTC data channel integration for file transfers |
| **Large file streaming** | High | Files must fit entirely in memory; base64 encoding adds 33% overhead |
| **Transfer resumption across restarts** | Medium | Sessions not persisted to DB; pause works in-session only |
| **Shared folder sync** | Medium | `syncFolder()` just refreshes file list; no bidirectional sync, no conflict resolution |
| **Conflict resolution** | Medium | `resolveConflict()` is a no-op placeholder |
| **File versioning UI** | Low | DB has `previous_version_id` but no UI to view/restore versions |
| **File rename** | Low | No rename operation in UI (hook exists for move) |
| **Bulk file operations** | Low | No batch upload/download/delete |
| **File preview/thumbnails** | Low | No preview generation before download |
| **Bandwidth throttling** | Low | No speed limits for transfers |

---

## 2. Communities

### Working

- Community CRUD (create, update branding, delete, transfer ownership)
- Spaces CRUD with drag-to-reorder
- Categories CRUD with reorder and channel assignment
- 5 channel types: text, voice, announcement, forum, file
- Channel CRUD with slow mode and E2EE toggle
- 34-permission role system across 8 categories (General, Members, Messages, Threads, Voice, Moderation, Files, Advanced)
- Role CRUD (create, update name/color/hoisted/mentionable, delete, assign/unassign members)
- Member management (join, leave, kick, ban, unban, ban list)
- Invites with expiry, max uses, vanity URLs, QR codes
- Community messaging (send, receive, edit, delete, reactions, pins, threads)
- Emoji management (upload, rename, delete — PNG/GIF/WEBP/APNG, max 256 KB, limit 1000)
- Sticker management with packs (PNG/GIF/WEBP/APNG/Lottie, max 2 MB)
- Seats system (batch create, claim, delete, platform matching for Discord/GitHub/Steam/Bluesky/Xbox)
- Discord bridge (register, enable/disable, channel mapping, member sync)
- Discord import (OAuth flow, full structure import with channels, roles, members, pins, emoji, stickers)
- Community sync via relay (real-time event propagation)
- Sidebar navigation with context menus and drag-and-drop

### Gaps

| Gap | Severity | Details |
|-----|----------|---------|
| **Channel permission overrides** | Critical | No per-channel role or user permission overrides; only global role permissions. DB table `channel_permission_overrides` exists but unused |
| **Audit log viewer UI** | High | Backend `getAuditLog()` works but settings dialog shows placeholder text only |
| **Moderation panel UI** | High | Settings dialog "Moderation" tab is a stub — no ban list viewer, no timeout controls |
| **Member timeout/mute** | High | Permission bit 8 "Timeout Members" defined but no `timeoutMember()` method exists |
| **Voice moderation** | High | Permission bits 25-27 (Mute/Deafen/Move members) defined but no implementation |
| **Member context menu** | Medium | Can't kick/ban from member list panel — actions only through role management UI |
| **Permission deny support** | Medium | Only allow/inherit — TODO comment says "Full deny support requires per-role deny_bitfield" |
| **Community search/discovery** | Medium | No browse, search, or recommendation system for public communities |
| **Community onboarding** | Low | No welcome wizard, role assignment flow, or channel visibility defaults for new members |
| **Seats re-scan** | Low | TODO: "requires storing source guild ID + relay bot token endpoint" |
| **Audit log storage for imports** | Low | Warning in import: "Audit log entries fetched but storage not yet implemented" |

---

## 3. Messaging & DMs

### Working

- E2EE messaging (AES-256-GCM with ECDH + HKDF key derivation)
- Message CRUD (send, edit, delete with soft-delete)
- Reactions (add/remove emoji, display with counts)
- Threading (create thread, send reply, get replies, thread count)
- Message forwarding (with `forwarded` and `forwardedFrom` metadata)
- Message pinning (pin/unpin with panel display)
- Typing indicators (relay-based, animated bubble display)
- Read/delivery receipts (status tracking: sending > sent > delivered > read)
- DM file sharing (upload, list, folders, move, download tracking)
- Group DMs (creation, fan-out encryption, member add/remove with key rotation)
- Message pagination (offset/limit with hasMore flag)
- Real-time event system (messageReceived, messageEdited, messageDeleted, reactionAdded, etc.)
- Emoji picker with community custom emoji
- New DM dialog with friend picker and existing conversation detection
- Deterministic conversation IDs (SHA-256 of sorted DIDs)

### Gaps

| Gap | Severity | Details |
|-----|----------|---------|
| **Message search** | High | No `searchMessages()` in DM messaging service; SearchPanel component exists but no backend |
| **Link previews** | High | No URL detection, metadata extraction (og:meta), or preview card display |
| **Rich text / Markdown** | High | Plain text only — no bold, italic, code blocks, quotes, or formatting toolbar |
| **Media inline rendering** | High | Files shared as metadata only; no inline image display, no video player, no audio player |
| **Offline message queue** | Medium | Messages marked "sending" but no retry mechanism or persistent queue for failed sends |
| **Voice messages** | Medium | No audio recording, encoding, or playback for voice messages |
| **Stickers in chat** | Medium | Props for `stickerPacks` exist in ChatInput but not wired to send/display stickers in messages |
| **Read receipt display** | Medium | Status tracked in DB but no "double blue check" or read-by-who display in UI |
| **Perfect forward secrecy** | Medium | Static ECDH shared secret per conversation; no key ratcheting (Signal-like protocol) |
| **Message auto-expiry** | Low | No TTL, auto-deletion, or message retention policies |
| **Bulk message actions** | Low | No select-multiple for batch delete/forward |
| **Message export** | Low | No export conversations to JSON/CSV |
| **GIF support** | Low | No GIF search/picker or inline GIF display |
| **Hard delete** | Low | Soft delete only; original encrypted content still stored |

---

## 4. Voice & Video

### Working

- Community voice channels (join/leave, mute/deafen, speaking detection)
- 1-on-1 DM voice/video calls (offer/answer/ICE via relay signaling)
- WebRTC peer connections with ICE/STUN/TURN
- Audio quality presets (opus-voice, opus-music, PCM)
- Video quality modes (auto, 360p, 720p, 1080p)
- Screen sharing (replaces video track with screen capture)
- Noise suppression, echo cancellation, AGC (MediaTrack constraints)
- Audio/video settings panel (input/output volume, codec config, device selection)
- Media E2EE (frame-level AES-256-GCM via RTCRtpScriptTransform)
- Real-time call statistics (RTT, packet loss, jitter, bitrate, codec, resolution)
- Call diagnostics page (relay latency, STUN/TURN tests, loopback audio, SDP negotiation)
- Group voice via GroupCallManager (WebRTC mesh networking)
- Ring timeout (45-second auto-decline)
- Encrypted call signaling

### Gaps

| Gap | Severity | Details |
|-----|----------|---------|
| **Call history** | High | `calls_store`, `calls_end`, `calls_get_history`, `calls_get_all_history` all return 501 stubs |
| **Push-to-talk** | Medium | No PTT mode, no keyboard shortcut, no toggle in settings |
| **Video in community channels** | Medium | Voice channels support audio only; no video/camera in community calls |
| **Auto-reconnect** | Medium | `status: 'reconnecting'` set but no automatic reconnect attempt; user must restart call |
| **In-call video effects** | Medium | Background blur/replacement available in settings preview but not applied during actual calls |
| **Camera switching UI** | Low | `switchCamera()` implemented in CallManager but no UI button during calls |
| **Bandwidth adaptation** | Low | Manual quality selection only; no automatic quality adjustment based on network conditions |
| **Call recording** | Low | No recording controls, storage, or consent flow |
| **Call transfer** | Low | No hold, transfer, or swap between multiple calls |
| **Conference calls in DMs** | Low | Only 1-on-1 DM calls; community voice channels support multiple users but audio only |
| **Advanced VAD** | Low | Threshold-based only (0.05); no ML or WebRTC-native VAD |

---

## 5. Identity & Account

### Working

- DID creation with 24-word BIP39 recovery phrase
- Identity restore from recovery phrase
- Multi-account support with account switching
- PIN protection (5-digit setup/removal/verification)
- Profile editing (display name, status, avatar)
- Platform account linking (Discord, GitHub, Steam, Bluesky via OAuth)
- Discovery opt-in and friend discovery by platform username
- Appearance settings (theme light/dark/auto, accent colors, text size, font selection)
- Sound settings (per-category volume, sound theme selection)
- Notification toggles (messages, mentions, friend requests)
- Privacy toggles (read receipts, typing indicators, show online status)
- Session persistence (remember-me, secure storage on mobile, localStorage on web)

### Gaps

| Gap | Severity | Details |
|-----|----------|---------|
| **Blocked users management** | High | No UI to view, manage, or unblock blocked users; no block button in profile cards |
| **Settings persistence** | Medium | Privacy toggles and notification preferences exist in state but unclear if persisted to DB across sessions |
| **Account deletion** | Medium | No "Delete Account" option; no data retention policy UI |
| **Two-factor authentication** | Medium | PIN is offline only, not true 2FA; no TOTP/WebAuthn support |
| **Account export/backup** | Medium | DB export available but no structured account export (identity + settings + data) |
| **Activity/login history** | Medium | No device list, login locations, or sign-out-from-other-devices |
| **Language/locale settings** | Medium | English only; no i18n hook or translation system |
| **Xbox account linking** | Low | Commented out: "Xbox disabled until credentials configured" |
| **Custom status text** | Low | Dropdown for predefined statuses; unclear if custom text status is supported |
| **Recovery phrase viewing** | Low | Shown on import but no way to view again in settings |
| **Avatar optimization** | Low | No image compression, aspect ratio enforcement, or file size limit in upload UI |
| **Accessibility settings** | Low | No contrast adjustment, keyboard navigation hints, or screen reader optimization |

---

## 6. Plugins

### Working

- Plugin architecture with lifecycle management (activate/deactivate/enable/disable)
- Plugin registry with manifest support (slots, commands, storage requirements)
- Sandboxed API (`createSandboxedAPI()`) for isolated plugin execution
- Plugin KV storage (get/set/delete/list) with DB backing
- Plugin bundle storage (save/load/delete/list)
- Plugin marketplace client with bundled registry fallback
- Two reference plugins: `translator` (message decorator) and `system-monitor` (stats display)
- Service bridge: plugins can access messages, friends, conversations, register commands
- Slot rendering system for plugin UI components

### Gaps

| Gap | Severity | Details |
|-----|----------|---------|
| **Theme plugins** | Medium | Marketplace says "Themes: community colour themes (coming soon)" |
| **Font plugins** | Medium | Marketplace says "Fonts: custom font packs (coming soon)" |
| **Plugin toast integration** | Low | `showToast()` TODO: "Wire to ToastProvider" |
| **Plugin panel integration** | Low | `openPanel()` TODO: "Wire to right panel system" |
| **Plugin permissions** | Low | No explicit permission system for what plugins can access |
| **Plugin signing** | Low | No code signing or signature verification for plugin bundles |
| **Plugin auto-updates** | Low | No automatic update mechanism |

---

## 7. Network & Relay

### Working

- WebSocket relay client with DID-based registration
- Relay message types: Register, Signal, Send, CreateSession, JoinSession, FetchOffline, CallSignal, FileTransfer
- Offline message queuing and delivery on reconnect
- Metadata sync across sessions via relay
- libp2p integration (TCP/WebSocket/WebRTC transports, Yamux muxing, Noise encryption)
- Kademlia DHT (peer discovery, file providing, provider records)
- Connection state monitoring and reconnection
- TURN credential resolution from relay server

### Gaps

| Gap | Severity | Details |
|-----|----------|---------|
| **Relay failover** | High | Single relay URL configurable; no automatic failover to secondary relay |
| **Presence broadcasting** | High | Online/offline indicators exist as tracking state but no real-time presence system |
| **DHT file content distribution** | Medium | DHT can advertise providers but no code to actually download file content from providers |
| **Relay load balancing** | Medium | No load distribution across US and Seoul relays |
| **NAT traversal** | Medium | Relies heavily on relay; limited UPnP/PCP support |
| **Connection keep-alive tuning** | Low | Basic ping/pong but no adaptive keep-alive |

---

## 8. Crypto & Encryption

### Working

- BIP39 recovery phrases (24 words, 256 bits entropy)
- PBKDF2-SHA512 key derivation (2048 rounds)
- Ed25519 signing keys with constant-time operations
- X25519 ECDH key exchange
- AES-256-GCM authenticated encryption with random nonces
- HKDF-SHA256 for per-context key derivation
- File encryption per-chunk with AAD verification
- Channel file key derivation with version tracking
- Group key management with rotation on member removal
- Key fingerprinting (16-char hex)
- Crypto sign/verify in dispatcher (fully implemented)

### Gaps

| Gap | Severity | Details |
|-----|----------|---------|
| **Forward secrecy** | Medium | Static ECDH per conversation; no Double Ratchet or key ratcheting for per-message keys |
| **Key rotation on schedule** | Medium | Only rotates on member removal; no time-based rotation |
| **Cryptographic agility** | Low | Hardcoded algorithms; no negotiation or migration path |
| **Post-quantum readiness** | Low | Classical ECC only; no hybrid or PQC key exchange |
| **External audit** | Low | No evidence of third-party cryptographic audit |

---

## 9. Search

### Working

- Community message search (`search_messages(channel_id, query, limit)`)
- Community-wide search (`search_community_messages(community_id, query, limit)`)
- Advanced search filters: `from:`, `in:`, `before:`, `after:`, `has:file`, `has:reaction`, `is:pinned`
- User discovery by platform username (Discord, GitHub, Steam, Bluesky)
- SQL-based search on `community_messages` table

### Gaps

| Gap | Severity | Details |
|-----|----------|---------|
| **DM message search** | High | No search function exposed for direct messages |
| **Global cross-conversation search** | Medium | No full-text search across all conversations and communities |
| **Search indexing** | Medium | SQL LIKE queries only; no FTS5 or dedicated search index for performance |
| **Search UI for DMs** | Medium | SearchPanel component exists but only wired for community channels |
| **Search history** | Low | No saved or recent searches |
| **Real-time search updates** | Low | Static results; no live update as new messages arrive |

---

## 10. Notifications

### Working

- Message notifications (sound playback for non-active conversations)
- Friend request notifications (sound + event dispatch)
- Sound system with 16+ categories and per-category volume
- Community notification settings in DB (mute until, @everyone suppression, levels: all/mentions/none)
- Thread follow/unfollow for notification subscription
- Community read receipts in DB

### Gaps

| Gap | Severity | Details |
|-----|----------|---------|
| **Push notifications (mobile)** | Critical | No Firebase Cloud Messaging or APNS integration |
| **Desktop/browser notifications** | High | No OS-level Notification API or service worker integration |
| **Unread count badges** | High | No unread count on channels, spaces, or communities in sidebar |
| **@mention handling** | Medium | No special parsing, highlighting, or notification priority for @user/@here/@everyone |
| **Notification inbox** | Medium | Toast-only; no persistent notification panel or history |
| **Do Not Disturb** | Medium | Not fully implemented as a mode |
| **Per-conversation notification settings UI** | Low | DB support exists but limited UI exposure in settings |
| **Notification grouping** | Low | Individual toasts; no threading/stacking |
| **Haptic feedback** | Low | No vibration patterns for mobile notifications |

---

## 11. Mobile Parity

### Gaps specific to mobile (React Native / Expo)

| Gap | Severity | Details |
|-----|----------|---------|
| **File picker** | Critical | Returns `null` on mobile; needs expo-document-picker integration |
| **File download** | Critical | P2P download not implemented on any platform; mobile shows alert "Download unavailable" |
| **Push notifications** | Critical | No native push notification infrastructure |
| **Deep linking** | Medium | Invite links may not open directly in the app |
| **Haptic feedback** | Low | No tactile feedback for actions |
| **Offline mode** | Low | No graceful offline experience or cached data display |

---

## Summary by Priority

### Critical (Blocks core functionality)

1. P2P file download — no way to retrieve files from peers
2. Mobile file picker — can't upload files on mobile at all
3. Push notifications — users miss messages when app is backgrounded
4. Chunk transmission protocol — transfer state machine exists but no actual data transfer

### High (Major feature gaps)

5. Channel permission overrides — no per-channel access control
6. Message search in DMs — can't search direct message history
7. Audit log viewer UI — backend works, frontend is a placeholder
8. Moderation panel — no ban list viewer, timeout controls, or voice moderation
9. Link previews — no URL metadata extraction or display
10. Rich text / Markdown — plain text only in messages
11. Relay failover — single point of failure
12. Call history — all backend methods return 501
13. Unread count badges — no visual indicator of unread messages
14. Blocked users management — no UI to manage block list
15. Desktop/browser notifications — no OS-level alerts
16. Presence broadcasting — no real-time online/offline indicators
17. Media inline rendering — no inline images, video, or audio playback

### Medium (Expected features)

18. Member timeout/mute implementation
19. Offline message queue with retry
20. Voice messages
21. Sticker sending in chat
22. Read receipt display in UI
23. Forward secrecy (key ratcheting)
24. Community search/discovery
25. Auto-reconnect for calls
26. Video in community voice channels
27. Push-to-talk mode
28. Account deletion flow
29. Two-factor authentication
30. Settings persistence verification
31. DM search UI
32. @mention notifications
33. Notification inbox/history
34. Permission deny support
35. Language/locale settings
36. Account export/backup
37. DHT file content distribution
38. Relay load balancing

### Low (Polish / nice-to-have)

39. File versioning UI
40. Bulk file operations
41. File preview/thumbnails
42. Call recording
43. Camera switching UI during calls
44. Plugin themes and fonts
45. GIF support
46. Message auto-expiry
47. Search history
48. Haptic feedback
49. Avatar optimization
50. Accessibility settings
