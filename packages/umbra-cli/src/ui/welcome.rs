//! Welcome screen — animated landing page with fade-in effect.
//!
//! The UMBRA logo fades in from scattered characters to solid white,
//! then remains static. Subtitle and menu fade in alongside.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph};

use crate::app::App;
use super::centered_rect;

// ── Animation timing (ticks, ~250ms each) ───────────────────────────────

const RESOLVE_TICKS: usize = 8; // ~2s fade-in transition

// ── Logo (35 chars wide × 5 lines) ─────────────────────────────────────

const LOGO_LINES: &[&str] = &[
    "██  ██ ██    ██ ████  ████    ████ ",
    "██  ██ ███  ███ ██ ██ ██  ██ ██  ██",
    "██  ██ ████████ ████  ████   ██████",
    "██  ██ ██ ██ ██ ██ ██ ██ ██  ██  ██",
    " ████  ██    ██ ████  ██  ██ ██  ██",
];

// ── Rain characters ─────────────────────────────────────────────────────

const RAIN_CHARS: &[char] = &[
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k',
    '!', '@', '#', '$', '%', '&', '*', '+', '=', '~',
    '<', '>', '{', '}', '[', ']', '|', '/', '\\', '^',
];

// ── Pseudo-random hash ──────────────────────────────────────────────────

/// Deterministic hash for consistent animation frames.
fn hash(seed: usize) -> usize {
    let h = seed.wrapping_mul(2654435761);
    (h ^ (h >> 16)).wrapping_mul(0x45d9f3b) ^ ((h ^ (h >> 16)).wrapping_mul(0x45d9f3b) >> 16)
}

/// Get a rain character for a given position and time.
fn rain_char_at(col: usize, row: usize, tick: usize) -> char {
    let idx = hash(
        col.wrapping_mul(1009)
            .wrapping_add(row.wrapping_mul(37))
            .wrapping_add((tick / 3).wrapping_mul(7)),
    );
    RAIN_CHARS[idx % RAIN_CHARS.len()]
}

// ── Safe cell writer ────────────────────────────────────────────────────

/// Set a cell in the buffer, no-op if out of bounds.
fn set_cell(buf: &mut Buffer, x: u16, y: u16, ch: char, style: Style) {
    let a = buf.area;
    if x >= a.x && x < a.x + a.width && y >= a.y && y < a.y + a.height {
        if let Some(cell) = buf.cell_mut((x, y)) {
            cell.set_char(ch).set_style(style);
        }
    }
}

// ── Logo position helper ────────────────────────────────────────────────

/// Get the logo character at a given screen position, or None if outside the logo.
fn logo_char_at(x: u16, y: u16, logo_x: u16, logo_y: u16) -> Option<char> {
    if x < logo_x || y < logo_y {
        return None;
    }
    let lx = (x - logo_x) as usize;
    let ly = (y - logo_y) as usize;
    if ly >= LOGO_LINES.len() {
        return None;
    }
    LOGO_LINES[ly].chars().nth(lx)
}

/// Calculate logo origin for centering within an area.
fn logo_origin(area: Rect) -> (u16, u16) {
    let logo_w = LOGO_LINES[0].chars().count() as u16;
    let logo_h = LOGO_LINES.len() as u16;
    let x = area.x + area.width.saturating_sub(logo_w) / 2;
    let y = area.y + area.height.saturating_sub(logo_h) / 2;
    (x, y)
}

// ── Main render ─────────────────────────────────────────────────────────

pub fn render(frame: &mut Frame, app: &App) {
    let area = centered_rect(60, 75, frame.area());

    let outer_block = Block::default()
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::DarkGray));
    frame.render_widget(outer_block, area);

    let inner = area.inner(Margin::new(2, 1));

    let chunks = Layout::vertical([
        Constraint::Length(7), // Logo area (5 lines + vertical padding)
        Constraint::Length(2), // Subtitle
        Constraint::Length(1), // Spacer
        Constraint::Length(7), // Menu
        Constraint::Min(0),   // Spacer
        Constraint::Length(1), // Footer
    ])
    .split(inner);

    let tick = app.welcome_tick;

    // ── Logo area — fade in then hold solid white ──────────────────
    if tick < RESOLVE_TICKS {
        let progress = tick as f64 / RESOLVE_TICKS as f64;
        render_resolve(frame, chunks[0], tick, progress);
    } else {
        render_logo_static(frame, chunks[0]);
    }

    // ── Subtitle — fades in during resolve ──────────────────────────
    let opacity = (tick as f64 / RESOLVE_TICKS as f64).min(1.0);
    render_subtitle(frame, chunks[1], opacity);

    // ── Menu — fades in during second half of resolve ───────────────
    let menu_start = RESOLVE_TICKS / 2;
    if tick >= menu_start {
        let opacity =
            ((tick - menu_start) as f64 / (RESOLVE_TICKS - menu_start) as f64).min(1.0);
        render_menu(frame, chunks[3], opacity);
    }

    // ── Footer — always visible ─────────────────────────────────────
    render_footer(frame, chunks[5]);
}

// ── Phase 1: Resolve (scattered chars → logo) ──────────────────────────

fn render_resolve(frame: &mut Frame, area: Rect, tick: usize, progress: f64) {
    let buf = frame.buffer_mut();
    let (logo_x, logo_y) = logo_origin(area);

    // Wave front sweeps left → right across the area
    let wave = progress * (area.width as f64 + 10.0) - 5.0;

    for cx in 0..area.width {
        let x = area.x + cx;
        let col = cx as usize;
        let col_progress = wave - col as f64;

        for ry in 0..area.height {
            let y = area.y + ry;

            // Check if this cell corresponds to a logo character
            let logo_ch = logo_char_at(x, y, logo_x, logo_y);

            match logo_ch {
                Some(ch) if ch != ' ' && col_progress > 0.0 => {
                    // This position has resolved — show the logo character
                    let brightness = (col_progress * 80.0).min(255.0) as u8;
                    let style = Style::default()
                        .fg(Color::Rgb(brightness, brightness, brightness))
                        .bold();
                    set_cell(buf, x, y, ch, style);
                }
                _ => {
                    // Still rain, fading out as progress increases
                    let fade = (1.0 - progress * 0.8).max(0.0);
                    if fade > 0.05 {
                        let ch = rain_char_at(col, ry as usize, tick);
                        let g = (fade * 120.0) as u8;
                        if g > 10 {
                            set_cell(
                                buf,
                                x,
                                y,
                                ch,
                                Style::default().fg(Color::Rgb(0, g, 0)),
                            );
                        }
                    }
                }
            }
        }
    }
}

// ── Static logo (solid white) ────────────────────────────────────────────

fn render_logo_static(frame: &mut Frame, area: Rect) {
    let buf = frame.buffer_mut();
    let (logo_x, logo_y) = logo_origin(area);
    let style = Style::default().fg(Color::White).bold();

    for (row_idx, line) in LOGO_LINES.iter().enumerate() {
        let y = logo_y + row_idx as u16;
        if y >= area.bottom() {
            break;
        }

        for (col_idx, ch) in line.chars().enumerate() {
            let x = logo_x + col_idx as u16;
            if x >= area.right() || ch == ' ' {
                continue;
            }
            set_cell(buf, x, y, ch, style);
        }
    }
}

// ── Subtitle ────────────────────────────────────────────────────────────

fn render_subtitle(frame: &mut Frame, area: Rect, opacity: f64) {
    let gray = (opacity * 128.0) as u8;
    let subtitle = Paragraph::new("Encrypted P2P Chat  ·  Terminal")
        .alignment(Alignment::Center)
        .style(Style::default().fg(Color::Rgb(gray, gray, gray)));
    frame.render_widget(subtitle, area);
}

// ── Menu ────────────────────────────────────────────────────────────────

fn render_menu(frame: &mut Frame, area: Rect, opacity: f64) {
    let border_g = (opacity * 80.0) as u8;
    let cyan_v = (opacity * 255.0) as u8;
    let white_v = (opacity * 255.0) as u8;
    let dim_v = (opacity * 128.0) as u8;

    let menu_block = Block::default()
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Rgb(border_g, border_g, border_g)));

    let menu_text = vec![
        Line::from(""),
        Line::from(vec![
            Span::styled(
                "  [1] ",
                Style::default()
                    .fg(Color::Rgb(0, cyan_v, cyan_v))
                    .bold(),
            ),
            Span::styled(
                "Create New Identity",
                Style::default().fg(Color::Rgb(white_v, white_v, white_v)),
            ),
        ]),
        Line::from(vec![
            Span::styled(
                "  [2] ",
                Style::default()
                    .fg(Color::Rgb(0, cyan_v, cyan_v))
                    .bold(),
            ),
            Span::styled(
                "Import Existing Identity",
                Style::default().fg(Color::Rgb(white_v, white_v, white_v)),
            ),
        ]),
        Line::from(""),
        Line::from(vec![
            Span::styled(
                "  [q] ",
                Style::default()
                    .fg(Color::Rgb(dim_v, dim_v, dim_v))
                    .bold(),
            ),
            Span::styled(
                "Quit",
                Style::default().fg(Color::Rgb(dim_v, dim_v, dim_v)),
            ),
        ]),
    ];

    let menu = Paragraph::new(menu_text).block(menu_block);
    frame.render_widget(menu, area);
}

// ── Footer ──────────────────────────────────────────────────────────────

fn render_footer(frame: &mut Frame, area: Rect) {
    let version = umbra_core::version();
    let footer = Paragraph::new(format!("v{version}  ·  umbra.chat"))
        .alignment(Alignment::Center)
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(footer, area);
}
