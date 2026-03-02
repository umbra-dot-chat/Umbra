//! Member actions dialog — kick/ban menu for a selected community member.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph};

use crate::app::{App, MemberActionItem, Screen};
use super::centered_rect;

pub fn render(frame: &mut Frame, app: &App) {
    let (member_name, member_did, actions, selected_action) = match &app.screen {
        Screen::MemberActions {
            member_name,
            member_did,
            actions,
            selected_action,
            ..
        } => (member_name, member_did, actions, *selected_action),
        _ => return,
    };

    let area = centered_rect(40, 35, frame.area());

    let title = format!(" Actions \u{2014} {} ", member_name);
    let block = Block::default()
        .title(title)
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Magenta));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(2, 2));

    let chunks = Layout::vertical([
        Constraint::Length(1), // Member DID
        Constraint::Length(1), // Separator
        Constraint::Min(3),   // Action list
        Constraint::Length(1), // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // ── Member DID ─────────────────────────────────────────────────────
    let did_display = if member_did.len() > 32 {
        format!("{}...", &member_did[..28])
    } else {
        member_did.clone()
    };
    let did_line = Paragraph::new(Line::from(Span::styled(
        did_display,
        Style::default().fg(Color::DarkGray),
    )));
    frame.render_widget(did_line, chunks[0]);

    // ── Separator ──────────────────────────────────────────────────────
    let sep_width = chunks[1].width as usize;
    let separator = Paragraph::new("\u{2500}".repeat(sep_width))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(separator, chunks[1]);

    // ── Action list ────────────────────────────────────────────────────
    let mut lines = Vec::new();
    for (i, action) in actions.iter().enumerate() {
        let is_cursor = i == selected_action;
        let prefix = if is_cursor { " > " } else { "   " };
        let prefix_style = if is_cursor {
            Style::default().fg(Color::Magenta)
        } else {
            Style::default().fg(Color::DarkGray)
        };

        let (label, desc, color) = match action {
            MemberActionItem::Kick => ("Kick", "Remove from community", Color::Yellow),
            MemberActionItem::Ban => ("Ban", "Remove and prevent rejoining", Color::Red),
        };

        let label_style = if is_cursor {
            Style::default().fg(color).bold()
        } else {
            Style::default().fg(color)
        };

        let desc_style = Style::default().fg(Color::DarkGray);

        lines.push(Line::from(vec![
            Span::styled(prefix, prefix_style),
            Span::styled(label, label_style),
            Span::styled(format!("  {}", desc), desc_style),
        ]));
    }

    frame.render_widget(Paragraph::new(lines), chunks[2]);

    // ── Controls ───────────────────────────────────────────────────────
    let controls = Paragraph::new(Line::from(vec![
        Span::styled("[Enter] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Confirm  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Cancel", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(controls, chunks[4]);
}
