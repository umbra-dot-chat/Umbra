//! UI rendering module.
//!
//! Dispatches rendering to screen-specific modules based on
//! the current application state.

mod add_friend;
mod chat;
mod create;
mod discovery;
mod friend_requests;
mod import;
mod profile_import;
mod username;
mod welcome;

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, Paragraph};

use crate::app::{App, Screen};

/// Render the current screen.
pub fn render(frame: &mut Frame, app: &App) {
    match &app.screen {
        Screen::Welcome => welcome::render(frame, app),
        Screen::CreateName => create::render_name(frame, app),
        Screen::CreatePhrase { name, phrase } => create::render_phrase(frame, name, phrase),
        Screen::CreateConfirm { name: _, phrase: _ } => create::render_confirm(frame, app),
        Screen::ImportPhrase => import::render_phrase(frame, app),
        Screen::ImportName { .. } => import::render_name(frame, app),

        // Profile import screens
        Screen::ProfileImportSelect { .. } => profile_import::render_select(frame, app),
        Screen::ProfileImportLoading {
            platform,
            poll_count,
            ..
        } => profile_import::render_loading(frame, app, platform, *poll_count),
        Screen::ProfileImportSuccess {
            platform,
            platform_username,
            ..
        } => profile_import::render_success(frame, platform, platform_username),

        // Username screens
        Screen::UsernameRegister { .. } => username::render_register(frame, app),
        Screen::UsernameSuccess { username, .. } => username::render_success(frame, username),

        // Discovery screen
        Screen::DiscoveryOptIn { .. } => discovery::render(frame, app),

        // Chat screens
        Screen::Chat { .. } => chat::render(frame, app),
        Screen::AddFriend { .. } => add_friend::render(frame, app),
        Screen::FriendRequests { .. } => friend_requests::render(frame, app),
    }

    // Render error message overlay if present
    if let Some(ref msg) = app.error_message {
        render_error(frame, msg);
    }
}

/// Render an error message at the bottom of the screen.
fn render_error(frame: &mut Frame, message: &str) {
    let area = frame.area();
    let error_area = Rect {
        x: area.x + 2,
        y: area.height.saturating_sub(3),
        width: area.width.saturating_sub(4),
        height: 3,
    };

    let error = Paragraph::new(format!(" ! {message}"))
        .style(Style::default().fg(Color::White).bg(Color::Red))
        .block(Block::default().borders(Borders::ALL).border_style(
            Style::default().fg(Color::Red),
        ));

    frame.render_widget(error, error_area);
}

/// Helper to create a centered rect with percentage-based sizing.
pub fn centered_rect(percent_x: u16, percent_y: u16, area: Rect) -> Rect {
    let popup_layout = Layout::vertical([
        Constraint::Percentage((100 - percent_y) / 2),
        Constraint::Percentage(percent_y),
        Constraint::Percentage((100 - percent_y) / 2),
    ])
    .split(area);

    Layout::horizontal([
        Constraint::Percentage((100 - percent_x) / 2),
        Constraint::Percentage(percent_x),
        Constraint::Percentage((100 - percent_x) / 2),
    ])
    .split(popup_layout[1])[1]
}
