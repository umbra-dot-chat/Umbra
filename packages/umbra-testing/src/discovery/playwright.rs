use std::collections::BTreeMap;
use std::path::Path;

use crate::app::types::{TestType, TreeNode};

/// Scan the Playwright test directory for `.spec.ts` files.
///
/// Expects structure: `__tests__/e2e/{category}/{test}.spec.ts`
/// Skips helper files and non-test TypeScript files.
pub fn scan(playwright_dir: &Path) -> TreeNode {
    let mut category_node = TreeNode::category(TestType::Playwright);

    if !playwright_dir.exists() {
        return category_node;
    }

    let mut folders: BTreeMap<String, Vec<(String, std::path::PathBuf)>> = BTreeMap::new();
    let mut root_tests: Vec<(String, std::path::PathBuf)> = Vec::new();

    let pattern = format!("{}/**/*.spec.ts", playwright_dir.display());
    if let Ok(paths) = glob::glob(&pattern) {
        for entry in paths.flatten() {
            let relative = entry.strip_prefix(playwright_dir).unwrap_or(&entry);
            let file_name = relative
                .file_name()
                .and_then(|f| f.to_str())
                .unwrap_or_default()
                .to_string();

            if let Some(parent) = relative.parent() {
                let parent_str = parent.to_string_lossy().to_string();
                if parent_str.is_empty() || parent_str == "." {
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

    for (file_name, path) in &root_tests {
        let id = format!("playwright/{}", file_name);
        category_node.children.push(TreeNode::test_file(
            id,
            file_name.clone(),
            path.clone(),
            TestType::Playwright,
            1,
        ));
    }

    for (folder, files) in &folders {
        let folder_id = format!("playwright/{}", folder);
        let mut folder_node = TreeNode::folder(folder_id, folder.clone(), 1);

        let mut sorted_files = files.clone();
        sorted_files.sort_by(|a, b| a.0.cmp(&b.0));

        for (file_name, path) in &sorted_files {
            let id = format!("playwright/{}/{}", folder, file_name);
            folder_node.children.push(TreeNode::test_file(
                id,
                file_name.clone(),
                path.clone(),
                TestType::Playwright,
                2,
            ));
        }

        category_node.children.push(folder_node);
    }

    category_node
}
