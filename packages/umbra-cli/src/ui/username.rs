//! Username registration flow — enter name, display registered username.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph, Wrap};

use crate::app::App;
use super::centered_rect;

// ── UsernameRegister ────────────────────────────────────────────────────

pub fn render_register(frame: &mut Frame, app: &App) {
    let area = centered_rect(55, 55, frame.area());

    let block = Block::default()
        .title(" Choose Username ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Cyan));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(2), // Prompt
        Constraint::Length(3), // Input box
        Constraint::Length(1), // Spacer
        Constraint::Length(2), // Preview
        Constraint::Length(1), // Spacer
        Constraint::Length(2), // Help text
        Constraint::Min(0),   // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // Prompt
    let prompt = Paragraph::new("Pick a username for Umbra:")
        .style(Style::default().fg(Color::White));
    frame.render_widget(prompt, chunks[0]);

    // Input box
    let input_block = Block::default()
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Cyan));

    let input_text = Paragraph::new(app.input.as_str())
        .style(Style::default().fg(Color::White))
        .block(input_block);
    frame.render_widget(input_text, chunks[1]);

    // Cursor
    let cursor_x = chunks[1].x + 1 + app.cursor_pos as u16;
    let cursor_y = chunks[1].y + 1;
    frame.set_cursor_position(Position::new(cursor_x, cursor_y));

    // Preview
    let preview_name = if app.input.trim().is_empty() {
        "...".to_string()
    } else {
        app.input.trim().to_string()
    };
    let preview = Paragraph::new(vec![
        Line::from(Span::styled(
            "A unique tag will be assigned:",
            Style::default().fg(Color::DarkGray),
        )),
        Line::from(vec![
            Span::styled(
                format!("{preview_name}"),
                Style::default().fg(Color::White).bold(),
            ),
            Span::styled("#XXXXX", Style::default().fg(Color::DarkGray)),
        ]),
    ]);
    frame.render_widget(preview, chunks[3]);

    // Help text
    let help = Paragraph::new("Friends can find you with this username.")
        .style(Style::default().fg(Color::DarkGray))
        .wrap(Wrap { trim: true });
    frame.render_widget(help, chunks[5]);

    // Controls
    let controls = Paragraph::new(Line::from(vec![
        Span::styled("[Enter] ", Style::default().fg(Color::Cyan).bold()),
        Span::styled("Register  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[s] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Skip  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Back", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(controls, chunks[7]);
}

// ── UsernameSuccess ─────────────────────────────────────────────────────

pub fn render_success(frame: &mut Frame, username: &str) {
    let area = centered_rect(55, 45, frame.area());

    let block = Block::default()
        .title(" Choose Username ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Green));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(2), // Success message
        Constraint::Length(1), // Spacer
        Constraint::Length(1), // Username display
        Constraint::Length(1), // Spacer
        Constraint::Length(2), // Help text
        Constraint::Min(0),   // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // Success message
    let success = Paragraph::new("✓ Username registered!")
        .style(Style::default().fg(Color::Green));
    frame.render_widget(success, chunks[0]);

    // Username display
    let username_line = Paragraph::new(Line::from(vec![
        Span::styled("You are: ", Style::default().fg(Color::DarkGray)),
        Span::styled(username, Style::default().fg(Color::White).bold()),
    ]));
    frame.render_widget(username_line, chunks[2]);

    // Help text
    let help = Paragraph::new("Friends can find you with this tag.")
        .style(Style::default().fg(Color::DarkGray))
        .wrap(Wrap { trim: true });
    frame.render_widget(help, chunks[4]);

    // Controls
    let controls = Paragraph::new(Line::from(vec![
        Span::styled("[Enter] ", Style::default().fg(Color::Green).bold()),
        Span::styled("Continue", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(controls, chunks[6]);
}
