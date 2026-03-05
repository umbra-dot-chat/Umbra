use ratatui::{
    buffer::Buffer,
    layout::{Alignment, Rect},
    style::{Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Clear, Padding, Widget},
};

use crate::theme;

/// Widget to render the Detox configuration prompt.
pub struct DetoxPrompt {
    pub selection: usize,
}

impl Widget for DetoxPrompt {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let width = 40u16.min(area.width.saturating_sub(4));
        let height = 10u16.min(area.height.saturating_sub(4));
        let x = area.x + (area.width.saturating_sub(width)) / 2;
        let y = area.y + (area.height.saturating_sub(height)) / 2;
        let overlay_area = Rect::new(x, y, width, height);

        Clear.render(overlay_area, buf);

        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(theme::CATEGORY_DETOX))
            .title(" Detox Configuration ")
            .title_alignment(Alignment::Center)
            .title_style(
                Style::default()
                    .fg(theme::CATEGORY_DETOX)
                    .add_modifier(Modifier::BOLD),
            )
            .style(Style::default().bg(theme::MANTLE))
            .padding(Padding::new(2, 2, 1, 0));

        let inner = block.inner(overlay_area);
        block.render(overlay_area, buf);

        // Instructions.
        let instruction = Line::from(Span::styled(
            "Select configuration:",
            Style::default().fg(theme::SUBTEXT0),
        ));
        buf.set_line(inner.x, inner.y, &instruction, inner.width);

        // Option 1: ios.debug
        let debug_style = if self.selection == 0 {
            Style::default()
                .fg(theme::MAUVE)
                .bg(theme::CURSOR_BG)
                .add_modifier(Modifier::BOLD)
        } else {
            Style::default().fg(theme::TEXT)
        };
        let debug_marker = if self.selection == 0 { "▸ " } else { "  " };
        let debug_line = Line::from(vec![
            Span::styled(debug_marker.to_string(), debug_style),
            Span::styled("1. ios.debug", debug_style),
            Span::styled("  (dev server)", Style::default().fg(theme::OVERLAY0)),
        ]);
        buf.set_line(inner.x, inner.y + 2, &debug_line, inner.width);

        // Option 2: ios.release
        let release_style = if self.selection == 1 {
            Style::default()
                .fg(theme::MAUVE)
                .bg(theme::CURSOR_BG)
                .add_modifier(Modifier::BOLD)
        } else {
            Style::default().fg(theme::TEXT)
        };
        let release_marker = if self.selection == 1 { "▸ " } else { "  " };
        let release_line = Line::from(vec![
            Span::styled(release_marker.to_string(), release_style),
            Span::styled("2. ios.release", release_style),
            Span::styled("  (pre-built)", Style::default().fg(theme::OVERLAY0)),
        ]);
        buf.set_line(inner.x, inner.y + 3, &release_line, inner.width);

        // Hint.
        let hint = Line::from(vec![
            Span::styled("Enter", Style::default().fg(theme::HELP_KEY)),
            Span::styled("=confirm  ", Style::default().fg(theme::OVERLAY0)),
            Span::styled("Esc", Style::default().fg(theme::HELP_KEY)),
            Span::styled("=cancel", Style::default().fg(theme::OVERLAY0)),
        ]);
        if inner.height > 5 {
            buf.set_line(inner.x, inner.y + 5, &hint, inner.width);
        }
    }
}
