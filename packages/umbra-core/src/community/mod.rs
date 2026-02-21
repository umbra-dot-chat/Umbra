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

mod service;
mod spaces;
mod channels;
mod categories;
mod permissions;
mod roles;
mod members;
mod invites;
mod messaging;
mod threads;
mod moderation;
mod files;
mod customization;
mod integrations;
mod boost_nodes;
mod member_experience;
mod seats;

pub use service::CommunityService;
pub(crate) use service::generate_id;
pub use seats::SeatInput;
pub use permissions::{Permission, Permissions};
pub use roles::RolePreset;
pub use messaging::{MentionType, parse_mentions};
