use std::path::Path;
use std::time::Duration;

use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use tokio::sync::mpsc;

use crate::event::AppEvent;

/// Start watching the test directories for changes.
///
/// Sends `AppEvent::DiscoveryComplete` when test files are added, removed,
/// or renamed. Debounces events to avoid flooding during builds.
pub fn start_watcher(
    project_root: &Path,
    event_tx: mpsc::UnboundedSender<AppEvent>,
) -> Option<RecommendedWatcher> {
    let tests_dir = project_root.join("__tests__");
    let packages_dir = project_root.join("packages");

    let tx = event_tx;

    // Create a debounced channel.
    let (notify_tx, mut notify_rx) = mpsc::unbounded_channel::<()>();

    // Spawn debounce task: coalesce rapid events into one rediscovery.
    let event_tx_clone = tx.clone();
    tokio::spawn(async move {
        let mut pending = false;
        loop {
            tokio::select! {
                msg = notify_rx.recv() => {
                    match msg {
                        Some(()) => {
                            pending = true;
                        }
                        None => break,
                    }
                }
                _ = tokio::time::sleep(Duration::from_secs(2)), if pending => {
                    pending = false;
                    let _ = event_tx_clone.send(AppEvent::DiscoveryComplete);
                }
            }
        }
    });

    // Create the filesystem watcher.
    let watcher_result = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
        if let Ok(event) = res {
            // Only trigger on file creation, removal, or rename of test files.
            match event.kind {
                EventKind::Create(_) | EventKind::Remove(_) | EventKind::Modify(
                    notify::event::ModifyKind::Name(_)
                ) => {
                    let dominated_by_test = event.paths.iter().any(|p| {
                        let s = p.to_string_lossy();
                        s.ends_with(".test.ts")
                            || s.ends_with(".test.tsx")
                            || s.ends_with(".spec.ts")
                            || s.ends_with(".rs")
                            || s.ends_with("Cargo.toml")
                    });
                    if dominated_by_test {
                        let _ = notify_tx.send(());
                    }
                }
                _ => {}
            }
        }
    });

    match watcher_result {
        Ok(mut watcher) => {
            // Watch test directories.
            if tests_dir.exists() {
                let _ = watcher.watch(&tests_dir, RecursiveMode::Recursive);
            }
            if packages_dir.exists() {
                let _ = watcher.watch(&packages_dir, RecursiveMode::Recursive);
            }
            Some(watcher)
        }
        Err(e) => {
            eprintln!("Warning: Could not start file watcher: {}", e);
            None
        }
    }
}
