//! Application state machine.
//!
//! Manages screen transitions, input state, and dispatches
//! key events to the appropriate screen handler. Returns
//! `Option<AsyncAction>` when async work (HTTP calls) is needed.

use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use umbra_core::identity::{Identity, RecoveryPhrase};

use crate::api::ImportedProfile;
use crate::db::Db;

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
    Sidebar,
    MainArea,
}

/// A friend entry for the sidebar list.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct FriendEntry {
    pub did: String,
    pub display_name: String,
    pub username: Option<String>,
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
}

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

        if Identity::from_recovery_phrase(&phrase, stored.display_name.clone()).is_err() {
            return;
        }

        // Load friends from DB
        let friends: Vec<FriendEntry> = db
            .load_friends()
            .unwrap_or_default()
            .into_iter()
            .map(|f| FriendEntry {
                did: f.did,
                display_name: f.display_name,
                username: f.username,
            })
            .collect();

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

    // ── Screen handlers ────────────────────────────────────────────────

    fn handle_welcome_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        // If intro animation is still playing, any key skips to idle
        const INTRO_END: usize = 8; // RESOLVE_TICKS
        if self.welcome_tick < INTRO_END {
            self.welcome_tick = INTRO_END;
            return None;
        }

        match key.code {
            KeyCode::Char('1') | KeyCode::Char('c') => {
                self.input.clear();
                self.cursor_pos = 0;
                self.screen = Screen::CreateName;
            }
            KeyCode::Char('2') | KeyCode::Char('i') => {
                self.word_inputs = Default::default();
                self.active_word = 0;
                self.screen = Screen::ImportPhrase;
            }
            KeyCode::Char('q') | KeyCode::Esc => {
                self.should_quit = true;
            }
            _ => {}
        }
        None
    }

    fn handle_create_name_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Enter => {
                let name = self.input.trim().to_string();
                if name.is_empty() {
                    self.error_message = Some("Display name cannot be empty".into());
                    return None;
                }
                match self.create_identity(&name) {
                    Ok((_, phrase)) => {
                        let words = phrase.words().iter().map(|w| w.to_string()).collect();
                        self.screen = Screen::CreatePhrase {
                            name,
                            phrase: words,
                        };
                    }
                    Err(e) => {
                        self.error_message = Some(format!("Failed to create identity: {e}"));
                    }
                }
            }
            KeyCode::Esc => {
                self.welcome_tick = 100; // Skip intro on return
                self.screen = Screen::Welcome;
            }
            _ => {
                self.handle_text_input(key);
            }
        }
        None
    }

    fn handle_create_phrase_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Enter => {
                if let Screen::CreatePhrase { name, phrase } = &self.screen {
                    let name = name.clone();
                    let phrase = phrase.clone();
                    self.confirmed_backup = false;
                    self.screen = Screen::CreateConfirm { name, phrase };
                }
            }
            KeyCode::Esc => {
                self.welcome_tick = 100; // Skip intro on return
                self.screen = Screen::Welcome;
            }
            _ => {}
        }
        None
    }

    fn handle_create_confirm_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Char(' ') => {
                self.confirmed_backup = !self.confirmed_backup;
            }
            KeyCode::Enter => {
                if !self.confirmed_backup {
                    self.error_message =
                        Some("You must confirm you've backed up your phrase".into());
                    return None;
                }
                // Transition to profile import instead of dashboard
                if let Screen::CreateConfirm { name, phrase } = &self.screen {
                    let phrase_str = phrase.join(" ");
                    let word_refs: Vec<&str> = phrase.iter().map(|w| w.as_str()).collect();
                    match self.do_import(&word_refs, name) {
                        Ok(info) => {
                            // Persist identity to DB
                            if let Some(ref db) = self.db {
                                let _ = db.save_identity(
                                    &phrase_str,
                                    &info.display_name,
                                    &info.did,
                                    info.created_at,
                                );
                            }
                            self.selected_platform = 0;
                            self.screen = Screen::ProfileImportSelect {
                                did: info.did,
                                display_name: info.display_name,
                            };
                        }
                        Err(e) => {
                            self.error_message =
                                Some(format!("Failed to restore identity: {e}"));
                        }
                    }
                }
            }
            KeyCode::Esc => {
                if let Screen::CreateConfirm { name, phrase } = &self.screen {
                    let name = name.clone();
                    let phrase = phrase.clone();
                    self.screen = Screen::CreatePhrase { name, phrase };
                }
            }
            _ => {}
        }
        None
    }

    fn handle_import_phrase_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Esc => {
                self.welcome_tick = 100; // Skip intro on return
                self.screen = Screen::Welcome;
            }
            KeyCode::Tab => {
                if self.active_word < 23 {
                    self.active_word += 1;
                }
            }
            KeyCode::BackTab => {
                if self.active_word > 0 {
                    self.active_word -= 1;
                }
            }
            KeyCode::Enter => {
                let filled = self.word_inputs.iter().all(|w| !w.trim().is_empty());
                if !filled {
                    self.error_message = Some("Please fill in all 24 words".into());
                    return None;
                }
                let words: Vec<String> = self
                    .word_inputs
                    .iter()
                    .map(|w| w.trim().to_lowercase())
                    .collect();
                let phrase_str = words.join(" ");
                match RecoveryPhrase::validate(&phrase_str) {
                    Ok(()) => {
                        self.input.clear();
                        self.cursor_pos = 0;
                        self.screen = Screen::ImportName { phrase: words };
                    }
                    Err(e) => {
                        self.error_message =
                            Some(format!("Invalid recovery phrase: {e}"));
                    }
                }
            }
            KeyCode::Backspace => {
                let word = &mut self.word_inputs[self.active_word];
                if !word.is_empty() {
                    word.pop();
                } else if self.active_word > 0 {
                    self.active_word -= 1;
                }
            }
            KeyCode::Char(' ') => {
                if !self.word_inputs[self.active_word].is_empty() && self.active_word < 23 {
                    self.active_word += 1;
                }
            }
            KeyCode::Char('v') if key.modifiers.contains(KeyModifiers::CONTROL) => {
                // Ctrl+V paste placeholder
            }
            KeyCode::Char(c) => {
                let word = &mut self.word_inputs[self.active_word];
                if word.len() < 12 && c.is_ascii_lowercase() {
                    word.push(c);
                } else if c.is_ascii_uppercase() {
                    word.push(c.to_ascii_lowercase());
                }
            }
            _ => {}
        }
        None
    }

    fn handle_import_name_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Enter => {
                let name = self.input.trim().to_string();
                if name.is_empty() {
                    self.error_message = Some("Display name cannot be empty".into());
                    return None;
                }
                if let Screen::ImportName { phrase } = &self.screen {
                    let phrase_str = phrase.join(" ");
                    let word_refs: Vec<&str> = phrase.iter().map(|w| w.as_str()).collect();
                    match self.do_import(&word_refs, &name) {
                        Ok(info) => {
                            // Persist identity to DB
                            if let Some(ref db) = self.db {
                                let _ = db.save_identity(
                                    &phrase_str,
                                    &info.display_name,
                                    &info.did,
                                    info.created_at,
                                );
                            }
                            // Go to profile import instead of dashboard
                            self.selected_platform = 0;
                            self.screen = Screen::ProfileImportSelect {
                                did: info.did,
                                display_name: info.display_name,
                            };
                        }
                        Err(e) => {
                            self.error_message =
                                Some(format!("Failed to import identity: {e}"));
                        }
                    }
                }
            }
            KeyCode::Esc => {
                self.word_inputs = Default::default();
                self.active_word = 0;
                self.screen = Screen::ImportPhrase;
            }
            _ => {
                self.handle_text_input(key);
            }
        }
        None
    }

    fn handle_profile_import_select_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Up => {
                if self.selected_platform > 0 {
                    self.selected_platform -= 1;
                }
            }
            KeyCode::Down => {
                if self.selected_platform < PLATFORMS.len() - 1 {
                    self.selected_platform += 1;
                }
            }
            KeyCode::Char('1') => self.selected_platform = 0,
            KeyCode::Char('2') => self.selected_platform = 1,
            KeyCode::Char('3') => self.selected_platform = 2,
            KeyCode::Char('4') => self.selected_platform = 3,
            KeyCode::Enter => {
                let platform = PLATFORMS[self.selected_platform].0.to_string();
                if let Screen::ProfileImportSelect { did, .. } = &self.screen {
                    return Some(AsyncAction::StartProfileImport {
                        platform,
                        did: Some(did.clone()),
                    });
                }
            }
            KeyCode::Char('s') => {
                // Skip — go to username registration
                if let Screen::ProfileImportSelect { did, display_name } = &self.screen {
                    self.input.clear();
                    self.cursor_pos = 0;
                    self.screen = Screen::UsernameRegister {
                        did: did.clone(),
                        display_name: display_name.clone(),
                        linked_platform: None,
                        linked_username: None,
                    };
                }
            }
            KeyCode::Esc => {
                self.welcome_tick = 100; // Skip intro on return
                self.screen = Screen::Welcome;
            }
            _ => {}
        }
        None
    }

    fn handle_profile_import_loading_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Esc => {
                self.polling_active = false;
                if let Screen::ProfileImportLoading { did, display_name, .. } = &self.screen {
                    let did = did.clone();
                    let display_name = display_name.clone();
                    self.selected_platform = 0;
                    self.screen = Screen::ProfileImportSelect { did, display_name };
                }
            }
            _ => {}
        }
        None
    }

    fn handle_profile_import_success_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Enter => {
                if let Screen::ProfileImportSuccess {
                    did,
                    display_name,
                    platform,
                    platform_username,
                    ..
                } = &self.screen
                {
                    self.input.clear();
                    self.cursor_pos = 0;
                    self.screen = Screen::UsernameRegister {
                        did: did.clone(),
                        display_name: display_name.clone(),
                        linked_platform: Some(platform.clone()),
                        linked_username: Some(platform_username.clone()),
                    };
                }
            }
            KeyCode::Esc => {
                if let Screen::ProfileImportSuccess { did, display_name, .. } = &self.screen {
                    let did = did.clone();
                    let display_name = display_name.clone();
                    self.selected_platform = 0;
                    self.screen = Screen::ProfileImportSelect { did, display_name };
                }
            }
            _ => {}
        }
        None
    }

    fn handle_username_register_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Enter => {
                let name = self.input.trim().to_string();
                if name.is_empty() {
                    self.error_message = Some("Username cannot be empty".into());
                    return None;
                }
                if let Screen::UsernameRegister { did, .. } = &self.screen {
                    return Some(AsyncAction::RegisterUsername {
                        did: did.clone(),
                        name,
                    });
                }
            }
            KeyCode::Char('s') if self.input.is_empty() => {
                // Skip — go to discovery
                if let Screen::UsernameRegister {
                    did,
                    display_name,
                    linked_platform,
                    linked_username,
                } = &self.screen
                {
                    self.screen = Screen::DiscoveryOptIn {
                        did: did.clone(),
                        display_name: display_name.clone(),
                        username: None,
                        linked_platform: linked_platform.clone(),
                        linked_username: linked_username.clone(),
                    };
                }
            }
            KeyCode::Esc => {
                if let Screen::UsernameRegister { did, display_name, .. } = &self.screen {
                    let did = did.clone();
                    let display_name = display_name.clone();
                    self.selected_platform = 0;
                    self.screen = Screen::ProfileImportSelect { did, display_name };
                }
            }
            _ => {
                self.handle_text_input(key);
            }
        }
        None
    }

    fn handle_username_success_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Enter => {
                if let Screen::UsernameSuccess {
                    did,
                    display_name,
                    username,
                    linked_platform,
                    linked_username,
                } = &self.screen
                {
                    self.discovery_choice = true;
                    self.screen = Screen::DiscoveryOptIn {
                        did: did.clone(),
                        display_name: display_name.clone(),
                        username: Some(username.clone()),
                        linked_platform: linked_platform.clone(),
                        linked_username: linked_username.clone(),
                    };
                }
            }
            _ => {}
        }
        None
    }

    fn handle_discovery_optin_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Up | KeyCode::Down => {
                self.discovery_choice = !self.discovery_choice;
            }
            KeyCode::Char('y') => {
                self.discovery_choice = true;
            }
            KeyCode::Char('n') => {
                self.discovery_choice = false;
            }
            KeyCode::Enter => {
                if let Screen::DiscoveryOptIn { did, .. } = &self.screen {
                    return Some(AsyncAction::EnableDiscovery {
                        did: did.clone(),
                        discoverable: self.discovery_choice,
                    });
                }
            }
            KeyCode::Esc => {
                // Go back to username register
                if let Screen::DiscoveryOptIn {
                    did,
                    display_name,
                    linked_platform,
                    linked_username,
                    ..
                } = &self.screen
                {
                    self.input.clear();
                    self.cursor_pos = 0;
                    self.screen = Screen::UsernameRegister {
                        did: did.clone(),
                        display_name: display_name.clone(),
                        linked_platform: linked_platform.clone(),
                        linked_username: linked_username.clone(),
                    };
                }
            }
            _ => {}
        }
        None
    }

    fn handle_chat_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Char('q') => {
                self.should_quit = true;
            }
            KeyCode::Char('a') => {
                // Navigate to Add Friend modal
                if let Screen::Chat { info, friends, selected_friend, .. } = &self.screen {
                    self.input.clear();
                    self.cursor_pos = 0;
                    self.search_results.clear();
                    self.selected_result = 0;
                    self.searching = false;
                    self.screen = Screen::AddFriend {
                        info: info.clone(),
                        friends: friends.clone(),
                        selected_friend: *selected_friend,
                    };
                }
            }
            KeyCode::Char('r') => {
                // Navigate to Friend Requests modal — load from local DB
                if let Screen::Chat { info, friends, selected_friend, .. } = &self.screen {
                    let requests = self.load_requests_from_db();
                    let blocked = self.load_blocked_from_db();
                    self.screen = Screen::FriendRequests {
                        info: info.clone(),
                        friends: friends.clone(),
                        selected_friend: *selected_friend,
                        requests,
                        selected_request: 0,
                        active_tab: RequestTab::Incoming,
                        blocked,
                    };
                }
            }
            KeyCode::Char('x') => {
                // Remove selected friend
                if let Screen::Chat { focus: ChatFocus::Sidebar, friends, selected_friend, .. } = &self.screen {
                    if !friends.is_empty() {
                        let friend = &friends[*selected_friend];
                        if let Some(ref db) = self.db {
                            let _ = db.remove_friend(&friend.did);
                        }
                        // Update screen in-place
                        if let Screen::Chat { friends, selected_friend, active_conversation, .. } = &mut self.screen {
                            friends.remove(*selected_friend);
                            if *selected_friend > 0 && *selected_friend >= friends.len() {
                                *selected_friend = friends.len().saturating_sub(1);
                            }
                            *active_conversation = None;
                        }
                    }
                }
            }
            KeyCode::Char('b') => {
                // Block selected friend
                if let Screen::Chat { focus: ChatFocus::Sidebar, friends, selected_friend, .. } = &self.screen {
                    if !friends.is_empty() {
                        let friend = &friends[*selected_friend];
                        if let Some(ref db) = self.db {
                            let _ = db.block_user(
                                &friend.did,
                                Some(&friend.display_name),
                                friend.username.as_deref(),
                            );
                        }
                        if let Screen::Chat { friends, selected_friend, active_conversation, .. } = &mut self.screen {
                            friends.remove(*selected_friend);
                            if *selected_friend > 0 && *selected_friend >= friends.len() {
                                *selected_friend = friends.len().saturating_sub(1);
                            }
                            *active_conversation = None;
                        }
                    }
                }
            }
            KeyCode::Tab => {
                if let Screen::Chat { focus, .. } = &mut self.screen {
                    *focus = match focus {
                        ChatFocus::Sidebar => ChatFocus::MainArea,
                        ChatFocus::MainArea => ChatFocus::Sidebar,
                    };
                }
            }
            KeyCode::Up => {
                if let Screen::Chat { focus: ChatFocus::Sidebar, selected_friend, friends, .. } = &mut self.screen {
                    if !friends.is_empty() && *selected_friend > 0 {
                        *selected_friend -= 1;
                    }
                }
            }
            KeyCode::Down => {
                if let Screen::Chat { focus: ChatFocus::Sidebar, selected_friend, friends, .. } = &mut self.screen {
                    if !friends.is_empty() && *selected_friend < friends.len() - 1 {
                        *selected_friend += 1;
                    }
                }
            }
            KeyCode::Enter => {
                if let Screen::Chat { focus: ChatFocus::Sidebar, selected_friend, friends, active_conversation, .. } = &mut self.screen {
                    if !friends.is_empty() {
                        *active_conversation = Some(*selected_friend);
                    }
                }
            }
            KeyCode::Esc => {
                if let Screen::Chat { active_conversation, .. } = &mut self.screen {
                    *active_conversation = None;
                }
            }
            _ => {}
        }
        None
    }

    fn handle_add_friend_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Enter => {
                if !self.search_results.is_empty() {
                    // Send a friend request to the selected result
                    let result = self.search_results[self.selected_result].clone();
                    let display_name = result
                        .username
                        .as_deref()
                        .unwrap_or(result.did.as_str())
                        .to_string();

                    // Check if already a friend
                    if let Screen::AddFriend { friends, .. } = &self.screen {
                        if friends.iter().any(|f| f.did == result.did) {
                            self.error_message = Some("Already in your friends list".into());
                            return None;
                        }
                    }

                    // Check if blocked
                    if let Some(ref db) = self.db {
                        if db.is_blocked(&result.did).unwrap_or(false) {
                            self.error_message = Some("This user is blocked".into());
                            return None;
                        }
                        // Check if already has a pending request
                        if db.has_pending_request(&result.did).unwrap_or(false) {
                            self.error_message = Some("Request already pending".into());
                            return None;
                        }
                    }

                    // Generate request ID and save
                    let request_id = format!(
                        "{:x}",
                        std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap_or_default()
                            .as_nanos()
                    );

                    if let Some(ref db) = self.db {
                        let _ = db.save_friend_request(
                            &request_id,
                            &result.did,
                            &display_name,
                            result.username.as_deref(),
                            "outgoing",
                        );
                    }

                    self.error_message = Some(format!("Friend request sent to {display_name}"));

                    // Return to chat
                    if let Screen::AddFriend { info, friends, selected_friend } = &self.screen {
                        self.search_results.clear();
                        self.selected_result = 0;
                        self.searching = false;
                        self.screen = Screen::Chat {
                            info: info.clone(),
                            focus: ChatFocus::Sidebar,
                            friends: friends.clone(),
                            selected_friend: *selected_friend,
                            active_conversation: None,
                        };
                    }
                } else {
                    // Fire search
                    let query = self.input.trim().to_string();
                    if query.is_empty() {
                        self.error_message = Some("Enter a username or DID".into());
                        return None;
                    }
                    self.searching = true;
                    return Some(AsyncAction::SearchUser { query });
                }
            }
            KeyCode::Up => {
                if !self.search_results.is_empty() && self.selected_result > 0 {
                    self.selected_result -= 1;
                }
            }
            KeyCode::Down => {
                if !self.search_results.is_empty()
                    && self.selected_result < self.search_results.len() - 1
                {
                    self.selected_result += 1;
                }
            }
            KeyCode::Esc => {
                if !self.search_results.is_empty() {
                    // Clear results, go back to input mode
                    self.search_results.clear();
                    self.selected_result = 0;
                } else {
                    // Return to chat
                    if let Screen::AddFriend { info, friends, selected_friend } = &self.screen {
                        self.screen = Screen::Chat {
                            info: info.clone(),
                            focus: ChatFocus::Sidebar,
                            friends: friends.clone(),
                            selected_friend: *selected_friend,
                            active_conversation: None,
                        };
                    }
                }
            }
            _ => {
                // Any typing clears results to go back to input mode
                if !self.search_results.is_empty() {
                    self.search_results.clear();
                    self.selected_result = 0;
                }
                self.handle_text_input(key);
            }
        }
        None
    }

    fn handle_friend_requests_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Tab => {
                if let Screen::FriendRequests { active_tab, selected_request, .. } = &mut self.screen {
                    *active_tab = match active_tab {
                        RequestTab::Incoming => RequestTab::Outgoing,
                        RequestTab::Outgoing => RequestTab::Blocked,
                        RequestTab::Blocked => RequestTab::Incoming,
                    };
                    *selected_request = 0;
                }
            }
            KeyCode::Up => {
                if let Screen::FriendRequests { selected_request, .. } = &mut self.screen {
                    if *selected_request > 0 {
                        *selected_request -= 1;
                    }
                }
            }
            KeyCode::Down => {
                if let Screen::FriendRequests { selected_request, requests, active_tab, blocked, .. } = &mut self.screen {
                    let count = match active_tab {
                        RequestTab::Blocked => blocked.len(),
                        _ => requests.iter().filter(|r| r.direction == *active_tab).count(),
                    };
                    if count > 0 && *selected_request < count - 1 {
                        *selected_request += 1;
                    }
                }
            }
            KeyCode::Enter | KeyCode::Char('a') => {
                // Accept incoming request
                if let Screen::FriendRequests { active_tab: RequestTab::Incoming, requests, selected_request, friends: _, .. } = &self.screen {
                    let incoming: Vec<_> = requests.iter().filter(|r| r.direction == RequestTab::Incoming).collect();
                    if let Some(req) = incoming.get(*selected_request) {
                        let req = (*req).clone();
                        // Add to friends
                        if let Some(ref db) = self.db {
                            let _ = db.save_friend(&req.did, &req.display_name, req.username.as_deref());
                            let _ = db.delete_friend_request(&req.id);
                        }
                        // Update screen
                        if let Screen::FriendRequests { requests, friends, selected_request, .. } = &mut self.screen {
                            friends.insert(0, FriendEntry {
                                did: req.did,
                                display_name: req.display_name.clone(),
                                username: req.username,
                            });
                            requests.retain(|r| r.id != req.id);
                            *selected_request = 0;
                        }
                        self.error_message = Some(format!("{} added as friend", req.display_name));
                    }
                }
            }
            KeyCode::Char('x') => {
                // Reject incoming or cancel outgoing
                if let Screen::FriendRequests { active_tab, requests, selected_request, .. } = &self.screen {
                    if *active_tab == RequestTab::Incoming || *active_tab == RequestTab::Outgoing {
                        let filtered: Vec<_> = requests.iter().filter(|r| r.direction == *active_tab).collect();
                        if let Some(req) = filtered.get(*selected_request) {
                            let req_id = req.id.clone();
                            let display = req.display_name.clone();
                            let is_incoming = *active_tab == RequestTab::Incoming;
                            if let Some(ref db) = self.db {
                                let _ = db.delete_friend_request(&req_id);
                            }
                            if let Screen::FriendRequests { requests, selected_request, .. } = &mut self.screen {
                                requests.retain(|r| r.id != req_id);
                                *selected_request = 0;
                            }
                            self.error_message = Some(if is_incoming {
                                format!("Rejected request from {display}")
                            } else {
                                format!("Cancelled request to {display}")
                            });
                        }
                    }
                }
            }
            KeyCode::Char('b') => {
                // Block user from incoming or outgoing tab
                if let Screen::FriendRequests { active_tab, requests, selected_request, .. } = &self.screen {
                    if *active_tab == RequestTab::Incoming || *active_tab == RequestTab::Outgoing {
                        let filtered: Vec<_> = requests.iter().filter(|r| r.direction == *active_tab).collect();
                        if let Some(req) = filtered.get(*selected_request) {
                            let did = req.did.clone();
                            let display = req.display_name.clone();
                            let username = req.username.clone();
                            if let Some(ref db) = self.db {
                                let _ = db.block_user(&did, Some(&display), username.as_deref());
                            }
                            if let Screen::FriendRequests { requests, selected_request, blocked, friends, .. } = &mut self.screen {
                                requests.retain(|r| r.did != did);
                                friends.retain(|f| f.did != did);
                                blocked.push(BlockedEntry {
                                    did,
                                    display_name: Some(display.clone()),
                                    username,
                                });
                                *selected_request = 0;
                            }
                            self.error_message = Some(format!("Blocked {display}"));
                        }
                    }
                }
            }
            KeyCode::Char('u') => {
                // Unblock user from blocked tab
                if let Screen::FriendRequests { active_tab: RequestTab::Blocked, blocked, selected_request, .. } = &self.screen {
                    if let Some(entry) = blocked.get(*selected_request) {
                        let did = entry.did.clone();
                        let display = entry.display_name.clone().unwrap_or_else(|| did[..16.min(did.len())].to_string());
                        if let Some(ref db) = self.db {
                            let _ = db.unblock_user(&did);
                        }
                        if let Screen::FriendRequests { blocked, selected_request, .. } = &mut self.screen {
                            blocked.retain(|b| b.did != did);
                            if *selected_request > 0 && *selected_request >= blocked.len() {
                                *selected_request = blocked.len().saturating_sub(1);
                            }
                        }
                        self.error_message = Some(format!("Unblocked {display}"));
                    }
                }
            }
            KeyCode::Esc => {
                if let Screen::FriendRequests { info, friends, selected_friend, .. } = &self.screen {
                    self.screen = Screen::Chat {
                        info: info.clone(),
                        focus: ChatFocus::Sidebar,
                        friends: friends.clone(),
                        selected_friend: *selected_friend,
                        active_conversation: None,
                    };
                }
            }
            _ => {}
        }
        None
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    /// Handle common text input keys (used by name/username entry screens).
    fn handle_text_input(&mut self, key: KeyEvent) {
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
    fn go_to_chat(&mut self) {
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
    fn load_requests_from_db(&self) -> Vec<FriendRequestEntry> {
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
                });
            }
        }

        all
    }

    /// Load all blocked users from the local DB.
    fn load_blocked_from_db(&self) -> Vec<BlockedEntry> {
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

    // ── Identity operations ────────────────────────────────────────────

    fn create_identity(
        &self,
        name: &str,
    ) -> Result<(Identity, RecoveryPhrase), umbra_core::Error> {
        Identity::create(name.to_string())
    }

    fn do_import(
        &self,
        words: &[&str],
        name: &str,
    ) -> Result<DashboardInfo, umbra_core::Error> {
        let phrase = RecoveryPhrase::from_words(words)?;
        let identity = Identity::from_recovery_phrase(&phrase, name.to_string())?;
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
