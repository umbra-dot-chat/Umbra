//! Application state, tab management, and event routing.
//!
//! The `App` struct owns all trace events, per-client state,
//! computed statistics, and UI mode (active tab, filter, scroll).

use std::collections::HashMap;
use std::time::Instant;

use crossterm::event::{KeyCode, KeyModifiers};
use ratatui::prelude::*;
use regex::Regex;
use serde::{Deserialize, Serialize};

use crate::server::WsEvent;
use crate::store::SessionWriter;
use crate::ui;

/// Maximum events kept in memory (circular buffer behavior).
const MAX_EVENTS: usize = 100_000;

/// A single trace event received from the browser.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraceEvent {
    /// Monotonically increasing sequence number.
    pub seq: u64,
    /// High-resolution timestamp (performance.now() in ms).
    pub ts: f64,
    /// Event category.
    pub cat: String,
    /// Function name.
    #[serde(rename = "fn")]
    pub func: String,
    /// Argument size in bytes.
    #[serde(rename = "argBytes", default)]
    pub arg_bytes: u64,
    /// Optional argument preview string.
    #[serde(rename = "argPreview", default)]
    pub arg_preview: Option<String>,
    /// Duration in milliseconds.
    #[serde(rename = "durMs", default)]
    pub dur_ms: f64,
    /// WASM memory before call.
    #[serde(rename = "memBefore", default)]
    pub mem_before: i64,
    /// WASM memory after call.
    #[serde(rename = "memAfter", default)]
    pub mem_after: i64,
    /// Memory growth (memAfter - memBefore).
    #[serde(rename = "memGrowth", default)]
    pub mem_growth: i64,
    /// Parent SQL caller context.
    #[serde(rename = "sqlContext", default)]
    pub sql_context: Option<String>,
    /// Client identifier.
    #[serde(rename = "clientId", default)]
    pub client_id: String,
    /// Error message if this event represents a failure.
    #[serde(default)]
    pub err: Option<String>,
}

/// Connected client info from the hello handshake.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct ClientInfo {
    pub client_id: String,
    pub user_agent: String,
    pub device_memory: f64,
    pub connected_at: Instant,
}

/// Active tab in the TUI.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Tab {
    All,
    Wasm,
    Sql,
    Net,
    Mem,
    Err,
    Analysis,
    Browser,
}

impl Tab {
    pub const ALL: [Tab; 8] = [
        Tab::All,
        Tab::Wasm,
        Tab::Sql,
        Tab::Net,
        Tab::Mem,
        Tab::Err,
        Tab::Analysis,
        Tab::Browser,
    ];

    pub fn label(self) -> &'static str {
        match self {
            Tab::All => "All",
            Tab::Wasm => "WASM",
            Tab::Sql => "SQL",
            Tab::Net => "Net",
            Tab::Mem => "Mem",
            Tab::Err => "Err",
            Tab::Analysis => "Analysis",
            Tab::Browser => "Browser",
        }
    }

    pub fn next(self) -> Tab {
        let idx = Tab::ALL.iter().position(|&t| t == self).unwrap_or(0);
        Tab::ALL[(idx + 1) % Tab::ALL.len()]
    }

    pub fn prev(self) -> Tab {
        let idx = Tab::ALL.iter().position(|&t| t == self).unwrap_or(0);
        Tab::ALL[(idx + Tab::ALL.len() - 1) % Tab::ALL.len()]
    }
}

/// Per-function aggregated stats (for WASM and Analysis tabs).
#[derive(Debug, Clone, Default)]
pub struct FuncStats {
    pub call_count: u64,
    pub total_dur_ms: f64,
    pub total_mem_growth: i64,
    /// Recent call timestamps for calls/sec calculation.
    pub recent_calls: Vec<f64>,
}

/// Application state.
pub struct App {
    /// All trace events this session.
    pub events: Vec<TraceEvent>,
    /// Active tab.
    pub tab: Tab,
    /// Whether event ingestion is paused.
    pub paused: bool,
    /// Scroll offset for scrollable views.
    pub scroll_offset: usize,
    /// Compiled regex filter (applied to All tab).
    pub filter: Option<Regex>,
    /// Current filter text being typed.
    pub filter_input: String,
    /// Whether the filter input bar is active.
    pub filter_mode: bool,
    /// Connected clients.
    pub clients: HashMap<String, ClientInfo>,
    /// Session start time.
    pub session_start: Instant,
    /// Events per second (calculated from recent events).
    pub events_per_sec: f64,
    /// Memory graph window in seconds (adjustable).
    pub mem_graph_window_secs: u16,
    /// Per-function aggregated stats.
    pub func_stats: HashMap<String, FuncStats>,
    /// Whether the app should quit.
    pub should_quit: bool,
    /// Session JSONL writer.
    pub session_writer: Option<SessionWriter>,
    /// Whether auto-scroll is active (user hasn't scrolled up).
    pub auto_scroll: bool,
    /// Event count at last tick (for events/sec calculation).
    events_at_last_tick: usize,
    /// Tick counter for events/sec smoothing.
    tick_count: u64,
}

impl App {
    /// Create a new App with default state.
    pub fn new() -> Self {
        let session_writer = SessionWriter::new()
            .map_err(|e| eprintln!("Failed to create session writer: {e}"))
            .ok();

        Self {
            events: Vec::with_capacity(1024),
            tab: Tab::All,
            paused: false,
            scroll_offset: 0,
            filter: None,
            filter_input: String::new(),
            filter_mode: false,
            clients: HashMap::new(),
            session_start: Instant::now(),
            events_per_sec: 0.0,
            mem_graph_window_secs: 60,
            func_stats: HashMap::new(),
            should_quit: false,
            session_writer,
            auto_scroll: true,
            events_at_last_tick: 0,
            tick_count: 0,
        }
    }

    /// Handle a key press event.
    pub fn handle_key(&mut self, code: KeyCode, modifiers: KeyModifiers) {
        // In filter input mode, route keys to filter editing
        if self.filter_mode {
            match code {
                KeyCode::Esc => {
                    self.filter_mode = false;
                    self.filter_input.clear();
                    self.filter = None;
                }
                KeyCode::Enter => {
                    self.filter_mode = false;
                    if self.filter_input.is_empty() {
                        self.filter = None;
                    } else {
                        match Regex::new(&self.filter_input) {
                            Ok(re) => self.filter = Some(re),
                            Err(_) => {
                                // Invalid regex — clear filter
                                self.filter = None;
                            }
                        }
                    }
                }
                KeyCode::Backspace => {
                    self.filter_input.pop();
                }
                KeyCode::Char(c) => {
                    self.filter_input.push(c);
                }
                _ => {}
            }
            return;
        }

        // Normal mode key handling
        match code {
            KeyCode::Char('q') => self.should_quit = true,
            KeyCode::Char('c') if modifiers.contains(KeyModifiers::CONTROL) => {
                self.should_quit = true;
            }
            KeyCode::Tab => {
                self.tab = self.tab.next();
                self.scroll_offset = 0;
            }
            KeyCode::BackTab => {
                self.tab = self.tab.prev();
                self.scroll_offset = 0;
            }
            KeyCode::Char(' ') => {
                self.paused = !self.paused;
            }
            KeyCode::Char('/') => {
                self.filter_mode = true;
                self.filter_input.clear();
            }
            KeyCode::Esc => {
                self.filter = None;
                self.filter_input.clear();
            }
            KeyCode::Char('j') | KeyCode::Down => {
                self.scroll_offset = self.scroll_offset.saturating_add(1);
                self.auto_scroll = false;
            }
            KeyCode::Char('k') | KeyCode::Up => {
                self.scroll_offset = self.scroll_offset.saturating_sub(1);
                if self.scroll_offset == 0 {
                    self.auto_scroll = true;
                }
            }
            KeyCode::Char('G') => {
                // Jump to bottom
                self.auto_scroll = true;
                self.scroll_offset = 0;
            }
            KeyCode::Char('+') | KeyCode::Char('=') => {
                self.mem_graph_window_secs =
                    (self.mem_graph_window_secs + 10).min(300);
            }
            KeyCode::Char('-') => {
                self.mem_graph_window_secs =
                    self.mem_graph_window_secs.saturating_sub(10).max(10);
            }
            _ => {}
        }
    }

    /// Handle a WebSocket event from the server.
    pub fn handle_ws_event(&mut self, event: WsEvent) {
        match event {
            WsEvent::ClientConnected {
                client_id,
                user_agent,
                device_memory,
            } => {
                self.clients.insert(
                    client_id.clone(),
                    ClientInfo {
                        client_id,
                        user_agent,
                        device_memory,
                        connected_at: Instant::now(),
                    },
                );
            }
            WsEvent::Trace(trace) => {
                if !self.paused {
                    self.ingest_event(trace);
                }
            }
            WsEvent::ClientDisconnected { client_id, clean } => {
                if !clean {
                    self.generate_crash_report(&client_id);
                }
                self.clients.remove(&client_id);
            }
        }
    }

    /// Ingest a trace event into the app state.
    fn ingest_event(&mut self, event: TraceEvent) {
        // Update per-function stats
        let stats = self.func_stats.entry(event.func.clone()).or_default();
        stats.call_count += 1;
        stats.total_dur_ms += event.dur_ms;
        stats.total_mem_growth += event.mem_growth;
        stats.recent_calls.push(event.ts);

        // Write to session file
        if let Some(ref mut writer) = self.session_writer {
            let _ = writer.write_event(&event);
        }

        // Circular buffer: remove oldest if at capacity
        if self.events.len() >= MAX_EVENTS {
            self.events.remove(0);
        }

        self.events.push(event);
    }

    /// Periodic tick — update computed metrics.
    pub fn tick(&mut self) {
        self.tick_count += 1;

        // Calculate events/sec (every tick = 200ms, so 5 ticks = 1s)
        let current_count = self.events.len();
        let delta = current_count.saturating_sub(self.events_at_last_tick);
        // Exponential moving average (alpha=0.3)
        let instant_rate = delta as f64 * 5.0; // 200ms tick → multiply by 5 for /sec
        self.events_per_sec = self.events_per_sec * 0.7 + instant_rate * 0.3;
        self.events_at_last_tick = current_count;

        // Trim old recent_calls data (keep last 10s window)
        if let Some(latest_ts) = self.events.last().map(|e| e.ts) {
            let cutoff = latest_ts - 10_000.0;
            for stats in self.func_stats.values_mut() {
                stats.recent_calls.retain(|&ts| ts > cutoff);
            }
        }
    }

    /// Generate a crash report when a client disconnects unexpectedly.
    fn generate_crash_report(&self, client_id: &str) {
        if let Err(e) = crate::crash_report::generate(self, client_id) {
            eprintln!("Failed to generate crash report: {e}");
        }
    }

    /// Render the full UI.
    pub fn render(&self, frame: &mut Frame) {
        ui::render(frame, self);
    }

    /// Get the latest memory value across all events.
    pub fn latest_mem(&self) -> i64 {
        self.events
            .iter()
            .rev()
            .find(|e| e.mem_after > 0)
            .map(|e| e.mem_after)
            .unwrap_or(0)
    }

    /// Get total memory growth this session.
    pub fn total_mem_growth(&self) -> i64 {
        self.func_stats.values().map(|s| s.total_mem_growth).sum()
    }

    /// Get the session duration as a formatted string.
    pub fn session_duration(&self) -> String {
        let secs = self.session_start.elapsed().as_secs();
        let mins = secs / 60;
        let secs = secs % 60;
        format!("{mins}m{secs:02}s")
    }

    /// Get events filtered by the current regex filter.
    pub fn filtered_events(&self) -> Vec<&TraceEvent> {
        match &self.filter {
            Some(re) => self
                .events
                .iter()
                .filter(|e| {
                    re.is_match(&e.func)
                        || re.is_match(&e.cat)
                        || e.err.as_deref().is_some_and(|err| re.is_match(err))
                })
                .collect(),
            None => self.events.iter().collect(),
        }
    }

    /// Get events filtered by category.
    pub fn events_by_cat(&self, cat: &str) -> Vec<&TraceEvent> {
        self.events.iter().filter(|e| e.cat == cat).collect()
    }
}
