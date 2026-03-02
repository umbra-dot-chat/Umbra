//! Community members dialog — shows the member list of a community.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph};

use crate::app::{App, Screen};
use super::centered_rect;

pub fn render(frame: &mut Frame, app: &App) {
    let (community_name, members, selected_member) = match &app.screen {
        Screen::CommunityMembers {
            community_name,
            members,
            selected_member,
            ..
        } => (community_name, members, *selected_member),
        _ => return,
    };

    let area = centered_rect(50, 65, frame.area());

    let title = format!(" {} \u{2014} Members ", community_name);
    let block = Block::default()
        .title(title)
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Magenta));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(2, 2));

    let chunks = Layout::vertical([
        Constraint::Length(1), // Member count
        Constraint::Length(1), // Separator
        Constraint::Min(5),   // Member list
        Constraint::Length(1), // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // ── Member count ────────────────────────────────────────────────────
    let count_text = format!("{} member{}", members.len(), if members.len() != 1 { "s" } else { "" });
    let count = Paragraph::new(Line::from(Span::styled(
        count_text,
        Style::default().fg(Color::Magenta).bold(),
    )));
    frame.render_widget(count, chunks[0]);

    // ── Separator ───────────────────────────────────────────────────────
    let sep_width = chunks[1].width as usize;
    let separator = Paragraph::new("\u{2500}".repeat(sep_width))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(separator, chunks[1]);

    // ── Member list ─────────────────────────────────────────────────────
    if members.is_empty() {
        let empty = Paragraph::new(vec![
            Line::from(""),
            Line::from(Span::styled(
                "  No members found",
                Style::default().fg(Color::DarkGray),
            )),
        ]);
        frame.render_widget(empty, chunks[2]);
    } else {
        let max_visible = chunks[2].height as usize;
        let mut lines = Vec::new();

        let scroll_offset = if selected_member >= max_visible {
            selected_member - max_visible + 1
        } else {
            0
        };

        for (i, member) in members.iter().enumerate().skip(scroll_offset) {
            if lines.len() >= max_visible {
                break;
            }

            let is_cursor = i == selected_member;
            let prefix = if is_cursor { " > " } else { "   " };
            let prefix_style = if is_cursor {
                Style::default().fg(Color::Magenta)
            } else {
                Style::default().fg(Color::DarkGray)
            };

            let name = member.display_name
                .as_deref()
                .unwrap_or(&member.did[..8.min(member.did.len())]);

            let name_style = if is_cursor {
                Style::default().fg(Color::White).bold()
            } else {
                Style::default().fg(Color::White)
            };

            // Show a truncated DID after the name
            let did_display = if member.did.len() > 16 {
                format!("  {}...", &member.did[..12])
            } else {
                format!("  {}", member.did)
            };

            lines.push(Line::from(vec![
                Span::styled(prefix, prefix_style),
                Span::styled(name, name_style),
                Span::styled(did_display, Style::default().fg(Color::DarkGray)),
            ]));
        }

        frame.render_widget(Paragraph::new(lines), chunks[2]);
    }

    // ── Controls ────────────────────────────────────────────────────────
    let controls = Paragraph::new(Line::from(vec![
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Back", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(controls, chunks[4]);
}
