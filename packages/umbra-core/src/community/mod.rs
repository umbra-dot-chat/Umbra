//! # Community Module
//!
//! Community management for Umbra — large-scale spaces with channels,
//! roles, permissions, and moderation.
//!
//! ## Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                       COMMUNITY MODULE                                  │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │
//! │  │  Service    │  │   Spaces    │  │  Channels   │  │    Roles     │   │
//! │  │             │  │             │  │             │  │              │   │
//! │  │ - Create    │  │ - Create    │  │ - Create    │  │ - Create     │   │
//! │  │ - Update    │  │ - Reorder   │  │ - Update    │  │ - Assign     │   │
//! │  │ - Delete    │  │ - Delete    │  │ - Delete    │  │ - Presets    │   │
//! │  │ - Get       │  │ - List      │  │ - Types     │  │ - Bitfields  │   │
//! │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘   │
//! │         │                │                │                │           │
//! │  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐                     │
//! │  │  Members   │  │  Invites    │  │ Permissions │                     │
//! │  │             │  │             │  │             │                     │
//! │  │ - Join      │  │ - Create    │  │ - Bitfield  │                     │
//! │  │ - Leave     │  │ - Use       │  │ - Override  │                     │
//! │  │ - Kick/Ban  │  │ - Expire    │  │ - Check     │                     │
//! │  │ - Profile   │  │ - Vanity    │  │ - Compute   │                     │
//! │  └─────────────┘  └─────────────┘  └─────────────┘                     │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

mod boost_nodes;
mod categories;
mod channels;
mod customization;
mod files;
mod integrations;
mod invites;
mod member_experience;
mod members;
mod messaging;
mod moderation;
mod permissions;
mod roles;
mod seats;
mod service;
mod spaces;
mod threads;

pub use messaging::{parse_mentions, MentionType};
pub use permissions::{Permission, Permissions};
pub use roles::RolePreset;
pub use seats::SeatInput;
pub(crate) use service::generate_id;
pub use service::CommunityService;
