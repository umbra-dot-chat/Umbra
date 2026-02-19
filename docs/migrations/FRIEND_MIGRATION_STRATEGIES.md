# Friend Migration Strategies

**Status:** Research & Planning
**Last Updated:** February 2026

---

## The Challenge

Moving to a new messaging platform means leaving your social graph behind. This is the #1 barrier to migration. We need strategies that are:

1. **Legal** — Only using publicly available APIs and user-authorized data
2. **Privacy-Preserving** — Not exposing friend lists to servers
3. **Low Friction** — Minimal effort from users
4. **Effective** — Actually results in friends migrating

---

## Strategy Overview

| Strategy | User Effort | Effectiveness | Privacy | Legal Risk |
|----------|-------------|---------------|---------|------------|
| GDPR Package Parse | Medium | Medium | High | None |
| OAuth Friends Scope | Low | High | Medium | Low |
| Invite Link Sharing | Low | Medium | High | None |
| Username Hash Matching | Low | Low | High | None |
| Community Migration | Low | Very High | High | None |
| QR Code Campaigns | Medium | Medium | High | None |

---

## Strategy 1: GDPR Data Package Parsing

### How It Works

1. User requests Discord GDPR data package
2. User uploads ZIP to Umbra (processed client-side)
3. Umbra parses `account/relationships.json`
4. Extract friend usernames/IDs
5. Hash usernames, query Umbra for matches
6. Show "X friends already on Umbra!"

### Discord Package Friend Format

```json
// account/relationships.json
[
  {
    "id": "123456789012345678",
    "type": 1,
    "nickname": null,
    "user": {
      "id": "123456789012345678",
      "username": "friend_username",
      "global_name": "Friend Display Name",
      "avatar": "abc123def456",
      "discriminator": "0"
    }
  }
]
```

Type values:
- `1` = Friend
- `2` = Blocked
- `3` = Incoming friend request
- `4` = Outgoing friend request

### Implementation

```typescript
interface DiscordFriend {
  id: string;
  username: string;
  globalName?: string;
  avatar?: string;
}

async function extractFriendsFromPackage(file: File): Promise<DiscordFriend[]> {
  const zip = await JSZip.loadAsync(file);
  const relationshipsFile = zip.file('account/relationships.json');

  if (!relationshipsFile) {
    throw new Error('No relationships data found');
  }

  const content = await relationshipsFile.async('string');
  const relationships = JSON.parse(content);

  return relationships
    .filter((r: any) => r.type === 1) // Friends only
    .map((r: any) => ({
      id: r.user?.id || r.id,
      username: r.user?.username || r.username,
      globalName: r.user?.global_name,
      avatar: r.user?.avatar,
    }));
}
```

### Privacy-Preserving Friend Discovery

```typescript
// Client-side: hash friend usernames before sending
const UMBRA_FRIEND_SALT = 'umbra-friend-discovery-v1';

async function hashUsername(username: string): Promise<string> {
  const normalized = username.toLowerCase().trim();
  const data = new TextEncoder().encode(normalized + UMBRA_FRIEND_SALT);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function findExistingFriends(friends: DiscordFriend[]): Promise<{
  found: Array<{ discordUsername: string; umbraDid: string }>;
  notFound: DiscordFriend[];
}> {
  // Hash all usernames client-side
  const hashes = await Promise.all(
    friends.map(async f => ({
      hash: await hashUsername(f.username),
      friend: f,
    }))
  );

  // Query server with hashes only (server never sees usernames)
  const response = await fetch('/api/friend-discovery/lookup', {
    method: 'POST',
    body: JSON.stringify({ hashes: hashes.map(h => h.hash) }),
  });

  const results = await response.json();
  // results: { [hash]: umbraDid | null }

  const found = [];
  const notFound = [];

  for (const { hash, friend } of hashes) {
    if (results[hash]) {
      found.push({
        discordUsername: friend.username,
        umbraDid: results[hash],
      });
    } else {
      notFound.push(friend);
    }
  }

  return { found, notFound };
}
```

### Server-Side Hash Registry

```typescript
// When user links Discord account, store hash of username
async function registerUsernameHash(username: string, umbraDid: string) {
  const hash = await hashUsername(username);

  await db.usernameHashes.upsert({
    hash,
    umbraDid,
    platform: 'discord',
    // Don't store actual username - only hash
  });
}

// Lookup endpoint
async function lookupHashes(hashes: string[]): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {};

  for (const hash of hashes) {
    const record = await db.usernameHashes.findByHash(hash);
    results[hash] = record?.umbraDid || null;
  }

  return results;
}
```

### Pros & Cons

**Pros:**
- No API access required
- Works offline after package download
- Complete friend list
- Privacy-preserving via hashing

**Cons:**
- Takes up to 30 days to receive package
- Requires user to upload file
- Friends must have also imported/linked Discord

---

## Strategy 2: OAuth Friends Scope (Discord)

### How It Works

The `relationships.read` scope in Discord OAuth provides access to the user's friend list. However, this scope requires Discord approval for your application.

### Requesting Access

1. Apply at https://discord.com/developers/applications
2. Under OAuth2 → Scopes, enable `relationships.read`
3. Submit application for review
4. Explain use case: "Help users find existing friends on our platform"

### Implementation (If Approved)

```typescript
// Fetch friends via OAuth (requires approved scope)
async function fetchDiscordFriends(accessToken: string): Promise<DiscordFriend[]> {
  const response = await fetch('https://discord.com/api/v10/users/@me/relationships', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch relationships: ${response.status}`);
  }

  const relationships = await response.json();

  return relationships
    .filter((r: any) => r.type === 1)
    .map((r: any) => ({
      id: r.id,
      username: r.user.username,
      globalName: r.user.global_name,
      avatar: r.user.avatar,
    }));
}
```

### Approval Strategy

When applying for `relationships.read`, emphasize:

1. **User Privacy Focus** — We're a privacy-focused platform helping users migrate
2. **User-Initiated Only** — Only accessed when user explicitly requests
3. **No Storage** — Friend list processed client-side, not stored on servers
4. **Clear Purpose** — Find friends already on Umbra, generate invite links for others

### Pros & Cons

**Pros:**
- Real-time access
- Seamless user experience
- No file upload needed

**Cons:**
- Requires Discord approval (may be denied)
- Scope may be revoked
- Users may distrust OAuth permissions

---

## Strategy 3: Smart Invite Link System

### How It Works

Make it extremely easy to invite friends, then track who accepts.

### Personalized Invite Links

```typescript
interface InviteLink {
  id: string;
  createdBy: string; // Umbra DID
  code: string;
  type: 'personal' | 'community';
  metadata: {
    platform?: 'discord' | 'slack' | 'telegram';
    friendUsername?: string; // Optional: who this is for
  };
  uses: number;
  maxUses?: number;
  expiresAt?: Date;
}

// Generate personal invite link
async function createFriendInvite(
  creatorDid: string,
  friendUsername?: string
): Promise<InviteLink> {
  const code = generateSecureCode(8);

  return {
    id: uuid(),
    createdBy: creatorDid,
    code,
    type: 'personal',
    metadata: {
      friendUsername,
    },
    uses: 0,
    expiresAt: addDays(new Date(), 30),
  };
}

// When invite is used
async function handleInviteAccepted(
  code: string,
  newUserDid: string
) {
  const invite = await db.invites.findByCode(code);

  if (!invite) throw new Error('Invalid invite');

  // Auto-add as friends
  await createFriendship(invite.createdBy, newUserDid);

  // Notify inviter
  await sendNotification(invite.createdBy, {
    type: 'friend_joined',
    message: `${invite.metadata.friendUsername || 'Someone'} joined via your invite!`,
    newFriendDid: newUserDid,
  });

  // Update invite stats
  await db.invites.incrementUses(invite.id);
}
```

### Bulk Invite Generator

```typescript
// Generate multiple invite links from friend list
async function generateBulkInvites(
  creatorDid: string,
  friends: DiscordFriend[]
): Promise<Array<{ friend: DiscordFriend; inviteUrl: string }>> {
  const invites = await Promise.all(
    friends.map(async friend => {
      const invite = await createFriendInvite(creatorDid, friend.username);
      return {
        friend,
        inviteUrl: `https://umbra.chat/join/${invite.code}`,
      };
    })
  );

  return invites;
}
```

### Share Template Generator

```typescript
// Generate shareable message for Discord
function generateShareMessage(invites: Array<{ friend: DiscordFriend; inviteUrl: string }>): string {
  return `🔒 I'm switching to Umbra for private, encrypted messaging!

Join me: ${invites[0].inviteUrl}

Why Umbra?
• End-to-end encrypted (not even Umbra can read your messages)
• No phone number required
• Your data stays on YOUR device
• Open source & auditable

See you there! 🚀`;
}

// Generate DM message for specific friend
function generateDMMessage(friend: DiscordFriend, inviteUrl: string): string {
  return `Hey ${friend.globalName || friend.username}! 👋

I'm trying out this new messaging app called Umbra. It's like Discord but actually private - all messages are encrypted and they can't see anything.

Would be cool to chat there too: ${inviteUrl}

No pressure, just thought you might be interested!`;
}
```

### UI: Invite Friends Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Invite Your Discord Friends                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ We found 47 friends from your Discord import.               │
│ 3 are already on Umbra! [Add them]                          │
│                                                             │
│ Invite the rest:                                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📋 Copy message to share in Discord                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📤 Generate individual invite links (for DMs)          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Or share your personal invite link:                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ umbra.chat/join/abc123xyz                  [Copy] [QR]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Strategy 4: Community Migration ("Move Together")

### The Most Effective Strategy

Instead of migrating individual friends, migrate entire communities. When a group moves together, nobody is left behind.

### How It Works

1. Community admin initiates migration in Umbra
2. Creates Umbra community mirroring Discord structure
3. Generates community-specific invite link
4. Posts announcement in Discord server
5. Members join with same link
6. Automatic friend connections within community

### Implementation

```typescript
interface CommunityMigration {
  id: string;
  sourceplatform: 'discord' | 'slack';
  sourceGuildId: string;
  sourceGuildName: string;
  umbraCommunityId: string;
  inviteCode: string;
  migratedMembers: Map<string, { sourceId: string; umbraDid: string }>;
  status: 'pending' | 'active' | 'completed';
}

// Start community migration
async function initiateCommunityMigration(
  adminDid: string,
  sourceGuild: { id: string; name: string }
): Promise<CommunityMigration> {
  // Create Umbra community
  const community = await createCommunity({
    name: sourceGuild.name,
    createdBy: adminDid,
    metadata: {
      migratedFrom: 'discord',
      sourceGuildId: sourceGuild.id,
    },
  });

  // Generate migration invite
  const inviteCode = generateSecureCode(10);

  return {
    id: uuid(),
    sourceplatform: 'discord',
    sourceGuildId: sourceGuild.id,
    sourceGuildName: sourceGuild.name,
    umbraCommunityId: community.id,
    inviteCode,
    migratedMembers: new Map(),
    status: 'active',
  };
}

// When member joins via migration link
async function handleMigrationJoin(
  inviteCode: string,
  newUserDid: string,
  sourceUserId?: string // Optional: their Discord ID
) {
  const migration = await db.migrations.findByCode(inviteCode);

  if (!migration) throw new Error('Invalid migration link');

  // Add to community
  await addCommunityMember(migration.umbraCommunityId, newUserDid);

  // Track migration
  if (sourceUserId) {
    migration.migratedMembers.set(sourceUserId, {
      sourceId: sourceUserId,
      umbraDid: newUserDid,
    });
  }

  // Auto-friend with other migrated members
  for (const [, member] of migration.migratedMembers) {
    if (member.umbraDid !== newUserDid) {
      await createFriendship(member.umbraDid, newUserDid);
    }
  }

  await db.migrations.save(migration);
}
```

### Migration Announcement Generator

```typescript
function generateMigrationAnnouncement(migration: CommunityMigration): string {
  return `📢 **${migration.sourceGuildName} is moving to Umbra!**

We're switching to a more private, secure platform where:

🔐 **All messages are end-to-end encrypted**
No one (not even Umbra) can read your messages

🚫 **No data harvesting**
Unlike Discord, Umbra doesn't scan your messages or sell your data

👤 **No phone number required**
Your identity is a secure recovery phrase you control

🌐 **Same features you love**
Channels, roles, voice chat, file sharing - all encrypted

---

**Join us:** https://umbra.chat/migrate/${migration.inviteCode}

This link will:
1. Create your Umbra account (takes 30 seconds)
2. Add you to our new ${migration.sourceGuildName} community
3. Auto-connect you with members who've already joined

See you on the other side! 🚀

Questions? Ask in #migration-help`;
}
```

---

## Strategy 5: QR Code Friend Adding

### How It Works

1. User generates QR code containing friend request data
2. Shares QR in Discord profile, status, or DMs
3. Friends scan with Umbra app
4. Instant friend connection

### Implementation

```typescript
interface QRFriendData {
  version: 1;
  type: 'friend-request';
  did: string;
  displayName: string;
  avatar?: string; // Base64 thumbnail
  expiresAt: number;
  signature: string; // Proves ownership of DID
}

// Generate QR data
async function generateFriendQR(userDid: string): Promise<string> {
  const user = await getProfile(userDid);

  const data: QRFriendData = {
    version: 1,
    type: 'friend-request',
    did: userDid,
    displayName: user.displayName,
    avatar: user.avatarThumbnail, // Small base64
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    signature: await signData(userDid, `friend-request:${Date.now()}`),
  };

  return JSON.stringify(data);
}

// Process scanned QR
async function processFriendQR(
  scannerDid: string,
  qrData: string
): Promise<{ success: boolean; friend?: Profile }> {
  const data: QRFriendData = JSON.parse(qrData);

  // Validate
  if (data.version !== 1) throw new Error('Unsupported QR version');
  if (data.type !== 'friend-request') throw new Error('Not a friend request');
  if (data.expiresAt < Date.now()) throw new Error('QR code expired');

  // Verify signature
  const valid = await verifySignature(data.did, data.signature);
  if (!valid) throw new Error('Invalid signature');

  // Create friendship
  await createFriendship(scannerDid, data.did);

  // Return friend profile
  const friend = await getProfile(data.did);
  return { success: true, friend };
}
```

### QR Display Component

```tsx
function FriendQRCode({ userDid }: { userDid: string }) {
  const [qrData, setQrData] = useState<string | null>(null);

  useEffect(() => {
    generateFriendQR(userDid).then(setQrData);
  }, [userDid]);

  if (!qrData) return <Loading />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan to Add Me</Text>

      <QRCode
        value={qrData}
        size={200}
        logo={require('./umbra-logo.png')}
      />

      <Text style={styles.hint}>
        Share this QR code with friends.
        They can scan it with the Umbra app to add you instantly.
      </Text>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={() => saveQRAsImage(qrData)}
      >
        <Text>Save as Image</Text>
      </TouchableOpacity>

      <Text style={styles.expiry}>
        Valid for 7 days
      </Text>
    </View>
  );
}
```

---

## Strategy 6: Integration with Platform Features

### Discord Profile Banner

Users can add their Umbra invite link to their Discord profile:

```
Discord Profile → About Me:
"Also on Umbra (private messaging): umbra.chat/u/abc123"
```

### Discord Status

```
🔐 Trying Umbra for encrypted chat! umbra.chat/join/xyz
```

### Discord Bot for Migration

A Discord bot that helps migration:

```
/umbra invite
> 🔗 Your personal Umbra invite: umbra.chat/join/abc123

/umbra migrate #channel
> 📋 Generated migration guide posted to #channel

/umbra stats
> 📊 12 of 47 server members have joined Umbra
```

---

## Comparison Summary

| Strategy | Best For | Implementation Effort |
|----------|----------|----------------------|
| GDPR Package | Complete friend list import | Medium |
| OAuth Scope | Seamless if approved | High (approval needed) |
| Invite Links | Low-friction sharing | Low |
| Community Migration | Moving whole groups | Medium |
| QR Codes | In-person/visual sharing | Low |
| Bot Integration | Active Discord communities | Medium |

---

## Recommended Implementation Order

### Phase 1 (MVP)
1. Basic personal invite link system
2. Invite tracking (who joined via your link)
3. Auto-friend on invite acceptance

### Phase 2
1. GDPR package friend extraction
2. Privacy-preserving hash matching
3. "X friends already on Umbra" feature

### Phase 3
1. Community migration flow
2. Migration announcement generator
3. Bulk member tracking

### Phase 4
1. QR code generation
2. Deep link handling
3. Discord bot (if valuable)

### Phase 5 (If Approved)
1. Discord OAuth relationships.read
2. Real-time friend list sync
