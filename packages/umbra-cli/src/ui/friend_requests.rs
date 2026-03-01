//! Friend requests dialog — view incoming/outgoing requests and blocked users.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph};

use crate::app::{App, BlockedEntry, FriendRequestEntry, RequestTab, Screen};
use super::centered_rect;

pub fn render(frame: &mut Frame, app: &App) {
    let (requests, selected_request, active_tab, blocked) = match &app.screen {
        Screen::FriendRequests {
            requests,
            selected_request,
            active_tab,
            blocked,
            ..
        } => (requests, *selected_request, *active_tab, blocked),
        _ => return,
    };

    let area = centered_rect(60, 65, frame.area());

    let block = Block::default()
        .title(" Friend Requests ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Magenta));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(1), // Tab bar
        Constraint::Length(1), // Separator
        Constraint::Min(5),   // List
        Constraint::Length(1), // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // ── Tab bar ──────────────────────────────────────────────────────
    render_tabs(frame, active_tab, chunks[0]);

    // ── Separator ────────────────────────────────────────────────────
    let sep_width = chunks[1].width as usize;
    let separator = Paragraph::new("─".repeat(sep_width))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(separator, chunks[1]);

    // ── List ─────────────────────────────────────────────────────────
    match active_tab {
        RequestTab::Incoming | RequestTab::Outgoing => {
            render_request_list(frame, requests, selected_request, active_tab, chunks[2]);
        }
        RequestTab::Blocked => {
            render_blocked_list(frame, blocked, selected_request, chunks[2]);
        }
    }

    // ── Controls ─────────────────────────────────────────────────────
    render_controls(frame, active_tab, requests, blocked, selected_request, chunks[4]);
}

// ── Tab bar ──────────────────────────────────────────────────────────────

fn render_tabs(frame: &mut Frame, active_tab: RequestTab, area: Rect) {
    let tabs = [
        ("Incoming", RequestTab::Incoming),
        ("Outgoing", RequestTab::Outgoing),
        ("Blocked", RequestTab::Blocked),
    ];

    let mut spans = Vec::new();
    for (i, (label, tab)) in tabs.iter().enumerate() {
        if i > 0 {
            spans.push(Span::styled("   ", Style::default()));
        }
        let style = if active_tab == *tab {
            Style::default().fg(Color::Magenta).bold()
        } else {
            Style::default().fg(Color::DarkGray)
        };
        let marker = if active_tab == *tab { " ▸ " } else { "   " };
        spans.push(Span::styled(marker, style));
        spans.push(Span::styled(*label, style));
    }

    frame.render_widget(Paragraph::new(Line::from(spans)), area);
}

// ── Request list (Incoming / Outgoing) ───────────────────────────────────

fn render_request_list(
    frame: &mut Frame,
    requests: &[FriendRequestEntry],
    selected: usize,
    tab: RequestTab,
    area: Rect,
) {
    let filtered: Vec<&FriendRequestEntry> = requests
        .iter()
        .filter(|r| r.direction == tab)
        .collect();

    if filtered.is_empty() {
        let msg = match tab {
            RequestTab::Incoming => "No incoming requests",
            RequestTab::Outgoing => "No outgoing requests",
            RequestTab::Blocked => unreachable!(),
        };
        let empty = Paragraph::new(vec![
            Line::from(""),
            Line::from(Span::styled(
                format!("  ({msg})"),
                Style::default().fg(Color::DarkGray),
            )),
        ]);
        frame.render_widget(empty, area);
        return;
    }

    let max_visible = area.height as usize;
    let mut lines = Vec::new();

    for (i, req) in filtered.iter().enumerate() {
        if lines.len() >= max_visible {
            break;
        }
        let is_selected = i == selected;
        let prefix = if is_selected { " > " } else { "   " };

        let display = req.username.as_deref().unwrap_or(&req.display_name);

        let name_style = if is_selected {
            Style::default().fg(Color::White).bold()
        } else {
            Style::default().fg(Color::White)
        };

        lines.push(Line::from(vec![
            Span::styled(
                prefix,
                Style::default().fg(if is_selected {
                    Color::Magenta
                } else {
                    Color::DarkGray
                }),
            ),
            Span::styled(display, name_style),
            Span::styled("  ", Style::default()),
            Span::styled("pending", Style::default().fg(Color::Yellow)),
        ]));
    }

    frame.render_widget(Paragraph::new(lines), area);
}

// ── Blocked list ─────────────────────────────────────────────────────────

fn render_blocked_list(
    frame: &mut Frame,
    blocked: &[BlockedEntry],
    selected: usize,
    area: Rect,
) {
    if blocked.is_empty() {
        let empty = Paragraph::new(vec![
            Line::from(""),
            Line::from(Span::styled(
                "  (No blocked users)",
                Style::default().fg(Color::DarkGray),
            )),
        ]);
        frame.render_widget(empty, area);
        return;
    }

    let max_visible = area.height as usize;
    let mut lines = Vec::new();

    for (i, entry) in blocked.iter().enumerate() {
        if lines.len() >= max_visible {
            break;
        }
        let is_selected = i == selected;
        let prefix = if is_selected { " > " } else { "   " };

        let display = entry
            .username
            .as_deref()
            .or(entry.display_name.as_deref())
            .unwrap_or(&entry.did[..entry.did.len().min(24)]);

        let name_style = if is_selected {
            Style::default().fg(Color::White).bold()
        } else {
            Style::default().fg(Color::White)
        };

        lines.push(Line::from(vec![
            Span::styled(
                prefix,
                Style::default().fg(if is_selected {
                    Color::Magenta
                } else {
                    Color::DarkGray
                }),
            ),
            Span::styled(display, name_style),
            Span::styled("  ", Style::default()),
            Span::styled("blocked", Style::default().fg(Color::Red)),
        ]));
    }

    frame.render_widget(Paragraph::new(lines), area);
}

// ── Context-sensitive controls ───────────────────────────────────────────

fn render_controls(
    frame: &mut Frame,
    tab: RequestTab,
    requests: &[FriendRequestEntry],
    blocked: &[BlockedEntry],
    _selected: usize,
    area: Rect,
) {
    let has_items = match tab {
        RequestTab::Incoming => requests.iter().any(|r| r.direction == RequestTab::Incoming),
        RequestTab::Outgoing => requests.iter().any(|r| r.direction == RequestTab::Outgoing),
        RequestTab::Blocked => !blocked.is_empty(),
    };

    let mut spans = Vec::new();

    if has_items {
        match tab {
            RequestTab::Incoming => {
                spans.push(Span::styled("[Enter] ", Style::default().fg(Color::Magenta).bold()));
                spans.push(Span::styled("Accept  ", Style::default().fg(Color::DarkGray)));
                spans.push(Span::styled("[x] ", Style::default().fg(Color::Red).bold()));
                spans.push(Span::styled("Reject  ", Style::default().fg(Color::DarkGray)));
                spans.push(Span::styled("[b] ", Style::default().fg(Color::Red).bold()));
                spans.push(Span::styled("Block  ", Style::default().fg(Color::DarkGray)));
            }
            RequestTab::Outgoing => {
                spans.push(Span::styled("[x] ", Style::default().fg(Color::Red).bold()));
                spans.push(Span::styled("Cancel  ", Style::default().fg(Color::DarkGray)));
                spans.push(Span::styled("[b] ", Style::default().fg(Color::Red).bold()));
                spans.push(Span::styled("Block  ", Style::default().fg(Color::DarkGray)));
            }
            RequestTab::Blocked => {
                spans.push(Span::styled("[u] ", Style::default().fg(Color::Green).bold()));
                spans.push(Span::styled("Unblock  ", Style::default().fg(Color::DarkGray)));
            }
        }
    }

    spans.push(Span::styled("[Tab] ", Style::default().fg(Color::Magenta).bold()));
    spans.push(Span::styled("Switch  ", Style::default().fg(Color::DarkGray)));
    spans.push(Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()));
    spans.push(Span::styled("Back", Style::default().fg(Color::DarkGray)));

    frame.render_widget(Paragraph::new(Line::from(spans)), area);
}
