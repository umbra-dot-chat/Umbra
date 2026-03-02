//! Community view — channel tree sidebar and channel content area.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph, Wrap};

use crate::app::{App, ChatFocus, ChannelTreeItem, MessageAction};

// ── Channel tree sidebar ────────────────────────────────────────────────

pub fn render_channel_tree(frame: &mut Frame, app: &App, focus: ChatFocus, area: Rect) {
    let community_name = app.communities.iter()
        .find(|c| Some(&c.id) == app.active_community.as_ref())
        .map(|c| c.name.as_str())
        .unwrap_or("Community");

    let border_color = if focus == ChatFocus::Sidebar {
        Color::Magenta
    } else {
        Color::DarkGray
    };

    let title = format!(" {} ", community_name);
    let block = Block::default()
        .title(title)
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(border_color));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(1, 1));

    let control_lines: u16 = 4;

    let chunks = Layout::vertical([
        Constraint::Min(3),                       // Channel tree
        Constraint::Length(1),                     // Separator
        Constraint::Length(control_lines),         // Controls
    ])
    .split(inner);

    // Channel tree
    if app.channel_tree.is_empty() {
        let empty = Paragraph::new(vec![
            Line::from(""),
            Line::from(Span::styled(
                "  No channels",
                Style::default().fg(Color::DarkGray),
            )),
        ]);
        frame.render_widget(empty, chunks[0]);
    } else {
        let max_visible = chunks[0].height as usize;
        let mut lines = Vec::new();

        // Calculate scroll offset
        let scroll_offset = if app.selected_channel_item >= max_visible {
            app.selected_channel_item - max_visible + 1
        } else {
            0
        };

        for (i, item) in app.channel_tree.iter().enumerate().skip(scroll_offset) {
            if lines.len() >= max_visible {
                break;
            }

            let is_selected = i == app.selected_channel_item && focus == ChatFocus::Sidebar;

            match item {
                ChannelTreeItem::Space { name, .. } => {
                    let style = if is_selected {
                        Style::default().fg(Color::Magenta).bold()
                    } else {
                        Style::default().fg(Color::White).bold()
                    };
                    let prefix = if is_selected { "> " } else { "  " };
                    lines.push(Line::from(vec![
                        Span::styled(prefix, Style::default().fg(if is_selected { Color::Magenta } else { Color::DarkGray })),
                        Span::styled("\u{25BC} ", Style::default().fg(Color::DarkGray)),
                        Span::styled(name.as_str(), style),
                    ]));
                }
                ChannelTreeItem::Category { name, .. } => {
                    let style = if is_selected {
                        Style::default().fg(Color::Magenta).bold()
                    } else {
                        Style::default().fg(Color::DarkGray).bold()
                    };
                    let prefix = if is_selected { "> " } else { "  " };
                    lines.push(Line::from(vec![
                        Span::styled(prefix, Style::default().fg(if is_selected { Color::Magenta } else { Color::DarkGray })),
                        Span::styled("  ", Style::default()),
                        Span::styled(name.to_uppercase(), style),
                    ]));
                }
                ChannelTreeItem::Channel { name, channel_type, id } => {
                    let is_active = app.active_channel.as_deref() == Some(id);
                    let icon = match channel_type.as_str() {
                        "voice" => "\u{1F50A} ",
                        "announcement" => "\u{1F4E2} ",
                        _ => "# ",
                    };
                    let style = if is_selected {
                        Style::default().fg(Color::Magenta).bold()
                    } else if is_active {
                        Style::default().fg(Color::White).bold()
                    } else {
                        Style::default().fg(Color::White)
                    };
                    let prefix = if is_selected { "> " } else { "  " };
                    let icon_style = if is_active {
                        Style::default().fg(Color::Magenta)
                    } else {
                        Style::default().fg(Color::DarkGray)
                    };
                    lines.push(Line::from(vec![
                        Span::styled(prefix, Style::default().fg(if is_selected { Color::Magenta } else { Color::DarkGray })),
                        Span::styled("    ", Style::default()),
                        Span::styled(icon, icon_style),
                        Span::styled(name.as_str(), style),
                    ]));
                }
            }
        }

        let tree = Paragraph::new(lines);
        frame.render_widget(tree, chunks[0]);
    }

    // Separator
    let sep_width = chunks[1].width as usize;
    let separator = Paragraph::new("\u{2500}".repeat(sep_width))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(separator, chunks[1]);

    // Controls
    let ctrl_lines = vec![
        Line::from(vec![
            Span::styled("[m] ", Style::default().fg(Color::Magenta).bold()),
            Span::styled("Members  ", Style::default().fg(Color::DarkGray)),
            Span::styled("[R] ", Style::default().fg(Color::Cyan).bold()),
            Span::styled("Roles", Style::default().fg(Color::DarkGray)),
        ]),
        Line::from(vec![
            Span::styled("[I] ", Style::default().fg(Color::Cyan).bold()),
            Span::styled("Invites  ", Style::default().fg(Color::DarkGray)),
            Span::styled("[Enter] ", Style::default().fg(Color::Magenta).bold()),
            Span::styled("Open ch", Style::default().fg(Color::DarkGray)),
        ]),
        Line::from(vec![
            Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
            Span::styled("Back  ", Style::default().fg(Color::DarkGray)),
            Span::styled("[q] ", Style::default().fg(Color::DarkGray).bold()),
            Span::styled("Quit", Style::default().fg(Color::DarkGray)),
        ]),
    ];

    let controls = Paragraph::new(ctrl_lines);
    frame.render_widget(controls, chunks[2]);
}

// ── Channel content area ────────────────────────────────────────────────

pub fn render_channel_content(frame: &mut Frame, app: &App, focus: ChatFocus, area: Rect) {
    let channel_name = app.active_channel_name.as_deref().unwrap_or("Select a channel");
    let has_channel = app.active_channel.is_some();

    let border_color = match focus {
        ChatFocus::MainArea | ChatFocus::Input if has_channel => Color::Magenta,
        _ => Color::DarkGray,
    };

    let title = if has_channel {
        format!(" # {} ", channel_name)
    } else {
        " Channel ".to_string()
    };

    let block = Block::default()
        .title(title)
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(border_color));
    frame.render_widget(block, area);

    if !has_channel {
        let inner = area.inner(Margin::new(3, 2));
        let welcome = Paragraph::new(vec![
            Line::from(""),
            Line::from(Span::styled(
                "Select a text channel from the sidebar",
                Style::default().fg(Color::DarkGray),
            )),
            Line::from(Span::styled(
                "to start chatting.",
                Style::default().fg(Color::DarkGray),
            )),
        ])
        .wrap(Wrap { trim: true });
        frame.render_widget(welcome, inner);
        return;
    }

    let inner = area.inner(Margin::new(1, 1));

    let input_height: u16 = if focus == ChatFocus::Input || app.message_action_mode.is_some() { 3 } else { 2 };

    let chunks = Layout::vertical([
        Constraint::Min(3),             // Messages area
        Constraint::Length(1),          // Separator
        Constraint::Length(input_height), // Input area
    ])
    .split(inner);

    // Reuse the chat message renderer
    render_channel_messages(frame, app, chunks[0]);

    // Separator
    let sep_width = chunks[1].width as usize;
    let separator = Paragraph::new("\u{2500}".repeat(sep_width))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(separator, chunks[1]);

    // Input area
    render_channel_input(frame, app, focus, chunks[2]);
}

/// Render channel messages (reuses the same pattern as DM/group messages).
fn render_channel_messages(frame: &mut Frame, app: &App, area: Rect) {
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

    let mut all_lines: Vec<(Line, Option<usize>)> = Vec::new();

    for (i, msg) in app.messages.iter().enumerate() {
        let name_color = if msg.is_mine { Color::Cyan } else { Color::Magenta };
        let time_str = format_timestamp(msg.timestamp);

        let mut header_spans = vec![
            Span::styled("  ", Style::default()),
        ];

        header_spans.push(Span::styled(
            &msg.sender_name,
            Style::default().fg(name_color).bold(),
        ));

        header_spans.push(Span::styled(
            format!("  {time_str}"),
            Style::default().fg(Color::DarkGray),
        ));

        if msg.edited_at.is_some() {
            header_spans.push(Span::styled(
                " (edited)",
                Style::default().fg(Color::DarkGray),
            ));
        }

        all_lines.push((Line::from(header_spans), Some(i)));

        // Content lines
        if msg.deleted {
            all_lines.push((Line::from(vec![
                Span::styled("    ", Style::default()),
                Span::styled(
                    "[message deleted]",
                    Style::default().fg(Color::DarkGray).italic(),
                ),
            ]), Some(i)));
        } else {
            let max_content_width = available_width.saturating_sub(6);
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
                    Style::default().fg(Color::Magenta),
                ));
            }
            all_lines.push((Line::from(reaction_spans), Some(i)));
        }

        all_lines.push((Line::from(""), None));
    }

    // Apply scroll offset
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

    let selected = app.selected_message;
    let styled_lines: Vec<Line> = visible
        .into_iter()
        .map(|(line, msg_idx)| {
            if let (Some(sel), Some(idx)) = (selected, msg_idx) {
                if sel == idx {
                    let bg = Color::Rgb(50, 30, 60);
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

/// Render the message input area for community channels.
fn render_channel_input(frame: &mut Frame, app: &App, focus: ChatFocus, area: Rect) {
    // Check for message action modes first
    if let Some(action) = app.message_action_mode {
        match action {
            MessageAction::Edit => {
                let header = Paragraph::new(Line::from(Span::styled(
                    "Editing message:",
                    Style::default().fg(Color::Magenta).bold(),
                )));
                frame.render_widget(header, Rect { height: 1, ..area });

                if area.height > 1 {
                    let display_text = if app.edit_buffer.is_empty() {
                        " ...".to_string()
                    } else {
                        format!(" {}", app.edit_buffer)
                    };
                    let input = Paragraph::new(Line::from(vec![
                        Span::styled("> ", Style::default().fg(Color::Magenta).bold()),
                        Span::styled(display_text, Style::default().fg(Color::White)),
                    ]));
                    frame.render_widget(input, Rect {
                        y: area.y + 1,
                        height: 1,
                        ..area
                    });

                    let cursor_x = area.x + 2 + app.edit_cursor as u16 + 1;
                    let cursor_y = area.y + 1;
                    frame.set_cursor_position(Position::new(
                        cursor_x.min(area.x + area.width - 1),
                        cursor_y,
                    ));
                }

                if area.height > 2 {
                    let hints = Paragraph::new(Line::from(vec![
                        Span::styled("[Enter] ", Style::default().fg(Color::Magenta).bold()),
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
                    Span::styled("  React: ", Style::default().fg(Color::Magenta).bold()),
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
            MessageAction::Pin => {}
        }
    }

    if focus == ChatFocus::Input {
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
            Span::styled("> ", Style::default().fg(Color::Magenta).bold()),
            Span::styled(display_text, input_style),
        ]));
        frame.render_widget(input, Rect { height: 1, ..area });

        let cursor_x = area.x + 2 + app.message_cursor as u16 + 1;
        let cursor_y = area.y;
        frame.set_cursor_position(Position::new(
            cursor_x.min(area.x + area.width - 1),
            cursor_y,
        ));

        if area.height > 1 {
            let hints = Paragraph::new(Line::from(vec![
                Span::styled("[Enter] ", Style::default().fg(Color::Magenta).bold()),
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
        if app.selected_message.is_some() {
            let hints = Paragraph::new(Line::from(vec![
                Span::styled("[e] ", Style::default().fg(Color::Magenta).bold()),
                Span::styled("Edit  ", Style::default().fg(Color::DarkGray)),
                Span::styled("[d] ", Style::default().fg(Color::Red).bold()),
                Span::styled("Delete  ", Style::default().fg(Color::DarkGray)),
                Span::styled("[+] ", Style::default().fg(Color::Magenta).bold()),
                Span::styled("React  ", Style::default().fg(Color::DarkGray)),
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
