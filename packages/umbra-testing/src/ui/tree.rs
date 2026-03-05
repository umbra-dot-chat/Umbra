use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::{Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Padding, StatefulWidget, Widget},
};

use crate::app::types::*;
use crate::theme;

/// Widget to render the test tree in the left pane.
pub struct TestTree<'a> {
    pub nodes: &'a [FlatNode],
    pub cursor: usize,
    pub pane_focused: bool,
}

/// State for the tree widget (scroll offset).
pub struct TestTreeState {
    pub offset: usize,
}

impl Default for TestTreeState {
    fn default() -> Self {
        Self { offset: 0 }
    }
}

impl<'a> StatefulWidget for TestTree<'a> {
    type State = TestTreeState;

    fn render(self, area: Rect, buf: &mut Buffer, state: &mut Self::State) {
        // Draw border.
        let border_style = if self.pane_focused {
            Style::default().fg(theme::MAUVE)
        } else {
            Style::default().fg(theme::SURFACE1)
        };

        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(border_style)
            .title(" Tests ")
            .title_style(Style::default().fg(theme::TEXT).add_modifier(Modifier::BOLD))
            .style(Style::default().bg(theme::BG))
            .padding(Padding::new(1, 1, 0, 0));

        let inner = block.inner(area);
        block.render(area, buf);

        if self.nodes.is_empty() {
            let msg = Line::from(Span::styled(
                "No tests found",
                Style::default().fg(theme::OVERLAY0),
            ));
            buf.set_line(inner.x, inner.y, &msg, inner.width);
            return;
        }

        // Ensure cursor is visible by adjusting scroll offset.
        let visible_height = inner.height as usize;
        if self.cursor < state.offset {
            state.offset = self.cursor;
        } else if self.cursor >= state.offset + visible_height {
            state.offset = self.cursor - visible_height + 1;
        }

        // Render visible rows.
        for (i, row_idx) in (state.offset..self.nodes.len())
            .take(visible_height)
            .enumerate()
        {
            let node = &self.nodes[row_idx];
            let y = inner.y + i as u16;
            let is_cursor = row_idx == self.cursor;

            let line = render_tree_line(node, is_cursor);

            // Background for cursor row.
            if is_cursor && self.pane_focused {
                let bg_style = Style::default().bg(theme::CURSOR_BG);
                for x in inner.x..inner.x + inner.width {
                    buf.set_style(Rect::new(x, y, 1, 1), bg_style);
                }
            }

            buf.set_line(inner.x, y, &line, inner.width);
        }
    }
}

/// Render a single tree line with indentation, expand icon, selection, status, and label.
fn render_tree_line(node: &FlatNode, _is_cursor: bool) -> Line<'static> {
    let mut spans: Vec<Span> = Vec::new();

    // Indentation.
    let indent = "  ".repeat(node.depth);
    spans.push(Span::raw(indent));

    // Expand/collapse indicator.
    if node.has_children {
        let arrow = if node.expanded { "▾ " } else { "▸ " };
        spans.push(Span::styled(
            arrow.to_string(),
            Style::default().fg(theme::OVERLAY1),
        ));
    } else {
        spans.push(Span::raw("  "));
    }

    // Selection checkbox — shown for ALL node types.
    match &node.kind {
        NodeKind::TestFile { .. } | NodeKind::RustPackage { .. } => {
            if node.selected {
                spans.push(Span::styled(
                    "[✓] ",
                    Style::default().fg(theme::SELECTED),
                ));
            } else {
                spans.push(Span::styled(
                    "[ ] ",
                    Style::default().fg(theme::SURFACE2),
                ));
            }
        }
        NodeKind::Category(_) | NodeKind::Folder => {
            if node.total_tests > 0 && node.selected_tests == node.total_tests {
                // All children selected.
                spans.push(Span::styled(
                    "[✓] ",
                    Style::default().fg(theme::SELECTED),
                ));
            } else if node.selected_tests > 0 {
                // Some children selected.
                spans.push(Span::styled(
                    "[◆] ",
                    Style::default().fg(theme::YELLOW),
                ));
            } else {
                spans.push(Span::styled(
                    "[ ] ",
                    Style::default().fg(theme::SURFACE2),
                ));
            }
        }
    }

    // Status icon for test nodes.
    match node.status {
        TestStatus::Idle => {}
        status => {
            let (icon, color) = match status {
                TestStatus::Passed => (status.icon(), theme::PASSED),
                TestStatus::Failed => (status.icon(), theme::FAILED),
                TestStatus::Running => (status.icon(), theme::RUNNING),
                TestStatus::Queued => (status.icon(), theme::QUEUED),
                TestStatus::Cancelled => (status.icon(), theme::OVERLAY0),
                TestStatus::Idle => unreachable!(),
            };
            spans.push(Span::styled(
                format!("{} ", icon),
                Style::default().fg(color),
            ));
        }
    }

    // Label.
    let label_style = match &node.kind {
        NodeKind::Category(TestType::Detox) => {
            Style::default()
                .fg(theme::CATEGORY_DETOX)
                .add_modifier(Modifier::BOLD)
        }
        NodeKind::Category(TestType::Playwright) => {
            Style::default()
                .fg(theme::CATEGORY_PLAYWRIGHT)
                .add_modifier(Modifier::BOLD)
        }
        NodeKind::Category(TestType::Jest) => {
            Style::default()
                .fg(theme::CATEGORY_JEST)
                .add_modifier(Modifier::BOLD)
        }
        NodeKind::Category(TestType::Rust) => {
            Style::default()
                .fg(theme::CATEGORY_RUST)
                .add_modifier(Modifier::BOLD)
        }
        NodeKind::Folder => Style::default().fg(theme::SUBTEXT1).add_modifier(Modifier::BOLD),
        NodeKind::TestFile { .. } | NodeKind::RustPackage { .. } => {
            Style::default().fg(theme::TEXT)
        }
    };

    spans.push(Span::styled(node.label.clone(), label_style));

    // Show test count for categories and folders.
    if node.has_children && node.total_tests > 0 {
        let count_str = if node.selected_tests > 0 {
            format!(" {}/{}", node.selected_tests, node.total_tests)
        } else {
            format!(" {}", node.total_tests)
        };
        let count_color = if node.selected_tests == node.total_tests {
            theme::SELECTED
        } else if node.selected_tests > 0 {
            theme::YELLOW
        } else {
            theme::OVERLAY0
        };
        spans.push(Span::styled(count_str, Style::default().fg(count_color)));
    }

    Line::from(spans)
}
