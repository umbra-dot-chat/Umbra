use std::time::Duration;

use crossterm::event::{self, Event, KeyEvent, KeyEventKind};
use tokio::sync::mpsc;

/// Events that can occur in the application.
#[derive(Debug, Clone)]
pub enum AppEvent {
    /// A key was pressed.
    Key(KeyEvent),
    /// A periodic tick (for animations and status updates).
    Tick,
    /// The terminal was resized.
    Resize(u16, u16),
    /// Test discovery completed (tree should refresh).
    DiscoveryComplete,
    /// A line of output was received from a running test.
    OutputLine(String),
    /// A test finished running.
    TestFinished {
        test_id: String,
        success: bool,
    },
    /// All queued tests finished.
    RunComplete,
}

/// Handles terminal events on a background thread and forwards them
/// via an async channel.
pub struct EventHandler {
    rx: mpsc::UnboundedReceiver<AppEvent>,
    #[allow(dead_code)]
    tx: mpsc::UnboundedSender<AppEvent>,
}

impl EventHandler {
    /// Create a new event handler that polls at the given tick rate.
    pub fn new(tick_rate: Duration) -> Self {
        let (tx, rx) = mpsc::unbounded_channel();
        let sender = tx.clone();

        // Spawn a blocking thread for crossterm event polling.
        // This avoids blocking the tokio runtime.
        std::thread::spawn(move || {
            loop {
                match event::poll(tick_rate) {
                    Ok(true) => {
                        if let Ok(evt) = event::read() {
                            let app_event = match evt {
                                Event::Key(key) if key.kind == KeyEventKind::Press => {
                                    Some(AppEvent::Key(key))
                                }
                                Event::Resize(w, h) => Some(AppEvent::Resize(w, h)),
                                _ => None,
                            };
                            if let Some(e) = app_event {
                                if sender.send(e).is_err() {
                                    break;
                                }
                            }
                        }
                    }
                    Ok(false) => {
                        // Timeout — send a tick
                        if sender.send(AppEvent::Tick).is_err() {
                            break;
                        }
                    }
                    Err(_) => break,
                }
            }
        });

        Self { rx, tx }
    }

    /// Get a clone of the sender for dispatching events from other tasks
    /// (e.g., test runner output).
    pub fn sender(&self) -> mpsc::UnboundedSender<AppEvent> {
        self.tx.clone()
    }

    /// Wait for the next event.
    pub async fn next(&mut self) -> Option<AppEvent> {
        self.rx.recv().await
    }
}
