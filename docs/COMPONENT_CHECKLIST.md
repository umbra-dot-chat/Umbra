# Umbra Communities — UI Component Checklist

> **Purpose**: Master checklist of every UI component needed for the community feature set.
> Derived from `frontend_requirements.md`. Components will be built in Wisp following the
> 3-layer pattern (core types → core styles → React + RN + test + stories + registry).
>
> **Status key**: ✅ Done | 🔧 In Progress | ⬜ Not Started

---

## Phase 1: Core Community Infrastructure

| # | Component | Description | Status |
|---|-----------|-------------|--------|
| 1.1 | **CommunityCreateDialog** | Dialog with name, description, optional icon upload. Calls `community_create`. | ✅ |
| 1.2 | **CommunitySidebar** | Sidebar showing spaces as collapsible sections, channels within each space. Active channel highlight. | ⬜ |
| 1.3 | **ChannelHeader** | Top bar for active channel — channel name, topic, settings cog icon, E2EE indicator. | ⬜ |
| 1.4 | **MemberListPanel** | Right-side panel listing members grouped by hoisted roles with role colors. Online status dots. | ⬜ |
| 1.5 | **RoleManagementPanel** | Admin panel to create/edit roles, set colors, drag-to-reorder hierarchy, permission checkbox grid. | ⬜ |
| 1.6 | **InviteManagement** | Create invite links, copy to clipboard, set expiry/max uses, manage vanity URL. | ⬜ |
| 1.7 | **CommunitySettingsPage** | Full settings page: name, description, branding fields, danger zone (delete community, transfer ownership). | ⬜ |
| 1.8 | **BanListManagement** | View banned members, unban, see ban reason/expiry/device fingerprint status. | ⬜ |
| 1.9 | **AuditLogViewer** | Filterable log of all admin/mod actions. Filter by action type, actor, date range. Paginated. | ⬜ |
| 1.10 | **MemberProfilePopup** | Hover/click popup showing member nickname, avatar, bio, roles, joined date. | ⬜ |

---

## Phase 2: Messaging & Channels

| # | Component | Description | Status |
|---|-----------|-------------|--------|
| 2.1 | **MessageInputBar** | Rich text input with emoji picker, file attachment, content warning toggle, slow mode indicator. | ⬜ |
| 2.2 | **MessageList** | Infinite scroll message list with pagination via `before_timestamp`. Date separators. | ⬜ |
| 2.3 | **MessageBubble** | Single message: sender avatar, display name (role color), timestamp, content, reactions row, reply preview. | ⬜ |
| 2.4 | **MessageContextMenu** | Right-click/long-press menu: edit, delete, delete for me, pin, reply, create thread, copy text. | ⬜ |
| 2.5 | **ReactionPicker** | Emoji grid with standard + community custom emoji. Quick-react row for frequently used. | ⬜ |
| 2.6 | **PinnedMessagesPanel** | Slide-out drawer listing all pinned messages in channel. Click to jump to message. | ⬜ |
| 2.7 | **ReadReceiptIndicators** | Typing indicator ("X is typing..."), "seen by" tooltips on messages (5 avatars + count). | ⬜ |
| 2.8 | **E2EEKeyExchangeUI** | Key rotation notice banner, channel encryption status badge. | ⬜ |
| 2.9 | **SlowModeCountdown** | Countdown timer shown on message input when slow mode is active. | ⬜ |

---

## Phase 3: Threads & Search

| # | Component | Description | Status |
|---|-----------|-------------|--------|
| 3.1 | **ThreadIndicator** | Badge on parent message showing reply count, "View Thread" button. | ⬜ |
| 3.2 | **ThreadPanel** | Slide-out panel with thread messages, reply input, follow/unfollow toggle. | ⬜ |
| 3.3 | **ThreadListView** | List of all active threads in a channel with message count and last activity. | ⬜ |
| 3.4 | **SearchBar** | Global search input with community/channel scope selector dropdown. | ⬜ |
| 3.5 | **SearchResultsPanel** | Message results with channel context label. Click to jump to message in channel. | ⬜ |

---

## Phase 4: Advanced Roles & Permissions

| # | Component | Description | Status |
|---|-----------|-------------|--------|
| 4.1 | **ChannelPermissionEditor** | Per-channel role/member overrides with allow/deny/inherit toggle per permission. | ⬜ |
| 4.2 | **CustomRoleCreateDialog** | Dialog to create custom role: name, color picker, position, permission grid. | ⬜ |
| 4.3 | **RoleHierarchyDisplay** | Drag-to-reorder role list showing position-based authority. | ⬜ |
| 4.4 | **PermissionCalculator** | Debug/admin tool showing effective permissions for a user in a specific channel. | ⬜ |

---

## Phase 5: Moderation

| # | Component | Description | Status |
|---|-----------|-------------|--------|
| 5.1 | **WarningDialog** | Issue warning to member: reason field, optional expiry picker. | ⬜ |
| 5.2 | **WarningHistoryPanel** | Per-member warning list with active/expired status, delete button. | ⬜ |
| 5.3 | **AutoModSettings** | Keyword filter rules editor, escalation threshold config (timeout at N, ban at N). | ⬜ |
| 5.4 | **ModerationDashboard** | Overview: recent warnings, active warning counts per member, ban evasion alerts. | ⬜ |
| 5.5 | **MemberContextMenuAdditions** | Extra menu items on member: warn, timeout, view warnings, kick, ban. | ⬜ |

---

## Phase 6: Voice & Video

| # | Component | Description | Status |
|---|-----------|-------------|--------|
| 6.1 | **VoiceChannelPanel** | Connected users list with avatar + speaking indicator, mute/deafen controls. | ⬜ |
| 6.2 | **VideoGrid** | Participant video tiles, screen share tile, speaker highlight. | ⬜ |
| 6.3 | **VoiceConnectionControls** | Join/leave voice, mute self, deafen self, start video, share screen. | ⬜ |
| 6.4 | **ScreenSharePicker** | OS-level screen/window picker dialog. | ⬜ |
| 6.5 | **RecordingControls** | Recording indicator, start/stop, consent tracking display. | ⬜ |

---

## Phase 7: File Management

| # | Component | Description | Status |
|---|-----------|-------------|--------|
| 7.1 | **FileChannelView** | Folder tree sidebar + file grid/list toggle with sort options. | ⬜ |
| 7.2 | **FileUploadDialog** | Drag-and-drop zone, progress bar, chunked upload progress, description field. | ⬜ |
| 7.3 | **FileCard** | Thumbnail preview, filename, size, MIME icon, download count badge. | ⬜ |
| 7.4 | **FolderBreadcrumb** | Breadcrumb navigation for nested folders. | ⬜ |
| 7.5 | **FileDetailPanel** | Full file info: description, version history, size, uploader, download button. | ⬜ |

---

## Phase 8: Member Experience

| # | Component | Description | Status |
|---|-----------|-------------|--------|
| 8.1 | **MemberProfileCard** | Expanded profile: nickname, avatar, bio, roles, joined date, custom status. | ⬜ |
| 8.2 | **OnlineStatusIndicator** | Green/yellow/red/gray dot for presence state (online/idle/DND/offline). | ⬜ |
| 8.3 | **MemberSearchFilter** | Search/filter in member list by name, role. | ⬜ |
| 8.4 | **NicknameDisplay** | Display nickname with role color in messages and member list. | ⬜ |

---

## Phase 9: Customization & Branding

| # | Component | Description | Status |
|---|-----------|-------------|--------|
| 9.1 | **BrandingSettingsPage** | Icon upload, banner upload, splash image, accent color picker, custom CSS editor. | ⬜ |
| 9.2 | **VanityURLSettings** | Input field for vanity URL with availability check feedback. | ⬜ |
| 9.3 | **EmojiManagementPanel** | Upload custom emoji, preview grid, name editor, animated flag, delete. | ⬜ |
| 9.4 | **StickerManagementPanel** | Upload stickers, organize into packs, preview, delete. | ⬜ |
| 9.5 | **EmojiPickerIntegration** | Standard emoji grid + community custom emoji tab. | ⬜ |
| 9.6 | **StickerPicker** | Sticker packs grid picker, search stickers. | ⬜ |
| 9.7 | **ThemePreview** | Live preview of accent color + custom CSS applied to community. | ⬜ |

---

## Phase 10: Integrations (Webhooks)

| # | Component | Description | Status |
|---|-----------|-------------|--------|
| 10.1 | **WebhookManagementPanel** | List webhooks per channel with create/edit/delete actions. | ⬜ |
| 10.2 | **WebhookCreateDialog** | Create webhook: name, avatar upload, target channel selector. | ⬜ |
| 10.3 | **WebhookDetailPage** | Token display with copy button, edit name/avatar, regenerate token. | ⬜ |
| 10.4 | **WebhookMessagePreview** | Distinct message rendering for webhook-posted messages with webhook avatar. | ⬜ |

---

## Phase 11: Boost Nodes & Federation

| # | Component | Description | Status |
|---|-----------|-------------|--------|
| 11.1 | **BoostNodeDashboard** | List user's nodes, status indicators (online/offline), storage/bandwidth bars. | ⬜ |
| 11.2 | **NodeRegistrationWizard** | Step-by-step: local vs remote, key generation, name, storage/bandwidth limits. | ⬜ |
| 11.3 | **NodeDetailPanel** | Config editor: name, enable/disable, storage/bandwidth limits, auto-start, last seen. | ⬜ |
| 11.4 | **NodePairingFlow** | QR code or pairing token display/input for connecting remote nodes. | ⬜ |
| 11.5 | **CommunityBoostStatus** | Show which communities a node is prioritizing, health indicators. | ⬜ |
| 11.6 | **StorageUsageVisualization** | Bar chart or gauge of used vs available storage per node. | ⬜ |

---

## Gap Fill: Additional Features

| # | Component | Description | Status |
|---|-----------|-------------|--------|
| G.1 | **TimeoutDialog** | Timeout a member: duration picker (presets + custom), reason, type (mute/restrict). | ⬜ |
| G.2 | **ActiveTimeoutsBadge** | Badge/indicator on member profiles showing active timeout status. | ⬜ |
| G.3 | **ThreadFollowButton** | Toggle follow/unfollow on thread headers, follow count display. | ⬜ |
| G.4 | **AdvancedSearchPanel** | Filters: from user, in channel, before/after date, has file, has reaction, is pinned. | ⬜ |
| G.5 | **MemberStatusPicker** | Set custom status: text input, emoji picker, optional expiry. | ⬜ |
| G.6 | **MemberStatusDisplay** | Show custom status text + emoji next to member name in member list and profile. | ⬜ |
| G.7 | **NotificationSettingsPanel** | Per-community/space/channel controls: mute toggle, suppress @everyone/@roles, level dropdown (all/mentions/none). | ⬜ |
| G.8 | **MentionAutocomplete** | Dropdown when typing @ in message input: @everyone, @here, roles, member names. | ⬜ |
| G.9 | **SystemMessageRenderer** | Distinct styling for system messages (join notifications, etc). No avatar, centered text. | ⬜ |

---

## Summary

| Phase | Components | Done | Remaining |
|-------|-----------|------|-----------|
| Phase 1: Core Infrastructure | 10 | 1 | 9 |
| Phase 2: Messaging & Channels | 9 | 0 | 9 |
| Phase 3: Threads & Search | 5 | 0 | 5 |
| Phase 4: Advanced Roles | 4 | 0 | 4 |
| Phase 5: Moderation | 5 | 0 | 5 |
| Phase 6: Voice & Video | 5 | 0 | 5 |
| Phase 7: File Management | 5 | 0 | 5 |
| Phase 8: Member Experience | 4 | 0 | 4 |
| Phase 9: Customization | 7 | 0 | 7 |
| Phase 10: Integrations | 4 | 0 | 4 |
| Phase 11: Boost Nodes | 6 | 0 | 6 |
| Gap Fill | 9 | 0 | 9 |
| **Total** | **73** | **1** | **72** |

---

## Build Order Recommendation

Components should be built roughly in phase order, but some cross-phase dependencies exist:

1. **Start with Phase 1** — CommunitySidebar, ChannelHeader, MemberListPanel are foundational layout
2. **Phase 2 next** — MessageList, MessageBubble, MessageInputBar are the core interaction
3. **Phase 3** — Threads and search build on the message system
4. **Phases 4-5** — Roles/permissions/moderation are admin features, can be built in parallel
5. **Phase 6** — Voice/video is independent and can be deferred
6. **Phases 7-9** — Files, member experience, customization can be built in any order
7. **Phases 10-11** — Webhooks and boost nodes are the most specialized, build last
8. **Gap Fill** — Can be sprinkled in as the related phase components are built
