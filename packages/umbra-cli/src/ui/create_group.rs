//! Create group dialog — multi-select friend list + group name input.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph};

use crate::app::{App, CreateGroupFocus, Screen};
use super::centered_rect;

pub fn render(frame: &mut Frame, app: &App) {
    let (group_name, friends, selected_members, member_cursor, field_focus) = match &app.screen {
        Screen::CreateGroup {
            group_name,
            friends,
            selected_members,
            member_cursor,
            field_focus,
            ..
        } => (group_name, friends, selected_members, *member_cursor, *field_focus),
        _ => return,
    };

    let area = centered_rect(55, 70, frame.area());

    let block = Block::default()
        .title(" Create Group ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Yellow));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(1), // "Group Name" label
        Constraint::Length(1), // Name input
        Constraint::Length(1), // Spacer
        Constraint::Length(1), // "Select Members" label
        Constraint::Length(1), // Separator
        Constraint::Min(5),   // Member list
        Constraint::Length(1), // Spacer
        Constraint::Length(1), // Selected count
        Constraint::Length(1), // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // ── Group name label ────────────────────────────────────────────────
    let name_label_style = if field_focus == CreateGroupFocus::Name {
        Style::default().fg(Color::Yellow).bold()
    } else {
        Style::default().fg(Color::DarkGray)
    };
    let name_label = Paragraph::new(Line::from(Span::styled("Group Name:", name_label_style)));
    frame.render_widget(name_label, chunks[0]);

    // ── Name input ──────────────────────────────────────────────────────
    let name_border_style = if field_focus == CreateGroupFocus::Name {
        Style::default().fg(Color::Yellow)
    } else {
        Style::default().fg(Color::DarkGray)
    };

    let display_name = if group_name.is_empty() && field_focus == CreateGroupFocus::Name {
        "Type a name...".to_string()
    } else if group_name.is_empty() {
        "(empty)".to_string()
    } else {
        group_name.clone()
    };

    let name_style = if group_name.is_empty() {
        Style::default().fg(Color::DarkGray)
    } else {
        Style::default().fg(Color::White)
    };

    let name_input = Paragraph::new(Line::from(vec![
        Span::styled("> ", name_border_style.bold()),
        Span::styled(display_name, name_style),
    ]));
    frame.render_widget(name_input, chunks[1]);

    // Set cursor when name is focused
    if field_focus == CreateGroupFocus::Name {
        let cursor_x = chunks[1].x + 2 + group_name.len() as u16;
        frame.set_cursor_position(Position::new(
            cursor_x.min(chunks[1].x + chunks[1].width - 1),
            chunks[1].y,
        ));
    }

    // ── Select Members label ────────────────────────────────────────────
    let members_label_style = if field_focus == CreateGroupFocus::Members {
        Style::default().fg(Color::Yellow).bold()
    } else {
        Style::default().fg(Color::DarkGray)
    };
    let members_label = Paragraph::new(Line::from(Span::styled(
        "Select Members:",
        members_label_style,
    )));
    frame.render_widget(members_label, chunks[3]);

    // ── Separator ───────────────────────────────────────────────────────
    let sep_width = chunks[4].width as usize;
    let separator = Paragraph::new("─".repeat(sep_width))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(separator, chunks[4]);

    // ── Member list ─────────────────────────────────────────────────────
    if friends.is_empty() {
        let empty = Paragraph::new(vec![
            Line::from(""),
            Line::from(Span::styled(
                "  No friends to add. Add friends first!",
                Style::default().fg(Color::DarkGray),
            )),
        ]);
        frame.render_widget(empty, chunks[5]);
    } else {
        let max_visible = chunks[5].height as usize;
        let mut lines = Vec::new();

        // Calculate scroll offset for long lists
        let scroll_offset = if member_cursor >= max_visible {
            member_cursor - max_visible + 1
        } else {
            0
        };

        for (i, friend) in friends.iter().enumerate().skip(scroll_offset) {
            if lines.len() >= max_visible {
                break;
            }

            let is_cursor = i == member_cursor && field_focus == CreateGroupFocus::Members;
            let is_selected = i < selected_members.len() && selected_members[i];

            let checkbox = if is_selected { "[x] " } else { "[ ] " };
            let checkbox_style = if is_selected {
                Style::default().fg(Color::Green).bold()
            } else {
                Style::default().fg(Color::DarkGray)
            };

            let prefix = if is_cursor { "> " } else { "  " };
            let prefix_style = if is_cursor {
                Style::default().fg(Color::Yellow)
            } else {
                Style::default().fg(Color::DarkGray)
            };

            let name_style = if is_cursor {
                Style::default().fg(Color::White).bold()
            } else if is_selected {
                Style::default().fg(Color::Green)
            } else {
                Style::default().fg(Color::White)
            };

            lines.push(Line::from(vec![
                Span::styled(prefix, prefix_style),
                Span::styled(checkbox, checkbox_style),
                Span::styled(&friend.display_name, name_style),
            ]));
        }

        frame.render_widget(Paragraph::new(lines), chunks[5]);
    }

    // ── Selected count ──────────────────────────────────────────────────
    let selected_count = selected_members.iter().filter(|&&s| s).count();
    let count_text = format!(
        "{} member{} selected",
        selected_count,
        if selected_count != 1 { "s" } else { "" }
    );
    let count_style = if selected_count > 0 {
        Style::default().fg(Color::Green)
    } else {
        Style::default().fg(Color::DarkGray)
    };
    let count = Paragraph::new(Line::from(Span::styled(count_text, count_style)));
    frame.render_widget(count, chunks[7]);

    // ── Controls ────────────────────────────────────────────────────────
    let mut spans = Vec::new();

    if field_focus == CreateGroupFocus::Members {
        spans.push(Span::styled("[Space] ", Style::default().fg(Color::Yellow).bold()));
        spans.push(Span::styled("Toggle  ", Style::default().fg(Color::DarkGray)));
    }

    spans.push(Span::styled("[Tab] ", Style::default().fg(Color::Yellow).bold()));
    spans.push(Span::styled("Switch  ", Style::default().fg(Color::DarkGray)));
    spans.push(Span::styled("[Enter] ", Style::default().fg(Color::Green).bold()));
    spans.push(Span::styled("Create  ", Style::default().fg(Color::DarkGray)));
    spans.push(Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()));
    spans.push(Span::styled("Back", Style::default().fg(Color::DarkGray)));

    frame.render_widget(Paragraph::new(Line::from(spans)), chunks[9]);
}
