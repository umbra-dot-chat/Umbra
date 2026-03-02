//! Status bar — single row at the bottom of the terminal.
//!
//! Shows connection state, identity info, friend count, active context, and unread messages.

use ratatui::prelude::*;
use ratatui::widgets::Paragraph;

/// Render the status bar.
pub fn render(
    frame: &mut Frame,
    relay_connected: bool,
    display_name: &str,
    username: Option<&str>,
    friend_count: usize,
    _unread_count: usize,
    active_context: Option<&str>,
    area: Rect,
) {
    let mut spans = Vec::new();

    // Connection indicator
    if relay_connected {
        spans.push(Span::styled(" \u{25CF} ", Style::default().fg(Color::Green).bold()));
        spans.push(Span::styled("Connected", Style::default().fg(Color::Green)));
    } else {
        spans.push(Span::styled(" \u{25CB} ", Style::default().fg(Color::Red).bold()));
        spans.push(Span::styled("Disconnected", Style::default().fg(Color::Red)));
    }

    spans.push(Span::styled(" \u{2502} ", Style::default().fg(Color::DarkGray)));

    // Identity
    let identity_text = username.unwrap_or(display_name);
    spans.push(Span::styled(
        identity_text,
        Style::default().fg(Color::Cyan).bold(),
    ));

    spans.push(Span::styled(" \u{2502} ", Style::default().fg(Color::DarkGray)));

    // Friend count
    spans.push(Span::styled(
        format!("{friend_count} friend{}", if friend_count != 1 { "s" } else { "" }),
        Style::default().fg(Color::DarkGray),
    ));

    // Active context (conversation, group, channel)
    if let Some(context) = active_context {
        spans.push(Span::styled(" \u{2502} ", Style::default().fg(Color::DarkGray)));
        spans.push(Span::styled(
            context,
            Style::default().fg(Color::Magenta),
        ));
    }

    let status = Paragraph::new(Line::from(spans))
        .style(Style::default().bg(Color::Rgb(30, 30, 30)));

    frame.render_widget(status, area);
}
