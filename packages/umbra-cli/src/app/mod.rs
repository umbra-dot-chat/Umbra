//! Application state machine.
//!
//! Manages screen transitions, input state, and dispatches
//! key events to the appropriate screen handler. Returns
//! `Option<AsyncAction>` when async work (HTTP calls) is needed.

mod types;
mod onboarding;
mod chat;
mod groups;
mod community;

pub use types::*;

use std::collections::HashMap;
use std::time::Instant;

use crossterm::event::{KeyCode, KeyEvent};
use umbra_core::identity::{Identity, RecoveryPhrase};

use crate::db::Db;
use crate::relay::RelayHandle;

// ── App ────────────────────────────────────────────────────────────────

/// Main application state.
pub struct App {
    /// Current screen.
    pub screen: Screen,
    /// Text input buffer (used by name entry screens).
    pub input: String,
    /// Cursor position within the input buffer.
    pub cursor_pos: usize,
    /// Whether the app should exit.
    pub should_quit: bool,
    /// Error message to display (clears on next key press).
    pub error_message: Option<String>,
    /// Word inputs for the import phrase screen (24 slots).
    pub word_inputs: [String; 24],
    /// Which word slot is active during import.
    pub active_word: usize,
    /// Whether the user has confirmed backup on the confirm screen.
    pub confirmed_backup: bool,
    /// Selected platform index for profile import (0-3).
    pub selected_platform: usize,
    /// Selected discovery option: true = discoverable, false = private.
    pub discovery_choice: bool,
    /// Spinner animation frame (cycles on tick).
    pub spinner_frame: usize,
    /// Whether we're currently waiting for an async poll result.
    pub polling_active: bool,
    /// Tick counter for throttling poll frequency (poll every ~8 ticks = 2s at 250ms).
    pub tick_counter: u16,
    /// Welcome screen animation tick (monotonically increasing while on Welcome).
    pub welcome_tick: usize,
    /// Database handle for persistence (None if DB failed to open).
    pub db: Option<Db>,
    /// Search results from user discovery.
    pub search_results: Vec<SearchResult>,
    /// Selected index within search results.
    pub selected_result: usize,
    /// Whether a search is currently in-flight.
    pub searching: bool,
    /// Active navigation route.
    pub nav_route: NavRoute,
    /// Messages for the currently active conversation.
    pub messages: Vec<DisplayMessage>,
    /// Message input buffer.
    pub message_input: String,
    /// Cursor position within message_input.
    pub message_cursor: usize,
    /// Scroll offset for message list (0 = bottom / most recent).
    pub message_scroll: usize,
    /// Whether the relay WebSocket is connected.
    pub relay_connected: bool,
    /// Handle for sending commands to the relay.
    pub relay_handle: Option<RelayHandle>,
    /// Our identity for encryption (None until restored/created).
    pub identity: Option<Identity>,
    /// Our DID string (cached for convenience).
    pub my_did: Option<String>,
    /// Currently selected message index (None = no selection).
    pub selected_message: Option<usize>,
    /// Active message action mode (edit, delete, react, pin).
    pub message_action_mode: Option<MessageAction>,
    /// Typing indicators from peers: DID -> last typing timestamp.
    pub typing_peers: HashMap<String, Instant>,
    /// Buffer for editing a message's content.
    pub edit_buffer: String,
    /// Cursor position within edit_buffer.
    pub edit_cursor: usize,
    /// Whether search mode is active.
    #[allow(dead_code)]
    pub search_mode: bool,
    /// Current search query.
    #[allow(dead_code)]
    pub search_query: String,
    /// Search results (messages matching search_query).
    #[allow(dead_code)]
    pub search_results_messages: Vec<DisplayMessage>,
    /// Timestamp of last typing indicator sent (for debouncing).
    pub last_typing_sent: Option<Instant>,
    /// Current sidebar mode (DMs or Groups).
    pub sidebar_mode: SidebarMode,
    /// Loaded groups for the sidebar.
    pub groups: Vec<GroupEntry>,
    /// Selected group index in the sidebar.
    pub selected_group: usize,
    /// Active group ID when viewing a group conversation.
    pub active_group: Option<String>,
    /// Loaded communities for the sidebar.
    pub communities: Vec<CommunityEntry>,
    /// Selected community index in the communities sidebar.
    pub selected_community: usize,
    /// Active community ID when viewing a community.
    pub active_community: Option<String>,
    /// Channel tree items for the active community (flattened for navigation).
    pub channel_tree: Vec<ChannelTreeItem>,
    /// Selected channel tree item index.
    pub selected_channel_item: usize,
    /// Active channel ID when viewing channel content.
    pub active_channel: Option<String>,
    /// Active channel name (cached for display).
    pub active_channel_name: Option<String>,
    /// Community focus state.
    pub community_focus: CommunityFocus,
    /// Full space/category/channel structure for active community.
    pub community_spaces: Vec<SpaceEntry>,
}

impl App {
    /// Create a new app. If a database is provided and contains a stored
    /// identity, the app skips onboarding and goes directly to Chat.
    pub fn new(db: Option<Db>) -> Self {
        let mut app = Self {
            screen: Screen::Welcome,
            input: String::new(),
            cursor_pos: 0,
            should_quit: false,
            error_message: None,
            word_inputs: Default::default(),
            active_word: 0,
            confirmed_backup: false,
            selected_platform: 0,
            discovery_choice: true,
            spinner_frame: 0,
            polling_active: false,
            tick_counter: 0,
            welcome_tick: 0,
            db,
            search_results: Vec::new(),
            selected_result: 0,
            searching: false,
            nav_route: NavRoute::Messages,
            messages: Vec::new(),
            message_input: String::new(),
            message_cursor: 0,
            message_scroll: 0,
            relay_connected: false,
            relay_handle: None,
            identity: None,
            my_did: None,
            selected_message: None,
            message_action_mode: None,
            typing_peers: HashMap::new(),
            edit_buffer: String::new(),
            edit_cursor: 0,
            search_mode: false,
            search_query: String::new(),
            search_results_messages: Vec::new(),
            last_typing_sent: None,
            sidebar_mode: SidebarMode::DMs,
            groups: Vec::new(),
            selected_group: 0,
            active_group: None,
            communities: Vec::new(),
            selected_community: 0,
            active_community: None,
            channel_tree: Vec::new(),
            selected_channel_item: 0,
            active_channel: None,
            active_channel_name: None,
            community_focus: CommunityFocus::CommunityList,
            community_spaces: Vec::new(),
        };
        app.try_restore_identity();
        app
    }

    /// Attempt to restore identity from the database and skip to Chat.
    /// Silently falls back to Welcome screen on any error.
    fn try_restore_identity(&mut self) {
        let db = match &self.db {
            Some(db) => db,
            None => return,
        };

        let stored = match db.load_identity() {
            Ok(Some(s)) => s,
            _ => return,
        };

        // Validate the stored phrase by reconstructing the Identity
        let phrase = match RecoveryPhrase::from_phrase(&stored.recovery_phrase) {
            Ok(p) => p,
            Err(_) => return,
        };

        let identity = match Identity::from_recovery_phrase(&phrase, stored.display_name.clone()) {
            Ok(id) => id,
            Err(_) => return,
        };

        // Keep the identity for encryption and store our DID
        self.my_did = Some(identity.did_string());
        self.identity = match identity.clone_for_service() {
            Ok(cloned) => Some(cloned),
            Err(_) => None,
        };

        // Load friends from DB
        let friends: Vec<FriendEntry> = db
            .load_friends()
            .unwrap_or_default()
            .into_iter()
            .map(|f| FriendEntry {
                did: f.did,
                display_name: f.display_name,
                username: f.username,
                encryption_key: f.encryption_key,
                signing_key: f.signing_key,
            })
            .collect();

        // Load groups from DB
        self.load_groups_from_db();

        // Load communities from DB
        self.load_communities_from_db();

        // Phrase is valid — go directly to Chat
        self.screen = Screen::Chat {
            info: DashboardInfo {
                display_name: stored.display_name,
                did: stored.did,
                created_at: stored.created_at,
                username: stored.username,
                linked_platform: stored.linked_platform,
                linked_username: stored.linked_username,
            },
            focus: ChatFocus::Sidebar,
            friends,
            selected_friend: 0,
            active_conversation: None,
        };
    }

    /// Handle a key event, dispatching to the current screen's handler.
    /// Returns an `AsyncAction` if the main loop needs to spawn async work.
    pub fn handle_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        // Clear error on any key press
        self.error_message = None;

        match &self.screen {
            Screen::Welcome => self.handle_welcome_key(key),
            Screen::CreateName => self.handle_create_name_key(key),
            Screen::CreatePhrase { .. } => self.handle_create_phrase_key(key),
            Screen::CreateConfirm { .. } => self.handle_create_confirm_key(key),
            Screen::ImportPhrase => self.handle_import_phrase_key(key),
            Screen::ImportName { .. } => self.handle_import_name_key(key),
            Screen::ProfileImportSelect { .. } => self.handle_profile_import_select_key(key),
            Screen::ProfileImportLoading { .. } => self.handle_profile_import_loading_key(key),
            Screen::ProfileImportSuccess { .. } => self.handle_profile_import_success_key(key),
            Screen::UsernameRegister { .. } => self.handle_username_register_key(key),
            Screen::UsernameSuccess { .. } => self.handle_username_success_key(key),
            Screen::DiscoveryOptIn { .. } => self.handle_discovery_optin_key(key),
            Screen::Chat { .. } => self.handle_chat_key(key),
            Screen::AddFriend { .. } => self.handle_add_friend_key(key),
            Screen::FriendRequests { .. } => self.handle_friend_requests_key(key),
            Screen::CreateGroup { .. } => self.handle_create_group_key(key),
            Screen::CreateCommunity { .. } => self.handle_create_community_key(key),
            Screen::CommunityMembers { .. } => self.handle_community_members_key(key),
            Screen::CommunityRoles { .. } => self.handle_community_roles_key(key),
            Screen::MemberActions { .. } => self.handle_member_actions_key(key),
            Screen::CommunityInvites { .. } => self.handle_community_invites_key(key),
            Screen::JoinCommunity { .. } => self.handle_join_community_key(key),
        }
    }

    /// Called on every tick (~250ms). Returns an AsyncAction if polling is needed.
    pub fn tick(&mut self) -> Option<AsyncAction> {
        // Advance spinner
        self.spinner_frame = (self.spinner_frame + 1) % 4;
        self.tick_counter = self.tick_counter.wrapping_add(1);

        // Advance welcome screen animation
        if matches!(self.screen, Screen::Welcome) {
            self.welcome_tick = self.welcome_tick.saturating_add(1);
        }

        // Expire typing indicators older than 4 seconds
        let now = Instant::now();
        self.typing_peers.retain(|_, ts| now.duration_since(*ts).as_secs() < 4);

        // Poll for profile import result every ~2 seconds (8 ticks at 250ms)
        if self.polling_active && self.tick_counter % 8 == 0 {
            if let Screen::ProfileImportLoading { state, poll_count, .. } = &self.screen {
                if *poll_count < 60 {
                    return Some(AsyncAction::PollProfileImport {
                        state: state.clone(),
                    });
                }
            }
        }

        None
    }

    /// Handle the result of an async operation.
    /// May return another AsyncAction for chained operations (e.g., link after import).
    pub fn handle_async_result(&mut self, result: AsyncResult) -> Option<AsyncAction> {
        match result {
            AsyncResult::ProfileImportStarted { redirect_url, state } => {
                // Open browser and transition to loading screen
                let _ = open::that(&redirect_url);

                if let Screen::ProfileImportSelect { did, display_name } = &self.screen {
                    let platform = PLATFORMS[self.selected_platform].0.to_string();
                    self.screen = Screen::ProfileImportLoading {
                        did: did.clone(),
                        display_name: display_name.clone(),
                        platform,
                        state,
                        poll_count: 0,
                    };
                    self.polling_active = true;
                    self.tick_counter = 0;
                }
                None
            }

            AsyncResult::ProfileImportResult { profile } => {
                if let Some(profile) = profile {
                    self.polling_active = false;

                    if let Screen::ProfileImportLoading { did, display_name, platform, .. } =
                        &self.screen
                    {
                        let did = did.clone();
                        let display_name = display_name.clone();
                        let platform = platform.clone();
                        let platform_username = profile.username.clone();
                        let platform_id = profile.platform_id.clone();

                        self.screen = Screen::ProfileImportSuccess {
                            did: did.clone(),
                            display_name,
                            platform: platform.clone(),
                            platform_username: platform_username.clone(),
                            platform_id: platform_id.clone(),
                        };

                        // Auto-link the account
                        return Some(AsyncAction::LinkAccount {
                            did,
                            platform,
                            platform_id,
                            username: platform_username,
                        });
                    }
                } else {
                    // Still waiting — increment poll count
                    if let Screen::ProfileImportLoading { poll_count, .. } = &mut self.screen {
                        *poll_count += 1;
                        if *poll_count >= 60 {
                            self.polling_active = false;
                            self.error_message =
                                Some("Sign-in timed out. Please try again.".into());
                            // Go back to select screen
                            if let Screen::ProfileImportLoading { did, display_name, .. } =
                                &self.screen
                            {
                                let did = did.clone();
                                let display_name = display_name.clone();
                                self.screen = Screen::ProfileImportSelect { did, display_name };
                            }
                        }
                    }
                }
                None
            }

            AsyncResult::ProfileImportError(msg) => {
                self.polling_active = false;
                self.error_message = Some(msg);
                // Go back to select screen
                if let Screen::ProfileImportLoading { did, display_name, .. } = &self.screen {
                    let did = did.clone();
                    let display_name = display_name.clone();
                    self.screen = Screen::ProfileImportSelect { did, display_name };
                }
                None
            }

            AsyncResult::AccountLinked => {
                // Persist linked account to DB
                if let Some(ref db) = self.db {
                    if let Screen::ProfileImportSuccess {
                        platform,
                        platform_username,
                        ..
                    } = &self.screen
                    {
                        let _ = db.update_linked_account(platform, platform_username);
                    }
                }
                None
            }

            AsyncResult::AccountLinkError(msg) => {
                // Non-fatal — just show error, user can still continue
                self.error_message = Some(format!("Account link warning: {msg}"));
                None
            }

            AsyncResult::UsernameRegistered { username } => {
                // Persist username to DB
                if let Some(ref db) = self.db {
                    let _ = db.update_username(&username);
                }
                if let Screen::UsernameRegister {
                    did,
                    display_name,
                    linked_platform,
                    linked_username,
                } = &self.screen
                {
                    self.screen = Screen::UsernameSuccess {
                        did: did.clone(),
                        display_name: display_name.clone(),
                        username,
                        linked_platform: linked_platform.clone(),
                        linked_username: linked_username.clone(),
                    };
                }
                None
            }

            AsyncResult::UsernameError(msg) => {
                self.error_message = Some(msg);
                None
            }

            AsyncResult::DiscoveryUpdated => {
                // Persist discovery setting to DB
                if let Some(ref db) = self.db {
                    let _ = db.update_discoverable(self.discovery_choice);
                }
                self.go_to_chat();
                None
            }

            AsyncResult::DiscoveryError(msg) => {
                // Non-fatal — show error, still go to chat
                self.error_message = Some(format!("Discovery warning: {msg}"));
                self.go_to_chat();
                None
            }

            AsyncResult::UserSearchResult { results } => {
                self.searching = false;
                if results.is_empty() {
                    self.error_message = Some("No users found".into());
                }
                self.search_results = results;
                self.selected_result = 0;
                None
            }

            AsyncResult::UserSearchError(msg) => {
                self.error_message = Some(msg);
                None
            }
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    /// Handle common text input keys (used by name/username entry screens).
    pub(super) fn handle_text_input(&mut self, key: KeyEvent) {
        match key.code {
            KeyCode::Backspace => {
                if self.cursor_pos > 0 {
                    self.input.remove(self.cursor_pos - 1);
                    self.cursor_pos -= 1;
                }
            }
            KeyCode::Left => {
                if self.cursor_pos > 0 {
                    self.cursor_pos -= 1;
                }
            }
            KeyCode::Right => {
                if self.cursor_pos < self.input.len() {
                    self.cursor_pos += 1;
                }
            }
            KeyCode::Char(c) => {
                if self.input.len() < 32 {
                    self.input.insert(self.cursor_pos, c);
                    self.cursor_pos += 1;
                }
            }
            _ => {}
        }
    }

    /// Build a DashboardInfo from current screen state and transition to Chat.
    pub(super) fn go_to_chat(&mut self) {
        let (did, display_name, username, linked_platform, linked_username) = match &self.screen {
            Screen::DiscoveryOptIn {
                did,
                display_name,
                username,
                linked_platform,
                linked_username,
            } => (
                did.clone(),
                display_name.clone(),
                username.clone(),
                linked_platform.clone(),
                linked_username.clone(),
            ),
            // Fallback for direct transitions
            Screen::ProfileImportSelect { did, display_name } => {
                (did.clone(), display_name.clone(), None, None, None)
            }
            Screen::UsernameRegister {
                did, display_name, ..
            } => (did.clone(), display_name.clone(), None, None, None),
            _ => return,
        };

        self.screen = Screen::Chat {
            info: DashboardInfo {
                display_name,
                did,
                created_at: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_secs() as i64)
                    .unwrap_or(0),
                username,
                linked_platform,
                linked_username,
            },
            focus: ChatFocus::Sidebar,
            friends: Vec::new(),
            selected_friend: 0,
            active_conversation: None,
        };
    }

    // ── DB loading helpers ──────────────────────────────────────────────

    /// Load all pending friend requests from the local DB.
    pub(super) fn load_requests_from_db(&self) -> Vec<FriendRequestEntry> {
        let db = match &self.db {
            Some(db) => db,
            None => return Vec::new(),
        };

        let mut all = Vec::new();

        if let Ok(incoming) = db.load_friend_requests("incoming") {
            for r in incoming {
                all.push(FriendRequestEntry {
                    id: r.id,
                    display_name: r.display_name,
                    did: r.did,
                    username: r.username,
                    direction: RequestTab::Incoming,
                    encryption_key: r.encryption_key,
                    signing_key: r.signing_key,
                });
            }
        }

        if let Ok(outgoing) = db.load_friend_requests("outgoing") {
            for r in outgoing {
                all.push(FriendRequestEntry {
                    id: r.id,
                    display_name: r.display_name,
                    did: r.did,
                    username: r.username,
                    direction: RequestTab::Outgoing,
                    encryption_key: r.encryption_key,
                    signing_key: r.signing_key,
                });
            }
        }

        all
    }

    /// Load all blocked users from the local DB.
    pub(super) fn load_blocked_from_db(&self) -> Vec<BlockedEntry> {
        let db = match &self.db {
            Some(db) => db,
            None => return Vec::new(),
        };

        db.load_blocked_users()
            .unwrap_or_default()
            .into_iter()
            .map(|b| BlockedEntry {
                did: b.did,
                display_name: b.display_name,
                username: b.username,
            })
            .collect()
    }

    /// Load all groups from the local DB and populate in-memory list.
    pub(super) fn load_groups_from_db(&mut self) {
        let db = match &self.db {
            Some(db) => db,
            None => return,
        };

        let stored_groups = db.load_groups().unwrap_or_default();
        self.groups = stored_groups
            .into_iter()
            .map(|g| {
                let members = db
                    .load_group_members(&g.id)
                    .unwrap_or_default()
                    .into_iter()
                    .map(|m| GroupMemberEntry {
                        did: m.did,
                        display_name: m.display_name,
                    })
                    .collect();
                let last_message_at = db.group_last_message_at(&g.id);
                GroupEntry {
                    id: g.id,
                    name: g.name,
                    description: g.description,
                    created_by: g.created_by,
                    members,
                    last_message_at,
                }
            })
            .collect();

        // Sort by last message time (most recent first)
        self.groups.sort_by(|a, b| {
            b.last_message_at.unwrap_or(0).cmp(&a.last_message_at.unwrap_or(0))
        });
    }

    // ── Identity operations ────────────────────────────────────────────

    pub(super) fn create_identity(
        &mut self,
        name: &str,
    ) -> Result<(Identity, RecoveryPhrase), umbra_core::Error> {
        let (identity, phrase) = Identity::create(name.to_string())?;

        // Keep the identity for encryption
        self.my_did = Some(identity.did_string());
        self.identity = match identity.clone_for_service() {
            Ok(cloned) => Some(cloned),
            Err(_) => None,
        };

        Ok((identity, phrase))
    }

    pub(super) fn do_import(
        &mut self,
        words: &[&str],
        name: &str,
    ) -> Result<DashboardInfo, umbra_core::Error> {
        let phrase = RecoveryPhrase::from_words(words)?;
        let identity = Identity::from_recovery_phrase(&phrase, name.to_string())?;

        // Keep the identity for encryption
        self.my_did = Some(identity.did_string());
        self.identity = match identity.clone_for_service() {
            Ok(cloned) => Some(cloned),
            Err(_) => None,
        };

        Ok(DashboardInfo {
            display_name: identity.profile().display_name.clone(),
            did: identity.did().to_string(),
            created_at: identity.created_at(),
            username: None,
            linked_platform: None,
            linked_username: None,
        })
    }
}
