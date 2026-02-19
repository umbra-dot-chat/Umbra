# Platform Migration Plan for Umbra

**Status:** Planning Phase
**Last Updated:** February 2026
**Priority:** Discord (Primary), Slack, Telegram (Secondary)

---

## Executive Summary

This document outlines the strategy for enabling users to migrate their data from existing messaging platforms to Umbra. The goal is to make switching to Umbra as frictionless as possible by automatically importing:

1. **Profile Information** — Username, avatar, bio, status
2. **Community Structure** — Servers/workspaces, channels, roles, permissions
3. **Message History** — Conversations, threads, reactions
4. **Files & Media** — Shared files, images, attachments
5. **Social Graph** — Friends, contacts, connections

---

## Part 1: Data Sources & Access Methods

### 1.1 Discord Migration

Discord offers multiple data access paths:

#### A. GDPR Data Package (User-Initiated)

Users can request their complete data package through Discord Settings > Privacy & Safety > Request Data.

**What's Included:**
- `account/` — User ID, username, email, phone, avatar, settings
- `messages/` — All sent messages organized by channel/DM
  - `c{channel_id}/` folders containing `messages.json`
  - Each message: `id`, `timestamp`, `content`, `attachments[]`
- `servers/` — List of servers with roles and join dates
- `activity/` — Analytics, reporting, usage patterns
- `relationships/` — Friends list, blocked users, friend requests

**Data Format:** ZIP containing JSON files

**Limitations:**
- Takes up to 30 days to receive
- Must have verified email
- Cannot request while account disabled
- Only YOUR messages, not full channel history

**Sources:** [Discord Data Package](https://support.discord.com/hc/en-us/articles/360004957991-Your-Discord-Data-Package), [Data Package Tool](https://github.com/aamiaa/Data-Package-Tool)

#### B. Discord OAuth2 API (Live Access)

Real-time access to user data via OAuth2 authorization.

**Available Scopes:**

| Scope | Data Access | User Consent Required |
|-------|-------------|----------------------|
| `identify` | User ID, username, avatar, banner | Yes |
| `email` | User's email address | Yes |
| `guilds` | List of servers user is in (partial objects) | Yes |
| `guilds.members.read` | User's roles in specific guilds | Yes |
| `connections` | Linked accounts (Twitch, YouTube, etc.) | Yes |
| `relationships.read` | Friends list (requires Discord approval) | Yes, Special |

**Endpoints:**
```
GET /users/@me                    → Profile info
GET /users/@me/guilds             → Server list
GET /users/@me/guilds/{id}/member → Member info for specific guild
GET /users/@me/connections        → Linked accounts
```

**Sources:** [Discord OAuth2 Docs](https://discord.com/developers/docs/topics/oauth2)

#### C. Bot API (Community Migration)

For migrating entire communities, a bot with appropriate permissions can access:

**Available Data:**
- Guild structure (channels, categories, roles)
- Member list with roles
- Message history (with `Read Message History` permission)
- Files/attachments (via CDN URLs)
- Emoji, stickers, server settings

**Required Bot Permissions:**
```
VIEW_CHANNELS
READ_MESSAGE_HISTORY
MANAGE_GUILD (for full settings export)
MANAGE_ROLES (for role structure)
```

**Rate Limits:**
- 50 requests/second global
- Channel message history: 100 messages per request
- Must paginate for full history

---

### 1.2 Slack Migration

#### A. Workspace Export (Admin)

Workspace owners can export via Slack Admin > Settings > Import/Export Data.

**Free/Pro Plans:**
- Public channel messages only
- File links (not files themselves)

**Business+/Enterprise:**
- All channels including private
- DMs and group messages
- Full file access via Discovery API

**Format:** ZIP containing JSON files organized by channel

**Sources:** [Slack Export Guide](https://slack.com/help/articles/201658943-Export-your-workspace-data), [Import/Export Tools](https://slack.com/help/articles/204897248-Guide-to-Slack-import-and-export-tools)

#### B. Slack OAuth2 API

**Scopes for Migration:**
```
users:read           → User profiles
users:read.email     → Email addresses
channels:read        → Channel list
channels:history     → Message history
files:read           → File access
team:read            → Workspace info
```

#### C. Slackdump (Third-Party)

Open-source tool for comprehensive export without admin privileges.

**Source:** [Slackdump GitHub](https://github.com/rusq/slackdump)

---

### 1.3 Telegram Migration

#### A. Desktop App Export

Telegram Desktop > Settings > Export Telegram Data

**Exportable Data:**
- Account information
- Contact list (vCard format)
- Personal chats
- Group chats
- Channels
- Media files (photos, videos, voice messages)

**Formats:** JSON or HTML

**Limitations:**
- Desktop app only (not mobile)
- No API endpoint for export

**Sources:** [Telegram Export](https://telegram.org/blog/export-and-more), [Privacy International Guide](https://privacyinternational.org/guide-step/4770/guide-getting-your-data-telegram)

#### B. Telegram Bot API

For group/channel migration:
- Message history access
- Media file access
- Member lists (with admin rights)

---

## Part 2: Migration Features Roadmap

### Phase 1: Profile Import (MVP)

**Target Platforms:** Discord, Slack, Telegram

**Features:**
- [ ] Import avatar/profile picture
- [ ] Import username/display name
- [ ] Import bio/about text
- [ ] Import linked accounts metadata

**Implementation:**
```typescript
// Profile import flow
interface ImportedProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  avatarBase64?: string;
  bio?: string;
  sourceplatform: 'discord' | 'slack' | 'telegram';
  sourceUserId: string;
  importedAt: Date;
}
```

### Phase 2: Friends/Contacts Import

**Challenge:** Most platforms don't expose friends list via public API.

**Strategies:**

#### A. GDPR Package Parse (Discord)
```json
// relationships/friends.json structure
{
  "friends": [
    {
      "id": "123456789",
      "username": "friend_name",
      "discriminator": "1234",
      "avatar": "hash"
    }
  ]
}
```

#### B. Invite Link Generation
- Generate unique Umbra invite links
- User shares with friends manually
- Track who accepts via referral system

#### C. Social Graph Matching (Privacy-Preserving)
- Hash friend usernames client-side
- Compare hashes to find existing Umbra users
- Never expose actual friend lists to server

### Phase 3: Community Structure Import

**Focus:** Discord Server → Umbra Community

**Mapping:**
```
Discord                    →    Umbra
─────────────────────────────────────────
Server                     →    Community
Category                   →    Space
Text Channel               →    Text Channel
Voice Channel              →    Voice Channel
Forum Channel              →    Forum Channel (future)
Role                       →    Role
Permission Overrides       →    Permission Overrides
```

**Implementation Requirements:**
1. Parse Discord server structure from:
   - GDPR data package (limited)
   - Bot API export (comprehensive)
   - User's guild list via OAuth

2. Create matching Umbra community:
   - Generate community ID
   - Create spaces from categories
   - Create channels with settings
   - Map roles and permissions

### Phase 4: Message History Import

**Data Flow:**
```
Source Messages (JSON)
        ↓
    Parse & Validate
        ↓
    Convert to Umbra Format
        ↓
    Encrypt with Community Key
        ↓
    Store in Local Database
        ↓
    Sync State to Members
```

**Message Mapping:**
```typescript
interface DiscordMessage {
  id: string;
  timestamp: string;
  content: string;
  author: { id: string; username: string };
  attachments: Array<{ url: string; filename: string }>;
  reactions: Array<{ emoji: string; count: number }>;
}

interface UmbraMessage {
  id: string;
  conversationId: string;
  senderDid: string;
  content: string;
  timestamp: number;
  attachments: AttachmentRef[];
  reactions: Reaction[];
  imported: {
    source: 'discord';
    originalId: string;
    originalAuthor: string;
  };
}
```

### Phase 5: File History Import

**Approach:**
1. Parse attachment URLs from messages
2. Download files (respecting rate limits)
3. Chunk and encrypt for Umbra storage
4. Update message references

**Considerations:**
- Discord CDN URLs expire
- Large files need chunked download
- Storage quota management

---

## Part 3: Technical Architecture

### 3.1 Import Service Structure

```
packages/umbra-service/src/
├── migrations/
│   ├── index.ts                 # Export all migration modules
│   ├── types.ts                 # Shared migration types
│   ├── discord/
│   │   ├── oauth.ts             # Discord OAuth2 flow
│   │   ├── profile-import.ts    # Profile data import
│   │   ├── gdpr-parser.ts       # Parse GDPR data package
│   │   ├── community-import.ts  # Server → Community mapping
│   │   └── message-import.ts    # Message history import
│   ├── slack/
│   │   ├── oauth.ts
│   │   ├── profile-import.ts
│   │   ├── workspace-parser.ts
│   │   └── message-import.ts
│   └── telegram/
│       ├── export-parser.ts     # Parse Telegram export
│       └── chat-import.ts
```

### 3.2 OAuth2 Integration

```typescript
// Discord OAuth2 configuration
const DISCORD_OAUTH_CONFIG = {
  clientId: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  redirectUri: 'umbra://oauth/discord/callback',
  scopes: ['identify', 'email', 'guilds', 'connections'],
  authUrl: 'https://discord.com/api/oauth2/authorize',
  tokenUrl: 'https://discord.com/api/oauth2/token',
};

// OAuth flow
async function initiateDiscordOAuth(): Promise<string> {
  const state = generateSecureState();
  const params = new URLSearchParams({
    client_id: DISCORD_OAUTH_CONFIG.clientId,
    redirect_uri: DISCORD_OAUTH_CONFIG.redirectUri,
    response_type: 'code',
    scope: DISCORD_OAUTH_CONFIG.scopes.join(' '),
    state,
  });
  return `${DISCORD_OAUTH_CONFIG.authUrl}?${params}`;
}
```

### 3.3 GDPR Package Parser

```typescript
// Discord GDPR package structure
interface DiscordDataPackage {
  account: {
    userId: string;
    username: string;
    discriminator: string;
    email: string;
    phone?: string;
    avatar: string;
  };
  messages: Map<string, ChannelMessages>;
  servers: ServerInfo[];
  relationships: {
    friends: Friend[];
    blocked: string[];
  };
}

async function parseDiscordPackage(zipFile: File): Promise<DiscordDataPackage> {
  const zip = await JSZip.loadAsync(zipFile);

  // Parse account info
  const accountJson = await zip.file('account/user.json')?.async('string');
  const account = JSON.parse(accountJson);

  // Parse messages
  const messages = new Map<string, ChannelMessages>();
  const messagesFolders = zip.folder('messages');
  // ... iterate and parse each channel

  // Parse relationships
  const friendsJson = await zip.file('account/relationships.json')?.async('string');

  return { account, messages, servers, relationships };
}
```

### 3.4 Friend Discovery (Privacy-Preserving)

```typescript
// Client-side hashing of friend usernames
async function hashFriendList(friends: Friend[]): Promise<string[]> {
  const hashes = await Promise.all(
    friends.map(async (friend) => {
      const normalized = friend.username.toLowerCase();
      const hash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(normalized + UMBRA_SALT)
      );
      return bufferToHex(hash);
    })
  );
  return hashes;
}

// Check against Umbra's hashed user registry
async function findExistingUmbraUsers(hashes: string[]): Promise<FoundFriend[]> {
  // Server only stores hashes, never usernames
  const response = await fetch('/api/migrations/find-friends', {
    method: 'POST',
    body: JSON.stringify({ hashes }),
  });
  return response.json();
}
```

---

## Part 4: UI/UX Design

### 4.1 Migration Entry Points

**Profile Settings:**
```
Settings → Profile → Import from...
├── Discord (Connect & Import)
├── Slack (Connect & Import)
├── Telegram (Upload Export)
└── Upload Data Package (ZIP)
```

**Onboarding Flow:**
```
Welcome to Umbra!
        ↓
Create Identity (Recovery Phrase)
        ↓
[Optional] Import Your Data
├── "I have a Discord account" → OAuth flow
├── "I have a data export" → Upload flow
└── "Start fresh" → Skip
        ↓
Invite Friends
```

### 4.2 Import Progress UI

```
┌─────────────────────────────────────────────────────┐
│ Importing from Discord                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ✓ Profile imported                                  │
│ ✓ Avatar downloaded                                 │
│ ● Importing friends (12 of 47)                      │
│ ○ Community structure                               │
│ ○ Message history                                   │
│                                                     │
│ [━━━━━━━━━━━━░░░░░░░░░░░░░] 35%                     │
│                                                     │
│ Found 3 friends already on Umbra!                   │
│ [Add them] [Skip]                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.3 Community Migration Wizard

```
Step 1: Select Server
┌─────────────────────────────────────────────────────┐
│ Which Discord server would you like to migrate?     │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🎮 Gaming Squad          142 members            │ │
│ │    Admin · 15 channels                          │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 💼 Work Team             28 members             │ │
│ │    Member · 8 channels                          │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Note: You need Admin permissions to migrate         │
│ the full server structure.                          │
└─────────────────────────────────────────────────────┘

Step 2: Configure Import
┌─────────────────────────────────────────────────────┐
│ What would you like to import?                      │
│                                                     │
│ ☑ Channel structure (categories, channels)         │
│ ☑ Roles and permissions                            │
│ ☐ Message history (may take a while)               │
│ ☐ Files and attachments                            │
│                                                     │
│ ⚠ Message history requires a Discord bot with      │
│   Read Message History permission in each channel.  │
│                                                     │
│ [Create Migration Bot] or [Skip Messages]           │
└─────────────────────────────────────────────────────┘

Step 3: Invite Members
┌─────────────────────────────────────────────────────┐
│ Invite your Discord members to Umbra                │
│                                                     │
│ Your migration invite link:                         │
│ ┌─────────────────────────────────────────────────┐ │
│ │ https://umbra.chat/join/abc123def456            │ │
│ └─────────────────────────────────────────────────┘ │
│ [Copy Link] [Share to Discord]                      │
│                                                     │
│ Or post this message in your Discord:               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🔒 We're moving to Umbra for better privacy!    │ │
│ │ Join us: umbra.chat/join/abc123                 │ │
│ │ Why? No data mining, E2E encryption, you own    │ │
│ │ your data.                                      │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Part 5: Friend Migration Strategies

### 5.1 Legal API-Based Methods

| Method | Platform | Feasibility | User Effort |
|--------|----------|-------------|-------------|
| OAuth + relationships.read | Discord | Requires Discord approval | Low |
| GDPR data package parse | Discord | Works now | Medium |
| Workspace member list | Slack | Admin only | Low |
| Contact list export | Telegram | Works via desktop | Medium |

### 5.2 Social Discovery Methods

**Username Matching:**
1. User imports friend list (locally)
2. Client hashes usernames
3. Query Umbra for matching hashes
4. Show "X friends already on Umbra!"

**Referral System:**
1. User generates personal invite link
2. Link tracks referrer
3. When friend joins, notify referrer
4. Option to auto-add as friend

**QR Code Campaign:**
1. Generate unique QR with embedded friend request
2. User shares QR in Discord/Slack
3. Scanning adds both as friends on Umbra

### 5.3 Community-Based Migration

**"Migrate Together" Feature:**
1. Community admin initiates migration
2. Generates community-specific invite
3. Members join via link
4. Auto-grouped in new Umbra community
5. Preserve username mappings

---

## Part 6: Implementation Priority

### Immediate (Phase 1) — Profile Import

**Files to Create:**
- `packages/umbra-service/src/migrations/discord/oauth.ts`
- `packages/umbra-service/src/migrations/discord/profile-import.ts`
- `apps/umbra/components/settings/ImportProfile.tsx`
- `apps/umbra/hooks/useDiscordImport.ts`

**MVP Features:**
1. Discord OAuth2 login
2. Fetch profile (username, avatar)
3. Download and store avatar
4. Update Umbra profile

### Short-term (Phase 2) — GDPR Package Import

**Files to Create:**
- `packages/umbra-service/src/migrations/discord/gdpr-parser.ts`
- `packages/umbra-service/src/migrations/types.ts`
- `apps/umbra/components/settings/UploadDataPackage.tsx`

**Features:**
1. Upload ZIP file
2. Parse account info
3. Extract friends list
4. Find existing Umbra users

### Medium-term (Phase 3) — Community Migration

**Requires:**
- Discord bot infrastructure
- Community structure mapping
- Batch import system

### Long-term (Phase 4) — Full History Import

**Requires:**
- Message format conversion
- File download/re-encryption
- Large-scale storage handling

---

## Part 7: Security Considerations

### 7.1 OAuth Token Handling

- Store tokens in secure storage (Keychain/Credential Manager)
- Refresh tokens before expiry
- Never log or transmit tokens
- Delete tokens after import complete

### 7.2 Data Package Processing

- Process ZIP entirely client-side
- No upload to Umbra servers
- Clear temporary files after import
- Warn user about sensitive data

### 7.3 Friend List Privacy

- Hash before any network transmission
- Salt with user-specific value
- Never store plaintext friend lists
- Allow user to opt-out of discovery

---

## Part 8: Legal Considerations

### 8.1 Terms of Service Compliance

| Platform | Data Export | API Access | Bot Usage |
|----------|-------------|------------|-----------|
| Discord | GDPR right | Per ToS | Per ToS |
| Slack | Admin only | Per ToS | Per ToS |
| Telegram | User right | Per ToS | Per ToS |

### 8.2 User Rights

- GDPR Article 20: Data Portability
- Users have right to export their data
- We're helping users exercise this right
- Not scraping or accessing without consent

---

## Appendix A: Discord Data Package Structure

```
discord-data-package.zip/
├── README.txt
├── account/
│   ├── avatar.png
│   ├── user.json
│   └── relationships.json
├── activity/
│   ├── analytics/
│   ├── modeling/
│   ├── reporting/
│   └── tns/
├── messages/
│   ├── c123456789/              # Channel ID
│   │   ├── channel.json         # Channel metadata
│   │   └── messages.json        # Array of messages
│   ├── c987654321/
│   │   ├── channel.json
│   │   └── messages.json
│   └── index.json               # Message index
├── programs/
│   └── activity/
└── servers/
    └── index.json               # Server list
```

---

## Appendix B: Message Format Mapping

### Discord → Umbra

```json
// Discord message
{
  "ID": "1234567890",
  "Timestamp": "2024-01-15T12:30:00.000+00:00",
  "Contents": "Hello world!",
  "Attachments": "https://cdn.discordapp.com/...",
  "Reactions": "👍(3),❤️(1)"
}

// Umbra message (encrypted payload)
{
  "id": "umbra-msg-uuid",
  "conversationId": "conv-uuid",
  "senderDid": "did:key:z6Mk...",
  "content": "Hello world!",
  "timestamp": 1705322200000,
  "attachments": [{
    "fileId": "file-uuid",
    "filename": "image.png",
    "size": 12345,
    "mimeType": "image/png"
  }],
  "reactions": [
    { "emoji": "👍", "users": ["did:key:..."] }
  ],
  "metadata": {
    "imported": true,
    "source": "discord",
    "originalId": "1234567890",
    "originalTimestamp": "2024-01-15T12:30:00.000+00:00"
  }
}
```

---

## Next Steps

1. [ ] Set up Discord Developer Application for OAuth
2. [ ] Implement basic OAuth flow in Umbra
3. [ ] Create profile import UI component
4. [ ] Test with real Discord accounts
5. [ ] Expand to GDPR package parsing
6. [ ] Design community migration bot
