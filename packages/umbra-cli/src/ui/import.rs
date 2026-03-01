//! Import identity flow — enter 24 recovery words, then display name.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph, Wrap};
use umbra_core::identity::RecoveryPhrase;

use crate::app::App;
use super::centered_rect;

// ── ImportPhrase ───────────────────────────────────────────────────────

pub fn render_phrase(frame: &mut Frame, app: &App) {
    let area = centered_rect(70, 80, frame.area());

    let block = Block::default()
        .title(" Import Identity ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Magenta));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(2), // Prompt
        Constraint::Length(1), // Spacer
        Constraint::Min(10),  // Word grid
        Constraint::Length(1), // Spacer
        Constraint::Length(2), // Suggestions
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // Prompt
    let prompt = Paragraph::new("Enter your 24-word recovery phrase:")
        .style(Style::default().fg(Color::White));
    frame.render_widget(prompt, chunks[0]);

    // Word grid — 3 columns x 8 rows
    let cols = 3;
    let grid_area = chunks[2];
    let col_width = grid_area.width / cols as u16;

    let mut cursor_x: u16 = 0;
    let mut cursor_y: u16 = 0;

    for i in 0..24 {
        let col = i / 8;
        let row = i % 8;

        let x = grid_area.x + col as u16 * col_width;
        let y = grid_area.y + row as u16;

        if y >= grid_area.y + grid_area.height {
            continue;
        }

        let word = &app.word_inputs[i];
        let is_active = i == app.active_word;
        let is_valid = !word.is_empty() && RecoveryPhrase::is_valid_word(word.trim());
        let is_filled = !word.trim().is_empty();

        let num_style = if is_active {
            Style::default().fg(Color::Cyan).bold()
        } else {
            Style::default().fg(Color::DarkGray)
        };

        let word_style = if is_active {
            Style::default().fg(Color::White).bold()
        } else if is_filled && is_valid {
            Style::default().fg(Color::Green)
        } else if is_filled && !is_valid {
            Style::default().fg(Color::Red)
        } else {
            Style::default().fg(Color::DarkGray)
        };

        let num = format!("{:>2}. ", i + 1);
        let display_word = if word.is_empty() && !is_active {
            "........".to_string()
        } else {
            format!("{:<10}", word)
        };

        let bracket_style = if is_active {
            Style::default().fg(Color::Cyan)
        } else if is_filled {
            Style::default().fg(Color::DarkGray)
        } else {
            Style::default().fg(Color::DarkGray)
        };

        let line = Line::from(vec![
            Span::styled(num, num_style),
            Span::styled("[", bracket_style),
            Span::styled(display_word.clone(), word_style),
            Span::styled("]", bracket_style),
        ]);

        let word_rect = Rect {
            x,
            y,
            width: col_width,
            height: 1,
        };
        frame.render_widget(Paragraph::new(line), word_rect);

        // Track cursor position for the active word
        if is_active {
            cursor_x = x + 4 + 1 + word.len() as u16; // num + "[" + word chars
            cursor_y = y;
        }
    }

    // Set cursor at the active word input
    frame.set_cursor_position(Position::new(cursor_x, cursor_y));

    // Suggestions — show autocomplete hints for the current word
    let current_word = &app.word_inputs[app.active_word];
    let suggestions_area = chunks[4];

    if !current_word.is_empty() && current_word.len() >= 2 {
        let suggestions = RecoveryPhrase::suggest_words(current_word);
        if !suggestions.is_empty() {
            let suggestion_spans: Vec<Span> = suggestions
                .iter()
                .take(6)
                .enumerate()
                .flat_map(|(i, word)| {
                    let mut spans = vec![Span::styled(
                        *word,
                        Style::default().fg(Color::DarkGray),
                    )];
                    if i < suggestions.len().min(6) - 1 {
                        spans.push(Span::raw("  "));
                    }
                    spans
                })
                .collect();

            let suggestions_line = Line::from(suggestion_spans);
            let suggestions_para = Paragraph::new(suggestions_line);
            frame.render_widget(suggestions_para, suggestions_area);
        }
    }

    // Controls
    let filled_count = app.word_inputs.iter().filter(|w| !w.trim().is_empty()).count();
    let controls = Paragraph::new(Line::from(vec![
        Span::styled("[Tab] ", Style::default().fg(Color::Cyan).bold()),
        Span::styled("Next  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[Shift+Tab] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Prev  ", Style::default().fg(Color::DarkGray)),
        if filled_count == 24 {
            Span::styled("[Enter] ", Style::default().fg(Color::Green).bold())
        } else {
            Span::styled("[Enter] ", Style::default().fg(Color::DarkGray).bold())
        },
        Span::styled(
            format!("Submit ({filled_count}/24)  "),
            Style::default().fg(Color::DarkGray),
        ),
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Back", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(controls, chunks[5]);
}

// ── ImportName ─────────────────────────────────────────────────────────

pub fn render_name(frame: &mut Frame, app: &App) {
    let area = centered_rect(50, 50, frame.area());

    let block = Block::default()
        .title(" Import Identity ")
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Magenta));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(2), // Info
        Constraint::Length(1), // Spacer
        Constraint::Length(1), // Prompt
        Constraint::Length(3), // Input box
        Constraint::Length(2), // Help text
        Constraint::Min(0),   // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // Info
    let info = Paragraph::new(Span::styled(
        "Recovery phrase validated successfully!",
        Style::default().fg(Color::Green),
    ));
    frame.render_widget(info, chunks[0]);

    // Prompt
    let prompt = Paragraph::new("Enter a display name for this identity:")
        .style(Style::default().fg(Color::White));
    frame.render_widget(prompt, chunks[2]);

    // Input box
    let input_block = Block::default()
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Magenta));

    let input_text = Paragraph::new(app.input.as_str())
        .style(Style::default().fg(Color::White))
        .block(input_block);
    frame.render_widget(input_text, chunks[3]);

    // Cursor
    let cursor_x = chunks[3].x + 1 + app.cursor_pos as u16;
    let cursor_y = chunks[3].y + 1;
    frame.set_cursor_position(Position::new(cursor_x, cursor_y));

    // Help text
    let help = Paragraph::new("This name is shown to your contacts. You can change it later.")
        .style(Style::default().fg(Color::DarkGray))
        .wrap(Wrap { trim: true });
    frame.render_widget(help, chunks[4]);

    // Controls
    let controls = Paragraph::new(Line::from(vec![
        Span::styled("[Enter] ", Style::default().fg(Color::Magenta).bold()),
        Span::styled("Import  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Back", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(controls, chunks[6]);
}
