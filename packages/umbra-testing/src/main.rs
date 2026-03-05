#![allow(dead_code)]

mod app;
mod config;
mod discovery;
mod event;
mod runner;
mod theme;
mod tui;
mod ui;

use std::path::PathBuf;
use std::time::Duration;

use color_eyre::eyre::Result;

use crate::app::App;
use crate::event::{AppEvent, EventHandler};
use crate::ui::tree::TestTreeState;

#[tokio::main]
async fn main() -> Result<()> {
    color_eyre::install()?;

    // Determine the project root (look for package.json or .git).
    let project_root = find_project_root().unwrap_or_else(|| {
        std::env::current_dir().expect("Failed to get current directory")
    });

    // Check for --discover flag (prints test tree and exits).
    let args: Vec<String> = std::env::args().collect();
    if args.iter().any(|a| a == "--discover" || a == "-d") {
        let config = config::Config::load(&project_root);
        let tree = discovery::discover_all(&project_root, &config);
        discovery::print_summary(&tree);
        return Ok(());
    }

    // Initialize the app.
    let mut app = App::new(project_root);

    // Initialize the terminal.
    let mut terminal = tui::init()?;

    // Start the event handler (250ms tick rate for smooth spinner).
    let mut events = EventHandler::new(Duration::from_millis(250));

    // Give the app access to the event sender for dispatching runner events.
    app.set_event_sender(events.sender());

    // Start the filesystem watcher for auto-refresh on test file changes.
    let _watcher = discovery::watcher::start_watcher(
        &app.project_root,
        events.sender(),
    );

    // Tree scroll state.
    let mut tree_state = TestTreeState::default();

    // Main event loop.
    loop {
        // Render.
        terminal.draw(|frame| {
            ui::render(&app, frame, &mut tree_state);
        })?;

        // Wait for next event.
        match events.next().await {
            Some(AppEvent::Key(key)) => {
                app.handle_key(key);
            }
            Some(AppEvent::Tick) => {
                app.tick();
            }
            Some(AppEvent::Resize(_, _)) => {
                // Terminal handles resize automatically.
            }
            Some(AppEvent::OutputLine(line)) => {
                // Detect error lines by content heuristics rather than
                // stream origin, since many frameworks (Jest, Playwright,
                // cargo test) write normal output to stderr.
                let lower = line.to_lowercase();
                let is_error = lower.contains("error")
                    || lower.contains("fail")
                    || lower.contains("✗")
                    || lower.contains("panic")
                    || lower.starts_with("err:");
                app.live_output.push(app::types::OutputLine {
                    text: line,
                    is_error,
                    timestamp: chrono::Utc::now(),
                });
                app.auto_scroll_output();
            }
            Some(AppEvent::TestFinished { test_id, success }) => {
                let status = if success {
                    app::types::TestStatus::Passed
                } else {
                    app::types::TestStatus::Failed
                };
                // Store per-test output history before updating state.
                app.store_test_output(&test_id, success);
                app.set_test_status(&test_id, status);
                app.running_test = None;
                app.rebuild_visible_nodes();
            }
            Some(AppEvent::RunComplete) => {
                app.running_test = None;
                // Record this run in recent runs.
                app.record_run_complete();
                app.rebuild_visible_nodes();
            }
            Some(AppEvent::DiscoveryComplete) => {
                // Re-scan tests when file watcher detects changes.
                app.rediscover();
            }
            None => break,
        }

        if app.should_quit {
            // Save state before quitting.
            app.save_persisted_state();
            break;
        }
    }

    // Restore the terminal.
    tui::restore()?;

    Ok(())
}

/// Walk up from the current directory to find the project root.
///
/// Looks for `package.json` alongside a `__tests__` directory to confirm
/// we're in the Umbra monorepo root.
fn find_project_root() -> Option<PathBuf> {
    let mut dir = std::env::current_dir().ok()?;

    loop {
        if dir.join("package.json").exists() && dir.join("__tests__").exists() {
            return Some(dir);
        }
        if !dir.pop() {
            break;
        }
    }

    None
}
