//! Horizontal tab bar — single row above the content area.
//!
//! Provides route switching between Home, Messages, Communities, and Settings.
//! Active tab shown with brackets, focused state uses inverted colors.

use ratatui::prelude::*;
use ratatui::widgets::Paragraph;

use crate::app::{ChatFocus, NavRoute};

/// Render the tab bar as a single horizontal row.
pub fn render(frame: &mut Frame, route: NavRoute, focus: ChatFocus, area: Rect) {
    let is_focused = focus == ChatFocus::TabBar;

    let items = [
        (NavRoute::Home, "Home"),
        (NavRoute::Messages, "Messages"),
        (NavRoute::Communities, "Communities"),
        (NavRoute::Settings, "\u{2699}"),
    ];

    let mut spans = Vec::new();
    spans.push(Span::styled(" ", Style::default()));

    for (i, (item_route, label)) in items.iter().enumerate() {
        let is_active = route == *item_route;

        let style = if is_active && is_focused {
            // Active + focused: inverted cyan
            Style::default().fg(Color::Black).bg(Color::Cyan).bold()
        } else if is_active {
            // Active but tab bar not focused: cyan bold
            Style::default().fg(Color::Cyan).bold()
        } else if is_focused {
            // Inactive but tab bar focused: white
            Style::default().fg(Color::White)
        } else {
            // Inactive and unfocused: dark gray
            Style::default().fg(Color::DarkGray)
        };

        if is_active {
            spans.push(Span::styled(format!("[{label}]"), style));
        } else {
            spans.push(Span::styled(format!(" {label} "), style));
        }

        // Add separator between tabs (not after the last one)
        if i < items.len() - 1 {
            spans.push(Span::styled(
                " \u{2502} ",
                Style::default().fg(Color::DarkGray),
            ));
        }
    }

    let tab_bar = Paragraph::new(Line::from(spans))
        .style(Style::default().bg(Color::Rgb(30, 30, 30)));

    frame.render_widget(tab_bar, area);
}
