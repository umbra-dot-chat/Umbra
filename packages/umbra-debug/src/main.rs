//! # Umbra Debug TUI
//!
//! Terminal inspector for Umbra WASM trace events. Receives trace
//! data via WebSocket from the browser and displays it in an
//! interactive ratatui-based terminal UI with multiple analysis tabs.
//!
//! ## Usage
//!
//! ```bash
//! # Launch TUI mode (default)
//! umbra-debug
//!
//! # Launch on a custom port
//! umbra-debug --port 8888
//!
//! # Replay a saved session
//! umbra-debug --replay ~/.umbra/debug-logs/session-2026-03-12T120000.jsonl
//!
//! # CLI query mode
//! umbra-debug query --last-crash
//! umbra-debug query --memory-suspects
//! umbra-debug query --hot-functions
//! umbra-debug query --grep "store_incoming"
//! umbra-debug query --tail
//! umbra-debug query --memory-timeline
//! ```

mod app;
mod crash_report;
mod replay;
mod server;
mod store;
mod tui;
mod ui;

use clap::{Parser, Subcommand};
use color_eyre::eyre::Result;

/// Umbra Debug TUI — trace event inspector for WASM debugging.
#[derive(Parser)]
#[command(name = "umbra-debug", version, about)]
struct Cli {
    /// WebSocket server port (default: 9999)
    #[arg(long, default_value_t = 9999)]
    port: u16,

    /// Replay a saved JSONL session file
    #[arg(long, value_name = "FILE")]
    replay: Option<String>,

    /// Enable verbose logging
    #[arg(long)]
    verbose: bool,

    /// CLI query subcommand (skip TUI)
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Query saved sessions without launching the TUI
    Query {
        /// Print the last crash report
        #[arg(long)]
        last_crash: bool,

        /// Print top 20 memory-growing functions from last session
        #[arg(long)]
        memory_suspects: bool,

        /// Print top 20 functions by call count from last session
        #[arg(long)]
        hot_functions: bool,

        /// Regex search across all session files
        #[arg(long, value_name = "PATTERN")]
        grep: Option<String>,

        /// Tail live events from a running TUI instance
        #[arg(long)]
        tail: bool,

        /// Print ASCII memory timeline from last session
        #[arg(long)]
        memory_timeline: bool,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    color_eyre::install()?;
    let cli = Cli::parse();

    // CLI query mode — print to stdout and exit
    if let Some(Commands::Query {
        last_crash,
        memory_suspects,
        hot_functions,
        grep,
        tail,
        memory_timeline,
    }) = cli.command
    {
        return run_query(
            last_crash,
            memory_suspects,
            hot_functions,
            grep,
            tail,
            memory_timeline,
        )
        .await;
    }

    // TUI mode (default or --replay)
    run_tui(cli.port, cli.replay, cli.verbose).await
}

/// Run the interactive TUI.
async fn run_tui(port: u16, replay_path: Option<String>, _verbose: bool) -> Result<()> {
    use app::App;
    use crossterm::event::{self, Event, KeyEventKind};
    use std::time::Duration;
    use tokio::sync::mpsc;

    // Channel for trace events from WebSocket server
    let (ws_tx, mut ws_rx) = mpsc::unbounded_channel();

    let mut app = App::new();

    // Start WebSocket server (unless in replay mode)
    if replay_path.is_none() {
        server::start(port, ws_tx.clone()).await?;
    }

    // Initialize terminal
    let mut terminal = tui::init()?;

    // Tick interval for UI refresh
    let tick_rate = Duration::from_millis(200);

    loop {
        // Render
        terminal.draw(|frame| app.render(frame))?;

        if app.should_quit {
            break;
        }

        // Event loop: terminal events, WebSocket messages, or tick timeout
        tokio::select! {
            // Terminal input (poll with tick_rate timeout)
            _ = tokio::time::sleep(tick_rate) => {
                // Check for crossterm events (non-blocking)
                while event::poll(Duration::ZERO)? {
                    if let Event::Key(key) = event::read()? {
                        if key.kind == KeyEventKind::Press {
                            app.handle_key(key.code, key.modifiers);
                        }
                    }
                }
                app.tick();
            }
            // WebSocket trace events
            msg = ws_rx.recv() => {
                if let Some(event) = msg {
                    app.handle_ws_event(event);
                }
            }
        }
    }

    // Restore terminal
    tui::restore()?;
    Ok(())
}

/// Run CLI query mode — prints to stdout and exits.
async fn run_query(
    last_crash: bool,
    memory_suspects: bool,
    hot_functions: bool,
    grep: Option<String>,
    _tail: bool,
    memory_timeline: bool,
) -> Result<()> {
    let log_dir = store::log_dir();

    if last_crash {
        store::query::print_last_crash(&log_dir)?;
    } else if memory_suspects {
        store::query::print_memory_suspects(&log_dir)?;
    } else if hot_functions {
        store::query::print_hot_functions(&log_dir)?;
    } else if let Some(pattern) = grep {
        store::query::print_grep(&log_dir, &pattern)?;
    } else if memory_timeline {
        store::query::print_memory_timeline(&log_dir)?;
    } else {
        println!("No query flag provided. Use --help for options.");
    }

    Ok(())
}
