# Umbra Communities — Frontend Requirements

> **Purpose**: This document tracks the WASM function interfaces, data types, and UI requirements the frontend needs to implement. Updated as each backend phase is built. If implementation is interrupted, this document serves as the contract between Rust backend and TypeScript frontend.

!IMPORTANT! As you're implementing the UI elements in Wisp for these requirements please ensure that the components are build just like existing components containing tests, a react and react native version, storybook files for both, and update the website in Wisp/website. You should reuse things from the kit where possible and try not to ever roll your own primitives since they're all built. Adhere to the styles we have so far and ensure every component supports light and dark modes. Categorize the components on the website into a community category

---

## How to Use This Document

1. Each phase lists the **WASM functions** exposed by the Rust backend
2. Each function includes its **signature**, **input JSON shape**, and **return JSON shape**
3. **Events** the frontend should subscribe to are listed per phase
4. **UI components** needed are listed but NOT implemented by the backend — frontend-only work

---

## Phase 1: Core Community Infrastructure

> Status: **Backend Complete** (WASM bindings complete)

### Data Types

```typescript
// Core community record
interface Community {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  banner_url?: string;
  splash_url?: string;
  accent_color?: string;
  custom_css?: string;
  owner_did: string;
  vanity_url?: string;
  created_at: number;
  updated_at: number;
}

// Space (one level of organization)
interface CommunitySpace {
  id: string;
  community_id: string;
  name: string;
  position: number;
  created_at: number;
  updated_at: number;
}

// Channel types: 'text' | 'voice' | 'files' | 'announcement' | 'bulletin' | 'welcome'
interface CommunityChannel {
  id: string;
  community_id: string;
  space_id: string;
  name: string;
  channel_type: string;
  topic?: string;
  position: number;
  slow_mode_seconds: number;
  e2ee_enabled: boolean;
  pin_limit: number;
  created_at: number;
  updated_at: number;
}

// Role with permission bitfield
interface CommunityRole {
  id: string;
  community_id: string;
  name: string;
  color?: string;
  icon?: string;
  badge?: string;
  position: number;
  hoisted: boolean;
  mentionable: boolean;
  is_preset: boolean;
  permissions_bitfield: string; // decimal string of u64
  created_at: number;
  updated_at: number;
}

// Community member
interface CommunityMember {
  community_id: string;
  member_did: string;
  nickname?: string;
  avatar_url?: string;
  bio?: string;
  joined_at: number;
}

// Invite link
interface CommunityInvite {
  id: string;
  community_id: string;
  code: string;
  vanity: boolean;
  creator_did: string;
  max_uses?: number;
  use_count: number;
  expires_at?: number;
  created_at: number;
}

// Ban record
interface CommunityBan {
  community_id: string;
  banned_did: string;
  reason?: string;
  banned_by: string;
  device_fingerprint?: string;
  expires_at?: number;
  created_at: number;
}

// Audit log entry
interface AuditLogEntry {
  id: string;
  community_id: string;
  actor_did: string;
  action_type: string;
  target_type?: string;
  target_id?: string;
  metadata_json?: string;
  content_detail?: string;
  created_at: number;
}

// Create result (returned when creating a community)
interface CommunityCreateResult {
  community_id: string;
  space_id: string;
  welcome_channel_id: string;
  general_channel_id: string;
  role_ids: {
    owner: string;
    admin: string;
    moderator: string;
    member: string;
  };
}
```

### Permission Bitfield

The permission system uses a 64-bit bitfield. The frontend should use BigInt or a string representation.

```typescript
// Permission flags (bit positions)
enum Permission {
  ViewChannels        = 1 << 0,
  ManageCommunity     = 1 << 1,
  ManageChannels      = 1 << 2,
  ManageRoles         = 1 << 3,
  CreateInvites       = 1 << 4,
  ManageInvites       = 1 << 5,
  KickMembers         = 1 << 6,
  BanMembers          = 1 << 7,
  TimeoutMembers      = 1 << 8,
  ChangeNickname      = 1 << 9,
  ManageNicknames     = 1 << 10,
  SendMessages        = 1 << 11,
  EmbedLinks          = 1 << 12,
  AttachFiles         = 1 << 13,
  AddReactions        = 1 << 14,
  UseExternalEmoji    = 1 << 15,
  MentionEveryone     = 1 << 16,
  ManageMessages      = 1 << 17,
  ReadMessageHistory  = 1 << 18,
  CreateThreads       = 1 << 19,
  SendThreadMessages  = 1 << 20,
  ManageThreads       = 1 << 21,
  VoiceConnect        = 1 << 22,
  VoiceSpeak          = 1 << 23,
  VoiceStream         = 1 << 24,
  VoiceMuteMembers    = 1 << 25,
  VoiceDeafenMembers  = 1 << 26,
  VoiceMoveMembers    = 1 << 27,
  ViewAuditLog        = 1 << 28,
  ManageWebhooks      = 1 << 29,
  ManageEmoji         = 1 << 30,
  ManageBranding      = 1 << 31,
  UploadFiles         = 1 << 32,
  ManageFiles         = 1 << 33,
  Administrator       = 1 << 63,
}
```

### WASM Functions (Exposed)

All functions are synchronous and return `Result<JsValue, JsValue>`. Functions accept either direct string parameters or a JSON string input. All return JSON-serialized results.

#### Community CRUD
- `umbra_wasm_community_create(json)` — Input: `{ "name", "description"?, "owner_did" }` → `CommunityCreateResult`
- `umbra_wasm_community_get(community_id)` → `Community`
- `umbra_wasm_community_get_mine(member_did)` → `Community[]`
- `umbra_wasm_community_update(json)` — Input: `{ "id", "name"?, "description"?, "actor_did" }` → `{ success: true }`
- `umbra_wasm_community_delete(json)` — Input: `{ "id", "actor_did" }` → `{ success: true }`
- `umbra_wasm_community_transfer_ownership(json)` — Input: `{ "community_id", "current_owner_did", "new_owner_did" }` → `{ success: true }`

#### Spaces
- `umbra_wasm_community_space_create(json)` — Input: `{ "community_id", "name", "position"?, "actor_did" }` → `CommunitySpace`
- `umbra_wasm_community_space_list(community_id)` → `CommunitySpace[]`
- `umbra_wasm_community_space_update(json)` — Input: `{ "space_id", "name", "actor_did" }` → `{ success: true }`
- `umbra_wasm_community_space_reorder(json)` — Input: `{ "community_id", "space_ids": [] }` → `{ success: true }`
- `umbra_wasm_community_space_delete(json)` — Input: `{ "space_id", "actor_did" }` → `{ success: true }`

#### Channels
- `umbra_wasm_community_channel_create(json)` — Input: `{ "community_id", "space_id", "name", "channel_type", "topic"?, "position"?, "actor_did" }` → `CommunityChannel`
- `umbra_wasm_community_channel_list(space_id)` → `CommunityChannel[]`
- `umbra_wasm_community_channel_list_all(community_id)` → `CommunityChannel[]`
- `umbra_wasm_community_channel_get(channel_id)` → `CommunityChannel`
- `umbra_wasm_community_channel_update(json)` — Input: `{ "channel_id", "name"?, "topic"?, "actor_did" }` → `{ success: true }`
- `umbra_wasm_community_channel_set_slow_mode(json)` — Input: `{ "channel_id", "seconds", "actor_did" }` → `{ success: true }`
- `umbra_wasm_community_channel_set_e2ee(json)` — Input: `{ "channel_id", "enabled", "actor_did" }` → `{ success: true }`
- `umbra_wasm_community_channel_delete(json)` — Input: `{ "channel_id", "actor_did" }` → `{ success: true }`
- `umbra_wasm_community_channel_reorder(json)` — Input: `{ "space_id", "channel_ids": [] }` → `{ success: true }`

#### Members
- `umbra_wasm_community_join(json)` — Input: `{ "community_id", "member_did" }` → `{ success: true }`
- `umbra_wasm_community_leave(json)` — Input: `{ "community_id", "member_did" }` → `{ success: true }`
- `umbra_wasm_community_kick(json)` — Input: `{ "community_id", "target_did", "actor_did" }` → `{ success: true }`
- `umbra_wasm_community_ban(json)` — Input: `{ "community_id", "target_did", "reason"?, "expires_at"?, "device_fingerprint"?, "actor_did" }` → `{ success: true }`
- `umbra_wasm_community_unban(json)` — Input: `{ "community_id", "target_did", "actor_did" }` → `{ success: true }`
- `umbra_wasm_community_member_list(community_id)` → `CommunityMember[]`
- `umbra_wasm_community_member_get(community_id, member_did)` → `CommunityMember`
- `umbra_wasm_community_member_update_profile(json)` — Input: `{ "community_id", "member_did", "nickname"?, "avatar_url"?, "bio"? }` → `{ success: true }`
- `umbra_wasm_community_ban_list(community_id)` → `CommunityBan[]`

#### Roles
- `umbra_wasm_community_role_list(community_id)` → `CommunityRole[]`
- `umbra_wasm_community_member_roles(community_id, member_did)` → `CommunityRole[]`
- `umbra_wasm_community_role_assign(json)` — Input: `{ "community_id", "member_did", "role_id", "actor_did" }` → `{ success: true }`
- `umbra_wasm_community_role_unassign(json)` — Input: `{ "community_id", "member_did", "role_id", "actor_did" }` → `{ success: true }`

#### Invites
- `umbra_wasm_community_invite_create(json)` — Input: `{ "community_id", "creator_did", "max_uses"?, "expires_at"? }` → `CommunityInvite`
- `umbra_wasm_community_invite_use(json)` — Input: `{ "code", "member_did" }` → `{ community_id }`
- `umbra_wasm_community_invite_list(community_id)` → `CommunityInvite[]`
- `umbra_wasm_community_invite_delete(json)` — Input: `{ "invite_id", "actor_did" }` → `{ success: true }`
- `umbra_wasm_community_invite_set_vanity(json)` — Input: `{ "community_id", "vanity_code", "creator_did" }` → `CommunityInvite`

#### Audit Log
- `umbra_wasm_community_audit_log(json)` — Input: `{ "community_id", "limit"?, "offset"? }` → `AuditLogEntry[]`

### Error Codes (800-899)

| Code | Name | Description |
|------|------|-------------|
| 800 | CommunityNotFound | Community does not exist |
| 801 | SpaceNotFound | Space does not exist |
| 802 | ChannelNotFound | Channel does not exist |
| 803 | RoleNotFound | Role does not exist |
| 804 | AlreadyMember | User is already a member |
| 805 | NotMember | User is not a member |
| 806 | InsufficientPermissions | Missing required permission |
| 807 | CannotModifyOwner | Cannot kick/ban the owner |
| 808 | InviteNotFound | Invite code not found |
| 809 | InviteExpired | Invite has expired |
| 810 | InviteMaxUsesReached | Invite max uses exhausted |
| 811 | BannedFromCommunity | User is banned |
| 812 | InvalidCommunityOperation | Invalid operation |

### Events

Subscribe via `umbra_wasm_subscribe_events(callback)`. Events arrive as JSON: `{ "domain": "community", "data": { "type": "...", ... } }`

| Event Type | Data Fields | Description |
|------------|-------------|-------------|
| `communityCreated` | `community_id`, `name` | New community created |
| `communityUpdated` | `community_id` | Community settings changed |
| `communityDeleted` | `community_id` | Community deleted |
| `ownershipTransferred` | `community_id`, `new_owner_did` | Ownership transferred |
| `spaceCreated` | `community_id`, `space_id` | New space created |
| `spaceUpdated` | `space_id` | Space settings changed |
| `spaceDeleted` | `space_id` | Space deleted |
| `channelCreated` | `community_id`, `channel_id` | New channel created |
| `channelUpdated` | `channel_id` | Channel settings changed |
| `channelDeleted` | `channel_id` | Channel deleted |
| `memberJoined` | `community_id`, `member_did` | Member joined (direct or via invite) |
| `memberLeft` | `community_id`, `member_did` | Member left voluntarily |
| `memberKicked` | `community_id`, `target_did` | Member was kicked |
| `memberBanned` | `community_id`, `target_did` | Member was banned |
| `memberUnbanned` | `community_id`, `target_did` | Member was unbanned |
| `roleAssigned` | `community_id`, `member_did`, `role_id` | Role assigned to member |
| `roleUnassigned` | `community_id`, `member_did`, `role_id` | Role removed from member |

_Additional events for P2P sync will be documented as that layer is built._

### UI Components Needed

- Community creation dialog (name, description, optional icon upload)
- Community sidebar (spaces as tabs, channels within each space)
- Channel header (name, topic, settings cog)
- Member list panel (grouped by role, with role colors)
- Role management panel (create/edit roles, assign permissions via checkbox grid)
- Invite management (create link, copy, set expiry/max uses, vanity URL)
- Community settings page (name, description, branding, danger zone for delete/transfer)
- Ban list management
- Audit log viewer (filterable by action type, actor)
- Member profile popup (nickname, avatar, bio, roles)

---

## Phase 2: Messaging & Channels

> Status: **Backend Complete** (WASM bindings complete)

### Data Types

```typescript
interface CommunityMessage {
  id: string;
  channel_id: string;
  sender_did: string;
  content_encrypted_b64?: string; // base64 encoded for E2EE messages
  content_plaintext?: string;     // for non-E2EE messages
  nonce?: string;
  key_version?: number;
  is_e2ee: boolean;
  reply_to_id?: string;
  thread_id?: string;
  has_embed: boolean;
  has_attachment: boolean;
  content_warning?: string;
  edited_at?: number;
  deleted_for_everyone: boolean;
  created_at: number;
}

interface CommunityReaction {
  id: string;
  message_id: string;
  member_did: string;
  emoji: string;
  is_custom: boolean;
  created_at: number;
}

interface ReadReceipt {
  channel_id: string;
  member_did: string;
  last_read_message_id: string;
  read_at: number;
}

interface CommunityPin {
  channel_id: string;
  message_id: string;
  pinned_by: string;
  pinned_at: number;
}

interface ChannelKey {
  channel_id: string;
  key_version: number;
  encrypted_key_b64: string; // base64 encoded
  created_at: number;
}
```

### WASM Functions

#### Messages
- `umbra_wasm_community_message_send(json)` — Input: `{ "channel_id", "sender_did", "content", "reply_to_id"?, "thread_id"?, "content_warning"? }` → `CommunityMessage`
- `umbra_wasm_community_message_send_encrypted(json)` — Input: `{ "channel_id", "sender_did", "content_encrypted_b64", "nonce", "key_version", "reply_to_id"?, "thread_id"? }` → `{ message_id }`
- `umbra_wasm_community_message_list(json)` — Input: `{ "channel_id", "limit"?, "before_timestamp"? }` → `CommunityMessage[]`
- `umbra_wasm_community_message_get(message_id)` → `CommunityMessage`
- `umbra_wasm_community_message_edit(json)` — Input: `{ "message_id", "new_content", "editor_did" }` → `{ success: true }`
- `umbra_wasm_community_message_delete(message_id)` → `{ success: true }`
- `umbra_wasm_community_message_delete_for_me(json)` — Input: `{ "message_id", "member_did" }` → `{ success: true }`

#### Reactions
- `umbra_wasm_community_reaction_add(json)` — Input: `{ "message_id", "member_did", "emoji", "is_custom"? }` → `{ success: true }`
- `umbra_wasm_community_reaction_remove(json)` — Input: `{ "message_id", "member_did", "emoji" }` → `{ success: true }`
- `umbra_wasm_community_reaction_list(message_id)` → `CommunityReaction[]`

#### Read Receipts
- `umbra_wasm_community_mark_read(json)` — Input: `{ "channel_id", "member_did", "last_read_message_id" }` → `{ success: true }`
- `umbra_wasm_community_read_receipts(channel_id)` → `ReadReceipt[]`

#### Pins
- `umbra_wasm_community_pin_message(json)` — Input: `{ "channel_id", "message_id", "pinned_by" }` → `{ success: true }`
- `umbra_wasm_community_unpin_message(json)` — Input: `{ "channel_id", "message_id" }` → `{ success: true }`
- `umbra_wasm_community_pin_list(channel_id)` → `CommunityPin[]`

#### Channel Keys (E2EE)
- `umbra_wasm_community_channel_key_store(json)` — Input: `{ "channel_id", "key_version", "encrypted_key_b64" }` → `{ success: true }`
- `umbra_wasm_community_channel_key_latest(channel_id)` → `ChannelKey | null`

### Events

| Event Type | Data Fields | Description |
|------------|-------------|-------------|
| `communityMessageSent` | `channel_id`, `message_id`, `sender_did`, `is_e2ee?` | Message sent to channel |
| `communityMessageEdited` | `message_id` | Message content was edited |
| `communityMessageDeleted` | `message_id` | Message deleted for everyone |
| `communityReactionAdded` | `message_id`, `emoji`, `member_did` | Reaction added |
| `communityReactionRemoved` | `message_id`, `emoji`, `member_did` | Reaction removed |
| `communityMessagePinned` | `channel_id`, `message_id` | Message pinned |
| `communityMessageUnpinned` | `channel_id`, `message_id` | Message unpinned |

### UI Components Needed

- Message input bar (rich text, emoji picker, file attachment, content warning toggle)
- Message list (infinite scroll, pagination via `before_timestamp`)
- Message bubble (sender avatar, name, timestamp, content, reactions, reply preview)
- Message context menu (edit, delete, delete for me, pin, reply, create thread)
- Reaction picker (standard emoji + custom emoji from community)
- Pinned messages panel (slide-out drawer)
- Read receipt indicators (typing indicator, "seen by" tooltips)
- E2EE channel key exchange UI (key rotation notice)
- Slow mode countdown indicator

---

## Phase 3: Threads & Search

> Status: **Backend Complete** (WASM bindings complete)

### Data Types

```typescript
interface CommunityThread {
  id: string;
  channel_id: string;
  parent_message_id: string;
  name?: string;
  created_by: string;
  message_count: number;
  last_message_at?: number;
  created_at: number;
}
```

### WASM Functions

#### Threads
- `umbra_wasm_community_thread_create(json)` — Input: `{ "channel_id", "parent_message_id", "name"?, "created_by" }` → `CommunityThread`
- `umbra_wasm_community_thread_get(thread_id)` → `CommunityThread`
- `umbra_wasm_community_thread_list(channel_id)` → `CommunityThread[]`
- `umbra_wasm_community_thread_messages(json)` — Input: `{ "thread_id", "limit"?, "before_timestamp"? }` → `CommunityMessage[]`

#### Search
- `umbra_wasm_community_search_channel(json)` — Input: `{ "channel_id", "query", "limit"? }` → `CommunityMessage[]`
- `umbra_wasm_community_search(json)` — Input: `{ "community_id", "query", "limit"? }` → `CommunityMessage[]`

### Events

| Event Type | Data Fields | Description |
|------------|-------------|-------------|
| `communityThreadCreated` | `channel_id`, `thread_id` | New thread created from a message |

### UI Components Needed

- Thread indicator on parent message (reply count badge, "View Thread" button)
- Thread panel (slide-out panel with thread messages and reply input)
- Thread list view (all active threads in a channel)
- Search bar (global search with community/channel scope selector)
- Search results panel (message results with channel context, click to jump)

---

## Phase 4: Advanced Roles & Permissions

> Status: **Backend Complete** (WASM bindings complete)

### Data Types

```typescript
interface ChannelPermissionOverride {
  id: string;
  channel_id: string;
  target_type: 'role' | 'member';
  target_id: string;
  allow_bitfield: string; // decimal string of u64
  deny_bitfield: string;  // decimal string of u64
}
```

### WASM Functions

#### Channel Permission Overrides
- `umbra_wasm_community_channel_override_set(json)` — Input: `{ "channel_id", "target_type", "target_id", "allow_bitfield", "deny_bitfield", "actor_did" }` → `{ success: true }`
- `umbra_wasm_community_channel_override_list(channel_id)` → `ChannelPermissionOverride[]`
- `umbra_wasm_community_channel_override_remove(override_id)` → `{ success: true }`

#### Custom Roles
- `umbra_wasm_community_custom_role_create(json)` — Input: `{ "community_id", "name", "color"?, "position"?, "hoisted"?, "mentionable"?, "permissions_bitfield", "actor_did" }` → `CommunityRole`
- `umbra_wasm_community_role_update(json)` — Input: `{ "role_id", "name"?, "color"?, "hoisted"?, "mentionable"?, "position"?, "actor_did" }` → `{ success: true }`
- `umbra_wasm_community_role_update_permissions(json)` — Input: `{ "role_id", "permissions_bitfield", "actor_did" }` → `{ success: true }`
- `umbra_wasm_community_role_delete(json)` — Input: `{ "role_id", "actor_did" }` → `{ success: true }`

### Events

| Event Type | Data Fields | Description |
|------------|-------------|-------------|
| `communityRoleCreated` | `community_id`, `role_id` | Custom role created |
| `communityRoleUpdated` | `role_id` | Role properties changed |
| `communityRolePermissionsUpdated` | `role_id` | Role permissions changed |
| `communityRoleDeleted` | `role_id` | Role deleted |

### UI Components Needed

- Channel permission editor (per-channel role/member overrides with allow/deny/inherit toggles)
- Custom role creation dialog (name, color, position, permission grid)
- Role hierarchy display (drag-to-reorder, position-based authority)
- Permission calculator (show effective permissions for a user in a channel)

---

## Phase 5: Moderation

> Status: **Backend Complete** (WASM bindings complete)

### Data Types

```typescript
interface CommunityWarning {
  id: string;
  community_id: string;
  member_did: string;
  reason: string;
  warned_by: string;
  expires_at?: number;
  created_at: number;
}

interface KeywordFilter {
  pattern: string;
  action: 'delete' | 'warn' | 'timeout';
}
```

### WASM Functions

#### Warnings
- `umbra_wasm_community_warn_member(json)` — Input: `{ "community_id", "member_did", "reason", "warned_by", "expires_at"? }` → `CommunityWarning`
- `umbra_wasm_community_member_warnings(json)` — Input: `{ "community_id", "member_did" }` → `CommunityWarning[]`
- `umbra_wasm_community_warnings(json)` — Input: `{ "community_id", "limit"?, "offset"? }` → `CommunityWarning[]`
- `umbra_wasm_community_active_warning_count(json)` — Input: `{ "community_id", "member_did" }` → `{ count: number }`
- `umbra_wasm_community_warning_delete(json)` — Input: `{ "warning_id", "actor_did" }` → `{ success: true }`

#### AutoMod
- `umbra_wasm_community_check_escalation(json)` — Input: `{ "community_id", "member_did", "timeout_threshold"?, "ban_threshold"? }` → `{ action: "timeout" | "ban" | null }`
- `umbra_wasm_community_check_keyword_filter(json)` — Input: `{ "content", "filters": KeywordFilter[] }` → `{ action: string | null }`
- `umbra_wasm_community_check_ban_evasion(json)` — Input: `{ "community_id", "device_fingerprint" }` → `{ banned_did: string | null }`

### Events

| Event Type | Data Fields | Description |
|------------|-------------|-------------|
| `communityMemberWarned` | `community_id`, `member_did`, `warning_id` | Member received a warning |

### UI Components Needed

- Warning dialog (issue warning to member with reason and optional expiry)
- Warning history panel (per-member warning list, delete warnings)
- AutoMod settings (keyword filter rules, escalation thresholds)
- Moderation dashboard (recent warnings, active warning counts, ban evasion alerts)
- Member context menu additions (warn, timeout, view warnings)

---

## Phase 6: Voice & Video

> Status: **Deferred** (WebRTC is a TypeScript/frontend concern; no backend WASM functions needed)

### Notes

Voice and video are handled entirely on the frontend via WebRTC. The backend provides:
- Channel type `'voice'` for voice channels
- Permission flags: `VoiceConnect`, `VoiceSpeak`, `VoiceStream`, `VoiceMuteMembers`, `VoiceDeafenMembers`, `VoiceMoveMembers`

### UI Components Needed

- Voice channel panel (connected users list, mute/deafen controls)
- Video grid (participant tiles, screen share)
- Voice connection controls (join/leave, mute, deafen)
- Screen share picker
- Recording indicator + controls

---

## Phase 7: File Management

> Status: **Backend Complete** (WASM bindings complete)

### Data Types

```typescript
interface CommunityFile {
  id: string;
  channel_id: string;
  folder_id?: string;
  filename: string;
  description?: string;
  file_size: number;
  mime_type?: string;
  storage_chunks_json: string; // JSON of chunk references for P2P distribution
  uploaded_by: string;
  version: number;
  download_count: number;
  created_at: number;
}

interface CommunityFileFolder {
  id: string;
  channel_id: string;
  parent_folder_id?: string;
  name: string;
  created_by: string;
  created_at: number;
}
```

### WASM Functions

#### Files
- `umbra_wasm_community_file_upload(json)` — Input: `{ "channel_id", "folder_id"?, "filename", "description"?, "file_size", "mime_type"?, "storage_chunks_json", "uploaded_by" }` → `CommunityFile`
- `umbra_wasm_community_file_list(json)` — Input: `{ "channel_id", "folder_id"?, "limit"?, "offset"? }` → `CommunityFile[]`
- `umbra_wasm_community_file_get(file_id)` → `CommunityFile`
- `umbra_wasm_community_file_download(file_id)` → `{ success: true }` _(increments download counter)_
- `umbra_wasm_community_file_delete(json)` — Input: `{ "file_id", "actor_did" }` → `{ success: true }`

#### Folders
- `umbra_wasm_community_folder_create(json)` — Input: `{ "channel_id", "parent_folder_id"?, "name", "created_by" }` → `CommunityFileFolder`
- `umbra_wasm_community_folder_list(json)` — Input: `{ "channel_id", "parent_folder_id"? }` → `CommunityFileFolder[]`
- `umbra_wasm_community_folder_delete(folder_id)` → `{ success: true }`

### Events

| Event Type | Data Fields | Description |
|------------|-------------|-------------|
| `communityFileUploaded` | `channel_id`, `file_id`, `filename` | New file uploaded |
| `communityFileDeleted` | `file_id` | File deleted |

### UI Components Needed

- File channel view (folder tree + file grid/list toggle)
- File upload dialog (drag-and-drop, progress bar, chunked upload)
- File card (thumbnail preview, filename, size, download count)
- Folder breadcrumb navigation
- File detail panel (description, version history, download button)

---

## Phase 8: Member Experience

> Status: **Backend Complete** (covered by Phase 1 member profile functions)

### Notes

Member experience features are built on top of Phase 1 member functions:
- `umbra_wasm_community_member_update_profile` (nickname, avatar, bio)
- `umbra_wasm_community_member_get` (profile lookup)

### UI Components Needed

- Member profile card (hover/click popup with nickname, avatar, bio, roles, joined date)
- Online status indicator (requires P2P presence — frontend only)
- Member search/filter in member list
- Nickname display in messages (with role color)

---

## Phase 9: Customization & Branding

> Status: **Backend Complete** (WASM bindings complete)

### Data Types

```typescript
interface CommunityEmoji {
  id: string;
  community_id: string;
  name: string;
  image_url: string;
  animated: boolean;
  uploaded_by: string;
  created_at: number;
}

interface CommunitySticker {
  id: string;
  community_id: string;
  pack_id?: string;
  name: string;
  image_url: string;
  animated: boolean;
  uploaded_by: string;
  created_at: number;
}
```

### WASM Functions

#### Branding
- `umbra_wasm_community_update_branding(json)` — Input: `{ "community_id", "icon_url"?, "banner_url"?, "splash_url"?, "accent_color"?, "custom_css"?, "actor_did" }` → `{ success: true }`
- `umbra_wasm_community_set_vanity_url(json)` — Input: `{ "community_id", "vanity_url", "actor_did" }` → `{ success: true }`

#### Custom Emoji
- `umbra_wasm_community_emoji_create(json)` — Input: `{ "community_id", "name", "image_url", "animated"?, "uploaded_by" }` → `CommunityEmoji`
- `umbra_wasm_community_emoji_list(community_id)` → `CommunityEmoji[]`
- `umbra_wasm_community_emoji_delete(json)` — Input: `{ "emoji_id", "actor_did" }` → `{ success: true }`

#### Custom Stickers
- `umbra_wasm_community_sticker_create(json)` — Input: `{ "community_id", "pack_id"?, "name", "image_url", "animated"?, "uploaded_by" }` → `CommunitySticker`
- `umbra_wasm_community_sticker_list(community_id)` → `CommunitySticker[]`
- `umbra_wasm_community_sticker_delete(sticker_id)` → `{ success: true }`

### Events

| Event Type | Data Fields | Description |
|------------|-------------|-------------|
| `communityBrandingUpdated` | `community_id` | Branding settings changed |
| `communityEmojiCreated` | `community_id`, `emoji_id` | Custom emoji added |

### UI Components Needed

- Branding settings page (icon upload, banner upload, splash image, accent color picker, custom CSS editor)
- Vanity URL settings (input with availability check)
- Emoji management panel (upload, preview, delete)
- Sticker management panel (upload, organize into packs)
- Emoji picker integration (standard + community custom emoji)
- Sticker picker (sticker packs grid)
- Theme preview (live preview of accent color + custom CSS)

---

## Phase 10: Integrations (Webhooks)

> Status: **Backend Complete** (WASM bindings complete)

### Data Types

```typescript
interface CommunityWebhook {
  id: string;
  channel_id: string;
  name: string;
  avatar_url?: string;
  token: string;
  creator_did: string;
  created_at: number;
}
```

### WASM Functions

#### Webhooks
- `umbra_wasm_community_webhook_create(json)` — Input: `{ "channel_id", "name", "avatar_url"?, "creator_did" }` → `CommunityWebhook`
- `umbra_wasm_community_webhook_list(channel_id)` → `CommunityWebhook[]`
- `umbra_wasm_community_webhook_get(webhook_id)` → `CommunityWebhook`
- `umbra_wasm_community_webhook_update(json)` — Input: `{ "webhook_id", "name"?, "avatar_url"? }` → `{ success: true }`
- `umbra_wasm_community_webhook_delete(json)` — Input: `{ "webhook_id", "actor_did" }` → `{ success: true }`

### Events

| Event Type | Data Fields | Description |
|------------|-------------|-------------|
| `communityWebhookCreated` | `channel_id`, `webhook_id` | Webhook created |
| `communityWebhookDeleted` | `webhook_id` | Webhook deleted |

### UI Components Needed

- Webhook management panel (list webhooks per channel)
- Webhook creation dialog (name, avatar, target channel)
- Webhook detail page (token display with copy, edit name/avatar)
- Webhook message preview (show messages posted by webhooks with webhook avatar)

---

## Phase 11: Boost Nodes & Federation

> Status: **Backend Complete** (WASM bindings complete)

### Data Types

```typescript
interface BoostNode {
  id: string;
  owner_did: string;
  node_type: 'local' | 'remote';
  node_public_key: string;
  name: string;
  enabled: boolean;
  max_storage_bytes: number;
  max_bandwidth_mbps: number;
  auto_start: boolean;
  prioritized_communities?: string;
  pairing_token?: string;
  remote_address?: string;
  last_seen_at?: number;
  created_at: number;
  updated_at: number;
}
```

### WASM Functions

#### Boost Nodes
- `umbra_wasm_community_boost_node_register(json)` — Input: `{ "owner_did", "node_type", "node_public_key", "name", "max_storage_bytes", "max_bandwidth_mbps", "auto_start"?, "prioritized_communities"?, "pairing_token"?, "remote_address"? }` → `BoostNode`
- `umbra_wasm_community_boost_node_list(owner_did)` → `BoostNode[]`
- `umbra_wasm_community_boost_node_get(node_id)` → `BoostNode`
- `umbra_wasm_community_boost_node_update(json)` — Input: `{ "node_id", "name"?, "enabled"?, "max_storage_bytes"?, "max_bandwidth_mbps"?, "auto_start"?, "prioritized_communities"? }` → `{ success: true }`
- `umbra_wasm_community_boost_node_heartbeat(node_id)` → `{ success: true }`
- `umbra_wasm_community_boost_node_delete(node_id)` → `{ success: true }`

### Events

| Event Type | Data Fields | Description |
|------------|-------------|-------------|
| `boostNodeRegistered` | `node_id`, `owner_did` | Boost node registered |
| `boostNodeUpdated` | `node_id` | Boost node config updated |
| `boostNodeDeleted` | `node_id` | Boost node removed |

### UI Components Needed

- Boost node dashboard (list user's nodes, status indicators)
- Node registration wizard (local vs remote, key generation, storage/bandwidth limits)
- Node detail panel (config editor, enable/disable toggle, last seen, heartbeat status)
- Node pairing flow (QR code or token for remote nodes)
- Community boost status (show which communities are prioritized)
- Storage usage visualization (bar chart of used vs available per node)

---

## WASM Function Summary

Total community WASM functions: **~95+** across all phases.

| Category | Count | Phase |
|----------|-------|-------|
| Community CRUD | 6 | 1 |
| Spaces | 5 | 1 |
| Channels | 9 | 1 |
| Members | 9 | 1 |
| Roles (basic) | 4 | 1 |
| Invites | 5 | 1 |
| Audit Log | 1 | 1 |
| Messages | 7 | 2 |
| Reactions | 3 | 2 |
| Read Receipts | 2 | 2 |
| Pins | 3 | 2 |
| Channel Keys | 2 | 2 |
| Threads | 4 | 3 |
| Search | 2 | 3 |
| Channel Overrides | 3 | 4 |
| Custom Roles | 4 | 4 |
| Warnings | 5 | 5 |
| AutoMod | 3 | 5 |
| Files | 5 | 7 |
| Folders | 3 | 7 |
| Branding | 2 | 9 |
| Emoji | 3 | 9 |
| Stickers | 3 | 9 |
| Webhooks | 5 | 10 |
| Boost Nodes | 6 | 11 |

---

## Event Summary

All events arrive via `umbra_wasm_subscribe_events(callback)` as JSON: `{ "domain": "community", "data": { "type": "...", ... } }`

Total community event types: **~35+**

Events are emitted from WASM→JS for local state changes. P2P-synced events (when other peers perform actions) will use the same event types but will arrive via the libp2p network layer.

---

## Gap Fill: Additional Features (Schema v7)

> Status: **Backend Complete** — Schema v7 adds 4 new tables, ~20 new service methods, ~18 new WASM functions

### New Data Types

```typescript
// Timeout record (mute/restrict a member temporarily)
interface CommunityTimeout {
  id: string;
  community_id: string;
  member_did: string;
  reason?: string;
  timeout_type: 'mute' | 'restrict';
  issued_by: string;
  expires_at: number;
  created_at: number;
}

// Thread follower record
interface ThreadFollower {
  thread_id: string;
  member_did: string;
  followed_at: number;
}

// Custom member status
interface MemberStatus {
  community_id: string;
  member_did: string;
  status_text?: string;
  status_emoji?: string;
  expires_at?: number;
  updated_at: number;
}

// Notification settings (per-community, per-space, or per-channel)
interface NotificationSetting {
  id: string;
  community_id: string;
  member_did: string;
  target_type: 'community' | 'space' | 'channel';
  target_id: string;
  mute_until?: number;
  suppress_everyone: boolean;
  suppress_roles: boolean;
  level: 'all' | 'mentions' | 'none';
  updated_at: number;
}

// Mention types returned by parse_mentions
type MentionType =
  | { type: 'everyone' }
  | { type: 'here' }
  | { type: 'role'; id: string }
  | { type: 'user'; did: string };
```

### Timeouts WASM Functions

| Function | Params | Returns | Notes |
|----------|--------|---------|-------|
| `umbra_wasm_community_timeout_member(json)` | `{community_id, member_did, reason?, timeout_type, duration_seconds, issued_by}` | `CommunityTimeout` JSON | Emits `memberTimedOut` |
| `umbra_wasm_community_remove_timeout(timeout_id, actor_did)` | string, string | `{success:true}` | Emits `timeoutRemoved` |
| `umbra_wasm_community_get_active_timeouts(community_id, member_did)` | string, string | `CommunityTimeout[]` JSON | Active (non-expired) only |
| `umbra_wasm_community_get_timeouts(community_id)` | string | `CommunityTimeout[]` JSON | All timeouts (active + expired) |
| `umbra_wasm_community_is_member_muted(community_id, member_did)` | string, string | `{muted: boolean}` | Quick check |

### Thread Follow/Unfollow WASM Functions

| Function | Params | Returns | Notes |
|----------|--------|---------|-------|
| `umbra_wasm_community_follow_thread(thread_id, member_did)` | string, string | `{success:true}` | Emits `threadFollowed` |
| `umbra_wasm_community_unfollow_thread(thread_id, member_did)` | string, string | `{success:true}` | Emits `threadUnfollowed` |
| `umbra_wasm_community_get_thread_followers(thread_id)` | string | `ThreadFollower[]` JSON | |
| `umbra_wasm_community_is_following_thread(thread_id, member_did)` | string, string | `{following: boolean}` | |

### Advanced Search WASM Function

| Function | Params | Returns | Notes |
|----------|--------|---------|-------|
| `umbra_wasm_community_search_advanced(json)` | `{community_id, query?, from_did?, channel_id?, before?, after?, has_file?, has_reaction?, is_pinned?, limit?}` | `CommunityMessage[]` JSON | Supports from:, in:, before:, after:, has:file, has:reaction, is:pinned |

### Member Status WASM Functions

| Function | Params | Returns | Notes |
|----------|--------|---------|-------|
| `umbra_wasm_community_set_member_status(json)` | `{community_id, member_did, status_text?, status_emoji?, expires_at?}` | `MemberStatus` JSON | Emits `memberStatusChanged` |
| `umbra_wasm_community_get_member_status(community_id, member_did)` | string, string | `MemberStatus` JSON or `null` | |
| `umbra_wasm_community_clear_member_status(community_id, member_did)` | string, string | `{success:true}` | Emits `memberStatusCleared` |

### Notification Settings WASM Functions

| Function | Params | Returns | Notes |
|----------|--------|---------|-------|
| `umbra_wasm_community_set_notification_settings(json)` | `{community_id, member_did, target_type, target_id, mute_until?, suppress_everyone?, suppress_roles?, level?}` | `NotificationSetting` JSON | Upserts |
| `umbra_wasm_community_get_notification_settings(community_id, member_did)` | string, string | `NotificationSetting[]` JSON | |
| `umbra_wasm_community_delete_notification_setting(setting_id)` | string | `{success:true}` | |

### Mention Parsing & System Messages WASM Functions

| Function | Params | Returns | Notes |
|----------|--------|---------|-------|
| `umbra_wasm_community_parse_mentions(content)` | string | `MentionType[]` JSON | Parses @everyone, @here, @role:ID, @user:DID |
| `umbra_wasm_community_send_system_message(channel_id, content)` | string, string | `CommunityMessage` JSON | Emits `systemMessage`. sender_did = "system" |

### Channel Type Enforcement (Automatic)

These restrictions are enforced automatically in `send_message`:

| Channel Type | Restriction | Error |
|-------------|-------------|-------|
| `voice` | Cannot send text messages | `ChannelTypeRestriction` (814) |
| `announcement` | Only admins/mods can post (checks permission bits 0 and 4) | `ChannelTypeRestriction` (814) |
| All channels | Muted members cannot send messages | `MemberTimedOut` (813) |

### Welcome Channel (Automatic)

When a member joins via `join_community`, if a channel with type `welcome` exists, a system message is automatically sent: `"Welcome to the community, {member_did}!"`. No frontend action needed — the `systemMessage` event will fire.

### New Events

| Event Type | Data Fields | Trigger |
|-----------|-------------|---------|
| `memberTimedOut` | `community_id`, `member_did`, `timeout_type`, `expires_at` | Member timed out |
| `timeoutRemoved` | `timeout_id` | Timeout removed early |
| `threadFollowed` | `thread_id`, `member_did` | Thread followed |
| `threadUnfollowed` | `thread_id`, `member_did` | Thread unfollowed |
| `memberStatusChanged` | `community_id`, `member_did` | Status set |
| `memberStatusCleared` | `community_id`, `member_did` | Status cleared |
| `systemMessage` | `channel_id`, `message_id` | System message sent |

### New Error Codes

| Code | Variant | Description |
|------|---------|-------------|
| 813 | `MemberTimedOut` | Member is currently muted/timed out |
| 814 | `ChannelTypeRestriction` | Channel type doesn't allow this action |

### UI Components Needed

- **TimeoutDialog**: Form to timeout a member (duration picker, reason, type selector)
- **ActiveTimeoutsBadge**: Show timeout status on member profiles
- **ThreadFollowButton**: Toggle follow/unfollow on thread headers
- **AdvancedSearchPanel**: Filters panel with from:, in:, before:, after:, has:, is: fields
- **MemberStatusPicker**: Set custom status text + emoji with optional expiry
- **MemberStatusDisplay**: Show status next to member name in member list
- **NotificationSettingsPanel**: Per-community/space/channel notification controls (mute, suppress @everyone/@roles, level selector)
- **MentionAutocomplete**: Dropdown when typing @ in message input (show @everyone, @here, roles, members)
- **SystemMessageRenderer**: Distinct styling for system messages (sender_did = "system")
