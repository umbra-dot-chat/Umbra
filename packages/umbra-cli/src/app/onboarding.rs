use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use umbra_core::identity::RecoveryPhrase;

use super::*;

impl App {
    pub(super) fn handle_welcome_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
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

    pub(super) fn handle_create_name_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
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

    pub(super) fn handle_create_phrase_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
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

    pub(super) fn handle_create_confirm_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
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
                    let name = name.clone();
                    let phrase = phrase.clone();
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

    pub(super) fn handle_import_phrase_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
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

    pub(super) fn handle_import_name_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Enter => {
                let name = self.input.trim().to_string();
                if name.is_empty() {
                    self.error_message = Some("Display name cannot be empty".into());
                    return None;
                }
                if let Screen::ImportName { phrase } = &self.screen {
                    let phrase = phrase.clone();
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

    pub(super) fn handle_profile_import_select_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
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

    pub(super) fn handle_profile_import_loading_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
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

    pub(super) fn handle_profile_import_success_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
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

    pub(super) fn handle_username_register_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
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

    pub(super) fn handle_username_success_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
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

    pub(super) fn handle_discovery_optin_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
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
}
