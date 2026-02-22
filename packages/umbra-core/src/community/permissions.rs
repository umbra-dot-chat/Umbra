//! # Permission Bitfield Engine
//!
//! Discord-style permission system using bitfields for efficient
//! permission checking with Allow/Deny/Inherit overrides.
//!
//! ## Permission Resolution
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                   PERMISSION RESOLUTION ORDER                          │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  1. Owner bypass — owner has all permissions                           │
//! │  2. Compute base permissions from all assigned roles (OR together)     │
//! │  3. Apply channel-level overrides:                                     │
//! │     a. Apply role overrides (deny first, then allow)                   │
//! │     b. Apply member-specific overrides (deny first, then allow)        │
//! │  4. Final result = computed permission set                             │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

/// Individual permission flags.
///
/// Each permission is a single bit in a u64 bitfield.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u64)]
pub enum Permission {
    // ── General ──────────────────────────────────────────────────────────
    /// View channels and read messages
    ViewChannels = 1 << 0,
    /// Manage community settings (name, description, icon)
    ManageCommunity = 1 << 1,
    /// Manage channels (create, edit, delete)
    ManageChannels = 1 << 2,
    /// Manage roles (create, edit, delete, assign)
    ManageRoles = 1 << 3,
    /// Create invite links
    CreateInvites = 1 << 4,
    /// Manage invites (delete others' invites)
    ManageInvites = 1 << 5,

    // ── Members ──────────────────────────────────────────────────────────
    /// Kick members
    KickMembers = 1 << 6,
    /// Ban members
    BanMembers = 1 << 7,
    /// Timeout members (mute)
    TimeoutMembers = 1 << 8,
    /// Change own nickname
    ChangeNickname = 1 << 9,
    /// Change other members' nicknames
    ManageNicknames = 1 << 10,

    // ── Messages ─────────────────────────────────────────────────────────
    /// Send messages in text channels
    SendMessages = 1 << 11,
    /// Embed links (URL previews)
    EmbedLinks = 1 << 12,
    /// Attach files
    AttachFiles = 1 << 13,
    /// Add reactions
    AddReactions = 1 << 14,
    /// Use external emoji
    UseExternalEmoji = 1 << 15,
    /// Mention @everyone and @here
    MentionEveryone = 1 << 16,
    /// Manage messages (delete/pin others' messages)
    ManageMessages = 1 << 17,
    /// Read message history
    ReadMessageHistory = 1 << 18,

    // ── Threads ──────────────────────────────────────────────────────────
    /// Create threads
    CreateThreads = 1 << 19,
    /// Send messages in threads
    SendThreadMessages = 1 << 20,
    /// Manage threads (archive, delete, lock)
    ManageThreads = 1 << 21,

    // ── Voice ────────────────────────────────────────────────────────────
    /// Connect to voice channels
    VoiceConnect = 1 << 22,
    /// Speak in voice channels
    VoiceSpeak = 1 << 23,
    /// Stream video/screen share
    VoiceStream = 1 << 24,
    /// Mute other members in voice
    VoiceMuteMembers = 1 << 25,
    /// Deafen other members in voice
    VoiceDeafenMembers = 1 << 26,
    /// Move members between voice channels
    VoiceMoveMembers = 1 << 27,

    // ── Moderation ───────────────────────────────────────────────────────
    /// View audit log
    ViewAuditLog = 1 << 28,
    /// Manage webhooks
    ManageWebhooks = 1 << 29,
    /// Manage emoji and stickers
    ManageEmoji = 1 << 30,
    /// Manage community branding (banner, splash, accent)
    ManageBranding = 1 << 31,

    // ── Files ────────────────────────────────────────────────────────────
    /// Upload files to file channels
    UploadFiles = 1 << 32,
    /// Manage files (delete, organize)
    ManageFiles = 1 << 33,

    // ── Administrator ────────────────────────────────────────────────────
    /// Full administrator access (bypasses all permission checks)
    Administrator = 1 << 63,
}

/// A set of permissions represented as a bitfield.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct Permissions(u64);

impl Permissions {
    /// No permissions.
    pub const NONE: Permissions = Permissions(0);

    /// All permissions (administrator).
    pub const ALL: Permissions = Permissions(u64::MAX);

    /// Create from a raw bitfield value.
    pub fn from_bits(bits: u64) -> Self {
        Self(bits)
    }

    /// Get the raw bitfield value.
    pub fn bits(&self) -> u64 {
        self.0
    }

    /// Create from a string (decimal representation).
    pub fn from_string(s: &str) -> Self {
        Self(s.parse::<u64>().unwrap_or(0))
    }

    /// Convert to string (decimal representation).
    pub fn to_string_repr(&self) -> String {
        self.0.to_string()
    }

    /// Check if a specific permission is set.
    pub fn has(&self, perm: Permission) -> bool {
        // Administrator bypasses all checks
        if self.0 & (Permission::Administrator as u64) != 0 {
            return true;
        }
        self.0 & (perm as u64) != 0
    }

    /// Add a permission.
    pub fn add(&mut self, perm: Permission) {
        self.0 |= perm as u64;
    }

    /// Remove a permission.
    pub fn remove(&mut self, perm: Permission) {
        self.0 &= !(perm as u64);
    }

    /// Merge with another permission set (OR).
    pub fn merge(&self, other: &Permissions) -> Permissions {
        Permissions(self.0 | other.0)
    }

    /// Compute effective permissions given role permissions and channel overrides.
    ///
    /// The computation follows Discord's model:
    /// 1. Start with base permissions (OR of all role permissions)
    /// 2. Apply role-level channel overrides (deny removes, allow adds)
    /// 3. Apply member-specific channel overrides (deny removes, allow adds)
    pub fn compute_channel_permissions(
        base: &Permissions,
        role_overrides: &[(Permissions, Permissions)], // (allow, deny) per role
        member_override: Option<&(Permissions, Permissions)>, // (allow, deny) for member
    ) -> Permissions {
        // Administrator bypasses everything
        if base.has(Permission::Administrator) {
            return Permissions::ALL;
        }

        let mut perms = base.0;

        // Apply role overrides: deny first, then allow
        let mut role_deny = 0u64;
        let mut role_allow = 0u64;
        for (allow, deny) in role_overrides {
            role_deny |= deny.0;
            role_allow |= allow.0;
        }
        perms &= !role_deny;
        perms |= role_allow;

        // Apply member overrides: deny first, then allow
        if let Some((allow, deny)) = member_override {
            perms &= !deny.0;
            perms |= allow.0;
        }

        Permissions(perms)
    }

    /// Default permissions for the @everyone role.
    pub fn default_everyone() -> Self {
        let mut p = Permissions::NONE;
        p.add(Permission::ViewChannels);
        p.add(Permission::SendMessages);
        p.add(Permission::ReadMessageHistory);
        p.add(Permission::AddReactions);
        p.add(Permission::EmbedLinks);
        p.add(Permission::AttachFiles);
        p.add(Permission::UseExternalEmoji);
        p.add(Permission::ChangeNickname);
        p.add(Permission::CreateThreads);
        p.add(Permission::SendThreadMessages);
        p.add(Permission::VoiceConnect);
        p.add(Permission::VoiceSpeak);
        p.add(Permission::VoiceStream);
        p.add(Permission::UploadFiles);
        p
    }

    /// Moderator permissions.
    pub fn moderator() -> Self {
        let mut p = Self::default_everyone();
        p.add(Permission::KickMembers);
        p.add(Permission::TimeoutMembers);
        p.add(Permission::ManageMessages);
        p.add(Permission::ManageThreads);
        p.add(Permission::MentionEveryone);
        p.add(Permission::ManageNicknames);
        p.add(Permission::ViewAuditLog);
        p
    }

    /// Admin permissions (everything except Administrator flag).
    pub fn admin() -> Self {
        let mut p = Self::moderator();
        p.add(Permission::ManageCommunity);
        p.add(Permission::ManageChannels);
        p.add(Permission::ManageRoles);
        p.add(Permission::CreateInvites);
        p.add(Permission::ManageInvites);
        p.add(Permission::BanMembers);
        p.add(Permission::ManageWebhooks);
        p.add(Permission::ManageEmoji);
        p.add(Permission::ManageBranding);
        p.add(Permission::ManageFiles);
        p
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_permission_has() {
        let mut p = Permissions::NONE;
        assert!(!p.has(Permission::SendMessages));

        p.add(Permission::SendMessages);
        assert!(p.has(Permission::SendMessages));
        assert!(!p.has(Permission::ManageMessages));
    }

    #[test]
    fn test_administrator_bypasses_all() {
        let mut p = Permissions::NONE;
        p.add(Permission::Administrator);
        assert!(p.has(Permission::SendMessages));
        assert!(p.has(Permission::ManageRoles));
        assert!(p.has(Permission::BanMembers));
    }

    #[test]
    fn test_permission_remove() {
        let mut p = Permissions::default_everyone();
        assert!(p.has(Permission::SendMessages));

        p.remove(Permission::SendMessages);
        assert!(!p.has(Permission::SendMessages));
    }

    #[test]
    fn test_merge() {
        let a = Permissions::from_bits(Permission::SendMessages as u64);
        let b = Permissions::from_bits(Permission::ManageMessages as u64);
        let merged = a.merge(&b);
        assert!(merged.has(Permission::SendMessages));
        assert!(merged.has(Permission::ManageMessages));
    }

    #[test]
    fn test_string_roundtrip() {
        let p = Permissions::default_everyone();
        let s = p.to_string_repr();
        let p2 = Permissions::from_string(&s);
        assert_eq!(p, p2);
    }

    #[test]
    fn test_channel_overrides() {
        let base = Permissions::default_everyone();
        assert!(base.has(Permission::SendMessages));

        // Role override: deny SendMessages
        let deny = Permissions::from_bits(Permission::SendMessages as u64);
        let allow = Permissions::NONE;
        let result = Permissions::compute_channel_permissions(&base, &[(allow, deny)], None);
        assert!(!result.has(Permission::SendMessages));
        assert!(result.has(Permission::ViewChannels));
    }

    #[test]
    fn test_member_override_takes_priority() {
        let base = Permissions::default_everyone();

        // Role override denies SendMessages
        let role_deny = Permissions::from_bits(Permission::SendMessages as u64);
        // But member override allows it back
        let member_allow = Permissions::from_bits(Permission::SendMessages as u64);

        let result = Permissions::compute_channel_permissions(
            &base,
            &[(Permissions::NONE, role_deny)],
            Some(&(member_allow, Permissions::NONE)),
        );
        assert!(result.has(Permission::SendMessages));
    }

    #[test]
    fn test_preset_permissions_hierarchy() {
        let everyone = Permissions::default_everyone();
        let moderator = Permissions::moderator();
        let admin = Permissions::admin();

        // Moderator has everything everyone has, plus more
        assert!(moderator.has(Permission::SendMessages));
        assert!(moderator.has(Permission::KickMembers));
        assert!(!everyone.has(Permission::KickMembers));

        // Admin has everything moderator has, plus more
        assert!(admin.has(Permission::KickMembers));
        assert!(admin.has(Permission::ManageChannels));
        assert!(!moderator.has(Permission::ManageChannels));
    }
}
