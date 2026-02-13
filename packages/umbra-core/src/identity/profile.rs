//! # User Profile
//!
//! User profile information that accompanies an identity.
//!
//! ## Profile Data
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                          USER PROFILE                                   │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │  Profile Fields                                                 │   │
//! │  ├─────────────────────────────────────────────────────────────────┤   │
//! │  │                                                                 │   │
//! │  │  display_name: String (required)                               │   │
//! │  │  ───────────────────────────────                                │   │
//! │  │  Human-readable name shown to other users.                     │   │
//! │  │  • 1-64 characters                                             │   │
//! │  │  • Unicode allowed                                             │   │
//! │  │                                                                 │   │
//! │  │  status: Option<String>                                        │   │
//! │  │  ──────────────────────                                         │   │
//! │  │  Optional status message (e.g., "Available", "Busy").          │   │
//! │  │  • 0-256 characters                                            │   │
//! │  │                                                                 │   │
//! │  │  avatar: Option<String>                                        │   │
//! │  │  ──────────────────────                                         │   │
//! │  │  Optional avatar image.                                        │   │
//! │  │  • Currently: base64-encoded image data                        │   │
//! │  │  • Future: IPFS CID for decentralized storage                  │   │
//! │  │  • Max size: 256KB (encoded)                                   │   │
//! │  │                                                                 │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                                                                         │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │  Profile Updates                                                │   │
//! │  ├─────────────────────────────────────────────────────────────────┤   │
//! │  │                                                                 │   │
//! │  │  ProfileUpdate enum allows partial updates:                    │   │
//! │  │                                                                 │   │
//! │  │  • DisplayName(String) - Change display name                   │   │
//! │  │  • Status(Option<String>) - Set or clear status               │   │
//! │  │  • Avatar(Option<String>) - Set or clear avatar               │   │
//! │  │                                                                 │   │
//! │  │  Updates are validated before application.                     │   │
//! │  │                                                                 │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};

/// Maximum length for display name
pub const MAX_DISPLAY_NAME_LENGTH: usize = 64;

/// Maximum length for status message
pub const MAX_STATUS_LENGTH: usize = 256;

/// Maximum size for avatar data (base64 encoded)
pub const MAX_AVATAR_SIZE: usize = 256 * 1024; // 256KB

/// User profile information
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Profile {
    /// Human-readable display name
    pub display_name: String,

    /// Optional status message
    pub status: Option<String>,

    /// Optional avatar (base64 or IPFS CID)
    pub avatar: Option<String>,
}

impl Profile {
    /// Create a new profile with just a display name
    pub fn new(display_name: String) -> Self {
        Self {
            display_name,
            status: None,
            avatar: None,
        }
    }

    /// Create a profile with all fields
    pub fn with_all(
        display_name: String,
        status: Option<String>,
        avatar: Option<String>,
    ) -> Result<Self> {
        let mut profile = Self::new(display_name);
        profile.validate()?;

        if let Some(ref s) = status {
            if s.len() > MAX_STATUS_LENGTH {
                return Err(Error::ProfileUpdateFailed(format!(
                    "Status too long: max {} characters",
                    MAX_STATUS_LENGTH
                )));
            }
            profile.status = status;
        }

        if let Some(ref a) = avatar {
            if a.len() > MAX_AVATAR_SIZE {
                return Err(Error::ProfileUpdateFailed(format!(
                    "Avatar too large: max {} bytes",
                    MAX_AVATAR_SIZE
                )));
            }
            profile.avatar = avatar;
        }

        Ok(profile)
    }

    /// Validate the profile
    pub fn validate(&self) -> Result<()> {
        // Display name validation
        if self.display_name.is_empty() {
            return Err(Error::ProfileUpdateFailed(
                "Display name cannot be empty".into(),
            ));
        }

        if self.display_name.len() > MAX_DISPLAY_NAME_LENGTH {
            return Err(Error::ProfileUpdateFailed(format!(
                "Display name too long: max {} characters",
                MAX_DISPLAY_NAME_LENGTH
            )));
        }

        // Status validation
        if let Some(ref status) = self.status {
            if status.len() > MAX_STATUS_LENGTH {
                return Err(Error::ProfileUpdateFailed(format!(
                    "Status too long: max {} characters",
                    MAX_STATUS_LENGTH
                )));
            }
        }

        // Avatar validation
        if let Some(ref avatar) = self.avatar {
            if avatar.len() > MAX_AVATAR_SIZE {
                return Err(Error::ProfileUpdateFailed(format!(
                    "Avatar too large: max {} bytes",
                    MAX_AVATAR_SIZE
                )));
            }
        }

        Ok(())
    }

    /// Apply an update to the profile
    pub fn apply_update(&mut self, update: ProfileUpdate) -> Result<()> {
        match update {
            ProfileUpdate::DisplayName(name) => {
                if name.is_empty() {
                    return Err(Error::ProfileUpdateFailed(
                        "Display name cannot be empty".into(),
                    ));
                }
                if name.len() > MAX_DISPLAY_NAME_LENGTH {
                    return Err(Error::ProfileUpdateFailed(format!(
                        "Display name too long: max {} characters",
                        MAX_DISPLAY_NAME_LENGTH
                    )));
                }
                self.display_name = name;
            }
            ProfileUpdate::Status(status) => {
                if let Some(ref s) = status {
                    if s.len() > MAX_STATUS_LENGTH {
                        return Err(Error::ProfileUpdateFailed(format!(
                            "Status too long: max {} characters",
                            MAX_STATUS_LENGTH
                        )));
                    }
                }
                self.status = status;
            }
            ProfileUpdate::Avatar(avatar) => {
                if let Some(ref a) = avatar {
                    if a.len() > MAX_AVATAR_SIZE {
                        return Err(Error::ProfileUpdateFailed(format!(
                            "Avatar too large: max {} bytes",
                            MAX_AVATAR_SIZE
                        )));
                    }
                }
                self.avatar = avatar;
            }
        }
        Ok(())
    }
}

/// A partial update to a user's profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProfileUpdate {
    /// Update the display name
    DisplayName(String),

    /// Update the status message (None to clear)
    Status(Option<String>),

    /// Update the avatar (None to clear)
    Avatar(Option<String>),
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_profile_new() {
        let profile = Profile::new("Alice".to_string());
        assert_eq!(profile.display_name, "Alice");
        assert!(profile.status.is_none());
        assert!(profile.avatar.is_none());
    }

    #[test]
    fn test_profile_validate_empty_name() {
        let profile = Profile::new("".to_string());
        assert!(profile.validate().is_err());
    }

    #[test]
    fn test_profile_validate_long_name() {
        let long_name = "a".repeat(MAX_DISPLAY_NAME_LENGTH + 1);
        let profile = Profile::new(long_name);
        assert!(profile.validate().is_err());
    }

    #[test]
    fn test_profile_update_display_name() {
        let mut profile = Profile::new("Alice".to_string());
        profile
            .apply_update(ProfileUpdate::DisplayName("Bob".to_string()))
            .unwrap();
        assert_eq!(profile.display_name, "Bob");
    }

    #[test]
    fn test_profile_update_status() {
        let mut profile = Profile::new("Alice".to_string());

        // Set status
        profile
            .apply_update(ProfileUpdate::Status(Some("Busy".to_string())))
            .unwrap();
        assert_eq!(profile.status, Some("Busy".to_string()));

        // Clear status
        profile.apply_update(ProfileUpdate::Status(None)).unwrap();
        assert!(profile.status.is_none());
    }

    #[test]
    fn test_profile_serialization() {
        let profile = Profile::with_all(
            "Alice".to_string(),
            Some("Available".to_string()),
            None,
        )
        .unwrap();

        let json = serde_json::to_string(&profile).unwrap();
        let restored: Profile = serde_json::from_str(&json).unwrap();

        assert_eq!(profile, restored);
    }
}
