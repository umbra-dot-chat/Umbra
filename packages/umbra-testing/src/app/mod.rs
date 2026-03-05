pub mod input;
pub mod selection;
pub mod types;

use std::collections::{HashMap, HashSet, VecDeque};
use std::path::PathBuf;
use std::time::Instant;

use tokio::sync::{mpsc, watch};

use types::*;

use crate::config::Config;
use crate::discovery;
use crate::event::AppEvent;
use crate::runner::output;

/// The main application state.
pub struct App {
    /// The full test tree (hierarchical).
    pub tree: Vec<TreeNode>,
    /// Flattened visible nodes for rendering.
    pub visible_nodes: Vec<FlatNode>,
    /// Current cursor position in the visible nodes list.
    pub cursor: usize,
    /// Set of selected test IDs.
    pub selected: HashSet<String>,

    /// Queue of tests to run.
    pub run_queue: VecDeque<String>,
    /// Currently running test ID.
    pub running_test: Option<String>,
    /// Live output lines for the current test.
    pub live_output: Vec<OutputLine>,
    /// Stored output per test ID.
    pub output_history: HashMap<String, TestOutput>,
    /// Output scroll offset.
    pub output_scroll: usize,
    /// Whether to auto-scroll to the bottom of output.
    pub output_auto_scroll: bool,

    /// Current input mode.
    pub input_mode: InputMode,
    /// Which pane is focused.
    pub pane_focus: PaneFocus,
    /// Whether the app should quit.
    pub should_quit: bool,

    /// Search query string.
    pub search_query: String,

    /// Detox prompt selection (0=debug, 1=release).
    pub detox_prompt_selection: usize,
    /// The chosen Detox configuration for the current run.
    pub detox_config: DetoxConfig,

    /// Persisted state.
    pub persisted: PersistedState,
    /// Recent runs for display.
    pub recent_runs: Vec<RecentRun>,

    /// Test counts for the status bar.
    pub counts: TestCounts,

    /// Tick counter for animations.
    pub tick_count: usize,

    /// Project root path.
    pub project_root: PathBuf,
    /// Configuration.
    pub config: Config,
    /// Event sender for dispatching runner events.
    pub event_tx: Option<mpsc::UnboundedSender<AppEvent>>,
    /// Cancel sender to kill all running processes.
    pub cancel_tx: Option<watch::Sender<bool>>,
    /// When the current run started (for duration tracking).
    pub run_start: Option<Instant>,
}

impl App {
    /// Create a new App by discovering tests from the project root.
    pub fn new(project_root: PathBuf) -> Self {
        let config = Config::load(&project_root);
        let tree = discovery::discover_all(&project_root, &config);

        let mut app = Self {
            tree,
            visible_nodes: Vec::new(),
            cursor: 0,
            selected: HashSet::new(),
            run_queue: VecDeque::new(),
            running_test: None,
            live_output: Vec::new(),
            output_history: HashMap::new(),
            output_scroll: 0,
            output_auto_scroll: true,
            input_mode: InputMode::Normal,
            pane_focus: PaneFocus::Tree,
            should_quit: false,
            search_query: String::new(),
            detox_prompt_selection: 0,
            detox_config: DetoxConfig::Debug,
            persisted: PersistedState::default(),
            recent_runs: Vec::new(),
            counts: TestCounts::default(),
            tick_count: 0,
            project_root,
            config,
            event_tx: None,
            cancel_tx: None,
            run_start: None,
        };

        // Load persisted state.
        app.load_persisted_state();

        // Build the initial flattened view.
        app.rebuild_visible_nodes();
        app.update_counts();

        app
    }

    /// Rebuild the flattened visible nodes from the tree.
    ///
    /// Respects expanded state and search filter.
    pub fn rebuild_visible_nodes(&mut self) {
        let mut nodes = Vec::new();
        let query = self.search_query.to_lowercase();

        for tree_node in &self.tree {
            Self::flatten_node(tree_node, &mut nodes, &self.selected, &query);
        }

        self.visible_nodes = nodes;

        // Clamp cursor.
        if !self.visible_nodes.is_empty() {
            if self.cursor >= self.visible_nodes.len() {
                self.cursor = self.visible_nodes.len() - 1;
            }
        } else {
            self.cursor = 0;
        }

        self.update_counts();
    }

    /// Recursively flatten a tree node into the visible nodes list.
    fn flatten_node(
        node: &TreeNode,
        out: &mut Vec<FlatNode>,
        selected: &HashSet<String>,
        search_query: &str,
    ) {
        // If searching, filter nodes.
        if !search_query.is_empty() {
            let matches = Self::node_matches_search(node, search_query);
            if !matches {
                return;
            }
        }

        let total_tests = node.count_tests();
        let selected_tests = node.count_selected(selected);

        let flat = FlatNode {
            id: node.id.clone(),
            label: node.label.clone(),
            kind: node.kind.clone(),
            depth: node.depth,
            expanded: node.expanded,
            has_children: !node.children.is_empty(),
            selected: selected.contains(&node.id),
            status: node.status,
            total_tests,
            selected_tests,
        };

        out.push(flat);

        // If expanded (or searching), show children.
        if node.expanded || !search_query.is_empty() {
            for child in &node.children {
                Self::flatten_node(child, out, selected, search_query);
            }
        }
    }

    /// Check if a node or any of its descendants match the search query.
    fn node_matches_search(node: &TreeNode, query: &str) -> bool {
        if node.label.to_lowercase().contains(query) || node.id.to_lowercase().contains(query) {
            return true;
        }
        node.children
            .iter()
            .any(|c| Self::node_matches_search(c, query))
    }

    /// Set the expanded state of a node by ID.
    pub fn set_expanded(&mut self, node_id: &str, expanded: bool) {
        fn set_in_tree(nodes: &mut [TreeNode], id: &str, expanded: bool) -> bool {
            for node in nodes {
                if node.id == id {
                    node.expanded = expanded;
                    return true;
                }
                if set_in_tree(&mut node.children, id, expanded) {
                    return true;
                }
            }
            false
        }

        set_in_tree(&mut self.tree, node_id, expanded);
    }

    /// Update the test counts for the status bar.
    pub fn update_counts(&mut self) {
        let mut counts = TestCounts::default();

        fn count_tree(node: &TreeNode, counts: &mut TestCounts) {
            if node.is_leaf() {
                counts.total += 1;
                match node.status {
                    TestStatus::Passed => counts.passed += 1,
                    TestStatus::Failed => counts.failed += 1,
                    TestStatus::Running => counts.running += 1,
                    TestStatus::Queued => counts.queued += 1,
                    _ => {}
                }
            }
            for child in &node.children {
                count_tree(child, counts);
            }
        }

        for node in &self.tree {
            count_tree(node, &mut counts);
        }

        counts.selected = self.selected.len();
        self.counts = counts;
    }

    /// Set the status of a test node by ID.
    pub fn set_test_status(&mut self, test_id: &str, status: TestStatus) {
        fn set_in_tree(nodes: &mut [TreeNode], id: &str, status: TestStatus) -> bool {
            for node in nodes {
                if node.id == id {
                    node.status = status;
                    return true;
                }
                if set_in_tree(&mut node.children, id, status) {
                    return true;
                }
            }
            false
        }

        set_in_tree(&mut self.tree, test_id, status);
    }

    /// Toggle pane focus.
    pub fn toggle_pane_focus(&mut self) {
        self.pane_focus = match self.pane_focus {
            PaneFocus::Tree => PaneFocus::Output,
            PaneFocus::Output => PaneFocus::Tree,
        };
    }

    /// Check if a test is currently running.
    pub fn is_running(&self) -> bool {
        self.running_test.is_some()
    }

    /// Cancel the currently running test by signalling the runner.
    pub fn cancel_running(&mut self) {
        // Signal the runner to cancel via the watch channel.
        if let Some(tx) = self.cancel_tx.take() {
            let _ = tx.send(true);
        }

        if let Some(test_id) = self.running_test.take() {
            self.set_test_status(&test_id, TestStatus::Cancelled);
        }

        // Cancel all queued tests too.
        let queued: Vec<String> = self.run_queue.drain(..).collect();
        for tid in &queued {
            self.set_test_status(tid, TestStatus::Cancelled);
        }

        self.rebuild_visible_nodes();
    }

    /// Kill all running processes and clear the queue.
    pub fn kill_all(&mut self) {
        self.cancel_running();
        self.live_output.push(OutputLine {
            text: "━━━ All processes killed ━━━".to_string(),
            is_error: false,
            timestamp: chrono::Utc::now(),
        });
        self.auto_scroll_output();
    }

    /// Run the currently selected tests (stub for Milestone 2).
    pub fn run_selected(&mut self) {
        if self.selected.is_empty() {
            // If nothing selected but cursor is on a node, run that node.
            if let Some(node) = self.visible_nodes.get(self.cursor) {
                match &node.kind {
                    NodeKind::TestFile { .. } | NodeKind::RustPackage { .. } => {
                        self.selected.insert(node.id.clone());
                    }
                    NodeKind::Category(_) | NodeKind::Folder => {
                        let ids = self.collect_children_ids(&node.id);
                        for id in ids {
                            self.selected.insert(id);
                        }
                    }
                }
                self.rebuild_visible_nodes();
            }
        }

        // Check if any Detox tests are selected — if so, show the config prompt.
        let has_detox = self.selected.iter().any(|id| id.starts_with("detox/"));
        if has_detox && self.config.detox.always_prompt {
            self.input_mode = InputMode::DetoxPrompt;
            return;
        }

        self.start_run();
    }

    /// Confirm the Detox configuration and start the run.
    pub fn confirm_detox_config(&mut self) {
        self.detox_config = if self.detox_prompt_selection == 0 {
            DetoxConfig::Debug
        } else {
            DetoxConfig::Release
        };
        self.input_mode = InputMode::Normal;
        self.start_run();
    }

    /// Set the event sender (called from main after creating the event handler).
    pub fn set_event_sender(&mut self, tx: mpsc::UnboundedSender<AppEvent>) {
        self.event_tx = Some(tx);
    }

    /// Start executing the selected tests.
    fn start_run(&mut self) {
        // Queue all selected tests.
        let selected_ids: Vec<String> = self.selected.iter().cloned().collect();
        self.run_queue = selected_ids.iter().cloned().collect();

        // Set all to queued status.
        for test_id in &selected_ids {
            self.set_test_status(test_id, TestStatus::Queued);
        }

        // Mark the first test as running.
        if let Some(first) = self.run_queue.front() {
            let first_id = first.clone();
            self.running_test = Some(first_id.clone());
            self.set_test_status(&first_id, TestStatus::Running);
        }

        self.live_output.clear();
        self.output_scroll = 0;
        self.output_auto_scroll = true;
        self.run_start = Some(Instant::now());

        // Switch focus to output pane.
        self.pane_focus = PaneFocus::Output;

        // Create a cancel channel for this run.
        let (cancel_tx, cancel_rx) = watch::channel(false);
        self.cancel_tx = Some(cancel_tx);

        // Start the runner if we have an event sender.
        if let Some(tx) = &self.event_tx {
            crate::runner::start_run(
                selected_ids,
                &self.tree,
                self.project_root.clone(),
                self.detox_config,
                tx.clone(),
                cancel_rx,
                self.config.relay.clone(),
            );
        }

        self.rebuild_visible_nodes();
    }

    /// Re-run tests that failed in the last run.
    pub fn rerun_failed(&mut self) {
        let failed_ids: Vec<String> = self
            .output_history
            .iter()
            .filter(|(_, output)| !output.passed)
            .map(|(id, _)| id.clone())
            .collect();

        if !failed_ids.is_empty() {
            self.selected.clear();
            for id in failed_ids {
                self.selected.insert(id);
            }
            self.rebuild_visible_nodes();
            self.run_selected();
        }
    }

    /// Open the latest screenshot from the focused test's output.
    pub fn open_screenshot(&self) {
        if let Some(test_id) = &self.running_test {
            if let Some(output) = self.output_history.get(test_id) {
                if let Some(path) = output.screenshot_paths.last() {
                    let _ = open::that(path);
                }
            }
        }
    }

    /// Auto-scroll output to the bottom (called when new output arrives).
    pub fn auto_scroll_output(&mut self) {
        if self.output_auto_scroll {
            // We set scroll to the max possible — the rendering code
            // clamps this to (total_lines - visible_height).
            self.output_scroll = self.live_output.len();
        }
    }

    /// Scroll output up.
    pub fn scroll_output_up(&mut self, amount: usize) {
        self.output_auto_scroll = false; // User took manual control.
        self.output_scroll = self.output_scroll.saturating_sub(amount);
    }

    /// Scroll output down.
    pub fn scroll_output_down(&mut self, amount: usize) {
        self.output_scroll = self.output_scroll.saturating_add(amount);
        let max_scroll = self.live_output.len().saturating_sub(1);
        if self.output_scroll >= max_scroll {
            self.output_scroll = max_scroll;
            self.output_auto_scroll = true; // Re-enable auto-scroll at bottom.
        }
    }

    /// Store the current live output as the output history for a test.
    pub fn store_test_output(&mut self, test_id: &str, success: bool) {
        let test_output = output::analyze_output(&self.live_output, success);
        self.output_history.insert(test_id.to_string(), test_output);
    }

    /// View the output history of a completed test (loads it into the output pane).
    pub fn view_test_output(&mut self, test_id: &str) {
        if let Some(history) = self.output_history.get(test_id) {
            self.live_output = history.lines.clone();
            self.output_scroll = 0;
            self.output_auto_scroll = false;
            self.pane_focus = PaneFocus::Output;
        }
    }

    /// Record a completed run in the recent runs list.
    pub fn record_run_complete(&mut self) {
        let duration = self.run_start.map(|s| s.elapsed().as_secs_f64()).unwrap_or(0.0);
        self.run_start = None;

        let total = self.counts.passed + self.counts.failed;
        if total == 0 {
            return;
        }

        let run = RecentRun {
            timestamp: chrono::Utc::now().timestamp(),
            test_ids: self.selected.iter().cloned().collect(),
            passed: self.counts.passed,
            failed: self.counts.failed,
            total,
            duration_secs: duration,
        };

        self.recent_runs.push(run);
        // Keep only the last 10 runs.
        if self.recent_runs.len() > 10 {
            self.recent_runs.remove(0);
        }
    }

    /// Re-discover tests (called when file watcher detects changes).
    pub fn rediscover(&mut self) {
        let new_tree = discovery::discover_all(&self.project_root, &self.config);
        self.tree = new_tree;
        self.rebuild_visible_nodes();
    }

    /// Handle a tick event (animations, etc.).
    pub fn tick(&mut self) {
        self.tick_count = self.tick_count.wrapping_add(1);
    }

    /// Load persisted state from `.umbra-test-state.json`.
    fn load_persisted_state(&mut self) {
        let state_path = self.project_root.join(".umbra-test-state.json");
        if state_path.exists() {
            if let Ok(contents) = std::fs::read_to_string(&state_path) {
                if let Ok(state) = serde_json::from_str::<PersistedState>(&contents) {
                    // Restore selection.
                    for id in &state.last_selection {
                        self.selected.insert(id.clone());
                    }
                    self.recent_runs = state.recent_runs.clone();
                    if let Some(ref dc) = state.detox_config {
                        self.detox_config = if dc == "ios.release" {
                            DetoxConfig::Release
                        } else {
                            DetoxConfig::Debug
                        };
                    }
                    self.persisted = state;
                }
            }
        }
    }

    /// Save persisted state to `.umbra-test-state.json`.
    #[allow(dead_code)]
    pub fn save_persisted_state(&self) {
        let state = PersistedState {
            last_selection: self.selected.iter().cloned().collect(),
            recent_runs: self.recent_runs.clone(),
            detox_config: Some(self.detox_config.as_str().to_string()),
        };

        let state_path = self.project_root.join(".umbra-test-state.json");
        if let Ok(json) = serde_json::to_string_pretty(&state) {
            let _ = std::fs::write(state_path, json);
        }
    }
}
