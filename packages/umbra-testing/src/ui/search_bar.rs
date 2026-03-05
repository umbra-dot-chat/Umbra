use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::{Modifier, Style},
    text::{Line, Span},
    widgets::Widget,
};

use crate::theme;

/// Widget to render the search bar at the bottom of the screen.
pub struct SearchBar<'a> {
    pub query: &'a str,
}

impl<'a> Widget for SearchBar<'a> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 {
            return;
        }

        let line = Line::from(vec![
            Span::styled(
                " / ",
                Style::default()
                    .fg(theme::MAUVE)
                    .add_modifier(Modifier::BOLD),
            ),
            Span::styled(
                self.query.to_string(),
                Style::default().fg(theme::TEXT),
            ),
            Span::styled(
                "▎",
                Style::default()
                    .fg(theme::MAUVE)
                    .add_modifier(Modifier::SLOW_BLINK),
            ),
        ]);

        // Fill background.
        for x in area.x..area.x + area.width {
            buf[(x, area.y)]
                .set_style(Style::default().bg(theme::SURFACE0));
        }

        buf.set_line(area.x, area.y, &line, area.width);
    }
}
