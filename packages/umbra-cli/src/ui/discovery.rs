//! Friend discovery opt-in screen.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph, Wrap};

use crate::app::App;
use super::centered_rect;

// ── DiscoveryOptIn ──────────────────────────────────────────────────────

pub fn render(frame: &mut Frame, app: &App) {
    let area = centered_rect(55, 55, frame.area());

    let block = Block::default()
        .title(" Friend Discovery ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Magenta));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(2), // Question
        Constraint::Length(1), // Spacer
        Constraint::Length(3), // Description
        Constraint::Length(1), // Spacer
        Constraint::Length(2), // Options
        Constraint::Length(1), // Spacer
        Constraint::Length(2), // Help text
        Constraint::Min(0),   // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // Question
    let question = Paragraph::new("Allow friends to find you on Umbra?")
        .style(Style::default().fg(Color::White));
    frame.render_widget(question, chunks[0]);

    // Description
    let description = Paragraph::new(vec![
        Line::from(Span::styled(
            "If enabled, people who have your",
            Style::default().fg(Color::DarkGray),
        )),
        Line::from(Span::styled(
            "linked accounts can discover you.",
            Style::default().fg(Color::DarkGray),
        )),
    ])
    .wrap(Wrap { trim: true });
    frame.render_widget(description, chunks[2]);

    // Options
    let yes_selected = app.discovery_choice;
    let no_selected = !app.discovery_choice;

    let options = Paragraph::new(vec![
        Line::from(vec![
            Span::styled(
                if yes_selected { " > " } else { "   " },
                Style::default().fg(if yes_selected {
                    Color::Green
                } else {
                    Color::DarkGray
                }),
            ),
            Span::styled(
                "[y] ",
                Style::default()
                    .fg(if yes_selected {
                        Color::Green
                    } else {
                        Color::DarkGray
                    })
                    .bold(),
            ),
            Span::styled(
                "Yes, make me discoverable",
                Style::default().fg(if yes_selected {
                    Color::White
                } else {
                    Color::DarkGray
                }),
            ),
        ]),
        Line::from(vec![
            Span::styled(
                if no_selected { " > " } else { "   " },
                Style::default().fg(if no_selected {
                    Color::Yellow
                } else {
                    Color::DarkGray
                }),
            ),
            Span::styled(
                "[n] ",
                Style::default()
                    .fg(if no_selected {
                        Color::Yellow
                    } else {
                        Color::DarkGray
                    })
                    .bold(),
            ),
            Span::styled(
                "No, stay private",
                Style::default().fg(if no_selected {
                    Color::White
                } else {
                    Color::DarkGray
                }),
            ),
        ]),
    ]);
    frame.render_widget(options, chunks[4]);

    // Help text
    let help = Paragraph::new("You can change this later in settings.")
        .style(Style::default().fg(Color::DarkGray))
        .wrap(Wrap { trim: true });
    frame.render_widget(help, chunks[6]);

    // Controls
    let controls = Paragraph::new(Line::from(vec![
        Span::styled("[Enter] ", Style::default().fg(Color::Magenta).bold()),
        Span::styled("Confirm  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Back", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(controls, chunks[8]);
}
