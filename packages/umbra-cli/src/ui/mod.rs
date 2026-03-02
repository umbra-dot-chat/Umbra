//! UI rendering module.
//!
//! Dispatches rendering to screen-specific modules based on
//! the current application state.

mod add_friend;
mod chat;
mod community_list;
mod community_members;
mod community_invites;
mod community_roles;
mod community_view;
mod join_community;
mod member_actions;
mod create;
mod create_community;
mod create_group;
mod discovery;
mod friend_requests;
mod home;
mod import;
mod tab_bar;
mod profile_import;
mod settings;
mod status_bar;
mod username;
mod welcome;

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, Paragraph};

use crate::app::{App, NavRoute, Screen};

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

        // Chat screens — three-column layout with nav rail
        Screen::Chat { .. } => render_chat_layout(frame, app),
        Screen::AddFriend { .. } => add_friend::render(frame, app),
        Screen::FriendRequests { .. } => friend_requests::render(frame, app),
        Screen::CreateGroup { .. } => create_group::render(frame, app),
        Screen::CreateCommunity { .. } => create_community::render(frame, app),
        Screen::CommunityMembers { .. } => community_members::render(frame, app),
        Screen::CommunityRoles { .. } => community_roles::render(frame, app),
        Screen::MemberActions { .. } => member_actions::render(frame, app),
        Screen::CommunityInvites { .. } => community_invites::render(frame, app),
        Screen::JoinCommunity { .. } => join_community::render(frame, app),
    }

    // Render error message overlay if present
    if let Some(ref msg) = app.error_message {
        render_error(frame, msg);
    }
}

/// Render the chat layout: TabBar | Sidebar + Main | Status bar.
fn render_chat_layout(frame: &mut Frame, app: &App) {
    let area = frame.area();

    // Vertical split: tab bar + content area + status bar
    let vert = Layout::vertical([
        Constraint::Length(1), // Tab bar
        Constraint::Min(5),   // Content area
        Constraint::Length(1), // Status bar
    ])
    .split(area);

    let tab_bar_area = vert[0];
    let content_area = vert[1];
    let status_area = vert[2];

    // Horizontal split: Sidebar | Main area
    let columns = Layout::horizontal([
        Constraint::Percentage(22), // Sidebar
        Constraint::Min(30),        // Main area
    ])
    .split(content_area);

    // Extract state from Chat screen
    let (info, focus, friends, selected_friend, active_conversation) = match &app.screen {
        Screen::Chat {
            info,
            focus,
            friends,
            selected_friend,
            active_conversation,
        } => (info, *focus, friends, *selected_friend, *active_conversation),
        _ => return,
    };

    // 1. Tab bar
    tab_bar::render(frame, app.nav_route, focus, tab_bar_area);

    // 2. Content based on route
    match app.nav_route {
        NavRoute::Home => {
            // Sidebar + Home content
            chat::render_sidebar(frame, app, focus, friends, selected_friend, columns[0]);
            home::render(frame, app, info, focus, columns[1]);
        }
        NavRoute::Messages => {
            // Sidebar + main area
            chat::render_sidebar(frame, app, focus, friends, selected_friend, columns[0]);
            chat::render_main_area(
                frame,
                app,
                info,
                focus,
                friends,
                active_conversation,
                columns[1],
            );
        }
        NavRoute::Communities => {
            // Community sidebar + channel content
            if app.active_community.is_some() {
                // Show channel tree sidebar and channel content
                community_view::render_channel_tree(frame, app, focus, columns[0]);
                community_view::render_channel_content(frame, app, focus, columns[1]);
            } else {
                // Show community list
                community_list::render(frame, app, focus, columns[0]);
                // Show welcome/empty state in main area
                render_community_welcome(frame, focus, columns[1]);
            }
        }
        NavRoute::Settings => {
            // Settings fills both sidebar + main area
            let settings_area = Rect {
                x: columns[0].x,
                y: columns[0].y,
                width: columns[0].width + columns[1].width,
                height: columns[0].height,
            };
            settings::render(frame, info, settings_area);
        }
    }

    // 3. Status bar
    let friend_count = friends.len();
    // Determine active context for status bar
    let active_context: Option<String> = if let Some(ref channel_name) = app.active_channel_name {
        let community_name = app.active_community.as_ref()
            .and_then(|cid| app.communities.iter().find(|c| c.id == *cid))
            .map(|c| c.name.as_str())
            .unwrap_or("?");
        Some(format!("{} > #{}", community_name, channel_name))
    } else if let Some(ref group_id) = app.active_group {
        app.groups.iter()
            .find(|g| g.id == *group_id)
            .map(|g| format!("Group: {}", g.name))
    } else if let Some(idx) = active_conversation {
        friends.get(idx).map(|f| {
            f.username.as_deref().unwrap_or(&f.display_name).to_string()
        })
    } else {
        None
    };
    status_bar::render(
        frame,
        app.relay_connected,
        &info.display_name,
        info.username.as_deref(),
        friend_count,
        0, // TODO: total unread from DB
        active_context.as_deref(),
        status_area,
    );
}

/// Render a welcome pane when no community is selected.
fn render_community_welcome(frame: &mut Frame, focus: crate::app::ChatFocus, area: Rect) {
    use ratatui::widgets::BorderType;

    let border_color = if focus == crate::app::ChatFocus::MainArea {
        Color::Magenta
    } else {
        Color::DarkGray
    };

    let block = Block::default()
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(border_color));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(3, 2));

    let chunks = Layout::vertical([
        Constraint::Length(2), // Header
        Constraint::Length(1), // Spacer
        Constraint::Length(3), // Description
        Constraint::Min(0),   // Spacer
        Constraint::Length(1), // Hint
    ])
    .split(inner);

    let header = Paragraph::new(Line::from(vec![
        Span::styled("Communities", Style::default().fg(Color::Magenta).bold()),
    ]));
    frame.render_widget(header, chunks[0]);

    let desc = Paragraph::new(vec![
        Line::from(Span::styled(
            "Select a community from the sidebar or",
            Style::default().fg(Color::DarkGray),
        )),
        Line::from(Span::styled(
            "press [n] to create a new one.",
            Style::default().fg(Color::DarkGray),
        )),
    ]);
    frame.render_widget(desc, chunks[2]);

    let hint = Paragraph::new(Line::from(vec![
        Span::styled("[Tab] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Switch pane  ", Style::default().fg(Color::DarkGray)),
        Span::styled("[Enter] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Open community", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(hint, chunks[4]);
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
