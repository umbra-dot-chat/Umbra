//! Community list sidebar — shows communities when NavRoute::Communities.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph};

use crate::app::{App, ChatFocus};

pub fn render(frame: &mut Frame, app: &App, focus: ChatFocus, area: Rect) {
    let border_color = if focus == ChatFocus::Sidebar {
        Color::Magenta
    } else {
        Color::DarkGray
    };

    let block = Block::default()
        .title(" Communities ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(border_color));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(1, 1));

    let has_communities = !app.communities.is_empty() && focus == ChatFocus::Sidebar;
    let control_lines: u16 = if has_communities { 5 } else { 4 };

    let chunks = Layout::vertical([
        Constraint::Min(3),                       // Community list
        Constraint::Length(1),                     // Separator
        Constraint::Length(control_lines),         // Controls
    ])
    .split(inner);

    // Community list or empty state
    if app.communities.is_empty() {
        let empty = Paragraph::new(vec![
            Line::from(""),
            Line::from(Span::styled(
                "  No communities yet",
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
        for (i, community) in app.communities.iter().enumerate() {
            let is_selected = i == app.selected_community && focus == ChatFocus::Sidebar;
            let prefix = if is_selected { " > " } else { "   " };
            let name_style = if is_selected {
                Style::default().fg(Color::Magenta).bold()
            } else {
                Style::default().fg(Color::White)
            };

            let member_count = format!(" ({})", community.member_count);

            let line = Line::from(vec![
                Span::styled(
                    prefix,
                    Style::default().fg(if is_selected { Color::Magenta } else { Color::DarkGray }),
                ),
                Span::styled(&community.name, name_style),
                Span::styled(member_count, Style::default().fg(Color::DarkGray)),
            ]);
            lines.push(line);
        }
        let list = Paragraph::new(lines);
        frame.render_widget(list, chunks[0]);
    }

    // Separator
    let sep_width = chunks[1].width as usize;
    let separator = Paragraph::new("\u{2500}".repeat(sep_width))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(separator, chunks[1]);

    // Controls
    let mut ctrl_lines = vec![
        Line::from(vec![
            Span::styled("[n] ", Style::default().fg(Color::Magenta).bold()),
            Span::styled("New  ", Style::default().fg(Color::DarkGray)),
            Span::styled("[j] ", Style::default().fg(Color::Cyan).bold()),
            Span::styled("Join", Style::default().fg(Color::DarkGray)),
        ]),
    ];

    if has_communities {
        ctrl_lines.push(Line::from(vec![
            Span::styled("[l] ", Style::default().fg(Color::Red).bold()),
            Span::styled("Leave", Style::default().fg(Color::DarkGray)),
        ]));
    }

    ctrl_lines.push(Line::from(vec![
        Span::styled("[Enter] ", Style::default().fg(Color::Magenta).bold()),
        Span::styled("Open", Style::default().fg(Color::DarkGray)),
    ]));

    ctrl_lines.push(Line::from(vec![
        Span::styled("[q] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Quit", Style::default().fg(Color::DarkGray)),
    ]));

    let controls = Paragraph::new(ctrl_lines);
    frame.render_widget(controls, chunks[2]);
}
