pub mod detox;
pub mod jest;
pub mod playwright;
pub mod rust;
pub mod watcher;

use std::path::Path;

use crate::app::types::TreeNode;
use crate::config::Config;

/// Discover all tests across all frameworks and build the tree.
///
/// Returns a `Vec<TreeNode>` with one category node per framework.
/// On macOS, all four categories are returned.
/// On Linux, Detox is omitted.
pub fn discover_all(project_root: &Path, config: &Config) -> Vec<TreeNode> {
    let mut tree = Vec::new();

    // Detox — only on macOS.
    #[cfg(target_os = "macos")]
    {
        let detox_dir = config.detox_dir(project_root);
        let detox_node = detox::scan(&detox_dir);
        tree.push(detox_node);
    }

    // Playwright.
    let playwright_dir = config.playwright_dir(project_root);
    let playwright_node = playwright::scan(&playwright_dir);
    tree.push(playwright_node);

    // Jest.
    let jest_root = config.jest_root(project_root);
    let jest_node = jest::scan(&jest_root, &config.paths.jest_exclude);
    tree.push(jest_node);

    // Rust.
    let rust_dir = config.rust_packages_dir(project_root);
    let rust_node = rust::scan(&rust_dir);
    tree.push(rust_node);

    tree
}

/// Print a summary of discovered tests to stdout (for diagnostics).
pub fn print_summary(tree: &[TreeNode]) {
    fn print_node(node: &TreeNode, depth: usize) {
        let indent = "  ".repeat(depth);
        let marker = if !node.children.is_empty() && !node.is_leaf() {
            "▸ "
        } else {
            "  "
        };
        let count = if !node.is_leaf() && !node.children.is_empty() {
            format!(" ({})", node.count_tests())
        } else {
            String::new()
        };
        println!("{}{}{}{}", indent, marker, node.label, count);
        for child in &node.children {
            print_node(child, depth + 1);
        }
    }

    for category in tree {
        print_node(category, 0);
    }
    let total: usize = tree.iter().map(|c| c.count_tests()).sum();
    println!("\nTotal tests discovered: {}", total);
}
