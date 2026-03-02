//! # Umbra CLI
//!
//! Terminal chat client for Umbra — encrypted P2P messaging in your terminal.
//!
//! Uses ratatui for the TUI and umbra-core for cryptographic identity
//! management. Implements the full onboarding flow: create/import identity,
//! profile import from external platforms, username registration, and
//! friend discovery opt-in.

mod api;
mod app;
mod db;
mod event;
mod relay;
mod tui;
mod ui;

use app::{App, AsyncAction, AsyncResult};
use event::{AppEvent, EventHandler};
use relay::{RelayEvent, RelayHandle};
use tokio::sync::mpsc;

#[tokio::main]
async fn main() -> color_eyre::Result<()> {
    color_eyre::install()?;

    // Initialize terminal
    let mut terminal = tui::init()?;

    // Open persistent database (degrades gracefully if it fails)
    let db = match db::Db::open(&db::default_db_path()) {
        Ok(db) => Some(db),
        Err(e) => {
            eprintln!("Warning: Could not open database: {e}");
            None
        }
    };

    // Create app state and event handler
    let mut app = App::new(db);
    let mut events = EventHandler::new(250);

    // Channel for async operation results
    let (async_tx, mut async_rx) = mpsc::unbounded_channel::<AsyncResult>();

    // Channel for relay events
    let (relay_tx, mut relay_rx) = mpsc::unbounded_channel::<RelayEvent>();

    // Start relay connection if we have an identity
    if let Some(ref did) = app.my_did {
        app.relay_handle = Some(RelayHandle::connect(did.clone(), relay_tx.clone()));
    }

    // Main event loop
    while !app.should_quit {
        // Render the current screen
        terminal.draw(|frame| ui::render(frame, &app))?;

        // Wait for terminal events, async results, or relay events
        tokio::select! {
            event = events.next() => {
                match event? {
                    AppEvent::Key(key) => {
                        if let Some(action) = app.handle_key(key) {
                            spawn_async_action(action, async_tx.clone());
                        }

                        // Check if identity was just created/imported and relay not started
                        if app.my_did.is_some() && app.relay_handle.is_none() {
                            if let Some(ref did) = app.my_did {
                                app.relay_handle = Some(RelayHandle::connect(
                                    did.clone(),
                                    relay_tx.clone(),
                                ));
                            }
                        }
                    }
                    AppEvent::Tick => {
                        if let Some(action) = app.tick() {
                            spawn_async_action(action, async_tx.clone());
                        }
                    }
                    AppEvent::Resize(_, _) => {
                        // Ratatui handles resize automatically on next draw
                    }
                }
            }
            result = async_rx.recv() => {
                if let Some(result) = result {
                    if let Some(action) = app.handle_async_result(result) {
                        spawn_async_action(action, async_tx.clone());
                    }
                }
            }
            relay_event = relay_rx.recv() => {
                if let Some(event) = relay_event {
                    app.handle_relay_event(event);
                }
            }
        }
    }

    // Restore terminal before exit
    tui::restore()?;

    Ok(())
}

/// Spawn an async action on the tokio runtime and send the result back.
fn spawn_async_action(action: AsyncAction, tx: mpsc::UnboundedSender<AsyncResult>) {
    tokio::spawn(async move {
        let result = execute_async_action(action).await;
        let _ = tx.send(result);
    });
}

/// Execute an async action and return the result.
async fn execute_async_action(action: AsyncAction) -> AsyncResult {
    match action {
        AsyncAction::StartProfileImport { platform, did } => {
            match api::start_profile_import(&platform, did.as_deref()).await {
                Ok(response) => AsyncResult::ProfileImportStarted {
                    redirect_url: response.redirect_url,
                    state: response.state,
                },
                Err(e) => AsyncResult::ProfileImportError(e),
            }
        }

        AsyncAction::PollProfileImport { state } => {
            match api::poll_profile_import(&state).await {
                Ok(profile) => AsyncResult::ProfileImportResult { profile },
                Err(_) => {
                    // Network errors during polling are non-fatal — just report no result
                    AsyncResult::ProfileImportResult { profile: None }
                }
            }
        }

        AsyncAction::LinkAccount {
            did,
            platform,
            platform_id,
            username,
        } => match api::link_account(&did, &platform, &platform_id, &username).await {
            Ok(()) => AsyncResult::AccountLinked,
            Err(e) => AsyncResult::AccountLinkError(e),
        },

        AsyncAction::RegisterUsername { did, name } => {
            match api::register_username(&did, &name).await {
                Ok(response) => {
                    if let Some(username) = response.username {
                        AsyncResult::UsernameRegistered { username }
                    } else {
                        AsyncResult::UsernameError("No username returned".into())
                    }
                }
                Err(e) => AsyncResult::UsernameError(e),
            }
        }

        AsyncAction::EnableDiscovery { did, discoverable } => {
            match api::enable_discovery(&did, discoverable).await {
                Ok(()) => AsyncResult::DiscoveryUpdated,
                Err(e) => AsyncResult::DiscoveryError(e),
            }
        }

        AsyncAction::SearchUser { query } => {
            match api::search_users(&query).await {
                Ok(results) => {
                    let mapped = results
                        .into_iter()
                        .filter(|r| r.found)
                        .map(|r| app::SearchResult {
                            did: r.did.unwrap_or_default(),
                            username: r.username,
                        })
                        .collect();
                    AsyncResult::UserSearchResult { results: mapped }
                }
                Err(e) => AsyncResult::UserSearchError(e),
            }
        }
    }
}
