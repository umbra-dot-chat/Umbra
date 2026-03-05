use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};

use super::App;
use crate::app::types::{InputMode, PaneFocus, TestStatus};

impl App {
    /// Handle a key event, dispatching based on the current input mode.
    pub fn handle_key(&mut self, key: KeyEvent) {
        match self.input_mode {
            InputMode::Normal => self.handle_normal_key(key),
            InputMode::Search => self.handle_search_key(key),
            InputMode::Help => self.handle_help_key(key),
            InputMode::DetoxPrompt => self.handle_detox_prompt_key(key),
        }
    }

    /// Handle keys in normal mode.
    fn handle_normal_key(&mut self, key: KeyEvent) {
        // Ctrl+C: cancel or quit.
        if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('c') {
            if self.is_running() {
                self.cancel_running();
            } else {
                self.should_quit = true;
            }
            return;
        }

        match key.code {
            // Quit.
            KeyCode::Char('q') => {
                self.should_quit = true;
            }

            // Navigation.
            KeyCode::Char('j') | KeyCode::Down => {
                self.move_cursor_down();
            }
            KeyCode::Char('k') | KeyCode::Up => {
                self.move_cursor_up();
            }

            // Expand / collapse.
            KeyCode::Char('l') | KeyCode::Right => {
                self.expand_current();
            }
            KeyCode::Char('h') | KeyCode::Left => {
                self.collapse_current();
            }

            // Selection.
            KeyCode::Char(' ') => {
                self.toggle_selection();
            }
            KeyCode::Char('a') => {
                self.select_all_in_category();
            }
            KeyCode::Char('A') => {
                self.select_all();
            }
            KeyCode::Char('c') => {
                self.clear_selection();
            }

            // Run.
            KeyCode::Enter => {
                self.run_selected();
            }

            // Re-run failed.
            KeyCode::Char('r') => {
                self.rerun_failed();
            }

            // Kill all running processes.
            KeyCode::Char('K') => {
                if self.is_running() {
                    self.kill_all();
                }
            }

            // View output history for a completed test.
            KeyCode::Char('v') if self.pane_focus == PaneFocus::Tree => {
                if let Some(node) = self.visible_nodes.get(self.cursor) {
                    if matches!(node.status, TestStatus::Passed | TestStatus::Failed) {
                        let id = node.id.clone();
                        self.view_test_output(&id);
                    }
                }
            }

            // Switch pane.
            KeyCode::Tab => {
                self.toggle_pane_focus();
            }

            // Search mode.
            KeyCode::Char('/') => {
                self.input_mode = InputMode::Search;
                self.search_query.clear();
            }

            // Help overlay.
            KeyCode::Char('?') => {
                self.input_mode = InputMode::Help;
            }

            // Open screenshot (when output pane is focused).
            KeyCode::Char('o') if self.pane_focus == PaneFocus::Output => {
                self.open_screenshot();
            }

            // Page up/down for output scrolling.
            KeyCode::PageUp if self.pane_focus == PaneFocus::Output => {
                self.scroll_output_up(10);
            }
            KeyCode::PageDown if self.pane_focus == PaneFocus::Output => {
                self.scroll_output_down(10);
            }

            // Home/End for tree.
            KeyCode::Home => {
                self.cursor = 0;
            }
            KeyCode::End => {
                if !self.visible_nodes.is_empty() {
                    self.cursor = self.visible_nodes.len() - 1;
                }
            }

            _ => {}
        }
    }

    /// Handle keys in search mode.
    fn handle_search_key(&mut self, key: KeyEvent) {
        match key.code {
            KeyCode::Esc => {
                self.input_mode = InputMode::Normal;
                self.search_query.clear();
                self.rebuild_visible_nodes();
            }
            KeyCode::Enter => {
                self.input_mode = InputMode::Normal;
                // Keep the filter active.
            }
            KeyCode::Backspace => {
                self.search_query.pop();
                self.rebuild_visible_nodes();
            }
            KeyCode::Char(c) => {
                self.search_query.push(c);
                self.rebuild_visible_nodes();
            }
            // Allow navigation while searching.
            KeyCode::Down => {
                self.move_cursor_down();
            }
            KeyCode::Up => {
                self.move_cursor_up();
            }
            _ => {}
        }
    }

    /// Handle keys in help overlay.
    fn handle_help_key(&mut self, key: KeyEvent) {
        match key.code {
            KeyCode::Esc | KeyCode::Char('?') | KeyCode::Char('q') => {
                self.input_mode = InputMode::Normal;
            }
            _ => {}
        }
    }

    /// Handle keys in Detox configuration prompt.
    fn handle_detox_prompt_key(&mut self, key: KeyEvent) {
        match key.code {
            KeyCode::Esc => {
                self.input_mode = InputMode::Normal;
                self.detox_prompt_selection = 0;
            }
            KeyCode::Char('j') | KeyCode::Down => {
                self.detox_prompt_selection = (self.detox_prompt_selection + 1) % 2;
            }
            KeyCode::Char('k') | KeyCode::Up => {
                self.detox_prompt_selection = (self.detox_prompt_selection + 1) % 2;
            }
            KeyCode::Enter | KeyCode::Char(' ') => {
                self.confirm_detox_config();
            }
            KeyCode::Char('1') | KeyCode::Char('d') => {
                self.detox_prompt_selection = 0;
                self.confirm_detox_config();
            }
            KeyCode::Char('2') | KeyCode::Char('r') => {
                self.detox_prompt_selection = 1;
                self.confirm_detox_config();
            }
            _ => {}
        }
    }

    // ── Navigation helpers ──────────────────────────────────────────────────

    fn move_cursor_down(&mut self) {
        if !self.visible_nodes.is_empty() && self.cursor < self.visible_nodes.len() - 1 {
            self.cursor += 1;
        }
    }

    fn move_cursor_up(&mut self) {
        if self.cursor > 0 {
            self.cursor -= 1;
        }
    }

    fn expand_current(&mut self) {
        if let Some(node) = self.visible_nodes.get(self.cursor) {
            if node.has_children && !node.expanded {
                let id = node.id.clone();
                self.set_expanded(&id, true);
                self.rebuild_visible_nodes();
            }
        }
    }

    fn collapse_current(&mut self) {
        if let Some(node) = self.visible_nodes.get(self.cursor) {
            if node.has_children && node.expanded {
                let id = node.id.clone();
                self.set_expanded(&id, false);
                self.rebuild_visible_nodes();
            } else if node.depth > 0 {
                // Move cursor to parent.
                let target_depth = node.depth - 1;
                for i in (0..self.cursor).rev() {
                    if self.visible_nodes[i].depth == target_depth && self.visible_nodes[i].has_children {
                        self.cursor = i;
                        break;
                    }
                }
            }
        }
    }
}
