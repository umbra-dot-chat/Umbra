# Discord Community Import Plan

Import Discord server structure (channels, roles, categories) into Umbra when creating a new community.

## Overview

This feature allows users to authenticate with Discord, select a server they manage, and create an Umbra community with matching structure. Only structure is imported (no messages or members).

## Architecture

```
User clicks "Import from Discord"
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. OAuth popup requests `guilds` scope from Discord                │
│  2. Relay fetches user's servers, filters to manageable ones        │
│  3. User selects server in popup                                    │
│  4. Relay fetches channels/roles for selected server                │
│  5. Structure returned via postMessage to main app                  │
│  6. Main app creates Umbra community using the structure            │
└─────────────────────────────────────────────────────────────────────┘
```

## Discord API Requirements

| Endpoint | Purpose | Requirement |
|----------|---------|-------------|
| `GET /users/@me/guilds` | List user's servers | `guilds` scope |
| `GET /guilds/{id}` | Get server details | User needs `MANAGE_GUILD` permission |
| `GET /guilds/{id}/channels` | Get all channels | User needs `MANAGE_GUILD` permission |
| `GET /guilds/{id}/roles` | Get all roles | User needs `MANAGE_GUILD` permission |

**Limitation**: Users can only import servers where they have admin/manage permissions.

## Data Mapping

### Channel Types

| Discord Type | ID | Umbra Type |
|--------------|----|----|
| GUILD_TEXT | 0 | `text` |
| GUILD_VOICE | 2 | `voice` |
| GUILD_CATEGORY | 4 | Category (organizational, not a channel) |
| GUILD_NEWS | 5 | `announcement` |
| GUILD_FORUM | 15 | `forum` |
| GUILD_STAGE_VOICE | 13 | `voice` |

### Structure Mapping

| Discord | Umbra |
|---------|-------|
| Server/Guild | Community |
| Category | Category (within default Space) |
| Text Channel | Channel (type: text) |
| Voice Channel | Channel (type: voice) |
| Announcement Channel | Channel (type: announcement) |
| Role | Custom Role |
| @everyone | Member preset role |

### Permission Translation

Discord uses a different permission bitfield. Key mappings:

| Discord Permission | Discord Bit | Umbra Permission | Umbra Bit |
|-------------------|-------------|------------------|-----------|
| VIEW_CHANNEL | 1 << 10 | ViewChannels | 1 << 0 |
| MANAGE_CHANNELS | 1 << 4 | ManageChannels | 1 << 2 |
| MANAGE_ROLES | 1 << 28 | ManageRoles | 1 << 3 |
| KICK_MEMBERS | 1 << 1 | KickMembers | 1 << 6 |
| BAN_MEMBERS | 1 << 2 | BanMembers | 1 << 7 |
| SEND_MESSAGES | 1 << 11 | SendMessages | 1 << 11 |
| MANAGE_MESSAGES | 1 << 13 | ManageMessages | 1 << 17 |
| READ_MESSAGE_HISTORY | 1 << 16 | ReadMessageHistory | 1 << 18 |
| CONNECT | 1 << 20 | VoiceConnect | 1 << 22 |
| SPEAK | 1 << 21 | VoiceSpeak | 1 << 23 |
| MUTE_MEMBERS | 1 << 22 | VoiceMuteMembers | 1 << 25 |
| ADMINISTRATOR | 1 << 3 | Administrator | 1 << 63 |

## Implementation

### Phase 1: Backend OAuth Extension

**Files to modify:**

1. `packages/umbra-relay/src/discovery/config.rs`
   - Add `DISCORD_COMMUNITY_IMPORT_SCOPES = ["identify", "guilds"]`
   - Add `discord_community_import_redirect_uri` config field

2. `packages/umbra-relay/src/discovery/types.rs`
   - Add `community_import: bool` flag to `OAuthState`

3. **Create** `packages/umbra-relay/src/discovery/oauth/community_import.rs`
   ```rust
   // Discord guild/channel/role types
   struct DiscordGuild { id, name, icon, owner, permissions }
   struct DiscordChannel { id, name, type, position, parent_id, topic }
   struct DiscordRole { id, name, color, hoist, position, permissions }

   // Endpoints
   POST /community/import/discord/start     // Start OAuth flow
   GET  /community/import/discord/callback  // OAuth callback
   GET  /community/import/discord/guilds    // List manageable servers
   GET  /community/import/discord/guild/:id/structure  // Get full structure
   ```

4. `packages/umbra-relay/src/discovery/mod.rs`
   - Register new routes

### Phase 2: Permission Translation

**Create** `packages/umbra-service/src/import/discord-permissions.ts`

```typescript
// Complete Discord → Umbra permission mapping
const DISCORD_TO_UMBRA: Array<[bigint, number]> = [
  [1n << 10n, 0],   // VIEW_CHANNEL → ViewChannels
  [1n << 4n, 2],    // MANAGE_CHANNELS → ManageChannels
  [1n << 28n, 3],   // MANAGE_ROLES → ManageRoles
  [1n << 1n, 6],    // KICK_MEMBERS → KickMembers
  [1n << 2n, 7],    // BAN_MEMBERS → BanMembers
  [1n << 8n, 8],    // MODERATE_MEMBERS → TimeoutMembers
  [1n << 11n, 11],  // SEND_MESSAGES → SendMessages
  [1n << 14n, 12],  // EMBED_LINKS → EmbedLinks
  [1n << 15n, 13],  // ATTACH_FILES → AttachFiles
  [1n << 6n, 14],   // ADD_REACTIONS → AddReactions
  [1n << 18n, 15],  // USE_EXTERNAL_EMOJIS → UseExternalEmoji
  [1n << 17n, 16],  // MENTION_EVERYONE → MentionEveryone
  [1n << 13n, 17],  // MANAGE_MESSAGES → ManageMessages
  [1n << 16n, 18],  // READ_MESSAGE_HISTORY → ReadMessageHistory
  [1n << 20n, 22],  // CONNECT → VoiceConnect
  [1n << 21n, 23],  // SPEAK → VoiceSpeak
  [1n << 9n, 24],   // STREAM → VoiceStream
  [1n << 22n, 25],  // MUTE_MEMBERS → VoiceMuteMembers
  [1n << 23n, 26],  // DEAFEN_MEMBERS → VoiceDeafenMembers
  [1n << 24n, 27],  // MOVE_MEMBERS → VoiceMoveMembers
  [1n << 3n, 63],   // ADMINISTRATOR → Administrator
];

export function translateDiscordPermissions(discordBits: string): string {
  const discord = BigInt(discordBits);
  let umbra = 0n;
  for (const [discordBit, umbraBit] of DISCORD_TO_UMBRA) {
    if ((discord & discordBit) !== 0n) {
      umbra |= 1n << BigInt(umbraBit);
    }
  }
  return umbra.toString();
}
```

### Phase 3: TypeScript Types

**Create** `packages/umbra-service/src/import/discord-community.ts`

```typescript
export interface DiscordGuildInfo {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  canImport: boolean;  // true if user has MANAGE_GUILD
}

export interface DiscordImportedChannel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement' | 'forum';
  topic: string | null;
  position: number;
}

export interface DiscordImportedCategory {
  id: string;
  name: string;
  position: number;
  channels: DiscordImportedChannel[];
}

export interface DiscordImportedRole {
  id: string;
  name: string;
  color: string;  // Hex color
  position: number;
  permissions: string;  // Translated Umbra bitfield
  hoisted: boolean;
  mentionable: boolean;
  isEveryone: boolean;
}

export interface DiscordImportedStructure {
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  categories: DiscordImportedCategory[];
  uncategorizedChannels: DiscordImportedChannel[];
  roles: DiscordImportedRole[];
}
```

### Phase 4: Frontend Components

**Create** `components/community/DiscordImportDialog.tsx`

Main dialog component that manages the import flow:
- Step 1: "Connect to Discord" button → opens OAuth popup
- Step 2: Server selection list (filtered to manageable servers)
- Step 3: Preview panel showing channels/roles to import
- Step 4: Name/description input + "Import" button

**Create** `components/community/DiscordServerSelector.tsx`

Grid/list of servers the user can import:
- Server icon, name
- "Owner" or "Admin" badge
- Click to select

**Create** `components/community/ImportPreviewPanel.tsx`

Two-column preview:
- Left: Channel tree (categories → channels)
- Right: Role list with color indicators

**Create** `hooks/useDiscordCommunityImport.ts`

```typescript
type ImportState =
  | { status: 'idle' }
  | { status: 'authorizing' }
  | { status: 'selectingServer'; guilds: DiscordGuildInfo[] }
  | { status: 'loadingStructure'; guildId: string }
  | { status: 'previewing'; structure: DiscordImportedStructure }
  | { status: 'importing' }
  | { status: 'complete'; communityId: string }
  | { status: 'error'; message: string };

export function useDiscordCommunityImport() {
  const [state, setState] = useState<ImportState>({ status: 'idle' });

  const startAuth = () => { /* Open OAuth popup */ };
  const selectGuild = (guildId: string) => { /* Fetch structure */ };
  const executeImport = (name: string, description?: string) => { /* Create community */ };

  return { state, startAuth, selectGuild, executeImport };
}
```

### Phase 5: Community Creation Integration

**Modify** `packages/umbra-service/src/community.ts`

Add method to create community from imported structure:

```typescript
async createCommunityFromDiscordImport(
  structure: DiscordImportedStructure,
  ownerDid: string,
  name: string,
  description?: string
): Promise<CommunityCreateResult> {
  // 1. Create base community (generates default space, roles)
  const result = await this.createCommunity(name, ownerDid, description);

  // 2. Create categories from Discord categories
  for (const category of structure.categories) {
    const catId = await this.createCategory(
      result.communityId,
      result.spaceId,
      category.name,
      category.position
    );

    // 3. Create channels within category
    for (const channel of category.channels) {
      await this.createChannel(
        result.communityId,
        result.spaceId,
        channel.name,
        channel.type,
        ownerDid,
        channel.topic,
        channel.position,
        catId
      );
    }
  }

  // 4. Create uncategorized channels
  for (const channel of structure.uncategorizedChannels) {
    await this.createChannel(...);
  }

  // 5. Create custom roles (skip @everyone, map to Member)
  for (const role of structure.roles) {
    if (role.isEveryone) continue;

    await this.createCustomRole(
      result.communityId,
      role.name,
      ownerDid,
      role.color,
      role.position,
      role.hoisted,
      role.mentionable,
      role.permissions
    );
  }

  return result;
}
```

## UI Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Create Community                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌───────────────────────┐    ┌───────────────────────┐               │
│   │                       │    │                       │               │
│   │     [+] Icon          │    │    [Discord Logo]     │               │
│   │                       │    │                       │               │
│   │   Start Fresh         │    │   Import from         │               │
│   │                       │    │   Discord             │               │
│   │   Create a new        │    │                       │               │
│   │   community from      │    │   Import structure    │               │
│   │   scratch             │    │   from a Discord      │               │
│   │                       │    │   server              │               │
│   └───────────────────────┘    └───────────────────────┘               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

                              ↓ Click "Import from Discord"

┌─────────────────────────────────────────────────────────────────────────┐
│  Select a Server                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   You can import servers where you have admin access.                   │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  [icon]  My Gaming Server                            [Owner]    │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  [icon]  Dev Community                               [Admin]    │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  [icon]  Friend's Server                       (no permission) │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   [Cancel]                                                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

                              ↓ Select server

┌─────────────────────────────────────────────────────────────────────────┐
│  Preview Import: My Gaming Server                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Channels (12)                    │   Roles (6)                        │
│   ─────────────────────────────────│───────────────────────────────────│
│   ▼ Announcements                  │   ● Admin         #e67e22         │
│     # rules                        │   ● Moderator     #2ecc71         │
│     # announcements                │   ● VIP           #9b59b6         │
│   ▼ General                        │   ● Booster       #f1c40f         │
│     # general                      │   ● Member        #95a5a6         │
│     # off-topic                    │                                    │
│     🔊 Voice Chat                  │                                    │
│   ▼ Gaming                         │                                    │
│     # looking-for-group            │                                    │
│     🔊 Gaming Voice 1              │                                    │
│     🔊 Gaming Voice 2              │                                    │
│                                                                         │
│   ────────────────────────────────────────────────────────────────────  │
│                                                                         │
│   Community Name:  [My Gaming Server                               ]   │
│   Description:     [                                               ]   │
│                                                                         │
│   [Cancel]                                      [Import Community]     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Error Handling

| Error | User Message |
|-------|--------------|
| OAuth denied | "Authorization cancelled. Try again when ready." |
| OAuth expired | "Session expired. Please try again." |
| 403 on guild fetch | Server hidden from selection (insufficient permissions) |
| 429 rate limit | "Discord is rate limiting requests. Please wait a moment." |
| Network timeout | "Connection timed out. Check your internet and retry." |

## Privacy Considerations

1. **Structure only** - No messages are imported
2. **No member data** - Members must join via invite
3. **No webhook import** - Security-sensitive
4. **User consent** - OAuth explicitly authorized by user
5. **Permission best-effort** - Some Discord permissions don't map to Umbra

## File Summary

### New Files

| File | Purpose |
|------|---------|
| `packages/umbra-relay/src/discovery/oauth/community_import.rs` | OAuth endpoints and Discord API calls |
| `packages/umbra-service/src/import/discord-community.ts` | TypeScript types and import logic |
| `packages/umbra-service/src/import/discord-permissions.ts` | Permission translation |
| `components/community/DiscordImportDialog.tsx` | Main import dialog |
| `components/community/DiscordServerSelector.tsx` | Server selection grid |
| `components/community/ImportPreviewPanel.tsx` | Preview before import |
| `hooks/useDiscordCommunityImport.ts` | Import state management |

### Modified Files

| File | Changes |
|------|---------|
| `packages/umbra-relay/src/discovery/config.rs` | Add community import scopes/config |
| `packages/umbra-relay/src/discovery/types.rs` | Add `community_import` flag |
| `packages/umbra-relay/src/discovery/mod.rs` | Register new routes |
| `packages/umbra-service/src/community.ts` | Add `createCommunityFromDiscordImport` |
| `packages/umbra-service/src/import/index.ts` | Export new types |

## Verification

1. **OAuth Flow**
   - Start import → Discord popup opens
   - Authorize → popup closes, servers load
   - Select server → structure preview appears

2. **Structure Import**
   - Categories appear in correct order
   - Channels nested under correct categories
   - Channel types match Discord types
   - Roles created with translated permissions

3. **Edge Cases**
   - Empty categories handled
   - 100+ channels imported
   - Special characters in names sanitized
   - Duplicate role names get suffix

4. **Error Recovery**
   - Cancel OAuth → returns to dialog
   - Rate limit → retry message shown
   - Network error → retry button available
