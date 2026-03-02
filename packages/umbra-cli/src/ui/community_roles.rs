//! Community roles dialog — shows the role list of a community.

use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, BorderType, Paragraph};

use crate::app::{App, Screen};
use super::centered_rect;

pub fn render(frame: &mut Frame, app: &App) {
    let (community_name, roles, selected_role) = match &app.screen {
        Screen::CommunityRoles {
            community_name,
            roles,
            selected_role,
            ..
        } => (community_name, roles, *selected_role),
        _ => return,
    };

    let area = centered_rect(50, 65, frame.area());

    let title = format!(" {} \u{2014} Roles ", community_name);
    let block = Block::default()
        .title(title)
        .title_alignment(Alignment::Left)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Magenta));
    frame.render_widget(block, area);

    let inner = area.inner(Margin::new(2, 2));

    let chunks = Layout::vertical([
        Constraint::Length(1), // Role count
        Constraint::Length(1), // Separator
        Constraint::Min(5),   // Role list
        Constraint::Length(1), // Spacer
        Constraint::Length(1), // Controls
    ])
    .split(inner);

    // ── Role count ─────────────────────────────────────────────────────
    let count_text = format!("{} role{}", roles.len(), if roles.len() != 1 { "s" } else { "" });
    let count = Paragraph::new(Line::from(Span::styled(
        count_text,
        Style::default().fg(Color::Magenta).bold(),
    )));
    frame.render_widget(count, chunks[0]);

    // ── Separator ──────────────────────────────────────────────────────
    let sep_width = chunks[1].width as usize;
    let separator = Paragraph::new("\u{2500}".repeat(sep_width))
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(separator, chunks[1]);

    // ── Role list ──────────────────────────────────────────────────────
    if roles.is_empty() {
        let empty = Paragraph::new(vec![
            Line::from(""),
            Line::from(Span::styled(
                "  No roles found",
                Style::default().fg(Color::DarkGray),
            )),
        ]);
        frame.render_widget(empty, chunks[2]);
    } else {
        let max_visible = chunks[2].height as usize;
        let mut lines = Vec::new();

        let scroll_offset = if selected_role >= max_visible {
            selected_role - max_visible + 1
        } else {
            0
        };

        for (i, role) in roles.iter().enumerate().skip(scroll_offset) {
            if lines.len() >= max_visible {
                break;
            }

            let is_cursor = i == selected_role;
            let prefix = if is_cursor { " > " } else { "   " };
            let prefix_style = if is_cursor {
                Style::default().fg(Color::Magenta)
            } else {
                Style::default().fg(Color::DarkGray)
            };

            // Determine role color
            let role_color = match role.color.as_deref() {
                Some("Cyan") => Color::Cyan,
                Some("Green") => Color::Green,
                Some("Yellow") => Color::Yellow,
                Some("Red") => Color::Red,
                Some("Blue") => Color::Blue,
                Some("Magenta") => Color::Magenta,
                _ => Color::White,
            };

            let name_style = if is_cursor {
                Style::default().fg(role_color).bold()
            } else {
                Style::default().fg(role_color)
            };

            // Show position and a brief permission summary
            let perm_summary = format_permissions_brief(role.permissions);
            let info = format!("  [pos:{}] {}", role.position, perm_summary);

            lines.push(Line::from(vec![
                Span::styled(prefix, prefix_style),
                Span::styled(&role.name, name_style),
                Span::styled(info, Style::default().fg(Color::DarkGray)),
            ]));
        }

        frame.render_widget(Paragraph::new(lines), chunks[2]);
    }

    // ── Controls ───────────────────────────────────────────────────────
    let controls = Paragraph::new(Line::from(vec![
        Span::styled("[Esc] ", Style::default().fg(Color::DarkGray).bold()),
        Span::styled("Back", Style::default().fg(Color::DarkGray)),
    ]));
    frame.render_widget(controls, chunks[4]);
}

/// Format a brief summary of permissions from the bitfield.
fn format_permissions_brief(permissions: i64) -> String {
    if permissions == i64::MAX {
        return "All permissions".to_string();
    }

    let mut perms = Vec::new();
    // Check key permission bits (aligned with umbra-core Permission enum)
    if permissions & (1 << 0) != 0 { perms.push("View"); }
    if permissions & (1 << 11) != 0 { perms.push("Send"); }
    if permissions & (1 << 14) != 0 { perms.push("React"); }
    if permissions & (1 << 3) != 0 { perms.push("Manage"); }
    if permissions & (1 << 4) != 0 { perms.push("Kick"); }
    if permissions & (1 << 5) != 0 { perms.push("Ban"); }

    if perms.is_empty() {
        "No permissions".to_string()
    } else {
        perms.join(", ")
    }
}
