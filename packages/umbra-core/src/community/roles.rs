//! # Role System
//!
//! Role management with preset role templates and custom role creation.

use crate::error::Result;
use crate::storage::Database;
use super::permissions::Permissions;
use super::service::generate_id;

/// Preset role types.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RolePreset {
    /// Community owner — all permissions, cannot be deleted
    Owner,
    /// Administrator — nearly all permissions
    Admin,
    /// Moderator — message/member management
    Moderator,
    /// Default member role (applied to @everyone)
    Member,
}

impl RolePreset {
    /// Get the display name for this preset.
    pub fn name(&self) -> &'static str {
        match self {
            RolePreset::Owner => "Owner",
            RolePreset::Admin => "Admin",
            RolePreset::Moderator => "Moderator",
            RolePreset::Member => "Member",
        }
    }

    /// Get the default color for this preset.
    pub fn color(&self) -> &'static str {
        match self {
            RolePreset::Owner => "#e74c3c",
            RolePreset::Admin => "#e67e22",
            RolePreset::Moderator => "#2ecc71",
            RolePreset::Member => "#95a5a6",
        }
    }

    /// Get the permission bitfield for this preset.
    pub fn permissions(&self) -> Permissions {
        match self {
            RolePreset::Owner => Permissions::ALL,
            RolePreset::Admin => Permissions::admin(),
            RolePreset::Moderator => Permissions::moderator(),
            RolePreset::Member => Permissions::default_everyone(),
        }
    }

    /// Get the position (higher = more authority).
    pub fn position(&self) -> i32 {
        match self {
            RolePreset::Owner => 1000,
            RolePreset::Admin => 100,
            RolePreset::Moderator => 50,
            RolePreset::Member => 0,
        }
    }

    /// Whether this role should be shown separately in the member list.
    pub fn hoisted(&self) -> bool {
        matches!(self, RolePreset::Owner | RolePreset::Admin | RolePreset::Moderator)
    }
}

/// IDs of the preset roles created for a community.
#[derive(Debug, Clone)]
pub struct PresetRoleIds {
    /// Owner role ID
    pub owner: String,
    /// Admin role ID
    pub admin: String,
    /// Moderator role ID
    pub moderator: String,
    /// Member role ID (default @everyone)
    pub member: String,
}

/// Create preset roles for a newly created community.
pub(crate) fn create_preset_roles(
    db: &Database,
    community_id: &str,
    created_at: i64,
) -> Result<PresetRoleIds> {
    let presets = [
        RolePreset::Owner,
        RolePreset::Admin,
        RolePreset::Moderator,
        RolePreset::Member,
    ];

    let mut ids = PresetRoleIds {
        owner: String::new(),
        admin: String::new(),
        moderator: String::new(),
        member: String::new(),
    };

    for preset in &presets {
        let role_id = generate_id();
        db.create_community_role(
            &role_id,
            community_id,
            preset.name(),
            Some(preset.color()),
            preset.position(),
            preset.hoisted(),
            false, // not mentionable by default
            true,  // is_preset
            &preset.permissions().to_string_repr(),
            created_at,
        )?;

        match preset {
            RolePreset::Owner => ids.owner = role_id,
            RolePreset::Admin => ids.admin = role_id,
            RolePreset::Moderator => ids.moderator = role_id,
            RolePreset::Member => ids.member = role_id,
        }
    }

    Ok(ids)
}
