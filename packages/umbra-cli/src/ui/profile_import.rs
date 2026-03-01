//! Profile import flow — select platform, loading spinner, success display.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph, Wrap};

use crate::app::{App, PLATFORMS};
use super::centered_rect;

// ── Spinner characters ──────────────────────────────────────────────────

const SPINNER: &[char] = &['◐', '◓', '◑', '◒'];

// ── ProfileImportSelect ─────────────────────────────────────────────────

pub fn render_select(frame: &mut Frame, app: &App) {
    let area = centered_rect(55, 60, frame.area());

    let block = Block::default()
        .title(" Link Account ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Blue));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(2), // Prompt
        Constraint::Length(1), // Spacer
        Constraint::Length(6), // Platform list
        Constraint::Length(1), // Spacer
        Constraint::Length(3), // Help text
        Constraint::Min(0),   // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // Prompt
    let prompt = Paragraph::new("Import your profile from:")
        .style(Style::default().fg(Color::White));
    frame.render_widget(prompt, chunks[0]);

    // Platform list
    let platform_area = chunks[2];
    for (i, (_, name)) in PLATFORMS.iter().enumerate() {
        let is_selected = i == app.selected_platform;

        let prefix = if is_selected { " > " } else { "   " };
        let num = format!("[{}] ", i + 1);

        let line = Line::from(vec![
            Span::styled(
                prefix,
                Style::default().fg(if is_selected {
                    Color::Cyan
                } else {
                    Color::DarkGray
                }),
            ),
            Span::styled(
                num,
                Style::default()
                    .fg(if is_selected {
                        Color::Cyan
                    } else {
                        Color::DarkGray
                    })
                    .bold(),
            ),
            Span::styled(
                *name,
                Style::default().fg(if is_selected {
                    Color::White
                } else {
                    Color::DarkGray
                }),
            ),
        ]);

        let y = platform_area.y + i as u16;
        if y < platform_area.y + platform_area.height {
            let rect = Rect {
                x: platform_area.x,
                y,
                width: platform_area.width,
                height: 1,
            };
            frame.render_widget(Paragraph::new(line), rect);
        }
    }

    // Help text
    let help = Paragraph::new(vec![
        Line::from(Span::styled(
            "This imports your username & avatar.",
            Style::default().fg(Color::DarkGray),
        )),
        Line::from(Span::styled(
            "Opens your browser to sign in.",
            Style::default().fg(Color::DarkGray),
        )),
    ])
    .wrap(Wrap { trim: true });
    frame.render_widget(help, chunks[4]);

    // Controls
    let controls = Paragraph::new(Line::from(vec![
        Span::styled("[Enter] ", Style::default().fg(Color::Blue).bold()),
        Span::styled("Connect  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[s] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Skip  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Back", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(controls, chunks[6]);
}

// ── ProfileImportLoading ────────────────────────────────────────────────

pub fn render_loading(frame: &mut Frame, app: &App, platform: &str, poll_count: u16) {
    let area = centered_rect(55, 50, frame.area());

    let block = Block::default()
        .title(" Link Account ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Blue));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(2), // Status
        Constraint::Length(1), // Spacer
        Constraint::Length(2), // Spinner + progress
        Constraint::Length(1), // Spacer
        Constraint::Length(3), // Help text
        Constraint::Min(0),   // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // Status
    let platform_name = PLATFORMS
        .iter()
        .find(|(id, _)| *id == platform)
        .map(|(_, name)| *name)
        .unwrap_or(platform);

    let status = Paragraph::new(format!("Connecting to {platform_name}..."))
        .style(Style::default().fg(Color::White));
    frame.render_widget(status, chunks[0]);

    // Spinner + progress
    let spinner_char = SPINNER[app.spinner_frame % SPINNER.len()];
    let spinner_text = vec![
        Line::from(vec![
            Span::styled(
                format!("{spinner_char} "),
                Style::default().fg(Color::Cyan),
            ),
            Span::styled(
                "Waiting for browser sign-in",
                Style::default().fg(Color::DarkGray),
            ),
        ]),
        Line::from(Span::styled(
            format!("  (attempt {poll_count}/60)"),
            Style::default().fg(Color::DarkGray),
        )),
    ];
    frame.render_widget(Paragraph::new(spinner_text), chunks[2]);

    // Help text
    let help = Paragraph::new(vec![
        Line::from(Span::styled(
            "A browser window should have opened.",
            Style::default().fg(Color::DarkGray),
        )),
        Line::from(Span::styled(
            "Complete the sign-in there.",
            Style::default().fg(Color::DarkGray),
        )),
    ])
    .wrap(Wrap { trim: true });
    frame.render_widget(help, chunks[4]);

    // Controls
    let controls = Paragraph::new(Line::from(vec![
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Cancel", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(controls, chunks[6]);
}

// ── ProfileImportSuccess ────────────────────────────────────────────────

pub fn render_success(frame: &mut Frame, platform: &str, platform_username: &str) {
    let area = centered_rect(55, 45, frame.area());

    let block = Block::default()
        .title(" Link Account ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Green));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(2), // Success message
        Constraint::Length(1), // Spacer
        Constraint::Length(1), // Username
        Constraint::Min(0),   // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    let platform_name = PLATFORMS
        .iter()
        .find(|(id, _)| *id == platform)
        .map(|(_, name)| *name)
        .unwrap_or(platform);

    // Success message
    let success = Paragraph::new(format!("✓ {platform_name} connected!"))
        .style(Style::default().fg(Color::Green));
    frame.render_widget(success, chunks[0]);

    // Username
    let username_line = Paragraph::new(Line::from(vec![
        Span::styled("Username: ", Style::default().fg(Color::DarkGray)),
        Span::styled(
            platform_username,
            Style::default().fg(Color::White).bold(),
        ),
    ]));
    frame.render_widget(username_line, chunks[2]);

    // Controls
    let controls = Paragraph::new(Line::from(vec![
        Span::styled("[Enter] ", Style::default().fg(Color::Green).bold()),
        Span::styled("Continue  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Back", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(controls, chunks[4]);
}
