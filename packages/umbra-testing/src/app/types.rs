use std::path::PathBuf;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

// ── Enums ───────────────────────────────────────────────────────────────────

/// The type/framework of a test.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TestType {
    Detox,
    Playwright,
    Jest,
    Rust,
}

impl TestType {
    /// Display label for the category header.
    pub fn label(&self) -> &'static str {
        match self {
            TestType::Detox => "Detox",
            TestType::Playwright => "Playwright",
            TestType::Jest => "Jest",
            TestType::Rust => "Rust",
        }
    }

    /// Icon/prefix for the test type.
    pub fn icon(&self) -> &'static str {
        match self {
            TestType::Detox => "📱",
            TestType::Playwright => "🌐",
            TestType::Jest => "🧪",
            TestType::Rust => "🦀",
        }
    }
}

/// Current status of a test.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum TestStatus {
    #[default]
    Idle,
    Queued,
    Running,
    Passed,
    Failed,
    Cancelled,
}

impl TestStatus {
    /// Icon for inline display in the tree.
    pub fn icon(&self) -> &'static str {
        match self {
            TestStatus::Idle => "○",
            TestStatus::Queued => "◎",
            TestStatus::Running => "●",
            TestStatus::Passed => "✓",
            TestStatus::Failed => "✗",
            TestStatus::Cancelled => "⊘",
        }
    }
}

/// What kind of node is this in the tree?
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum NodeKind {
    /// Top-level category (Detox, Playwright, Jest, Rust).
    Category(TestType),
    /// A folder grouping test files.
    Folder,
    /// A runnable test file.
    TestFile {
        path: PathBuf,
        test_type: TestType,
    },
    /// A Rust package with tests.
    RustPackage {
        package_name: String,
        manifest_path: PathBuf,
    },
}

/// The current input mode of the application.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum InputMode {
    #[default]
    Normal,
    Search,
    DetoxPrompt,
    Help,
}

/// Which pane has focus.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum PaneFocus {
    #[default]
    Tree,
    Output,
}

// ── Tree ────────────────────────────────────────────────────────────────────

/// A node in the test tree (hierarchical).
#[derive(Debug, Clone)]
pub struct TreeNode {
    /// Unique identifier (e.g. "detox/auth/account-creation.test.ts").
    pub id: String,
    /// Display label (e.g. "account-creation.test.ts").
    pub label: String,
    /// What kind of node this is.
    pub kind: NodeKind,
    /// Child nodes.
    pub children: Vec<TreeNode>,
    /// Whether the node is expanded in the tree view.
    pub expanded: bool,
    /// Current test status.
    pub status: TestStatus,
    /// Depth in the tree (0 = root category).
    pub depth: usize,
}

impl TreeNode {
    /// Create a new category node.
    pub fn category(test_type: TestType) -> Self {
        Self {
            id: test_type.label().to_lowercase(),
            label: format!("{} {}", test_type.icon(), test_type.label()),
            kind: NodeKind::Category(test_type),
            children: Vec::new(),
            expanded: false,
            status: TestStatus::Idle,
            depth: 0,
        }
    }

    /// Create a new folder node.
    pub fn folder(id: String, label: String, depth: usize) -> Self {
        Self {
            id,
            label,
            kind: NodeKind::Folder,
            children: Vec::new(),
            expanded: false,
            status: TestStatus::Idle,
            depth,
        }
    }

    /// Create a new test file node.
    pub fn test_file(id: String, label: String, path: PathBuf, test_type: TestType, depth: usize) -> Self {
        Self {
            id,
            label,
            kind: NodeKind::TestFile { path, test_type },
            children: Vec::new(),
            expanded: false,
            status: TestStatus::Idle,
            depth,
        }
    }

    /// Create a new Rust package node.
    pub fn rust_package(package_name: String, manifest_path: PathBuf, depth: usize) -> Self {
        let id = format!("rust/{}", package_name);
        Self {
            id,
            label: package_name.clone(),
            kind: NodeKind::RustPackage {
                package_name,
                manifest_path,
            },
            children: Vec::new(),
            expanded: false,
            status: TestStatus::Idle,
            depth,
        }
    }

    /// Whether this node is a leaf (runnable test or package).
    pub fn is_leaf(&self) -> bool {
        matches!(self.kind, NodeKind::TestFile { .. } | NodeKind::RustPackage { .. })
    }

    /// Count total leaf tests under this node.
    pub fn count_tests(&self) -> usize {
        if self.is_leaf() {
            1
        } else {
            self.children.iter().map(|c| c.count_tests()).sum()
        }
    }

    /// Collect all leaf test IDs under this node.
    pub fn collect_test_ids(&self) -> Vec<String> {
        if self.is_leaf() {
            vec![self.id.clone()]
        } else {
            self.children.iter().flat_map(|c| c.collect_test_ids()).collect()
        }
    }

    /// Count how many leaf tests under this node are in the selected set.
    pub fn count_selected(&self, selected: &std::collections::HashSet<String>) -> usize {
        if self.is_leaf() {
            if selected.contains(&self.id) { 1 } else { 0 }
        } else {
            self.children.iter().map(|c| c.count_selected(selected)).sum()
        }
    }
}

// ── Flat node for rendering ─────────────────────────────────────────────────

/// A flattened view of a tree node for rendering in the list widget.
#[derive(Debug, Clone)]
pub struct FlatNode {
    /// The node's unique ID.
    pub id: String,
    /// Display label.
    pub label: String,
    /// Node kind.
    pub kind: NodeKind,
    /// Depth for indentation.
    pub depth: usize,
    /// Whether the node is expanded (for showing ▸/▾).
    pub expanded: bool,
    /// Whether the node has children.
    pub has_children: bool,
    /// Whether this node is selected.
    pub selected: bool,
    /// Test status.
    pub status: TestStatus,
    /// Total leaf tests under this node (for categories/folders).
    pub total_tests: usize,
    /// How many leaf tests under this node are selected.
    pub selected_tests: usize,
}

// ── Output ──────────────────────────────────────────────────────────────────

/// A single line of test output.
#[derive(Debug, Clone)]
pub struct OutputLine {
    /// The raw text content.
    pub text: String,
    /// Whether this is an error line.
    pub is_error: bool,
    /// Timestamp.
    pub timestamp: DateTime<Utc>,
}

/// Stored output for a completed test.
#[derive(Debug, Clone)]
pub struct TestOutput {
    /// All output lines.
    pub lines: Vec<OutputLine>,
    /// Whether the test passed.
    pub passed: bool,
    /// Duration in seconds.
    pub duration_secs: f64,
    /// Path to failure screenshots (Detox).
    pub screenshot_paths: Vec<PathBuf>,
}

// ── Persistence ─────────────────────────────────────────────────────────────

/// A record of a completed test run.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentRun {
    /// When the run completed.
    pub timestamp: i64,
    /// Which tests were run.
    pub test_ids: Vec<String>,
    /// How many passed.
    pub passed: usize,
    /// How many failed.
    pub failed: usize,
    /// Total tests.
    pub total: usize,
    /// Duration in seconds.
    pub duration_secs: f64,
}

/// Persisted state between sessions.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PersistedState {
    /// Last selected test IDs.
    #[serde(default)]
    pub last_selection: Vec<String>,
    /// Recent test runs.
    #[serde(default)]
    pub recent_runs: Vec<RecentRun>,
    /// Last used Detox configuration.
    #[serde(default)]
    pub detox_config: Option<String>,
}

// ── App state (forward declaration) ─────────────────────────────────────────

/// Counts for the status bar.
#[derive(Debug, Clone, Default)]
pub struct TestCounts {
    pub total: usize,
    pub selected: usize,
    pub passed: usize,
    pub failed: usize,
    pub running: usize,
    pub queued: usize,
}

/// Detox configuration choice.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DetoxConfig {
    Debug,
    Release,
}

impl DetoxConfig {
    pub fn as_str(&self) -> &'static str {
        match self {
            DetoxConfig::Debug => "ios.debug",
            DetoxConfig::Release => "ios.release",
        }
    }
}
