use std::collections::BTreeMap;
use std::path::Path;

use crate::app::types::{TestType, TreeNode};

/// Scan the Jest test root for `.test.ts` / `.test.tsx` files, excluding
/// E2E directories (Detox and Playwright).
///
/// Expects structure: `__tests__/{category}/{test}.test.ts`
pub fn scan(jest_root: &Path, exclude_dirs: &[String]) -> TreeNode {
    let mut category_node = TreeNode::category(TestType::Jest);

    if !jest_root.exists() {
        return category_node;
    }

    let mut folders: BTreeMap<String, Vec<(String, std::path::PathBuf)>> = BTreeMap::new();

    // Scan for .test.ts and .test.tsx files.
    for ext in &["test.ts", "test.tsx"] {
        let pattern = format!("{}/**/*.{}", jest_root.display(), ext);
        if let Ok(paths) = glob::glob(&pattern) {
            for entry in paths.flatten() {
                let relative = entry.strip_prefix(jest_root).unwrap_or(&entry);

                // Skip excluded directories (e2e-ios, e2e, shared).
                let first_component = relative
                    .components()
                    .next()
                    .and_then(|c| c.as_os_str().to_str())
                    .unwrap_or_default();

                if exclude_dirs.iter().any(|d| d == first_component) {
                    continue;
                }

                // Skip helper files.
                let file_str = relative.to_string_lossy();
                if file_str.contains("helper") || file_str.contains("fixture") {
                    continue;
                }

                let file_name = relative
                    .file_name()
                    .and_then(|f| f.to_str())
                    .unwrap_or_default()
                    .to_string();

                if let Some(parent) = relative.parent() {
                    let parent_str = parent.to_string_lossy().to_string();
                    if !parent_str.is_empty() && parent_str != "." {
                        folders
                            .entry(parent_str)
                            .or_default()
                            .push((file_name, entry.clone()));
                    }
                }
            }
        }
    }

    for (folder, files) in &folders {
        let folder_id = format!("jest/{}", folder);
        let mut folder_node = TreeNode::folder(folder_id, folder.clone(), 1);

        let mut sorted_files = files.clone();
        sorted_files.sort_by(|a, b| a.0.cmp(&b.0));
        // Deduplicate (in case .test.ts and .test.tsx both matched).
        sorted_files.dedup_by(|a, b| a.0 == b.0);

        for (file_name, path) in &sorted_files {
            let id = format!("jest/{}/{}", folder, file_name);
            folder_node.children.push(TreeNode::test_file(
                id,
                file_name.clone(),
                path.clone(),
                TestType::Jest,
                2,
            ));
        }

        category_node.children.push(folder_node);
    }

    category_node
}
