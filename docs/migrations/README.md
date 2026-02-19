# Umbra Migration Documentation

This folder contains comprehensive plans for migrating users from other messaging platforms to Umbra.

## Documents

### [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)
The master plan covering all migration features including:
- Data sources and access methods for Discord, Slack, Telegram
- OAuth2 integration specifications
- GDPR data package parsing
- Community structure mapping (Discord Server → Umbra Community)
- Message history import
- File migration
- Technical architecture and implementation roadmap

### [DISCORD_PROFILE_IMPORT.md](./DISCORD_PROFILE_IMPORT.md)
Detailed implementation spec for the first migration feature:
- Discord OAuth2 flow
- Profile data extraction (avatar, username, bio)
- GDPR package profile parsing
- React Native hooks and components
- Step-by-step user flows

### [FRIEND_MIGRATION_STRATEGIES.md](./FRIEND_MIGRATION_STRATEGIES.md)
Strategies for helping users bring their friends to Umbra:
- GDPR package friend list parsing
- Privacy-preserving username hash matching
- Smart invite link system
- Community "Move Together" migration
- QR code friend adding
- Legal and privacy considerations

---

## Implementation Priority

### Phase 1: Profile Import (Ready to Implement)
- Discord OAuth2 connection
- Avatar and username import
- GDPR package upload and parsing
- **Files:** `packages/umbra-service/src/migrations/discord/`

### Phase 2: Friend Discovery
- Hash-based friend matching
- Invite link generation and tracking
- Auto-friending on invite acceptance

### Phase 3: Community Migration
- Discord server structure export
- Umbra community creation
- Bulk member invite system

### Phase 4: History Import
- Message format conversion
- File download and re-encryption
- Large-scale storage handling

---

## API Research Summary

### Discord

| Data | Access Method | Availability |
|------|--------------|--------------|
| Profile (avatar, username) | OAuth2 `identify` | ✅ Available |
| Email | OAuth2 `email` | ✅ Available |
| Server list | OAuth2 `guilds` | ✅ Available |
| Connections | OAuth2 `connections` | ✅ Available |
| Friend list | OAuth2 `relationships.read` | ⚠️ Requires approval |
| Full account data | GDPR package | ✅ User-initiated |
| Server structure | Bot API | ✅ With permissions |
| Message history | Bot API | ✅ With permissions |

### Slack

| Data | Access Method | Availability |
|------|--------------|--------------|
| Profile | OAuth2 `users:read` | ✅ Available |
| Workspace data | Admin export | ⚠️ Admin only |
| Messages | OAuth2 `channels:history` | ✅ With permissions |
| Full export | Discovery API | ⚠️ Enterprise only |

### Telegram

| Data | Access Method | Availability |
|------|--------------|--------------|
| Full export | Desktop app | ✅ User-initiated |
| Contacts | Export (vCard) | ✅ User-initiated |
| Chat history | Export (JSON/HTML) | ✅ User-initiated |
| Bot access | Bot API | ✅ With permissions |

---

## Legal Considerations

All migration features are designed to:
1. Only access data the user explicitly authorizes
2. Comply with platform Terms of Service
3. Support users' GDPR data portability rights
4. Process sensitive data client-side when possible
5. Never store or transmit data users haven't consented to share

---

## Next Steps

1. [ ] Set up Discord Developer Application
2. [ ] Implement basic OAuth flow
3. [ ] Create profile import UI
4. [ ] Test with real accounts
5. [ ] Apply for `relationships.read` scope
6. [ ] Build GDPR package parser
7. [ ] Implement friend discovery
