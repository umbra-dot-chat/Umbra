//! CLI query functions for inspecting saved sessions.
//!
//! These functions are used by the `query` subcommand to print
//! analysis results to stdout without launching the TUI.

use std::collections::HashMap;
use std::path::Path;

use color_eyre::eyre::{eyre, Result};
use regex::Regex;

use crate::app::TraceEvent;
use crate::store;

/// Print the contents of the last crash report.
pub fn print_last_crash(log_dir: &Path) -> Result<()> {
    match store::find_latest_crash(log_dir)? {
        Some(path) => {
            let content = std::fs::read_to_string(&path)?;
            println!("{content}");
        }
        None => {
            println!("No crash reports found.");
        }
    }
    Ok(())
}

/// Print top 20 functions by total memory growth.
pub fn print_memory_suspects(log_dir: &Path) -> Result<()> {
    let events = load_latest_session(log_dir)?;
    let mut growth_map: HashMap<String, i64> = HashMap::new();

    for ev in &events {
        if ev.mem_growth != 0 {
            *growth_map.entry(ev.func.clone()).or_default() += ev.mem_growth;
        }
    }

    let mut suspects: Vec<(String, i64)> = growth_map.into_iter().collect();
    suspects.sort_by(|a, b| b.1.abs().cmp(&a.1.abs()));

    println!("{:<50} {:>15}", "Function", "Total Growth");
    println!("{}", "-".repeat(67));
    for (func, growth) in suspects.iter().take(20) {
        println!("{:<50} {:>15}", func, format_bytes(*growth));
    }
    Ok(())
}

/// Print top 20 functions by call count.
pub fn print_hot_functions(log_dir: &Path) -> Result<()> {
    let events = load_latest_session(log_dir)?;
    let mut count_map: HashMap<String, usize> = HashMap::new();

    for ev in &events {
        *count_map.entry(ev.func.clone()).or_default() += 1;
    }

    let mut hot: Vec<(String, usize)> = count_map.into_iter().collect();
    hot.sort_by(|a, b| b.1.cmp(&a.1));

    println!("{:<50} {:>10}", "Function", "Calls");
    println!("{}", "-".repeat(62));
    for (func, count) in hot.iter().take(20) {
        println!("{:<50} {:>10}", func, count);
    }
    Ok(())
}

/// Regex search across all session files.
pub fn print_grep(log_dir: &Path, pattern: &str) -> Result<()> {
    let re = Regex::new(pattern)?;
    let sessions = store::list_sessions(log_dir)?;

    for session_path in sessions {
        let events = store::load_session(&session_path)?;
        let filename = session_path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy();

        for ev in &events {
            let line = serde_json::to_string(ev)?;
            if re.is_match(&line) {
                println!("[{filename}] seq={} {} {}", ev.seq, ev.cat, ev.func);
            }
        }
    }
    Ok(())
}

/// Print ASCII memory timeline from the last session.
pub fn print_memory_timeline(log_dir: &Path) -> Result<()> {
    let events = load_latest_session(log_dir)?;

    if events.is_empty() {
        println!("No events in last session.");
        return Ok(());
    }

    // Collect memory snapshots over time
    let mut mem_points: Vec<(f64, i64)> = Vec::new();
    for ev in &events {
        if ev.mem_after > 0 {
            mem_points.push((ev.ts, ev.mem_after));
        }
    }

    if mem_points.is_empty() {
        println!("No memory data in last session.");
        return Ok(());
    }

    // Print a simple ASCII sparkline of memory over time
    let max_mem = mem_points.iter().map(|(_, m)| *m).max().unwrap_or(1);
    let min_mem = mem_points.iter().map(|(_, m)| *m).min().unwrap_or(0);
    let range = (max_mem - min_mem).max(1);

    let width = 60;
    let step = mem_points.len().max(1) / width.max(1);
    let step = step.max(1);

    println!("Memory Timeline (last session)");
    println!("Max: {}  Min: {}", format_bytes(max_mem), format_bytes(min_mem));
    println!();

    let bars = [' ', '\u{2581}', '\u{2582}', '\u{2583}', '\u{2584}', '\u{2585}', '\u{2586}', '\u{2587}', '\u{2588}'];
    let mut sparkline = String::new();

    for chunk in mem_points.chunks(step) {
        let avg = chunk.iter().map(|(_, m)| *m).sum::<i64>() / chunk.len() as i64;
        let normalized = ((avg - min_mem) * 8 / range).min(8) as usize;
        sparkline.push(bars[normalized]);
    }

    println!("{sparkline}");
    Ok(())
}

/// Load events from the latest session file.
fn load_latest_session(log_dir: &Path) -> Result<Vec<TraceEvent>> {
    let sessions = store::list_sessions(log_dir)?;
    let path = sessions
        .first()
        .ok_or_else(|| eyre!("No session files found"))?;
    store::load_session(path)
}

/// Format bytes as a human-readable string.
fn format_bytes(bytes: i64) -> String {
    let abs = bytes.unsigned_abs();
    let sign = if bytes < 0 { "-" } else { "" };
    if abs >= 1_073_741_824 {
        format!("{sign}{:.1}GB", abs as f64 / 1_073_741_824.0)
    } else if abs >= 1_048_576 {
        format!("{sign}{:.1}MB", abs as f64 / 1_048_576.0)
    } else if abs >= 1024 {
        format!("{sign}{:.1}KB", abs as f64 / 1024.0)
    } else {
        format!("{sign}{abs}B")
    }
}
