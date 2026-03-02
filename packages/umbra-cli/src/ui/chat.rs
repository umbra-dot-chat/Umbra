//! Chat screen — main screen with friends sidebar and conversation area.
//!
//! Layout managed by mod.rs:
//! - Top: Tab bar (1 row)
//! - Left: Friends sidebar (22%)
//! - Right: Welcome message or active conversation

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph, Wrap};

use crate::app::{App, ChatFocus, DashboardInfo, FriendEntry, GroupEntry, MessageAction, SidebarMode};

// ── Sidebar ─────────────────────────────────────────────────────────────

pub fn render_sidebar(
    frame: &mut Frame,
    app: &App,
    focus: ChatFocus,
    friends: &[FriendEntry],
    selected: usize,
    area: Rect,
) {
    match app.sidebar_mode {
        SidebarMode::DMs => render_sidebar_dms(frame, focus, friends, selected, area),
        SidebarMode::Groups => render_sidebar_groups(frame, app, focus, area),
    }
}

fn render_sidebar_dms(
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
    let control_lines = if has_friends { 4 } else { 3 };

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
        Span::styled("[g] ", Style::default().fg(Color::Yellow).bold()),
        Span::styled("Groups", Style::default().fg(Color::DarkGray)),
    ]));

    ctrl_lines.push(Line::from(vec![
        Span::styled("[q] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Quit", Style::default().fg(Color::DarkGray)),
    ]));

    let controls = Paragraph::new(ctrl_lines);
    frame.render_widget(controls, chunks[2]);
}

fn render_sidebar_groups(
    frame: &mut Frame,
    app: &App,
    focus: ChatFocus,
    area: Rect,
) {
    let border_color = if focus == ChatFocus::Sidebar {
        Color::Yellow
    } else {
        Color::DarkGray
    };

    let block = Block::default()
        .title(" Groups ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(border_color));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(1, 1));

    let has_groups = !app.groups.is_empty() && focus == ChatFocus::Sidebar;
    let control_lines = if has_groups { 4 } else { 3 };

    let chunks = Layout::vertical([
        Constraint::Min(3),                       // Group list
        Constraint::Length(1),                     // Separator
        Constraint::Length(control_lines as u16),  // Controls
    ])
    .split(inner);

    // Group list or empty state
    if app.groups.is_empty() {
        let empty = Paragraph::new(vec![
            Line::from(""),
            Line::from(Span::styled(
                "  No groups yet",
                Style::default().fg(Color::DarkGray),
            )),
            Line::from(""),
            Line::from(Span::styled(
                "  Press [n] to create",
                Style::default().fg(Color::DarkGray),
            )),
        ]);
        frame.render_widget(empty, chunks[0]);
    } else {
        let mut lines = Vec::new();
        for (i, group) in app.groups.iter().enumerate() {
            let is_selected = i == app.selected_group && focus == ChatFocus::Sidebar;
            let prefix = if is_selected { " > " } else { "   " };
            let name_style = if is_selected {
                Style::default().fg(Color::Yellow).bold()
            } else {
                Style::default().fg(Color::White)
            };

            let member_count = format!(" ({})", group.members.len());

            let line = Line::from(vec![
                Span::styled(
                    prefix,
                    Style::default().fg(if is_selected { Color::Yellow } else { Color::DarkGray }),
                ),
                Span::styled(&group.name, name_style),
                Span::styled(member_count, Style::default().fg(Color::DarkGray)),
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
            Span::styled("[n] ", Style::default().fg(Color::Yellow).bold()),
            Span::styled("New group", Style::default().fg(Color::DarkGray)),
        ]),
    ];

    if has_groups {
        ctrl_lines.push(Line::from(vec![
            Span::styled("[l] ", Style::default().fg(Color::Red).bold()),
            Span::styled("Leave", Style::default().fg(Color::DarkGray)),
        ]));
    }

    ctrl_lines.push(Line::from(vec![
        Span::styled("[g] ", Style::default().fg(Color::Cyan).bold()),
        Span::styled("DMs", Style::default().fg(Color::DarkGray)),
    ]));

    ctrl_lines.push(Line::from(vec![
        Span::styled("[q] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Quit", Style::default().fg(Color::DarkGray)),
    ]));

    let controls = Paragraph::new(ctrl_lines);
    frame.render_widget(controls, chunks[2]);
}

// ── Main area ───────────────────────────────────────────────────────────

pub fn render_main_area(
    frame: &mut Frame,
    app: &App,
    info: &DashboardInfo,
    focus: ChatFocus,
    friends: &[FriendEntry],
    active_conversation: Option<usize>,
    area: Rect,
) {
    // Check for active group conversation first
    if let Some(ref group_id) = app.active_group {
        if let Some(group) = app.groups.iter().find(|g| &g.id == group_id) {
            render_group_conversation(frame, app, group, focus, area);
            return;
        }
    }

    match active_conversation {
        Some(idx) if idx < friends.len() => {
            render_conversation(frame, app, &friends[idx], focus, area);
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
        Span::styled("Switch pane  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[i] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Type message", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(hint, chunks[6]);
}

// ── Conversation pane (friend selected) ─────────────────────────────────

fn render_conversation(
    frame: &mut Frame,
    app: &App,
    friend: &FriendEntry,
    focus: ChatFocus,
    area: Rect,
) {
    let border_color = match focus {
        ChatFocus::MainArea | ChatFocus::Input => Color::Cyan,
        _ => Color::DarkGray,
    };

    let title = format!(" Chat with {} ", friend.display_name);
    let block = Block::default()
        .title(title)
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(border_color));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(1, 1));

    let input_height = if focus == ChatFocus::Input || app.message_action_mode.is_some() { 3 } else { 2 };
    let typing_height: u16 = if app.typing_peers.is_empty() { 0 } else { 1 };

    let chunks = Layout::vertical([
        Constraint::Min(3),                         // Messages area
        Constraint::Length(typing_height),           // Typing indicator
        Constraint::Length(1),                       // Separator
        Constraint::Length(input_height as u16),     // Input area
    ])
    .split(inner);

    // Messages area
    render_messages(frame, app, chunks[0]);

    // Typing indicator
    if !app.typing_peers.is_empty() {
        render_typing_indicator(frame, app, chunks[1]);
    }

    // Separator
    let sep_width = chunks[2].width as usize;
    let separator = Paragraph::new("─".repeat(sep_width))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(separator, chunks[2]);

    // Input area
    render_input(frame, app, focus, chunks[3]);
}

// ── Group conversation pane ──────────────────────────────────────────────

fn render_group_conversation(
    frame: &mut Frame,
    app: &App,
    group: &GroupEntry,
    focus: ChatFocus,
    area: Rect,
) {
    let border_color = match focus {
        ChatFocus::MainArea | ChatFocus::Input => Color::Yellow,
        _ => Color::DarkGray,
    };

    let member_count = group.members.len();
    let title = format!(" {} ({} members) ", group.name, member_count);
    let block = Block::default()
        .title(title)
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(border_color));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(1, 1));

    let input_height = if focus == ChatFocus::Input || app.message_action_mode.is_some() { 3 } else { 2 };

    let chunks = Layout::vertical([
        Constraint::Min(3),                         // Messages area
        Constraint::Length(1),                       // Separator
        Constraint::Length(input_height as u16),     // Input area
    ])
    .split(inner);

    // Messages area (reuse same renderer)
    render_messages(frame, app, chunks[0]);

    // Separator
    let sep_width = chunks[1].width as usize;
    let separator = Paragraph::new("─".repeat(sep_width))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(separator, chunks[1]);

    // Input area (reuse same renderer)
    render_input(frame, app, focus, chunks[2]);
}

/// Render the message list with scrolling.
fn render_messages(frame: &mut Frame, app: &App, area: Rect) {
    if app.messages.is_empty() {
        let empty = Paragraph::new(vec![
            Line::from(""),
            Line::from(Span::styled(
                "  No messages yet.",
                Style::default().fg(Color::DarkGray),
            )),
            Line::from(Span::styled(
                "  Press [i] or [Tab] to start typing.",
                Style::default().fg(Color::DarkGray),
            )),
        ]);
        frame.render_widget(empty, area);
        return;
    }

    let available_height = area.height as usize;
    let available_width = area.width as usize;

    // Build display lines from messages (each message = 2+ lines)
    // We track which line ranges belong to which message index for selection highlighting
    let mut all_lines: Vec<(Line, Option<usize>)> = Vec::new();

    for (i, msg) in app.messages.iter().enumerate() {
        // Header line: sender name + timestamp + status + edited + pinned
        let name_color = if msg.is_mine { Color::Cyan } else { Color::Green };
        let time_str = format_timestamp(msg.timestamp);

        let mut header_spans = vec![
            Span::styled("  ", Style::default()),
        ];

        // Pinned prefix
        if msg.pinned {
            header_spans.push(Span::styled(
                "\u{1F4CC} ",
                Style::default(),
            ));
        }

        header_spans.push(Span::styled(
            &msg.sender_name,
            Style::default().fg(name_color).bold(),
        ));

        header_spans.push(Span::styled(
            format!("  {time_str}"),
            Style::default().fg(Color::DarkGray),
        ));

        // Edited indicator
        if msg.edited_at.is_some() {
            header_spans.push(Span::styled(
                " (edited)",
                Style::default().fg(Color::DarkGray),
            ));
        }

        // Status indicator
        if msg.is_mine {
            match msg.status.as_str() {
                "delivered" => {
                    header_spans.push(Span::styled(
                        " \u{2713}",
                        Style::default().fg(Color::DarkGray),
                    ));
                }
                "read" => {
                    header_spans.push(Span::styled(
                        " \u{2713}\u{2713}",
                        Style::default().fg(Color::Cyan),
                    ));
                }
                _ => {} // "sent" — no indicator
            }
        }

        all_lines.push((Line::from(header_spans), Some(i)));

        // Content lines (word-wrap long messages)
        if msg.deleted {
            all_lines.push((Line::from(vec![
                Span::styled("    ", Style::default()),
                Span::styled(
                    "[message deleted]",
                    Style::default().fg(Color::DarkGray).italic(),
                ),
            ]), Some(i)));
        } else {
            let max_content_width = available_width.saturating_sub(6); // indent
            for line in wrap_text(&msg.content, max_content_width) {
                all_lines.push((Line::from(vec![
                    Span::styled("    ", Style::default()),
                    Span::styled(line, Style::default().fg(Color::White)),
                ]), Some(i)));
            }
        }

        // Reactions line
        if !msg.reactions.is_empty() {
            let mut reaction_spans = vec![
                Span::styled("   ", Style::default()),
            ];
            for (emoji, count) in &msg.reactions {
                reaction_spans.push(Span::styled(
                    format!("{emoji} {count}  "),
                    Style::default().fg(Color::Yellow),
                ));
            }
            all_lines.push((Line::from(reaction_spans), Some(i)));
        }

        // Spacing between messages
        all_lines.push((Line::from(""), None));
    }

    // Apply scroll offset (scroll from bottom)
    let total = all_lines.len();
    let skip = if total > available_height {
        let max_scroll = total - available_height;
        let scroll = app.message_scroll.min(max_scroll);
        max_scroll - scroll
    } else {
        0
    };

    let visible: Vec<(Line, Option<usize>)> = all_lines
        .into_iter()
        .skip(skip)
        .take(available_height)
        .collect();

    // Apply selection highlighting
    let selected = app.selected_message;
    let styled_lines: Vec<Line> = visible
        .into_iter()
        .map(|(line, msg_idx)| {
            if let (Some(sel), Some(idx)) = (selected, msg_idx) {
                if sel == idx {
                    // Highlight the selected message lines
                    let bg = Color::Rgb(40, 40, 60);
                    let styled_spans: Vec<Span> = line.spans.into_iter()
                        .map(|span| {
                            let mut style = span.style;
                            style = style.bg(bg);
                            Span::styled(span.content, style)
                        })
                        .collect();
                    return Line::from(styled_spans);
                }
            }
            line
        })
        .collect();

    let messages_widget = Paragraph::new(styled_lines);
    frame.render_widget(messages_widget, area);
}

/// Render the typing indicator line.
fn render_typing_indicator(frame: &mut Frame, app: &App, area: Rect) {
    let names: Vec<String> = app.typing_peers.keys()
        .map(|did| {
            app.find_friend_name(did)
                .unwrap_or_else(|| did[..8.min(did.len())].to_string())
        })
        .collect();

    let text = if names.len() == 1 {
        format!("  {} is typing...", names[0])
    } else {
        format!("  {} are typing...", names.join(", "))
    };

    let typing = Paragraph::new(Line::from(Span::styled(
        text,
        Style::default().fg(Color::DarkGray).italic(),
    )));
    frame.render_widget(typing, area);
}

/// Render the message input area.
fn render_input(frame: &mut Frame, app: &App, focus: ChatFocus, area: Rect) {
    // Check for message action modes first
    if let Some(action) = app.message_action_mode {
        match action {
            MessageAction::Edit => {
                // Editing mode
                let header = Paragraph::new(Line::from(Span::styled(
                    "Editing message:",
                    Style::default().fg(Color::Yellow).bold(),
                )));
                frame.render_widget(header, Rect { height: 1, ..area });

                if area.height > 1 {
                    let display_text = if app.edit_buffer.is_empty() {
                        " ...".to_string()
                    } else {
                        format!(" {}", app.edit_buffer)
                    };
                    let input = Paragraph::new(Line::from(vec![
                        Span::styled("> ", Style::default().fg(Color::Yellow).bold()),
                        Span::styled(display_text, Style::default().fg(Color::White)),
                    ]));
                    frame.render_widget(input, Rect {
                        y: area.y + 1,
                        height: 1,
                        ..area
                    });

                    // Set cursor position
                    let cursor_x = area.x + 2 + app.edit_cursor as u16 + 1;
                    let cursor_y = area.y + 1;
                    frame.set_cursor_position(Position::new(
                        cursor_x.min(area.x + area.width - 1),
                        cursor_y,
                    ));
                }

                if area.height > 2 {
                    let hints = Paragraph::new(Line::from(vec![
                        Span::styled("[Enter] ", Style::default().fg(Color::Yellow).bold()),
                        Span::styled("Confirm  ", Style::default().fg(Color::DarkGray)),
                        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
                        Span::styled("Cancel", Style::default().fg(Color::DarkGray)),
                    ]));
                    frame.render_widget(hints, Rect {
                        y: area.y + 2,
                        height: 1,
                        ..area
                    });
                }
                return;
            }
            MessageAction::Delete => {
                let prompt = Paragraph::new(Line::from(vec![
                    Span::styled("  Delete this message? ", Style::default().fg(Color::Red).bold()),
                    Span::styled("[y] ", Style::default().fg(Color::Red).bold()),
                    Span::styled("Yes  ", Style::default().fg(Color::DarkGray)),
                    Span::styled("[n] ", Style::default().fg(Color::DarkGray).bold()),
                    Span::styled("No", Style::default().fg(Color::DarkGray)),
                ]));
                frame.render_widget(prompt, area);
                return;
            }
            MessageAction::React => {
                let picker = Paragraph::new(Line::from(vec![
                    Span::styled("  React: ", Style::default().fg(Color::Yellow).bold()),
                    Span::styled("[1]", Style::default().fg(Color::Cyan).bold()),
                    Span::styled("\u{1F44D} ", Style::default()),
                    Span::styled("[2]", Style::default().fg(Color::Cyan).bold()),
                    Span::styled("\u{2764}\u{FE0F} ", Style::default()),
                    Span::styled("[3]", Style::default().fg(Color::Cyan).bold()),
                    Span::styled("\u{1F602} ", Style::default()),
                    Span::styled("[4]", Style::default().fg(Color::Cyan).bold()),
                    Span::styled("\u{1F525} ", Style::default()),
                    Span::styled("[5]", Style::default().fg(Color::Cyan).bold()),
                    Span::styled("\u{1F4AF} ", Style::default()),
                    Span::styled("  [Esc] Cancel", Style::default().fg(Color::DarkGray)),
                ]));
                frame.render_widget(picker, area);
                return;
            }
            MessageAction::Pin => {
                // Pin is instant, this shouldn't display
            }
        }
    }

    if focus == ChatFocus::Input {
        // Active input mode
        let display_text = if app.message_input.is_empty() {
            " Type a message...".to_string()
        } else {
            format!(" {}", app.message_input)
        };

        let input_style = if app.message_input.is_empty() {
            Style::default().fg(Color::DarkGray)
        } else {
            Style::default().fg(Color::White)
        };

        let input = Paragraph::new(Line::from(vec![
            Span::styled("> ", Style::default().fg(Color::Cyan).bold()),
            Span::styled(display_text, input_style),
        ]));
        frame.render_widget(input, Rect { height: 1, ..area });

        // Set cursor position
        let cursor_x = area.x + 2 + app.message_cursor as u16 + 1; // "> " + 1 for space
        let cursor_y = area.y;
        frame.set_cursor_position(Position::new(
            cursor_x.min(area.x + area.width - 1),
            cursor_y,
        ));

        // Hints line
        if area.height > 1 {
            let hints = Paragraph::new(Line::from(vec![
                Span::styled("[Enter] ", Style::default().fg(Color::Cyan).bold()),
                Span::styled("Send  ", Style::default().fg(Color::DarkGray)),
                Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
                Span::styled("Back", Style::default().fg(Color::DarkGray)),
            ]));
            frame.render_widget(hints, Rect {
                y: area.y + 1,
                height: 1,
                ..area
            });
        }
    } else {
        // Inactive — show placeholder or selection mode hints
        if app.selected_message.is_some() {
            let hints = Paragraph::new(Line::from(vec![
                Span::styled("[e] ", Style::default().fg(Color::Cyan).bold()),
                Span::styled("Edit  ", Style::default().fg(Color::DarkGray)),
                Span::styled("[d] ", Style::default().fg(Color::Red).bold()),
                Span::styled("Delete  ", Style::default().fg(Color::DarkGray)),
                Span::styled("[+] ", Style::default().fg(Color::Yellow).bold()),
                Span::styled("React  ", Style::default().fg(Color::DarkGray)),
                Span::styled("[p] ", Style::default().fg(Color::Cyan).bold()),
                Span::styled("Pin  ", Style::default().fg(Color::DarkGray)),
                Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
                Span::styled("Cancel", Style::default().fg(Color::DarkGray)),
            ]));
            frame.render_widget(hints, area);
        } else {
            let input = Paragraph::new(Line::from(vec![
                Span::styled("  ", Style::default()),
                Span::styled(
                    "Press [i] to type, [e] to select messages...",
                    Style::default().fg(Color::DarkGray),
                ),
            ]));
            frame.render_widget(input, area);
        }
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────

/// Format a Unix timestamp into a readable time string.
fn format_timestamp(ts: i64) -> String {
    use chrono::{Local, TimeZone};
    match Local.timestamp_opt(ts, 0) {
        chrono::LocalResult::Single(dt) => {
            let now = Local::now();
            if dt.date_naive() == now.date_naive() {
                dt.format("%H:%M").to_string()
            } else {
                dt.format("%m/%d %H:%M").to_string()
            }
        }
        _ => "??:??".to_string(),
    }
}

/// Simple word-wrapping for a text string.
fn wrap_text(text: &str, max_width: usize) -> Vec<String> {
    if max_width == 0 {
        return vec![text.to_string()];
    }

    let mut lines = Vec::new();
    for input_line in text.lines() {
        if input_line.len() <= max_width {
            lines.push(input_line.to_string());
        } else {
            let mut current = String::new();
            for word in input_line.split_whitespace() {
                if current.is_empty() {
                    current = word.to_string();
                } else if current.len() + 1 + word.len() <= max_width {
                    current.push(' ');
                    current.push_str(word);
                } else {
                    lines.push(current);
                    current = word.to_string();
                }
            }
            if !current.is_empty() {
                lines.push(current);
            }
        }
    }

    if lines.is_empty() {
        lines.push(String::new());
    }

    lines
}
