use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::{Modifier, Style},
    text::{Line, Span},
    widgets::Widget,
};

use crate::app::types::RecentRun;
use crate::theme;

/// Widget to render the recent runs section at the top of the tree pane.
pub struct RecentRunsWidget<'a> {
    pub runs: &'a [RecentRun],
}

impl<'a> Widget for RecentRunsWidget<'a> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if self.runs.is_empty() || area.height == 0 {
            return;
        }

        // Show the most recent run (or up to 3).
        let max_runs = (area.height as usize).min(3).min(self.runs.len());

        for (i, run) in self.runs.iter().rev().take(max_runs).enumerate() {
            let y = area.y + i as u16;
            if y >= area.y + area.height {
                break;
            }

            let status_icon = if run.failed > 0 { "✗" } else { "✓" };
            let status_color = if run.failed > 0 {
                theme::FAILED
            } else {
                theme::PASSED
            };

            // Format duration.
            let duration = if run.duration_secs >= 60.0 {
                format!("{:.0}m{:.0}s", run.duration_secs / 60.0, run.duration_secs % 60.0)
            } else {
                format!("{:.0}s", run.duration_secs)
            };

            // Format time ago.
            let now = chrono::Utc::now().timestamp();
            let ago = now - run.timestamp;
            let ago_str = if ago < 60 {
                "just now".to_string()
            } else if ago < 3600 {
                format!("{}m ago", ago / 60)
            } else if ago < 86400 {
                format!("{}h ago", ago / 3600)
            } else {
                format!("{}d ago", ago / 86400)
            };

            let line = Line::from(vec![
                Span::styled(
                    format!(" {} ", status_icon),
                    Style::default().fg(status_color),
                ),
                Span::styled(
                    format!("{}/{}", run.passed, run.total),
                    Style::default().fg(theme::TEXT),
                ),
                Span::styled(
                    format!(" {} ", duration),
                    Style::default().fg(theme::OVERLAY0),
                ),
                Span::styled(
                    ago_str,
                    Style::default()
                        .fg(theme::OVERLAY0)
                        .add_modifier(Modifier::ITALIC),
                ),
            ]);

            buf.set_line(area.x, y, &line, area.width);
        }
    }
}

/// Returns how many rows the recent runs section needs.
pub fn required_height(runs: &[RecentRun]) -> u16 {
    if runs.is_empty() {
        0
    } else {
        (runs.len().min(3) as u16) + 1 // +1 for separator line
    }
}
