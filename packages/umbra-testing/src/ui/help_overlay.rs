use ratatui::{
    buffer::Buffer,
    layout::{Alignment, Rect},
    style::{Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Clear, Padding, Widget},
};

use crate::theme;

/// Widget to render the help overlay.
pub struct HelpOverlay;

impl Widget for HelpOverlay {
    fn render(self, area: Rect, buf: &mut Buffer) {
        // Center a box in the terminal.
        let width = 50u16.min(area.width.saturating_sub(4));
        let height = 22u16.min(area.height.saturating_sub(4));
        let x = area.x + (area.width.saturating_sub(width)) / 2;
        let y = area.y + (area.height.saturating_sub(height)) / 2;
        let overlay_area = Rect::new(x, y, width, height);

        // Clear the area behind the overlay.
        Clear.render(overlay_area, buf);

        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(theme::MAUVE))
            .title(" Keybindings ")
            .title_alignment(Alignment::Center)
            .title_style(
                Style::default()
                    .fg(theme::MAUVE)
                    .add_modifier(Modifier::BOLD),
            )
            .style(Style::default().bg(theme::MANTLE))
            .padding(Padding::new(2, 2, 1, 0));

        let inner = block.inner(overlay_area);
        block.render(overlay_area, buf);

        let bindings = [
            ("j/k ↑/↓", "Navigate tree"),
            ("h/l ←/→", "Collapse/Expand"),
            ("Space", "Toggle selection"),
            ("Enter", "Run selected"),
            ("a", "Select all in category"),
            ("A", "Select all"),
            ("c", "Clear selection"),
            ("r", "Re-run failed"),
            ("v", "View test output"),
            ("K", "Kill all processes"),
            ("Tab", "Switch pane"),
            ("/", "Search"),
            ("?", "Toggle help"),
            ("o", "Open screenshot"),
            ("Ctrl+C", "Cancel / Quit"),
            ("q", "Quit"),
        ];

        for (i, (key, desc)) in bindings.iter().enumerate() {
            if i as u16 >= inner.height {
                break;
            }
            let y = inner.y + i as u16;
            let line = Line::from(vec![
                Span::styled(
                    format!("{:>12}", key),
                    Style::default()
                        .fg(theme::HELP_KEY)
                        .add_modifier(Modifier::BOLD),
                ),
                Span::raw("  "),
                Span::styled(
                    desc.to_string(),
                    Style::default().fg(theme::HELP_DESC),
                ),
            ]);
            buf.set_line(inner.x, y, &line, inner.width);
        }
    }
}
