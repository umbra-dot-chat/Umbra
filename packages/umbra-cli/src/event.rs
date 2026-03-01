//! Terminal event handling.
//!
//! Polls crossterm events on a background thread and sends them
//! through an async channel for the main event loop to consume.

use std::time::Duration;

use color_eyre::eyre::Result;
use crossterm::event::{self, Event, KeyEvent, KeyEventKind};
use tokio::sync::mpsc;

/// Application-level events.
#[derive(Debug)]
#[allow(dead_code)]
pub enum AppEvent {
    /// A key was pressed.
    Key(KeyEvent),
    /// Periodic tick for animations and status updates.
    Tick,
    /// Terminal was resized.
    Resize(u16, u16),
}

/// Handles terminal event polling on a background thread.
pub struct EventHandler {
    rx: mpsc::UnboundedReceiver<AppEvent>,
    // Keep handle alive so the thread isn't dropped
    _tx: mpsc::UnboundedSender<AppEvent>,
}

impl EventHandler {
    /// Create a new event handler with the given tick rate in milliseconds.
    pub fn new(tick_rate_ms: u64) -> Self {
        let (tx, rx) = mpsc::unbounded_channel();
        let event_tx = tx.clone();
        let tick_rate = Duration::from_millis(tick_rate_ms);

        // Spawn a blocking thread for event polling — crossterm's
        // event::poll is blocking and shouldn't run on the tokio runtime.
        std::thread::spawn(move || {
            loop {
                // Poll with timeout = tick rate
                if event::poll(tick_rate).unwrap_or(false) {
                    match event::read() {
                        Ok(Event::Key(key)) => {
                            // Only handle key press events (not release/repeat)
                            if key.kind == KeyEventKind::Press {
                                if event_tx.send(AppEvent::Key(key)).is_err() {
                                    return; // Receiver dropped, exit thread
                                }
                            }
                        }
                        Ok(Event::Resize(w, h)) => {
                            if event_tx.send(AppEvent::Resize(w, h)).is_err() {
                                return;
                            }
                        }
                        Ok(_) => {} // Ignore mouse, focus, paste events
                        Err(_) => return,
                    }
                } else {
                    // Timeout expired — send a tick
                    if event_tx.send(AppEvent::Tick).is_err() {
                        return;
                    }
                }
            }
        });

        Self { rx, _tx: tx }
    }

    /// Wait for the next event.
    pub async fn next(&mut self) -> Result<AppEvent> {
        self.rx
            .recv()
            .await
            .ok_or_else(|| color_eyre::eyre::eyre!("Event channel closed"))
    }
}
