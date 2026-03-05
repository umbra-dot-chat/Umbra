use std::collections::BTreeMap;
use std::path::Path;

use crate::app::types::{TestType, TreeNode};

/// Scan the Detox test directory for `.test.ts` files.
///
/// Expects structure: `__tests__/e2e-ios/{category}/{test}.test.ts`
/// Skips helper files and non-test directories.
pub fn scan(detox_dir: &Path) -> TreeNode {
    let mut category_node = TreeNode::category(TestType::Detox);

    if !detox_dir.exists() {
        return category_node;
    }

    // Collect folders → files mapping (sorted).
    let mut folders: BTreeMap<String, Vec<(String, std::path::PathBuf)>> = BTreeMap::new();
    // Also collect root-level test files (e.g., smoke.test.ts).
    let mut root_tests: Vec<(String, std::path::PathBuf)> = Vec::new();

    let pattern = format!("{}/**/*.test.ts", detox_dir.display());
    if let Ok(paths) = glob::glob(&pattern) {
        for entry in paths.flatten() {
            // Skip helpers and two-device directories.
            // Two-device tests require paired simulator processes and must be
            // run via the dedicated scripts (e.g. scripts/run-two-device-test.sh).
            if entry
                .components()
                .any(|c| c.as_os_str() == "helpers" || c.as_os_str() == "two-device")
            {
                continue;
            }

            let relative = entry.strip_prefix(detox_dir).unwrap_or(&entry);
            let file_name = relative
                .file_name()
                .and_then(|f| f.to_str())
                .unwrap_or_default()
                .to_string();

            if let Some(parent) = relative.parent() {
                let parent_str = parent.to_string_lossy().to_string();
                if parent_str.is_empty() || parent_str == "." {
                    // Root-level test file.
                    root_tests.push((file_name, entry.clone()));
                } else {
                    folders
                        .entry(parent_str)
                        .or_default()
                        .push((file_name, entry.clone()));
                }
            }
        }
    }

    // Build tree: root tests first, then folders.
    for (file_name, path) in &root_tests {
        let id = format!("detox/{}", file_name);
        category_node
            .children
            .push(TreeNode::test_file(id, file_name.clone(), path.clone(), TestType::Detox, 1));
    }

    for (folder, files) in &folders {
        let folder_id = format!("detox/{}", folder);
        let mut folder_node = TreeNode::folder(folder_id, folder.clone(), 1);

        let mut sorted_files = files.clone();
        sorted_files.sort_by(|a, b| a.0.cmp(&b.0));

        for (file_name, path) in &sorted_files {
            let id = format!("detox/{}/{}", folder, file_name);
            folder_node
                .children
                .push(TreeNode::test_file(id, file_name.clone(), path.clone(), TestType::Detox, 2));
        }

        category_node.children.push(folder_node);
    }

    category_node
}
