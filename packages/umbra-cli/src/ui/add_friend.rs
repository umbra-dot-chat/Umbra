//! Add friend dialog — search by username or DID, browse results, add.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph};

use crate::app::App;
use super::centered_rect;

// ── Spinner frames ──────────────────────────────────────────────────────

const SPINNER: &[&str] = &["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

pub fn render(frame: &mut Frame, app: &App) {
    let area = centered_rect(55, 55, frame.area());

    let block = Block::default()
        .title(" Add Friend ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Magenta));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    if !app.search_results.is_empty() {
        render_results(frame, app, inner);
    } else if app.searching {
        render_searching(frame, app, inner);
    } else {
        render_input(frame, app, inner);
    }
}

// ── Input mode (no results yet) ─────────────────────────────────────────

fn render_input(frame: &mut Frame, app: &App, area: Rect) {
    let chunks = Layout::vertical([
        Constraint::Length(2), // Prompt
        Constraint::Length(1), // Spacer
        Constraint::Length(3), // Input box
        Constraint::Length(1), // Spacer
        Constraint::Length(2), // Help text
        Constraint::Min(0),   // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(area);

    // Prompt
    let prompt = Paragraph::new("Search by username or DID:")
        .style(Style::default().fg(Color::White));
    frame.render_widget(prompt, chunks[0]);

    // Input box
    let input_block = Block::default()
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Magenta));
    let input_text = Paragraph::new(app.input.as_str())
        .style(Style::default().fg(Color::Cyan))
        .block(input_block);
    frame.render_widget(input_text, chunks[2]);

    // Place cursor inside the input box
    frame.set_cursor_position(Position::new(
        chunks[2].x + 1 + app.cursor_pos as u16,
        chunks[2].y + 1,
    ));

    // Help text
    let help = Paragraph::new(vec![Line::from(Span::styled(
        "e.g. Alice#01234 or did:key:z6Mk...",
        Style::default().fg(Color::DarkGray),
    ))]);
    frame.render_widget(help, chunks[4]);

    // Controls
    let controls = Paragraph::new(Line::from(vec![
        Span::styled("[Enter] ", Style::default().fg(Color::Magenta).bold()),
        Span::styled("Search  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Back", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(controls, chunks[6]);
}

// ── Searching spinner ───────────────────────────────────────────────────

fn render_searching(frame: &mut Frame, app: &App, area: Rect) {
    let chunks = Layout::vertical([
        Constraint::Min(0),
        Constraint::Length(1),
        Constraint::Min(0),
    ])
    .split(area);

    let spinner = SPINNER[app.spinner_frame % SPINNER.len()];
    let text = Paragraph::new(Line::from(vec![
        Span::styled(
            format!("{spinner} "),
            Style::default().fg(Color::Magenta),
        ),
        Span::styled(
            format!("Searching for \"{}\"...", app.input),
            Style::default().fg(Color::DarkGray),
        ),
    ]))
    .alignment(Alignment::Center);
    frame.render_widget(text, chunks[1]);
}

// ── Results mode ────────────────────────────────────────────────────────

fn render_results(frame: &mut Frame, app: &App, area: Rect) {
    let chunks = Layout::vertical([
        Constraint::Length(2), // Header
        Constraint::Length(1), // Spacer
        Constraint::Min(3),    // Results list
        Constraint::Length(1), // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(area);

    // Header
    let count = app.search_results.len();
    let header = Paragraph::new(Line::from(vec![
        Span::styled(
            format!("{count} result{}", if count == 1 { "" } else { "s" }),
            Style::default().fg(Color::White),
        ),
        Span::styled(
            format!(" for \"{}\":", app.input),
            Style::default().fg(Color::DarkGray),
        ),
    ]));
    frame.render_widget(header, chunks[0]);

    // Results list
    let max_visible = chunks[2].height as usize;
    let mut lines = Vec::new();

    for (i, result) in app.search_results.iter().enumerate() {
        if lines.len() >= max_visible {
            break;
        }

        let is_selected = i == app.selected_result;
        let prefix = if is_selected { " > " } else { "   " };

        // Build display: username (or DID if no username)
        let display_name = result
            .username
            .as_deref()
            .unwrap_or("(no username)");

        // Truncate DID for display
        let did_short = if result.did.len() > 24 {
            format!("{}...", &result.did[..24])
        } else {
            result.did.clone()
        };

        let name_style = if is_selected {
            Style::default().fg(Color::Cyan).bold()
        } else {
            Style::default().fg(Color::White)
        };

        let line = Line::from(vec![
            Span::styled(
                prefix,
                Style::default().fg(if is_selected {
                    Color::Cyan
                } else {
                    Color::DarkGray
                }),
            ),
            Span::styled(display_name, name_style),
            Span::styled("  ", Style::default()),
            Span::styled(
                did_short,
                Style::default().fg(Color::DarkGray),
            ),
        ]);
        lines.push(line);
    }

    let list = Paragraph::new(lines);
    frame.render_widget(list, chunks[2]);

    // Controls
    let controls = Paragraph::new(Line::from(vec![
        Span::styled("[Enter] ", Style::default().fg(Color::Magenta).bold()),
        Span::styled("Send Request  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[↑↓] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Navigate  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Back", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(controls, chunks[4]);
}
