use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::{Modifier, Style},
    text::{Line, Span},
    widgets::Widget,
};

use crate::app::types::*;
use crate::theme;

/// Widget to render the status bar at the bottom.
pub struct StatusBar<'a> {
    pub counts: &'a TestCounts,
    pub input_mode: InputMode,
    pub search_query: &'a str,
}

impl<'a> Widget for StatusBar<'a> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        // Fill background.
        let bg_style = Style::default().bg(theme::STATUS_BG);
        for x in area.x..area.x + area.width {
            buf.set_style(Rect::new(x, area.y, 1, 1), bg_style);
        }

        let mut left_spans: Vec<Span> = Vec::new();
        let mut right_spans: Vec<Span> = Vec::new();

        // Left side: counts.
        left_spans.push(Span::styled(
            " ",
            Style::default().bg(theme::STATUS_BG),
        ));

        // Total tests.
        left_spans.push(Span::styled(
            format!("{} tests", self.counts.total),
            Style::default().fg(theme::TEXT).bg(theme::STATUS_BG),
        ));

        // Selected.
        if self.counts.selected > 0 {
            left_spans.push(Span::styled(
                format!("  {} selected", self.counts.selected),
                Style::default()
                    .fg(theme::SELECTED)
                    .bg(theme::STATUS_BG)
                    .add_modifier(Modifier::BOLD),
            ));
        }

        // Running.
        if self.counts.running > 0 {
            left_spans.push(Span::styled(
                format!("  {} running", self.counts.running),
                Style::default().fg(theme::RUNNING).bg(theme::STATUS_BG),
            ));
        }

        // Passed.
        if self.counts.passed > 0 {
            left_spans.push(Span::styled(
                format!("  {} ✓", self.counts.passed),
                Style::default().fg(theme::PASSED).bg(theme::STATUS_BG),
            ));
        }

        // Failed.
        if self.counts.failed > 0 {
            left_spans.push(Span::styled(
                format!("  {} ✗", self.counts.failed),
                Style::default()
                    .fg(theme::FAILED)
                    .bg(theme::STATUS_BG)
                    .add_modifier(Modifier::BOLD),
            ));
        }

        // Queued.
        if self.counts.queued > 0 {
            left_spans.push(Span::styled(
                format!("  {} queued", self.counts.queued),
                Style::default().fg(theme::QUEUED).bg(theme::STATUS_BG),
            ));
        }

        // Right side: mode hints or search bar.
        match self.input_mode {
            InputMode::Search => {
                right_spans.push(Span::styled(
                    format!(" /{}▎", self.search_query),
                    Style::default()
                        .fg(theme::SEARCH_MATCH)
                        .bg(theme::STATUS_BG),
                ));
            }
            InputMode::Help => {
                right_spans.push(Span::styled(
                    " HELP ",
                    Style::default()
                        .fg(theme::MAUVE)
                        .bg(theme::STATUS_BG)
                        .add_modifier(Modifier::BOLD),
                ));
            }
            InputMode::DetoxPrompt => {
                right_spans.push(Span::styled(
                    " DETOX CONFIG ",
                    Style::default()
                        .fg(theme::CATEGORY_DETOX)
                        .bg(theme::STATUS_BG)
                        .add_modifier(Modifier::BOLD),
                ));
            }
            InputMode::Normal => {
                right_spans.push(Span::styled(
                    "?",
                    Style::default()
                        .fg(theme::HELP_KEY)
                        .bg(theme::STATUS_BG),
                ));
                right_spans.push(Span::styled(
                    "=help ",
                    Style::default().fg(theme::OVERLAY0).bg(theme::STATUS_BG),
                ));
                right_spans.push(Span::styled(
                    "/",
                    Style::default()
                        .fg(theme::HELP_KEY)
                        .bg(theme::STATUS_BG),
                ));
                right_spans.push(Span::styled(
                    "=search ",
                    Style::default().fg(theme::OVERLAY0).bg(theme::STATUS_BG),
                ));
            }
        }

        // Render left-aligned spans.
        let left_line = Line::from(left_spans);
        buf.set_line(area.x, area.y, &left_line, area.width);

        // Render right-aligned spans.
        let right_line = Line::from(right_spans);
        let right_width: u16 = right_line
            .spans
            .iter()
            .map(|s| s.content.len() as u16)
            .sum();
        let right_x = area.x + area.width.saturating_sub(right_width + 1);
        buf.set_line(right_x, area.y, &right_line, right_width + 1);
    }
}
