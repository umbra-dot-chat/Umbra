//! Create identity flow — name entry, phrase display, backup confirmation.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph, Wrap};

use crate::app::App;
use super::centered_rect;

// ── CreateName ─────────────────────────────────────────────────────────

pub fn render_name(frame: &mut Frame, app: &App) {
    let area = centered_rect(50, 50, frame.area());

    let block = Block::default()
        .title(" Create Identity ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Cyan));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(2), // Prompt
        Constraint::Length(3), // Input box
        Constraint::Length(2), // Help text
        Constraint::Min(0),   // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // Prompt
    let prompt = Paragraph::new("Enter your display name:")
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

    // Set cursor position
    let cursor_x = chunks[1].x + 1 + app.cursor_pos as u16;
    let cursor_y = chunks[1].y + 1;
    frame.set_cursor_position(Position::new(cursor_x, cursor_y));

    // Help text
    let help = Paragraph::new("This name is shown to your contacts. You can change it later.")
        .style(Style::default().fg(Color::DarkGray))
        .wrap(Wrap { trim: true });
    frame.render_widget(help, chunks[2]);

    // Controls
    let controls = Paragraph::new(Line::from(vec![
        Span::styled("[Enter] ", Style::default().fg(Color::Cyan).bold()),
        Span::styled("Continue  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Back", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(controls, chunks[4]);
}

// ── CreatePhrase ───────────────────────────────────────────────────────

pub fn render_phrase(frame: &mut Frame, _name: &str, phrase: &[String]) {
    let area = centered_rect(65, 75, frame.area());

    let block = Block::default()
        .title(" Recovery Phrase ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Yellow));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(3), // Warning
        Constraint::Length(1), // Spacer
        Constraint::Min(8),   // Word grid
        Constraint::Length(1), // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // Warning
    let warning = Paragraph::new(vec![
        Line::from(Span::styled(
            "!! Write these 24 words down on paper!",
            Style::default().fg(Color::Yellow).bold(),
        )),
        Line::from(Span::styled(
            "   Never store digitally. Never share with anyone.",
            Style::default().fg(Color::Yellow),
        )),
    ]);
    frame.render_widget(warning, chunks[0]);

    // Word grid — 3 columns x 8 rows
    let cols = 3;
    let grid_area = chunks[2];
    let col_width = grid_area.width / cols as u16;

    for (i, word) in phrase.iter().enumerate() {
        let col = i / 8;
        let row = i % 8;

        let x = grid_area.x + col as u16 * col_width;
        let y = grid_area.y + row as u16;

        if y < grid_area.y + grid_area.height {
            let num = format!("{:>2}. ", i + 1);
            let line = Line::from(vec![
                Span::styled(num, Style::default().fg(Color::DarkGray)),
                Span::styled(word.as_str(), Style::default().fg(Color::White).bold()),
            ]);
            let word_para = Paragraph::new(line);
            let word_rect = Rect {
                x,
                y,
                width: col_width,
                height: 1,
            };
            frame.render_widget(word_para, word_rect);
        }
    }

    // Controls
    let controls = Paragraph::new(Line::from(vec![
        Span::styled("[Enter] ", Style::default().fg(Color::Cyan).bold()),
        Span::styled("I've written them down  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Cancel", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(controls, chunks[4]);
}

// ── CreateConfirm ──────────────────────────────────────────────────────

pub fn render_confirm(frame: &mut Frame, app: &App) {
    let area = centered_rect(55, 45, frame.area());

    let block = Block::default()
        .title(" Confirm Backup ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Yellow));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(2), // Question
        Constraint::Length(1), // Spacer
        Constraint::Length(2), // Checkbox
        Constraint::Length(1), // Spacer
        Constraint::Length(2), // Warning
        Constraint::Min(0),   // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // Question
    let question = Paragraph::new("Have you securely stored your recovery phrase?")
        .style(Style::default().fg(Color::White))
        .wrap(Wrap { trim: true });
    frame.render_widget(question, chunks[0]);

    // Checkbox
    let check = if app.confirmed_backup { "x" } else { " " };
    let checkbox = Paragraph::new(Line::from(vec![
        Span::styled(
            format!("[{check}] "),
            Style::default()
                .fg(if app.confirmed_backup {
                    Color::Green
                } else {
                    Color::DarkGray
                })
                .bold(),
        ),
        Span::styled(
            "I have written down my recovery phrase and stored it securely",
            Style::default().fg(Color::White),
        ),
    ]))
    .wrap(Wrap { trim: true });
    frame.render_widget(checkbox, chunks[2]);

    // Warning
    let warning = Paragraph::new(Span::styled(
        "!! You will NOT be able to see it again",
        Style::default().fg(Color::Yellow),
    ));
    frame.render_widget(warning, chunks[4]);

    // Controls
    let controls = if app.confirmed_backup {
        Paragraph::new(Line::from(vec![
            Span::styled("[Enter] ", Style::default().fg(Color::Green).bold()),
            Span::styled("Complete  ", Style::default().fg(Color::DarkGray)),
            Span::styled("[Space] ", Style::default().fg(Color::DarkGray).bold()),
            Span::styled("Toggle  ", Style::default().fg(Color::DarkGray)),
            Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
            Span::styled("Back", Style::default().fg(Color::DarkGray)),
        ]))
    } else {
        Paragraph::new(Line::from(vec![
            Span::styled("[Space] ", Style::default().fg(Color::Cyan).bold()),
            Span::styled("Confirm  ", Style::default().fg(Color::DarkGray)),
            Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
            Span::styled("Back", Style::default().fg(Color::DarkGray)),
        ]))
    };
    frame.render_widget(controls, chunks[6]);
}
