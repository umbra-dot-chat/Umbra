use crate::app::types::NodeKind;

use super::App;

impl App {
    /// Toggle selection of the node at the cursor.
    pub fn toggle_selection(&mut self) {
        if let Some(node) = self.visible_nodes.get(self.cursor) {
            let id = node.id.clone();
            let kind = node.kind.clone();

            match kind {
                NodeKind::TestFile { .. } | NodeKind::RustPackage { .. } => {
                    // Toggle individual test.
                    if self.selected.contains(&id) {
                        self.selected.remove(&id);
                    } else {
                        self.selected.insert(id);
                    }
                }
                NodeKind::Category(_) | NodeKind::Folder => {
                    // Toggle all children.
                    let test_ids = self.collect_children_ids(&id);
                    let all_selected = test_ids.iter().all(|tid| self.selected.contains(tid));
                    if all_selected {
                        for tid in test_ids {
                            self.selected.remove(&tid);
                        }
                    } else {
                        for tid in test_ids {
                            self.selected.insert(tid);
                        }
                    }
                }
            }

            self.rebuild_visible_nodes();
        }
    }

    /// Select all tests in the current node's parent category.
    pub fn select_all_in_category(&mut self) {
        if let Some(node) = self.visible_nodes.get(self.cursor) {
            // Find the category node for this item.
            let category_id = self.find_category_id(&node.id);
            if let Some(cat_id) = category_id {
                let test_ids = self.collect_children_ids(&cat_id);
                for tid in test_ids {
                    self.selected.insert(tid);
                }
                self.rebuild_visible_nodes();
            }
        }
    }

    /// Select all tests across all categories.
    pub fn select_all(&mut self) {
        for tree_node in &self.tree {
            let ids = tree_node.collect_test_ids();
            for id in ids {
                self.selected.insert(id);
            }
        }
        self.rebuild_visible_nodes();
    }

    /// Clear all selections.
    pub fn clear_selection(&mut self) {
        self.selected.clear();
        self.rebuild_visible_nodes();
    }

    /// Collect all leaf test IDs under a given node ID.
    pub(crate) fn collect_children_ids(&self, node_id: &str) -> Vec<String> {
        fn find_and_collect(nodes: &[crate::app::types::TreeNode], target_id: &str) -> Option<Vec<String>> {
            for node in nodes {
                if node.id == target_id {
                    return Some(node.collect_test_ids());
                }
                if let Some(found) = find_and_collect(&node.children, target_id) {
                    return Some(found);
                }
            }
            None
        }

        find_and_collect(&self.tree, node_id).unwrap_or_default()
    }

    /// Find the top-level category ID for a given node ID.
    fn find_category_id(&self, node_id: &str) -> Option<String> {
        // Category IDs are the first component (e.g., "detox", "playwright", "jest", "rust").
        let first = node_id.split('/').next()?;
        // Verify it's a valid category.
        for tree_node in &self.tree {
            if tree_node.id == first {
                return Some(first.to_string());
            }
        }
        None
    }
}
