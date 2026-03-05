pub mod detox;
pub mod jest;
pub mod output;
pub mod playwright;
pub mod process;
pub mod rust;

use std::path::PathBuf;
use std::time::Instant;

use tokio::sync::{mpsc, watch};

use crate::app::types::*;
use crate::config::RelayConfig;
use crate::event::AppEvent;

/// Start running a sequence of tests.
///
/// Spawns a background task that runs tests one at a time, sending
/// events for output lines and completion. The `cancel_rx` watch
/// channel can be used to signal the runner to kill the current
/// process and stop.
///
/// If Detox tests are included and `relay_config.auto_start` is true,
/// the relay and Metro will be started automatically.
pub fn start_run(
    test_ids: Vec<String>,
    tree: &[TreeNode],
    project_root: PathBuf,
    detox_config: DetoxConfig,
    event_tx: mpsc::UnboundedSender<AppEvent>,
    mut cancel_rx: watch::Receiver<bool>,
    relay_config: RelayConfig,
) {
    // Resolve test IDs to their metadata.
    let tests: Vec<TestInfo> = test_ids
        .iter()
        .filter_map(|id| resolve_test_info(id, tree))
        .collect();

    // Check if any Detox tests are in the run.
    let has_detox = tests.iter().any(|t| matches!(
        &t.kind,
        ResolvedKind::TestFile { test_type: TestType::Detox, .. }
    ));

    tokio::spawn(async move {
        // If there are Detox tests, start the relay and Metro.
        let mut lifecycle = None;
        if has_detox && cfg!(target_os = "macos") {
            match detox::DetoxLifecycle::start(
                &project_root,
                &relay_config,
                detox_config,
                &event_tx,
            )
            .await
            {
                Ok(lc) => lifecycle = Some(lc),
                Err(e) => {
                    let _ = event_tx.send(AppEvent::OutputLine(format!(
                        "WARNING: Failed to start Detox lifecycle: {}",
                        e
                    )));
                    let _ = event_tx.send(AppEvent::OutputLine(
                        "Tests will attempt to run anyway...".to_string(),
                    ));
                }
            }
        }

        for test_info in tests {
            // Check for cancellation before starting each test.
            if *cancel_rx.borrow() {
                break;
            }

            let test_id = test_info.id.clone();

            // Notify: starting.
            let _ = event_tx.send(AppEvent::OutputLine(format!(
                "━━━ Running: {} ━━━",
                test_info.label
            )));

            let start = Instant::now();

            // Build command based on test type.
            let (program, args, env_vars) = match &test_info.kind {
                ResolvedKind::TestFile { path, test_type } => match test_type {
                    TestType::Detox => {
                        detox::build_command(path, detox_config, &project_root)
                    }
                    TestType::Playwright => {
                        playwright::build_command(path, &project_root)
                    }
                    TestType::Jest => {
                        jest::build_command(path, &project_root)
                    }
                    TestType::Rust => unreachable!(),
                },
                ResolvedKind::RustPackage {
                    package_name,
                    manifest_path,
                } => rust::build_command(package_name, manifest_path),
            };

            // Convert args to &str for spawn.
            let arg_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();

            // Spawn the process.
            match process::TestProcess::spawn(
                &program,
                &arg_refs,
                &project_root,
                &env_vars,
                event_tx.clone(),
                test_id.clone(),
            )
            .await
            {
                Ok(mut proc) => {
                    // Wait for process completion or cancellation.
                    let (success, cancelled) = tokio::select! {
                        result = proc.wait() => {
                            (result, false)
                        }
                        _ = cancel_rx.changed() => {
                            // Kill the process immediately.
                            proc.kill().await;
                            (false, true)
                        }
                    };

                    let elapsed = start.elapsed().as_secs_f64();

                    if cancelled {
                        let _ = event_tx.send(AppEvent::OutputLine(format!(
                            "━━━ CANCELLED ({:.1}s) ━━━\n",
                            elapsed,
                        )));
                        let _ = event_tx.send(AppEvent::TestFinished {
                            test_id: test_id.clone(),
                            success: false,
                        });
                        break;
                    }

                    let _ = event_tx.send(AppEvent::OutputLine(format!(
                        "━━━ {} ({:.1}s) ━━━\n",
                        if success { "PASSED" } else { "FAILED" },
                        elapsed,
                    )));

                    let _ = event_tx.send(AppEvent::TestFinished {
                        test_id: test_id.clone(),
                        success,
                    });
                }
                Err(e) => {
                    let _ = event_tx.send(AppEvent::OutputLine(format!(
                        "ERROR: Failed to start {}: {}",
                        program, e
                    )));
                    let _ = event_tx.send(AppEvent::TestFinished {
                        test_id: test_id.clone(),
                        success: false,
                    });
                }
            }
        }

        // Clean up lifecycle processes.
        if let Some(mut lc) = lifecycle {
            lc.stop().await;
        }

        let _ = event_tx.send(AppEvent::RunComplete);
    });
}

/// Resolved test metadata for running.
struct TestInfo {
    id: String,
    label: String,
    kind: ResolvedKind,
}

enum ResolvedKind {
    TestFile {
        path: PathBuf,
        test_type: TestType,
    },
    RustPackage {
        package_name: String,
        manifest_path: PathBuf,
    },
}

/// Resolve a test ID to its metadata by searching the tree.
fn resolve_test_info(test_id: &str, tree: &[TreeNode]) -> Option<TestInfo> {
    fn find_node<'a>(id: &str, nodes: &'a [TreeNode]) -> Option<&'a TreeNode> {
        for node in nodes {
            if node.id == id {
                return Some(node);
            }
            if let Some(found) = find_node(id, &node.children) {
                return Some(found);
            }
        }
        None
    }

    let node = find_node(test_id, tree)?;

    let kind = match &node.kind {
        NodeKind::TestFile { path, test_type } => ResolvedKind::TestFile {
            path: path.clone(),
            test_type: *test_type,
        },
        NodeKind::RustPackage {
            package_name,
            manifest_path,
        } => ResolvedKind::RustPackage {
            package_name: package_name.clone(),
            manifest_path: manifest_path.clone(),
        },
        _ => return None,
    };

    Some(TestInfo {
        id: test_id.to_string(),
        label: node.label.clone(),
        kind,
    })
}
