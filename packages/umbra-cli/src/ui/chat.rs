//! Chat screen — main screen with friends sidebar and conversation area.
//!
//! First multi-pane layout in the app. Horizontal split:
//! - Left 25%: Friends sidebar with list and controls
//! - Right 75%: Welcome message or active conversation

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph, Wrap};

use crate::app::{App, ChatFocus, DashboardInfo, FriendEntry, Screen};

// ── Main render ─────────────────────────────────────────────────────────

pub fn render(frame: &mut Frame, app: &App) {
    let (info, focus, friends, selected_friend, active_conversation) = match &app.screen {
        Screen::Chat {
            info,
            focus,
            friends,
            selected_friend,
            active_conversation,
        } => (info, *focus, friends, *selected_friend, *active_conversation),
        _ => return,
    };

    let area = frame.area();

    // Horizontal split: sidebar (25%) | main area (75%)
    let chunks = Layout::horizontal([
        Constraint::Percentage(25),
        Constraint::Percentage(75),
    ])
    .split(area);

    render_sidebar(frame, focus, friends, selected_friend, chunks[0]);
    render_main_area(frame, info, focus, friends, active_conversation, chunks[1]);
}

// ── Sidebar ─────────────────────────────────────────────────────────────

fn render_sidebar(
    frame: &mut Frame,
    focus: ChatFocus,
    friends: &[FriendEntry],
    selected: usize,
    area: Rect,
) {
    let border_color = if focus == ChatFocus::Sidebar {
        Color::Green
    } else {
        Color::DarkGray
    };

    let block = Block::default()
        .title(" Friends ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(border_color));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(1, 1));

    let has_friends = !friends.is_empty() && focus == ChatFocus::Sidebar;
    let control_lines = if has_friends { 3 } else { 2 };

    let chunks = Layout::vertical([
        Constraint::Min(3),                       // Friend list
        Constraint::Length(1),                     // Separator
        Constraint::Length(control_lines as u16),  // Controls
    ])
    .split(inner);

    // Friend list or empty state
    if friends.is_empty() {
        let empty = Paragraph::new(vec![
            Line::from(""),
            Line::from(Span::styled(
                "  No friends yet",
                Style::default().fg(Color::DarkGray),
            )),
            Line::from(""),
            Line::from(Span::styled(
                "  Press [a] to add",
                Style::default().fg(Color::DarkGray),
            )),
        ]);
        frame.render_widget(empty, chunks[0]);
    } else {
        let mut lines = Vec::new();
        for (i, friend) in friends.iter().enumerate() {
            let is_selected = i == selected && focus == ChatFocus::Sidebar;
            let prefix = if is_selected { " > " } else { "   " };
            let name_style = if is_selected {
                Style::default().fg(Color::Cyan).bold()
            } else {
                Style::default().fg(Color::White)
            };
            let line = Line::from(vec![
                Span::styled(prefix, Style::default().fg(if is_selected { Color::Cyan } else { Color::DarkGray })),
                Span::styled(friend.display_name.as_str(), name_style),
            ]);
            lines.push(line);
        }
        let list = Paragraph::new(lines);
        frame.render_widget(list, chunks[0]);
    }

    // Separator
    let sep_width = chunks[1].width as usize;
    let separator = Paragraph::new("─".repeat(sep_width))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(separator, chunks[1]);

    // Controls
    let mut ctrl_lines = vec![
        Line::from(vec![
            Span::styled("[a] ", Style::default().fg(Color::Cyan).bold()),
            Span::styled("Add  ", Style::default().fg(Color::DarkGray)),
            Span::styled("[r] ", Style::default().fg(Color::Cyan).bold()),
            Span::styled("Requests", Style::default().fg(Color::DarkGray)),
        ]),
    ];

    if has_friends {
        ctrl_lines.push(Line::from(vec![
            Span::styled("[x] ", Style::default().fg(Color::Red).bold()),
            Span::styled("Remove  ", Style::default().fg(Color::DarkGray)),
            Span::styled("[b] ", Style::default().fg(Color::Red).bold()),
            Span::styled("Block", Style::default().fg(Color::DarkGray)),
        ]));
    }

    ctrl_lines.push(Line::from(vec![
        Span::styled("[q] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Quit", Style::default().fg(Color::DarkGray)),
    ]));

    let controls = Paragraph::new(ctrl_lines);
    frame.render_widget(controls, chunks[2]);
}

// ── Main area ───────────────────────────────────────────────────────────

fn render_main_area(
    frame: &mut Frame,
    info: &DashboardInfo,
    focus: ChatFocus,
    friends: &[FriendEntry],
    active_conversation: Option<usize>,
    area: Rect,
) {
    match active_conversation {
        Some(idx) if idx < friends.len() => {
            render_conversation(frame, &friends[idx], focus, area);
        }
        _ => {
            render_welcome(frame, info, focus, area);
        }
    }
}

// ── Welcome pane (no conversation selected) ─────────────────────────────

fn render_welcome(frame: &mut Frame, info: &DashboardInfo, focus: ChatFocus, area: Rect) {
    let border_color = if focus == ChatFocus::MainArea {
        Color::Cyan
    } else {
        Color::DarkGray
    };

    let block = Block::default()
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(border_color));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(2), // Welcome header
        Constraint::Length(1), // Spacer
        Constraint::Length(3), // Description
        Constraint::Length(1), // Spacer
        Constraint::Length(5), // Identity info
        Constraint::Min(0),   // Spacer
        Constraint::Length(1), // Hint
    ])
    .split(inner);

    // Welcome header
    let welcome = Paragraph::new(Line::from(vec![
        Span::styled("Welcome, ", Style::default().fg(Color::White)),
        Span::styled(
            info.display_name.as_str(),
            Style::default().fg(Color::Cyan).bold(),
        ),
        Span::styled("!", Style::default().fg(Color::White)),
    ]));
    frame.render_widget(welcome, chunks[0]);

    // Description
    let desc = Paragraph::new(vec![
        Line::from(Span::styled(
            "Select a conversation from the sidebar or",
            Style::default().fg(Color::DarkGray),
        )),
        Line::from(Span::styled(
            "add a friend to start chatting.",
            Style::default().fg(Color::DarkGray),
        )),
    ])
    .wrap(Wrap { trim: true });
    frame.render_widget(desc, chunks[2]);

    // Identity info
    let did_display = if info.did.len() > 50 {
        format!("{}...{}", &info.did[..30], &info.did[info.did.len() - 16..])
    } else {
        info.did.clone()
    };

    let mut info_lines = vec![
        Line::from(vec![
            Span::styled("  DID:      ", Style::default().fg(Color::DarkGray)),
            Span::styled(did_display, Style::default().fg(Color::Cyan)),
        ]),
    ];

    if let Some(ref username) = info.username {
        info_lines.push(Line::from(""));
        info_lines.push(Line::from(vec![
            Span::styled("  Username: ", Style::default().fg(Color::DarkGray)),
            Span::styled(
                username.as_str(),
                Style::default().fg(Color::Cyan).bold(),
            ),
        ]));
    }

    let info_para = Paragraph::new(info_lines);
    frame.render_widget(info_para, chunks[4]);

    // Hint
    let hint = Paragraph::new(Line::from(vec![
        Span::styled("[Tab] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Switch pane", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(hint, chunks[6]);
}

// ── Conversation pane (friend selected) ─────────────────────────────────

fn render_conversation(
    frame: &mut Frame,
    friend: &FriendEntry,
    focus: ChatFocus,
    area: Rect,
) {
    let border_color = if focus == ChatFocus::MainArea {
        Color::Cyan
    } else {
        Color::DarkGray
    };

    let title = format!(" Chat with {} ", friend.display_name);
    let block = Block::default()
        .title(title)
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(border_color));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(2, 1));

    let chunks = Layout::vertical([
        Constraint::Min(3),    // Messages area
        Constraint::Length(1), // Separator
        Constraint::Length(1), // Input area
    ])
    .split(inner);

    // Placeholder messages
    let messages = Paragraph::new(vec![
        Line::from(""),
        Line::from(Span::styled(
            "  Messaging not yet connected.",
            Style::default().fg(Color::DarkGray),
        )),
        Line::from(Span::styled(
            "  Messages will appear here once relay",
            Style::default().fg(Color::DarkGray),
        )),
        Line::from(Span::styled(
            "  connection is established.",
            Style::default().fg(Color::DarkGray),
        )),
    ]);
    frame.render_widget(messages, chunks[0]);

    // Separator
    let sep_width = chunks[1].width as usize;
    let separator = Paragraph::new("─".repeat(sep_width))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(separator, chunks[1]);

    // Input placeholder
    let input = Paragraph::new(Span::styled(
        " Type a message...",
        Style::default().fg(Color::DarkGray),
    ));
    frame.render_widget(input, chunks[2]);
}
