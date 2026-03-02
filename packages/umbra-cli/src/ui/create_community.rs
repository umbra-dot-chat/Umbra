//! Create community dialog — name and description input.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph};

use crate::app::{App, CreateCommunityFocus, Screen};
use super::centered_rect;

pub fn render(frame: &mut Frame, app: &App) {
    let (community_name, community_description, field_focus) = match &app.screen {
        Screen::CreateCommunity {
            community_name,
            community_description,
            field_focus,
            ..
        } => (community_name, community_description, *field_focus),
        _ => return,
    };

    let area = centered_rect(55, 50, frame.area());

    let block = Block::default()
        .title(" Create Community ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Magenta));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(1), // "Community Name" label
        Constraint::Length(1), // Name input
        Constraint::Length(1), // Spacer
        Constraint::Length(1), // "Description" label
        Constraint::Length(1), // Description input
        Constraint::Min(3),   // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // ── Community name label ────────────────────────────────────────────
    let name_label_style = if field_focus == CreateCommunityFocus::Name {
        Style::default().fg(Color::Magenta).bold()
    } else {
        Style::default().fg(Color::DarkGray)
    };
    let name_label = Paragraph::new(Line::from(Span::styled("Community Name:", name_label_style)));
    frame.render_widget(name_label, chunks[0]);

    // ── Name input ──────────────────────────────────────────────────────
    let name_border_style = if field_focus == CreateCommunityFocus::Name {
        Style::default().fg(Color::Magenta)
    } else {
        Style::default().fg(Color::DarkGray)
    };

    let display_name = if community_name.is_empty() && field_focus == CreateCommunityFocus::Name {
        "Type a name...".to_string()
    } else if community_name.is_empty() {
        "(empty)".to_string()
    } else {
        community_name.clone()
    };

    let name_style = if community_name.is_empty() {
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
    if field_focus == CreateCommunityFocus::Name {
        let cursor_x = chunks[1].x + 2 + community_name.len() as u16;
        frame.set_cursor_position(Position::new(
            cursor_x.min(chunks[1].x + chunks[1].width - 1),
            chunks[1].y,
        ));
    }

    // ── Description label ───────────────────────────────────────────────
    let desc_label_style = if field_focus == CreateCommunityFocus::Description {
        Style::default().fg(Color::Magenta).bold()
    } else {
        Style::default().fg(Color::DarkGray)
    };
    let desc_label = Paragraph::new(Line::from(Span::styled("Description (optional):", desc_label_style)));
    frame.render_widget(desc_label, chunks[3]);

    // ── Description input ───────────────────────────────────────────────
    let desc_border_style = if field_focus == CreateCommunityFocus::Description {
        Style::default().fg(Color::Magenta)
    } else {
        Style::default().fg(Color::DarkGray)
    };

    let display_desc = if community_description.is_empty() && field_focus == CreateCommunityFocus::Description {
        "Type a description...".to_string()
    } else if community_description.is_empty() {
        "(none)".to_string()
    } else {
        community_description.clone()
    };

    let desc_style = if community_description.is_empty() {
        Style::default().fg(Color::DarkGray)
    } else {
        Style::default().fg(Color::White)
    };

    let desc_input = Paragraph::new(Line::from(vec![
        Span::styled("> ", desc_border_style.bold()),
        Span::styled(display_desc, desc_style),
    ]));
    frame.render_widget(desc_input, chunks[4]);

    // Set cursor when description is focused
    if field_focus == CreateCommunityFocus::Description {
        let cursor_x = chunks[4].x + 2 + community_description.len() as u16;
        frame.set_cursor_position(Position::new(
            cursor_x.min(chunks[4].x + chunks[4].width - 1),
            chunks[4].y,
        ));
    }

    // ── Controls ────────────────────────────────────────────────────────
    let spans = vec![
        Span::styled("[Tab] ", Style::default().fg(Color::Magenta).bold()),
        Span::styled("Switch  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[Enter] ", Style::default().fg(Color::Green).bold()),
        Span::styled("Create  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Back", Style::default().fg(Color::DarkGray)),
    ];

    frame.render_widget(Paragraph::new(Line::from(spans)), chunks[6]);
}
