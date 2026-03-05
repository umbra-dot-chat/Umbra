use std::path::Path;

use crate::app::types::{TestType, TreeNode};

/// Scan the packages directory for Rust crates that contain tests.
///
/// Looks for `Cargo.toml` files in `packages/*/` and checks if the
/// crate's `src/` directory contains `#[test]` or `#[cfg(test)]`.
pub fn scan(packages_dir: &Path) -> TreeNode {
    let mut category_node = TreeNode::category(TestType::Rust);

    if !packages_dir.exists() {
        return category_node;
    }

    let pattern = format!("{}/*/Cargo.toml", packages_dir.display());
    let mut packages: Vec<(String, std::path::PathBuf)> = Vec::new();

    if let Ok(paths) = glob::glob(&pattern) {
        for entry in paths.flatten() {
            let pkg_dir = entry.parent().unwrap_or(Path::new("."));
            let pkg_name = pkg_dir
                .file_name()
                .and_then(|f| f.to_str())
                .unwrap_or_default()
                .to_string();

            // Skip the umbra-testing package itself.
            if pkg_name == "umbra-testing" {
                continue;
            }

            // Check if the package has tests by scanning src/ for test markers.
            if has_tests(pkg_dir) {
                packages.push((pkg_name, entry.clone()));
            }
        }
    }

    packages.sort_by(|a, b| a.0.cmp(&b.0));

    for (pkg_name, manifest_path) in packages {
        category_node
            .children
            .push(TreeNode::rust_package(pkg_name, manifest_path, 1));
    }

    category_node
}

/// Check if a Rust package directory contains test code.
fn has_tests(pkg_dir: &Path) -> bool {
    let src_dir = pkg_dir.join("src");
    if !src_dir.exists() {
        return false;
    }

    let pattern = format!("{}/**/*.rs", src_dir.display());
    if let Ok(paths) = glob::glob(&pattern) {
        for entry in paths.flatten() {
            if let Ok(contents) = std::fs::read_to_string(&entry) {
                if contents.contains("#[test]") || contents.contains("#[cfg(test)]") {
                    return true;
                }
            }
        }
    }

    // Also check for a `tests/` directory.
    pkg_dir.join("tests").exists()
}
