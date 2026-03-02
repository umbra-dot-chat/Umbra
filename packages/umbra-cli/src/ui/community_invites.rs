//! Community invites dialog — create and manage invite codes.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph};

use crate::app::{App, Screen};
use super::centered_rect;

pub fn render(frame: &mut Frame, app: &App) {
    let (community_name, invites, selected_invite) = match &app.screen {
        Screen::CommunityInvites {
            community_name,
            invites,
            selected_invite,
            ..
        } => (community_name, invites, *selected_invite),
        _ => return,
    };

    let area = centered_rect(55, 60, frame.area());

    let title = format!(" {} \u{2014} Invites ", community_name);
    let block = Block::default()
        .title(title)
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Magenta));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(2, 2));

    let chunks = Layout::vertical([
        Constraint::Length(1), // Invite count
        Constraint::Length(1), // Separator
        Constraint::Min(5),   // Invite list
        Constraint::Length(1), // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // ── Invite count ───────────────────────────────────────────────────
    let count_text = format!(
        "{} invite{}",
        invites.len(),
        if invites.len() != 1 { "s" } else { "" }
    );
    let count = Paragraph::new(Line::from(Span::styled(
        count_text,
        Style::default().fg(Color::Magenta).bold(),
    )));
    frame.render_widget(count, chunks[0]);

    // ── Separator ──────────────────────────────────────────────────────
    let sep_width = chunks[1].width as usize;
    let separator = Paragraph::new("\u{2500}".repeat(sep_width))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(separator, chunks[1]);

    // ── Invite list ────────────────────────────────────────────────────
    if invites.is_empty() {
        let empty = Paragraph::new(vec![
            Line::from(""),
            Line::from(Span::styled(
                "  No invites yet. Press [n] to create one.",
                Style::default().fg(Color::DarkGray),
            )),
        ]);
        frame.render_widget(empty, chunks[2]);
    } else {
        let max_visible = chunks[2].height as usize;
        let mut lines = Vec::new();

        let scroll_offset = if selected_invite >= max_visible {
            selected_invite - max_visible + 1
        } else {
            0
        };

        for (i, invite) in invites.iter().enumerate().skip(scroll_offset) {
            if lines.len() >= max_visible {
                break;
            }

            let is_cursor = i == selected_invite;
            let prefix = if is_cursor { " > " } else { "   " };
            let prefix_style = if is_cursor {
                Style::default().fg(Color::Magenta)
            } else {
                Style::default().fg(Color::DarkGray)
            };

            let code_style = if is_cursor {
                Style::default().fg(Color::Cyan).bold()
            } else {
                Style::default().fg(Color::Cyan)
            };

            let uses_text = match invite.max_uses {
                Some(max) => format!("  [{}/{}]", invite.use_count, max),
                None => format!("  [{} uses]", invite.use_count),
            };

            lines.push(Line::from(vec![
                Span::styled(prefix, prefix_style),
                Span::styled(&invite.code, code_style),
                Span::styled(uses_text, Style::default().fg(Color::DarkGray)),
            ]));
        }

        frame.render_widget(Paragraph::new(lines), chunks[2]);
    }

    // ── Controls ───────────────────────────────────────────────────────
    let controls = Paragraph::new(Line::from(vec![
        Span::styled("[n] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("New  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[d] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Delete  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Back", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(controls, chunks[4]);
}
