//! Settings screen — read-only view of identity and account configuration.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph, Wrap};

use crate::app::DashboardInfo;

/// Render the settings screen in the main content area.
pub fn render(frame: &mut Frame, info: &DashboardInfo, area: Rect) {
    let block = Block::default()
        .title(" Settings ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Cyan));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(2), // Section: Identity
        Constraint::Length(1), // Separator
        Constraint::Length(6), // Identity fields
        Constraint::Length(1), // Spacer
        Constraint::Length(2), // Section: Linked Accounts
        Constraint::Length(1), // Separator
        Constraint::Length(3), // Linked account fields
        Constraint::Length(1), // Spacer
        Constraint::Length(2), // Section: Discovery
        Constraint::Length(1), // Separator
        Constraint::Length(2), // Discovery fields
        Constraint::Min(0),   // Spacer
        Constraint::Length(1), // Hint
    ])
    .split(inner);

    // ── Identity ─────────────────────────────────────────────
    let identity_header = Paragraph::new(Line::from(Span::styled(
        "Identity",
        Style::default().fg(Color::White).bold(),
    )));
    frame.render_widget(identity_header, chunks[0]);

    let sep_width = chunks[1].width as usize;
    let sep = Paragraph::new("─".repeat(sep_width.min(20)))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(sep, chunks[1]);

    let did_display = if info.did.len() > 40 {
        format!("{}...{}", &info.did[..24], &info.did[info.did.len() - 12..])
    } else {
        info.did.clone()
    };

    let mut id_lines = vec![
        Line::from(vec![
            Span::styled("  Display Name:  ", Style::default().fg(Color::DarkGray)),
            Span::styled(&info.display_name, Style::default().fg(Color::White)),
        ]),
        Line::from(""),
        Line::from(vec![
            Span::styled("  DID:           ", Style::default().fg(Color::DarkGray)),
            Span::styled(did_display, Style::default().fg(Color::Cyan)),
        ]),
    ];

    if let Some(ref username) = info.username {
        id_lines.push(Line::from(""));
        id_lines.push(Line::from(vec![
            Span::styled("  Username:      ", Style::default().fg(Color::DarkGray)),
            Span::styled(username.as_str(), Style::default().fg(Color::Cyan).bold()),
        ]));
    }

    let id_para = Paragraph::new(id_lines);
    frame.render_widget(id_para, chunks[2]);

    // ── Linked Accounts ──────────────────────────────────────
    let linked_header = Paragraph::new(Line::from(Span::styled(
        "Linked Accounts",
        Style::default().fg(Color::White).bold(),
    )));
    frame.render_widget(linked_header, chunks[4]);

    let sep2 = Paragraph::new("─".repeat(sep_width.min(20)))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(sep2, chunks[5]);

    let linked_text = match (&info.linked_platform, &info.linked_username) {
        (Some(platform), Some(username)) => {
            let platform_display = match platform.as_str() {
                "discord" => "Discord",
                "github" => "GitHub",
                "steam" => "Steam",
                "bluesky" => "Bluesky",
                other => other,
            };
            Line::from(vec![
                Span::styled(
                    format!("  {platform_display}:"),
                    Style::default().fg(Color::DarkGray),
                ),
                Span::styled(
                    format!("  {username}"),
                    Style::default().fg(Color::White),
                ),
            ])
        }
        _ => Line::from(Span::styled(
            "  No accounts linked",
            Style::default().fg(Color::DarkGray),
        )),
    };

    let linked_para = Paragraph::new(vec![linked_text]).wrap(Wrap { trim: true });
    frame.render_widget(linked_para, chunks[6]);

    // ── Discovery ────────────────────────────────────────────
    let disc_header = Paragraph::new(Line::from(Span::styled(
        "Discovery",
        Style::default().fg(Color::White).bold(),
    )));
    frame.render_widget(disc_header, chunks[8]);

    let sep3 = Paragraph::new("─".repeat(sep_width.min(20)))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(sep3, chunks[9]);

    let disc_para = Paragraph::new(Line::from(vec![
        Span::styled("  Discoverable:  ", Style::default().fg(Color::DarkGray)),
        Span::styled("Yes", Style::default().fg(Color::Green)),
    ]));
    frame.render_widget(disc_para, chunks[10]);

    // ── Hint ─────────────────────────────────────────────────
    let hint = Paragraph::new(Line::from(vec![
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Back", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(hint, chunks[12]);
}
