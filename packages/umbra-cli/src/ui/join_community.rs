//! Join community dialog — enter an invite code to join a community.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph};

use crate::app::{App, Screen};
use super::centered_rect;

pub fn render(frame: &mut Frame, app: &App) {
    let (invite_code_input, resolved_invite, resolving) = match &app.screen {
        Screen::JoinCommunity {
            invite_code_input,
            resolved_invite,
            resolving,
            ..
        } => (invite_code_input, resolved_invite, *resolving),
        _ => return,
    };

    let area = centered_rect(50, 45, frame.area());

    let block = Block::default()
        .title(" Join Community ")
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Magenta));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    if let Some(resolved) = resolved_invite {
        // Show resolved community info + confirm prompt
        let chunks = Layout::vertical([
            Constraint::Length(1), // Header
            Constraint::Length(1), // Spacer
            Constraint::Length(1), // Community name
            Constraint::Length(1), // Description
            Constraint::Length(1), // Member count
            Constraint::Length(1), // Spacer
            Constraint::Min(0),   // Spacer
            Constraint::Length(1), // Controls
        ])
        .split(inner);

        let header = Paragraph::new(Line::from(Span::styled(
            "Community found!",
            Style::default().fg(Color::Green).bold(),
        )));
        frame.render_widget(header, chunks[0]);

        let name_line = Paragraph::new(Line::from(vec![
            Span::styled("Name: ", Style::default().fg(Color::DarkGray)),
            Span::styled(&resolved.community_name, Style::default().fg(Color::White).bold()),
        ]));
        frame.render_widget(name_line, chunks[2]);

        if let Some(ref desc) = resolved.community_description {
            let desc_line = Paragraph::new(Line::from(vec![
                Span::styled("Desc: ", Style::default().fg(Color::DarkGray)),
                Span::styled(desc, Style::default().fg(Color::White)),
            ]));
            frame.render_widget(desc_line, chunks[3]);
        }

        let members_line = Paragraph::new(Line::from(vec![
            Span::styled("Members: ", Style::default().fg(Color::DarkGray)),
            Span::styled(
                format!("{}", resolved.member_count),
                Style::default().fg(Color::Magenta),
            ),
        ]));
        frame.render_widget(members_line, chunks[4]);

        let controls = Paragraph::new(Line::from(vec![
            Span::styled("[Enter] ", Style::default().fg(Color::DarkGray).bold()),
            Span::styled("Join  ", Style::default().fg(Color::DarkGray)),
            Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
            Span::styled("Cancel", Style::default().fg(Color::DarkGray)),
        ]));
        frame.render_widget(controls, chunks[7]);
    } else {
        // Show invite code input
        let chunks = Layout::vertical([
            Constraint::Length(1), // Header
            Constraint::Length(1), // Spacer
            Constraint::Length(1), // Label
            Constraint::Length(3), // Input box
            Constraint::Length(1), // Status
            Constraint::Min(0),   // Spacer
            Constraint::Length(1), // Controls
        ])
        .split(inner);

        let header = Paragraph::new(Line::from(Span::styled(
            "Enter an invite code to join a community",
            Style::default().fg(Color::DarkGray),
        )));
        frame.render_widget(header, chunks[0]);

        let label = Paragraph::new(Line::from(Span::styled(
            "Invite Code:",
            Style::default().fg(Color::Magenta).bold(),
        )));
        frame.render_widget(label, chunks[2]);

        // Input box
        let input_block = Block::default()
            .borders(Borders::ALL)
            .border_type(BorderType::Rounded)
            .border_style(Style::default().fg(Color::Magenta));
        let input_text = Paragraph::new(Line::from(Span::styled(
            invite_code_input,
            Style::default().fg(Color::White),
        )))
        .block(input_block);
        frame.render_widget(input_text, chunks[3]);

        // Show cursor
        let cursor_x = chunks[3].x + 1 + invite_code_input.len() as u16;
        let cursor_y = chunks[3].y + 1;
        if cursor_x < chunks[3].x + chunks[3].width - 1 {
            frame.set_cursor_position((cursor_x, cursor_y));
        }

        // Status
        if resolving {
            let spinner_chars = ["\u{25DC}", "\u{25DD}", "\u{25DE}", "\u{25DF}"];
            let spinner = spinner_chars[app.spinner_frame % spinner_chars.len()];
            let status = Paragraph::new(Line::from(vec![
                Span::styled(spinner, Style::default().fg(Color::Magenta)),
                Span::styled(" Resolving invite...", Style::default().fg(Color::DarkGray)),
            ]));
            frame.render_widget(status, chunks[4]);
        }

        let controls = Paragraph::new(Line::from(vec![
            Span::styled("[Enter] ", Style::default().fg(Color::DarkGray).bold()),
            Span::styled("Resolve  ", Style::default().fg(Color::DarkGray)),
            Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
            Span::styled("Cancel", Style::default().fg(Color::DarkGray)),
        ]));
        frame.render_widget(controls, chunks[6]);
    }
}
