pub mod detox_prompt;
pub mod help_overlay;
pub mod output_pane;
pub mod recent_runs;
pub mod search_bar;
pub mod status_bar;
pub mod tree;

use ratatui::{
    layout::{Constraint, Direction, Layout},
    Frame,
};

use crate::app::App;
use crate::app::types::*;
use crate::theme;

use self::detox_prompt::DetoxPrompt;
use self::help_overlay::HelpOverlay;
use self::output_pane::OutputPane;
use self::recent_runs::RecentRunsWidget;
use self::search_bar::SearchBar;
use self::status_bar::StatusBar;
use self::tree::{TestTree, TestTreeState};

/// Render the entire UI.
pub fn render(app: &App, frame: &mut Frame, tree_state: &mut TestTreeState) {
    let size = frame.area();

    // Clear background.
    frame.render_widget(
        ratatui::widgets::Block::default().style(
            ratatui::style::Style::default().bg(theme::BG),
        ),
        size,
    );

    // Main layout: content area + search bar (if searching) + status bar.
    let search_height = if app.input_mode == InputMode::Search { 1 } else { 0 };
    let main_layout = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Min(1),                  // Content
            Constraint::Length(search_height),    // Search bar (if searching)
            Constraint::Length(1),                // Status bar
        ])
        .split(size);

    let content_area = main_layout[0];
    let search_area = main_layout[1];
    let status_area = main_layout[2];

    // Content: left tree + right output.
    let content_layout = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage(35), // Tree
            Constraint::Percentage(65), // Output
        ])
        .split(content_area);

    let tree_area = content_layout[0];
    let output_area = content_layout[1];

    // Split tree area to include recent runs at top if there are any.
    let recent_height = recent_runs::required_height(&app.recent_runs);
    let tree_layout = if recent_height > 0 {
        Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(recent_height), // Recent runs
                Constraint::Min(1),                // Tree
            ])
            .split(tree_area)
    } else {
        Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(0),
                Constraint::Min(1),
            ])
            .split(tree_area)
    };

    let recent_area = tree_layout[0];
    let actual_tree_area = tree_layout[1];

    // Render recent runs.
    if recent_height > 0 {
        let recent = RecentRunsWidget {
            runs: &app.recent_runs,
        };
        frame.render_widget(recent, recent_area);
    }

    // Render the test tree.
    let test_tree = TestTree {
        nodes: &app.visible_nodes,
        cursor: app.cursor,
        pane_focused: app.pane_focus == PaneFocus::Tree,
    };
    frame.render_stateful_widget(test_tree, actual_tree_area, tree_state);

    // Render the output pane.
    let output_pane = OutputPane {
        live_output: &app.live_output,
        running_test: app.running_test.as_deref(),
        scroll: app.output_scroll,
        pane_focused: app.pane_focus == PaneFocus::Output,
        tick: app.tick_count,
    };
    frame.render_widget(output_pane, output_area);

    // Render the search bar if in search mode.
    if app.input_mode == InputMode::Search {
        let search = SearchBar {
            query: &app.search_query,
        };
        frame.render_widget(search, search_area);
    }

    // Render the status bar.
    let status = StatusBar {
        counts: &app.counts,
        input_mode: app.input_mode,
        search_query: &app.search_query,
    };
    frame.render_widget(status, status_area);

    // Render overlays.
    match app.input_mode {
        InputMode::Help => {
            frame.render_widget(HelpOverlay, size);
        }
        InputMode::DetoxPrompt => {
            let prompt = DetoxPrompt {
                selection: app.detox_prompt_selection,
            };
            frame.render_widget(prompt, size);
        }
        _ => {}
    }
}
