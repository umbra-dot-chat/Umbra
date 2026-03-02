//! Home screen — overview of activity, quick actions, and status.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph};

use crate::app::{App, ChatFocus, DashboardInfo};

/// Render the home screen content area.
pub fn render(frame: &mut Frame, app: &App, info: &DashboardInfo, focus: ChatFocus, area: Rect) {
    let border_color = if focus == ChatFocus::MainArea {
        Color::Cyan
    } else {
        Color::DarkGray
    };

    let block = Block::default()
        .title(" Home ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(border_color));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(3), // Welcome header
        Constraint::Length(1), // Separator
        Constraint::Length(1), // Section: Overview
        Constraint::Length(1), // Spacer
        Constraint::Length(5), // Stats
        Constraint::Length(1), // Spacer
        Constraint::Length(1), // Section: Quick Actions
        Constraint::Length(1), // Separator
        Constraint::Length(5), // Actions
        Constraint::Min(0),   // Spacer
        Constraint::Length(1), // Hint
    ])
    .split(inner);

    // ── Welcome header ─────────────────────────────────────────────────
    let welcome = Paragraph::new(vec![
        Line::from(vec![
            Span::styled("Welcome, ", Style::default().fg(Color::DarkGray)),
            Span::styled(&info.display_name, Style::default().fg(Color::White).bold()),
            Span::styled("!", Style::default().fg(Color::DarkGray)),
        ]),
        Line::from(""),
        Line::from(Span::styled(
            info.username.as_deref().unwrap_or(&info.did[..20.min(info.did.len())]),
            Style::default().fg(Color::Cyan),
        )),
    ]);
    frame.render_widget(welcome, chunks[0]);

    // ── Separator ──────────────────────────────────────────────────────
    let sep_width = chunks[1].width as usize;
    let sep = Paragraph::new("\u{2500}".repeat(sep_width.min(40)))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(sep, chunks[1]);

    // ── Overview header ────────────────────────────────────────────────
    let overview = Paragraph::new(Line::from(Span::styled(
        "Overview",
        Style::default().fg(Color::White).bold(),
    )));
    frame.render_widget(overview, chunks[2]);

    // ── Stats ──────────────────────────────────────────────────────────
    // Count friends from current screen state or DB
    let friend_count = get_friend_count(app);
    let group_count = app.groups.len();
    let community_count = app.communities.len();

    // Count pending requests from DB
    let pending_requests = if let Some(ref db) = app.db {
        db.load_friend_requests("incoming")
            .map(|r| r.len())
            .unwrap_or(0)
    } else {
        0
    };

    let stats = Paragraph::new(vec![
        Line::from(vec![
            Span::styled("  \u{25CF} ", Style::default().fg(Color::Green)),
            Span::styled(format!("{} friend{}", friend_count, if friend_count != 1 { "s" } else { "" }),
                Style::default().fg(Color::White)),
        ]),
        Line::from(vec![
            Span::styled("  \u{25CF} ", Style::default().fg(Color::Blue)),
            Span::styled(format!("{} group{}", group_count, if group_count != 1 { "s" } else { "" }),
                Style::default().fg(Color::White)),
        ]),
        Line::from(vec![
            Span::styled("  \u{25CF} ", Style::default().fg(Color::Magenta)),
            Span::styled(format!("{} communit{}", community_count, if community_count != 1 { "ies" } else { "y" }),
                Style::default().fg(Color::White)),
        ]),
        if pending_requests > 0 {
            Line::from(vec![
                Span::styled("  \u{25CF} ", Style::default().fg(Color::Yellow)),
                Span::styled(format!("{} pending request{}", pending_requests, if pending_requests != 1 { "s" } else { "" }),
                    Style::default().fg(Color::Yellow)),
            ])
        } else {
            Line::from(vec![
                Span::styled("  \u{25CF} ", Style::default().fg(Color::DarkGray)),
                Span::styled("No pending requests", Style::default().fg(Color::DarkGray)),
            ])
        },
        Line::from(""),
    ]);
    frame.render_widget(stats, chunks[4]);

    // ── Quick Actions header ───────────────────────────────────────────
    let actions_header = Paragraph::new(Line::from(Span::styled(
        "Quick Actions",
        Style::default().fg(Color::White).bold(),
    )));
    frame.render_widget(actions_header, chunks[6]);

    let sep2 = Paragraph::new("\u{2500}".repeat(sep_width.min(40)))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(sep2, chunks[7]);

    // ── Actions ────────────────────────────────────────────────────────
    let actions = Paragraph::new(vec![
        Line::from(vec![
            Span::styled("  [a] ", Style::default().fg(Color::Cyan).bold()),
            Span::styled("Add Friend", Style::default().fg(Color::White)),
        ]),
        Line::from(vec![
            Span::styled("  [r] ", Style::default().fg(Color::Cyan).bold()),
            Span::styled("Friend Requests", Style::default().fg(Color::White)),
        ]),
        Line::from(vec![
            Span::styled("  [g] ", Style::default().fg(Color::Cyan).bold()),
            Span::styled("Switch to Groups", Style::default().fg(Color::White)),
        ]),
        Line::from(vec![
            Span::styled("  [q] ", Style::default().fg(Color::Cyan).bold()),
            Span::styled("Quit", Style::default().fg(Color::White)),
        ]),
    ]);
    frame.render_widget(actions, chunks[8]);

    // ── Connection status hint ─────────────────────────────────────────
    let connection = if app.relay_connected {
        Line::from(vec![
            Span::styled("\u{25CF} ", Style::default().fg(Color::Green)),
            Span::styled("Connected to relay", Style::default().fg(Color::DarkGray)),
        ])
    } else {
        Line::from(vec![
            Span::styled("\u{25CF} ", Style::default().fg(Color::Red)),
            Span::styled("Disconnected", Style::default().fg(Color::DarkGray)),
        ])
    };
    frame.render_widget(Paragraph::new(connection), chunks[10]);
}

/// Get friend count from the current screen state.
fn get_friend_count(app: &App) -> usize {
    match &app.screen {
        crate::app::Screen::Chat { friends, .. } => friends.len(),
        _ => {
            if let Some(ref db) = app.db {
                db.load_friends().map(|f| f.len()).unwrap_or(0)
            } else {
                0
            }
        }
    }
}
