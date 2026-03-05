use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::{Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Padding, Widget},
};

use crate::app::types::*;
use crate::theme;

/// Widget to render the output pane (right side).
pub struct OutputPane<'a> {
    pub live_output: &'a [OutputLine],
    pub running_test: Option<&'a str>,
    pub scroll: usize,
    pub pane_focused: bool,
    pub tick: usize,
}

impl<'a> Widget for OutputPane<'a> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let border_style = if self.pane_focused {
            Style::default().fg(theme::MAUVE)
        } else {
            Style::default().fg(theme::SURFACE1)
        };

        let title = if let Some(test_name) = self.running_test {
            let spinner = spinner_char(self.tick);
            format!(" {} Running: {} ", spinner, short_name(test_name))
        } else {
            " Output ".to_string()
        };

        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(border_style)
            .title(title)
            .title_style(
                Style::default()
                    .fg(if self.running_test.is_some() {
                        theme::RUNNING
                    } else {
                        theme::TEXT
                    })
                    .add_modifier(Modifier::BOLD),
            )
            .style(Style::default().bg(theme::BG))
            .padding(Padding::new(1, 1, 0, 0));

        let inner = block.inner(area);
        block.render(area, buf);

        if self.live_output.is_empty() {
            let msg = if self.running_test.is_some() {
                "Waiting for output..."
            } else {
                "Select tests and press Enter to run"
            };
            let line = Line::from(Span::styled(
                msg,
                Style::default().fg(theme::OVERLAY0),
            ));
            buf.set_line(inner.x, inner.y, &line, inner.width);
            return;
        }

        // Render output lines with scroll offset.
        let visible_height = inner.height as usize;
        // Clamp scroll so we don't go past the end.
        let max_scroll = self.live_output.len().saturating_sub(visible_height);
        let start = self.scroll.min(max_scroll);

        for (i, line_idx) in (start..self.live_output.len())
            .take(visible_height)
            .enumerate()
        {
            let output_line = &self.live_output[line_idx];
            let y = inner.y + i as u16;

            let style = if output_line.is_error {
                Style::default().fg(theme::FAILED)
            } else if output_line.text.contains("PASS") || output_line.text.contains("✓") {
                Style::default().fg(theme::PASSED)
            } else if output_line.text.contains("FAIL") || output_line.text.contains("✗") {
                Style::default().fg(theme::FAILED)
            } else {
                Style::default().fg(theme::SUBTEXT0)
            };

            let line = Line::from(Span::styled(output_line.text.clone(), style));
            buf.set_line(inner.x, y, &line, inner.width);
        }
    }
}

/// Get a spinner character for the given tick.
fn spinner_char(tick: usize) -> char {
    let frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    frames[tick % frames.len()]
}

/// Shorten a test ID to just the file name.
fn short_name(test_id: &str) -> &str {
    test_id.rsplit('/').next().unwrap_or(test_id)
}
