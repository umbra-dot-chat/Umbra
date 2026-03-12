//! Crash report generation on unexpected client disconnect.
//!
//! Generates a Markdown file with system info, last events,
//! memory analysis, and session statistics.

use std::collections::HashMap;
use std::fs;
use std::io::Write;

use chrono::Local;
use color_eyre::eyre::Result;

use crate::app::App;
use crate::store;

/// Generate a crash report for the given client.
pub fn generate(app: &App, client_id: &str) -> Result<()> {
    let dir = store::log_dir();
    fs::create_dir_all(&dir)?;

    let filename = format!(
        "crash-{}.md",
        Local::now().format("%Y-%m-%dT%H%M%S")
    );
    let path = dir.join(filename);
    let mut file = fs::File::create(&path)?;

    writeln!(file, "# Crash Report")?;
    writeln!(file)?;
    writeln!(
        file,
        "**Generated**: {}",
        Local::now().format("%Y-%m-%d %H:%M:%S")
    )?;
    writeln!(file, "**Client ID**: {client_id}")?;
    writeln!(file, "**Session Duration**: {}", app.session_duration())?;
    writeln!(file)?;

    // System info from client hello
    if let Some(info) = app.clients.get(client_id) {
        writeln!(file, "## System Info")?;
        writeln!(file)?;
        writeln!(file, "- **User Agent**: {}", info.user_agent)?;
        writeln!(file, "- **Device Memory**: {:.1} GB", info.device_memory)?;
        writeln!(file)?;
    }

    // Last 100 events before disconnect
    writeln!(file, "## Last 100 Events")?;
    writeln!(file)?;
    writeln!(file, "```")?;
    let start = app.events.len().saturating_sub(100);
    for ev in &app.events[start..] {
        writeln!(
            file,
            "[{:.1}ms] [{}] {} dur={:.1}ms mem_growth={}",
            ev.ts, ev.cat, ev.func, ev.dur_ms, ev.mem_growth
        )?;
    }
    writeln!(file, "```")?;
    writeln!(file)?;

    // Top 10 memory-growing functions
    writeln!(file, "## Top 10 Memory Growers")?;
    writeln!(file)?;
    let mut growth_map: HashMap<String, i64> = HashMap::new();
    for ev in &app.events {
        if ev.mem_growth > 0 {
            *growth_map.entry(ev.func.clone()).or_default() += ev.mem_growth;
        }
    }
    let mut growers: Vec<(String, i64)> = growth_map.into_iter().collect();
    growers.sort_by(|a, b| b.1.cmp(&a.1));

    writeln!(file, "| Function | Total Growth |")?;
    writeln!(file, "|----------|-------------|")?;
    for (func, growth) in growers.iter().take(10) {
        writeln!(file, "| {} | {} |", func, format_bytes(*growth))?;
    }
    writeln!(file)?;

    // Memory timeline (last 30s as sparkline)
    writeln!(file, "## Memory Timeline (last 30s)")?;
    writeln!(file)?;
    let latest_ts = app.events.last().map(|e| e.ts).unwrap_or(0.0);
    let cutoff = latest_ts - 30_000.0;
    let mem_points: Vec<i64> = app
        .events
        .iter()
        .filter(|e| e.ts > cutoff && e.mem_after > 0)
        .map(|e| e.mem_after)
        .collect();

    if !mem_points.is_empty() {
        let bars = [
            ' ', '\u{2581}', '\u{2582}', '\u{2583}', '\u{2584}',
            '\u{2585}', '\u{2586}', '\u{2587}', '\u{2588}',
        ];
        let max = *mem_points.iter().max().unwrap_or(&1);
        let min = *mem_points.iter().min().unwrap_or(&0);
        let range = (max - min).max(1);

        let width = 60;
        let step = mem_points.len().max(1) / width.max(1);
        let step = step.max(1);

        writeln!(file, "```")?;
        for chunk in mem_points.chunks(step) {
            let avg = chunk.iter().sum::<i64>() / chunk.len() as i64;
            let idx = ((avg - min) * 8 / range).min(8) as usize;
            write!(file, "{}", bars[idx])?;
        }
        writeln!(file)?;
        writeln!(file, "```")?;
    }
    writeln!(file)?;

    // Session stats
    writeln!(file, "## Session Statistics")?;
    writeln!(file)?;
    let total_calls: u64 = app.func_stats.values().map(|s| s.call_count).sum();
    let total_growth = app.total_mem_growth();
    let sql_writes = app
        .events
        .iter()
        .filter(|e| e.cat == "sql")
        .count();

    writeln!(file, "- **Total WASM Calls**: {total_calls}")?;
    writeln!(file, "- **Total Memory Growth**: {}", format_bytes(total_growth))?;
    writeln!(file, "- **SQL Operations**: {sql_writes}")?;
    writeln!(file, "- **Events/sec (last)**: {:.0}", app.events_per_sec)?;

    Ok(())
}

/// Format bytes as a human-readable string.
fn format_bytes(bytes: i64) -> String {
    let abs = bytes.unsigned_abs();
    let sign = if bytes < 0 { "-" } else { "" };
    if abs >= 1_048_576 {
        format!("{sign}{:.1}MB", abs as f64 / 1_048_576.0)
    } else if abs >= 1024 {
        format!("{sign}{:.1}KB", abs as f64 / 1024.0)
    } else {
        format!("{sign}{abs}B")
    }
}
