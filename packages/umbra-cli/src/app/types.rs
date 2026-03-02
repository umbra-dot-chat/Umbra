use crate::api::ImportedProfile;

// ── Platform list ───────────────────────────────────────────────────────

/// Platforms available for profile import.
pub const PLATFORMS: &[(&str, &str)] = &[
    ("discord", "Discord"),
    ("github", "GitHub"),
    ("steam", "Steam"),
    ("bluesky", "Bluesky"),
];

// ── Types ──────────────────────────────────────────────────────────────

/// Information displayed on the chat screen after onboarding.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct DashboardInfo {
    pub display_name: String,
    pub did: String,
    pub created_at: i64,
    pub username: Option<String>,
    pub linked_platform: Option<String>,
    pub linked_username: Option<String>,
}

/// Which pane has keyboard focus on the Chat screen.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ChatFocus {
    TabBar,
    Sidebar,
    MainArea,
    Input,
}

/// Route selected in the tab bar.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NavRoute {
    Home,
    Messages,
    Communities,
    Settings,
}

/// A friend entry for the sidebar list.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct FriendEntry {
    pub did: String,
    pub display_name: String,
    pub username: Option<String>,
    pub encryption_key: Option<String>,
    pub signing_key: Option<String>,
}

/// A message displayed in the chat area.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct DisplayMessage {
    pub id: String,
    pub sender_did: String,
    pub sender_name: String,
    pub content: String,
    pub timestamp: i64,
    pub is_mine: bool,
    pub edited_at: Option<i64>,
    pub deleted: bool,
    pub status: String,
    pub reactions: Vec<(String, usize)>, // (emoji, count)
    pub pinned: bool,
}

/// Actions that can be performed on a selected message.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[allow(dead_code)]
pub enum MessageAction {
    Edit,
    Delete,
    React,
    Pin,
}

/// Sidebar display mode — DMs or Groups.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SidebarMode {
    DMs,
    Groups,
}

/// A group entry for the sidebar list.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct GroupEntry {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_by: String,
    pub members: Vec<GroupMemberEntry>,
    pub last_message_at: Option<i64>,
}

/// A member of a group.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct GroupMemberEntry {
    pub did: String,
    pub display_name: Option<String>,
}

/// Focus target when creating a group.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CreateGroupFocus {
    Name,
    Members,
}

/// A community entry for the sidebar list.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct CommunityEntry {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_by: String,
    pub member_count: usize,
}

/// A space within a community (organizational container).
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct SpaceEntry {
    pub id: String,
    pub name: String,
    pub categories: Vec<CategoryEntry>,
}

/// A category within a space (groups channels).
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct CategoryEntry {
    pub id: String,
    pub name: String,
    pub channels: Vec<ChannelEntry>,
}

/// A channel within a category.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct ChannelEntry {
    pub id: String,
    pub name: String,
    pub channel_type: String,
}

/// A member of a community.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct CommunityMemberEntry {
    pub did: String,
    pub display_name: Option<String>,
}

/// Focus target within the community view.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[allow(dead_code)]
pub enum CommunityFocus {
    /// Navigating the community list sidebar.
    CommunityList,
    /// Navigating the channel tree.
    ChannelTree,
    /// Viewing channel content.
    ChannelContent,
    /// Typing in a channel.
    Input,
}

/// A flattened item in the channel tree for navigation.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub enum ChannelTreeItem {
    /// A space header (collapsible).
    Space { id: String, name: String },
    /// A category header.
    Category { id: String, name: String },
    /// A channel.
    Channel { id: String, name: String, channel_type: String },
}

/// Focus target when creating a community.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CreateCommunityFocus {
    Name,
    Description,
}

/// A role entry for display.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct RoleEntry {
    pub id: String,
    pub name: String,
    pub permissions: i64,
    pub position: i32,
    pub color: Option<String>,
}

/// Actions available on a community member.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MemberActionItem {
    Kick,
    Ban,
}

/// An invite entry for display.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct InviteEntry {
    pub id: String,
    pub community_id: String,
    pub code: String,
    pub creator_did: String,
    pub max_uses: Option<i32>,
    pub use_count: i32,
    pub expires_at: Option<i64>,
    pub created_at: i64,
}

/// A resolved invite for joining a community.
#[derive(Debug, Clone)]
pub struct ResolvedInvite {
    pub code: String,
    pub community_id: String,
    pub community_name: String,
    pub community_description: Option<String>,
    pub member_count: u32,
    pub invite_payload: String,
}

/// Direction filter for the friend requests screen.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RequestTab {
    Incoming,
    Outgoing,
    Blocked,
}

/// A search result from user discovery.
#[derive(Debug, Clone)]
pub struct SearchResult {
    pub did: String,
    pub username: Option<String>,
}

/// A friend request entry for display.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct FriendRequestEntry {
    pub id: String,
    pub display_name: String,
    pub did: String,
    pub username: Option<String>,
    pub direction: RequestTab,
    pub encryption_key: Option<String>,
    pub signing_key: Option<String>,
}

/// A blocked user entry for display.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct BlockedEntry {
    pub did: String,
    pub display_name: Option<String>,
    pub username: Option<String>,
}

/// Async actions the main loop should execute via tokio.
#[derive(Debug)]
#[allow(dead_code)]
pub enum AsyncAction {
    StartProfileImport {
        platform: String,
        did: Option<String>,
    },
    PollProfileImport {
        state: String,
    },
    LinkAccount {
        did: String,
        platform: String,
        platform_id: String,
        username: String,
    },
    RegisterUsername {
        did: String,
        name: String,
    },
    EnableDiscovery {
        did: String,
        discoverable: bool,
    },
    SearchUser {
        query: String,
    },
}

/// Results from completed async operations.
#[derive(Debug)]
#[allow(dead_code)]
pub enum AsyncResult {
    ProfileImportStarted {
        redirect_url: String,
        state: String,
    },
    ProfileImportResult {
        profile: Option<ImportedProfile>,
    },
    ProfileImportError(String),
    AccountLinked,
    AccountLinkError(String),
    UsernameRegistered {
        username: String,
    },
    UsernameError(String),
    DiscoveryUpdated,
    DiscoveryError(String),
    UserSearchResult {
        results: Vec<SearchResult>,
    },
    UserSearchError(String),
}

/// The current screen in the application.
#[derive(Debug)]
#[allow(dead_code)]
pub enum Screen {
    // ── Core onboarding ─────────────────────────────────────────────
    /// Landing screen: create or import identity.
    Welcome,
    /// Enter a display name for a new identity.
    CreateName,
    /// Display the 24-word recovery phrase.
    CreatePhrase {
        name: String,
        phrase: Vec<String>,
    },
    /// Confirm the user has backed up the phrase.
    CreateConfirm {
        name: String,
        phrase: Vec<String>,
    },
    /// Enter 24 recovery words to import an identity.
    ImportPhrase,
    /// Enter display name for imported identity.
    ImportName {
        phrase: Vec<String>,
    },

    // ── Profile import ──────────────────────────────────────────────
    /// Select a platform to import profile from.
    ProfileImportSelect {
        did: String,
        display_name: String,
    },
    /// Waiting for OAuth sign-in in the browser.
    ProfileImportLoading {
        did: String,
        display_name: String,
        platform: String,
        state: String,
        poll_count: u16,
    },
    /// Profile import completed successfully.
    ProfileImportSuccess {
        did: String,
        display_name: String,
        platform: String,
        platform_username: String,
        platform_id: String,
    },

    // ── Username registration ───────────────────────────────────────
    /// Enter a username to register.
    UsernameRegister {
        did: String,
        display_name: String,
        linked_platform: Option<String>,
        linked_username: Option<String>,
    },
    /// Username registered successfully.
    UsernameSuccess {
        did: String,
        display_name: String,
        username: String,
        linked_platform: Option<String>,
        linked_username: Option<String>,
    },

    // ── Discovery opt-in ────────────────────────────────────────────
    /// Ask user if they want to be discoverable.
    DiscoveryOptIn {
        did: String,
        display_name: String,
        username: Option<String>,
        linked_platform: Option<String>,
        linked_username: Option<String>,
    },

    // ── Chat ───────────────────────────────────────────────────────
    /// Main chat screen with friends sidebar.
    Chat {
        info: DashboardInfo,
        focus: ChatFocus,
        friends: Vec<FriendEntry>,
        selected_friend: usize,
        active_conversation: Option<usize>,
    },
    /// Add friend dialog (modal over chat).
    AddFriend {
        info: DashboardInfo,
        friends: Vec<FriendEntry>,
        selected_friend: usize,
    },
    /// Friend requests dialog (modal over chat).
    FriendRequests {
        info: DashboardInfo,
        friends: Vec<FriendEntry>,
        selected_friend: usize,
        requests: Vec<FriendRequestEntry>,
        selected_request: usize,
        active_tab: RequestTab,
        blocked: Vec<BlockedEntry>,
    },
    /// Create a new group (modal over chat).
    CreateGroup {
        info: DashboardInfo,
        friends: Vec<FriendEntry>,
        selected_friend: usize,
        group_name: String,
        selected_members: Vec<bool>,
        member_cursor: usize,
        field_focus: CreateGroupFocus,
    },
    /// Create a new community (modal over chat).
    CreateCommunity {
        info: DashboardInfo,
        community_name: String,
        community_description: String,
        field_focus: CreateCommunityFocus,
    },
    /// View community members (modal over chat).
    CommunityMembers {
        info: DashboardInfo,
        community_id: String,
        community_name: String,
        members: Vec<CommunityMemberEntry>,
        selected_member: usize,
    },
    /// View community roles (modal over chat).
    CommunityRoles {
        info: DashboardInfo,
        community_id: String,
        community_name: String,
        roles: Vec<RoleEntry>,
        selected_role: usize,
    },
    /// Member actions menu (kick/ban on selected member).
    MemberActions {
        info: DashboardInfo,
        community_id: String,
        member_did: String,
        member_name: String,
        actions: Vec<MemberActionItem>,
        selected_action: usize,
    },
    /// View community invites (modal over chat).
    CommunityInvites {
        info: DashboardInfo,
        community_id: String,
        community_name: String,
        invites: Vec<InviteEntry>,
        selected_invite: usize,
    },
    /// Join a community by invite code (modal over chat).
    JoinCommunity {
        info: DashboardInfo,
        invite_code_input: String,
        resolved_invite: Option<ResolvedInvite>,
        resolving: bool,
    },
}
