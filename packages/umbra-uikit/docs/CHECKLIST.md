# Wisp Component Checklist

> Monochrome UI kit — cool blue-blacks with pure white accent. Zero color in base UI — color reserved for status only (error, warning, success).
> Based on [Untitled UI](https://github.com/untitleduico/react) patterns. Icons: Lucide React.

### Per-Component Requirements

Every component must complete these before it's marked ✅:

- [ ] **Component** — Implementation with types, props, forwardRef
- [ ] **Story** — Storybook stories showing all variants and states
- [ ] **Skeleton** — Loading skeleton state built into the component
- [ ] **Unit Tests** — Vitest tests covering props, states, accessibility
- [ ] **Visual Tests** — Playwright screenshot tests (dark + light mode)
- [ ] **Documentation** — Docsify page with usage examples, props table, and live demos

### Shared Token System

All components use the same universal enums from `src/tokens/shared.ts`:

| Token | Values | Used By |
|-------|--------|---------|
| `TextSize` | xs, sm, md, lg, xl, display-xs…2xl (11) | Text |
| `FontWeightKey` | regular, medium, semibold, bold (4) | Text, Button, … |
| `SemanticColor` | primary…brand (10) | Text, Icon, Button, … |
| `FontFamilyKey` | sans, mono (2) | Text |
| `ComponentSize` | xs, sm, md, lg, xl (5) | Icon, Button, Toggle, … |
| `resolveSemanticColor()` | maps name → theme hex | All components |

---
## Existing Primitives

### 1. Text

> Typography primitive — renders text with semantic sizing, weights, colors, icon slots, and truncation.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ✅ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ✅ |

### 2. Icon

> Icon primitive — wraps Lucide React icons with semantic sizing, monochrome colors, skeleton loading, and accessibility.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ✅ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ✅ |

### 3. Button

> Interactive button primitive — monochrome by default, with status variants for semantic actions.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ✅ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ✅ |

### 4. Toggle

> On/off switch control with sizes, slim variant, and animation.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 5. Input

> Text input with sizes, icons, error state, and prefix/suffix slots.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 6. TextArea

> Multiline text input with auto-resize, character count, and sizes.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 7. Checkbox

> Checkbox control with sizes, indeterminate state, and label support.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 8. Radio / RadioGroup

> Radio button control with group management, sizes, and orientation.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 9. Spinner

> Loading spinner with sizes and color variants.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 10. Slider

> Range slider with sizes, step, min/max, and label support.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 11. Badge

> Status badge with sizes, variants, shapes, and dot indicator.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 12. Tag

> Removable tag/chip with sizes and close button.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 13. Progress

> Linear progress bar with sizes, indeterminate mode, and value display.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 14. Tooltip

> Tooltip overlay with placement, delay, and arrow support.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 15. Separator

> Visual divider with orientation, variants, and spacing options.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 16. Combobox

> Searchable dropdown with filtering, keyboard navigation, and custom rendering.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 17. Skeleton

> Loading skeleton with variants (text, circular, rectangular) and animation modes.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 18. DropdownMenu

> Dropdown menu with trigger, content, items, separators, and keyboard navigation.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 19. Pagination

> Page navigation with sizes, boundary/sibling count, and ellipsis.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 20. Avatar

> Avatar with image, fallback initials, sizes, shapes, and status indicator.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 21. Toast

> Toast notification with variants (info, success, warning, error), icons, and dismiss.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 22. Dialog

> Modal dialog with sizes, overlay, close button, and focus trap.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 23. Select

> Native-style select dropdown with sizes, icons, and custom options.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 24. Breadcrumb

> Breadcrumb navigation with items, separators, and sizes.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 25. Card

> Card container with variants (elevated, outlined, filled), padding, and radius options.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 26. Tabs

> Tabbed interface with sliding indicator animation, horizontal/vertical orientation, keyboard navigation.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 27. SegmentedControl

> Segmented button group with sliding pill indicator animation, sizes, and full-width option.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

---

## New Primitives — To Build

### 28. Accordion

> Collapsible sections with expand/collapse animation. Single or multiple open panels. Icon rotation on toggle.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 29. Popover

> General-purpose anchored floating content panel. Trigger + content pattern with placement, offset, and click-outside dismiss.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 30. Sheet

> Bottom sheet for mobile patterns. Drag handle to dismiss, overlay backdrop, snap points.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 31. Alert

> Inline status banner (info, warning, error, success). Persistent (not dismissible like Toast). Icon + title + description + optional action.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 32. Table

> Data table with header, body, rows, cells. Sortable columns, sticky header, striped rows, compact/comfortable density.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 33. NumberInput

> Numeric input with increment/decrement buttons. Min, max, step, formatted display. Sizes matching Input.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 34. SwitchGroup / CheckboxGroup

> Grouped toggle switches or checkboxes with shared label, description, and error state. Vertical/horizontal layout.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 35. AspectRatio

> Constrains children to a given aspect ratio (16:9, 4:3, 1:1, etc.). Useful for images, videos, and cards.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 36. Kbd

> Keyboard shortcut display. Renders key combinations with proper platform glyphs (⌘, ⇧, ⌥, Ctrl). Sizes and inline usage.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 37. ColorSwatch

> Color preview chip. Displays a color with optional border, sizes, shapes (circle/square), and checkered transparency background.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 38. Chip / TokenInput

> Multi-value tag input. Type to add chips, backspace to remove. Autocomplete suggestions, max count, validation.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 39. CircularProgress

> Circular progress indicators. Half-circle (gauge) and full-circle (donut) variants. Value label, sizes, thickness, indeterminate mode.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

---

## Layout Primitives

> Foundation and application layout components. Stories live under `Layouts/` in Storybook.

### 40. Stack / HStack / VStack

> Flex-based stack with gap (ThemeSpacing keys), direction, alignment, divider insertion, and reverse.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 41. Box

> Polymorphic container with padding props (p/px/py/pt/pr/pb/pl), display, position, sizing, and radius. No margin.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 42. Center

> Simple centering primitive using flexbox. Inline and polymorphic `as` prop support.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 43. Spacer

> Fixed-size (ThemeSpacing `size` prop) or flexible (`flex` prop) whitespace. Aria-hidden, no children.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 44. Container

> Max-width constraint aligned with breakpoints. Sizes: sm(640), md(768), lg(1024), xl(1280), 2xl(1536), full(100%).

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 45. ScrollArea

> Styled scrollable container with direction, hideScrollbar, scrollbarWidth, and theme-colored scrollbar track.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 46. FormField

> Wraps a form control with label, description, error message. Sizes, horizontal/vertical orientation, required indicator.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 47. EmptyState

> Centered placeholder with icon, title, description, and action. Sizes sm/md/lg with icon/font/minHeight configs.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 48. Toolbar

> Compound component: Toolbar + ToolbarGroup + ToolbarSeparator. Variants: elevated/transparent. Context-based size sharing.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 49. Sidebar

> Compound component: Sidebar + SidebarSection + SidebarItem. Collapsible with animation. Active state with accent.primary bg.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

---

## Layout Primitives — Phase 2

> Additional layout primitives identified through gap analysis of all 76 planned components. These ensure zero-to-minimal custom layout styling within composed components.

### 50. Grid / GridItem

> CSS Grid container with token-based gap, responsive columns, and named template areas. Covers Calendar grids, DataTable layouts, ImageGallery, Heatmap, Kanban boards, ColorPicker swatches, and dashboard widget arrangements.
> **Serves:** 9+ components (Calendar, DataTable, ImageGallery, Heatmap, ColorPicker, Dashboard, Kanban, AddressForm, PinInput)

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 51. Collapse

> Animated expand/collapse container with measured height transitions. Extracts the pattern already used by Accordion into a standalone primitive for reuse.
> **Serves:** 7+ components (TreeView, Sidebar sections, CollapsiblePanel, CommentThread, FAQ, NavigationMenu, NotificationCenter)

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 52. Sticky

> Wrapper that applies sticky positioning with proper z-index from theme tokens. Handles scroll-awareness for show/hide and shrink behaviors.
> **Serves:** 8+ components (DataTable headers, StickyHeader, NavBar, AppShell header, Toolbar, TableOfContents, BottomNav, Banner)

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 53. Overlay

> Full-screen overlay container with backdrop, z-index management, and body-scroll locking. Consolidates the pattern used by Dialog, Sheet, and Lightbox.
> **Serves:** 5+ components (Lightbox, LoadingOverlay, CommandPalette, Tour highlight, FileUpload dropzone)

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 54. ListItem

> Three-region horizontal layout: leading slot (icon/avatar) + content slot (title/subtitle) + trailing slot (actions/metadata). The building block for all list-based components.
> **Serves:** 6+ components (UserCard, UserList, NotificationCenter items, FilePreview, DataList rows, ActivityFeed entries)

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 55. Floating / Anchor

> Positioning engine for floating UI relative to a trigger element. Handles placement, offset, flip, shift, and viewport collision detection. Extracts the pattern used by Popover/Tooltip/DropdownMenu.
> **Serves:** 13+ components (DatePicker, TimePicker, ColorPicker, Autocomplete, MentionInput, CommandPalette, ContextMenu, Tour, Combobox, MultiSelect, TagInput, NavBar dropdowns, NotificationCenter)

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

### 56. AppLayout

> Full-page layout orchestrator with named regions: header, sidebar, content, footer. Handles sidebar collapse/expand, responsive breakpoint switching, and scroll containment.
> **Serves:** 2 components but foundational (AppShell, MasterDetail)

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

---

### Existing Primitive Enhancements (Phase 2)

> Enhancements to existing layout primitives identified through gap analysis.

| Primitive | Enhancement | Serves | Status |
|-----------|-------------|--------|--------|
| **Stack** | Responsive `direction` prop (vertical on mobile → horizontal on desktop) | 15+ components | ⬜ |
| **Box** | `inset`, `top`, `right`, `bottom`, `left`, `zIndex` props | Floating, sticky, and overlay patterns | ⬜ |
| **HStack** | Negative gap / overlap support | AvatarGroup, stacked badges | ⬜ |
| **ScrollArea** | Scroll-snap support | Carousel, DatePicker month views | ⬜ |

---

## Components — Composed from Primitives

> Higher-level components that compose multiple primitives together. Each lives in `src/components/` and follows the same file pattern (types, styles, component, stories, index). Stories live under `Components/{Category}/` in Storybook.

---

### Data Display

#### 57. StatCard

> Displays a single key metric with label, value, trend indicator (up/down arrow + percentage), and optional icon or sparkline.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 58. DescriptionList

> Key-value pair list for displaying metadata, profile details, or settings summaries. Horizontal and vertical orientations.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 59. DataList

> A structured, repeatable list of records with consistent row layout, supporting inline actions and selection.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 60. Timeline

> Vertical sequence of events with timestamps, icons, connectors between nodes, and content slots.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 61. ActivityFeed

> Chronological stream of user/system actions with actor avatar, verb, object, timestamp, and action links.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 62. TreeView

> Hierarchical, expandable/collapsible node structure for file browsers, org charts, or nested categories.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 63. DataTable

> Enhanced table with sorting, filtering, column resizing, row selection, pagination, and bulk actions built in.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 64. VirtualList

> Windowed/virtualized list that efficiently renders thousands of rows by only mounting visible items.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 65. Calendar

> Month/week/day grid display for viewing dates and events. Display-only counterpart to DatePicker.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 66. CodeBlock

> Syntax-highlighted, copyable block of source code with optional line numbers and language label.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 67. Callout

> Block-level aside for tips, warnings, or important notes. Icon + title + body with status variants.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 68. Prose

> Typography wrapper that applies consistent heading, paragraph, list, and link styles to arbitrary HTML/Markdown content.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

---

### Navigation

#### 69. Stepper

> Multi-step progress indicator showing completed, current, and upcoming steps in a linear workflow.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 70. CommandPalette

> Keyboard-activated (⌘K) searchable overlay for finding and executing commands or navigating pages.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 71. NavBar

> Top-level horizontal navigation bar with logo, links, actions, and responsive mobile menu toggle.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 72. BottomNav

> Fixed bottom navigation bar with icon+label items. Designed for mobile-first or PWA layouts.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 73. TableOfContents

> Auto-generated list of in-page anchor links that highlights the currently visible section on scroll.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 74. BackToTop

> Floating button that appears on scroll and smoothly scrolls the page back to the top when clicked.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

---

### Data Entry

#### 75. DatePicker

> Calendar-based input for selecting a single date. Popover + Input composition with keyboard navigation and format masking.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 76. DateRangePicker

> Extends DatePicker to select a start and end date with visual range highlighting and preset shortcuts.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 77. TimePicker

> Input for selecting a time value with hour/minute/period controls and optional 24-hour mode.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 78. ColorPicker

> Visual color selection with hue/saturation panel, hex/RGB/HSL inputs, swatch presets, and eyedropper.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 79. FileUpload

> Drag-and-drop zone or file-browse button with progress indicators, file type validation, size limits, and preview.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 80. SearchInput

> Input with built-in search icon, clear button, keyboard shortcut hint (⌘K), and debounced change events.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 81. Autocomplete

> Text input that suggests matching options from a list as the user types with keyboard selection and highlighting.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 82. TagInput

> Input that converts typed entries into dismissible tags/chips. Supports autocomplete, validation, and max count.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 83. MultiSelect

> Dropdown select that allows choosing multiple values, displayed as chips inside the trigger.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 84. TransferList

> Two side-by-side lists with controls to move items between "available" and "selected" pools.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 85. PinInput

> Series of single-character input boxes for entering OTPs, verification codes, or PINs.

| Requirement | Status |
|---|---|
| Component | ✅ |
| Story | ✅ |
| Skeleton | ✅ |
| Unit Tests | ✅ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 86. PasswordInput

> Password field with show/hide toggle, strength meter bar, and optional requirements checklist.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 87. Rating

> Row of interactive stars (or custom icons) for submitting a 1-to-N score value. Half-star support.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 88. InlineEdit

> Value that appears as static text but transforms into an editable input on click or keyboard activation.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 89. SignaturePad

> Canvas-based input for capturing a handwritten signature via mouse or touch. Clear and undo support.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

---

### Feedback & Status

#### 90. Banner

> Full-width, page-level message bar for announcements, promotions, or system-wide notices. Dismissible.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 91. ConfirmDialog

> Pre-composed modal that asks the user to confirm or cancel a destructive or irreversible action.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 92. NotificationCenter

> Dropdown panel that aggregates and displays a list of user notifications with read/unread state and timestamps.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 93. LoadingOverlay

> Semi-transparent overlay with spinner or skeleton that blocks interaction during an async operation.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 94. ErrorPage

> Full-page error display (404, 500, etc.) with illustration area, message, and navigation back to safety.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 95. ResultScreen

> Full-page success or failure outcome view with icon, message, and next-step action buttons.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 96. Tour

> Multi-step guided walkthrough that highlights UI elements in sequence with tooltip explanations and step navigation.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

---

### Overlay

#### 97. ContextMenu

> Right-click (or long-press) triggered menu with nested items, icons, keyboard shortcuts, and separators.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 98. Drawer

> Panel that slides in from any edge (top, right, bottom, left) for secondary navigation, filters, or detail views.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 99. Lightbox

> Full-screen overlay for viewing an image at full resolution with close, zoom, and prev/next navigation.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

---

### Media

#### 100. AvatarGroup

> Stacked row of overlapping Avatars with a "+N" overflow indicator for showing group membership.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 101. Carousel

> Horizontally scrollable set of slides (images, cards, content) with dots, arrows, and optional autoplay.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 102. ImageGallery

> Grid or masonry layout of images that opens a Lightbox on click with prev/next navigation.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 103. FilePreview

> Thumbnail preview card for uploaded files showing icon/type, filename, size, and a remove action.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 104. EmbedCard

> OpenGraph/oEmbed-style preview card showing title, description, thumbnail, and domain for a URL.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

---

### Communication

#### 105. UserCard

> Compact card showing a user's avatar, name, role/title, status indicator, and quick-action buttons.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 106. UserList

> List of users with avatar, name, metadata, and row-level actions (invite, remove, assign role).

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 107. ChatBubble

> Single message bubble with sender avatar, text, timestamp, and alignment based on sent/received direction.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 108. Comment

> Single comment block with author info, body text, timestamp, and reply/like/edit actions.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 109. CommentThread

> Nested, indented list of Comments supporting threaded replies with collapse/expand.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 110. MentionInput

> Text input that supports @-mentioning users with an inline autocomplete popup and highlighting.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

---

### App Layout

#### 111. AppShell

> Top-level layout wrapper providing responsive sidebar collapse, top bar, breadcrumb slot, and content region.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 112. PageHeader

> Composed page header with title, description, breadcrumbs, and action buttons slot.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 113. SplitPane

> Resizable two-panel layout with a draggable divider for editors, diffs, or master-detail views.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 114. MasterDetail

> Responsive layout showing a list on one side and selected item details on the other. Collapses on mobile.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 115. StickyHeader

> Page or section header that fixes to the top of the viewport on scroll with optional shrink animation.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 116. CollapsiblePanel

> Panel section with a header that toggles its body content open/closed. For settings groups or filter drawers.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 117. FloatingActionButton

> Persistent floating circular button (typically bottom-right) for the primary action on a page.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

---

### Utility Components

#### 118. CopyButton

> Button that copies a given text value to the clipboard and shows a brief "Copied!" confirmation with icon swap.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 119. ThemeToggle

> Switch or button that toggles between light, dark, and system color modes with icon animation.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 120. Truncate

> Text wrapper that clamps content to N lines with ellipsis and optional "Show more" / "Show less" toggle.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 121. Highlight

> Wraps matching substrings in a text block with a visual highlight mark. Used for search-result emphasis.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 122. RelativeTime

> Displays a timestamp as a human-readable relative string ("3 minutes ago") that auto-updates.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 123. CountUp

> Animated number that increments from a start value to a target value over a configurable duration.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 124. SortableList

> Drag-and-drop reorderable list with animated position transitions and accessible keyboard reordering.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 125. VisuallyHidden

> Utility wrapper that hides content visually while keeping it accessible to screen readers.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 126. Portal

> Renders children into a DOM node outside the normal component tree for overlays, toasts, and tooltips.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 127. FocusTrap

> Wrapper that constrains keyboard focus within its children. Essential for modals and dialogs.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | N/A |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

---

### Data Visualization

#### 128. Sparkline

> Tiny inline chart (line or bar) embedded in a stat card or table cell to show trend at a glance.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 129. MiniMetric

> Compact inline metric display combining a number, label, and trend arrow for use inside tables or cards.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 130. Heatmap

> Color-coded grid (e.g., GitHub contribution graph) showing intensity of values across two dimensions.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

---

### Form Composition

#### 131. FormWizard

> Multi-step form with step navigation, per-step validation, summary review, and submit orchestration.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

#### 132. AddressForm

> Pre-composed group of inputs (street, city, state/province, postal code, country) with validation.

| Requirement | Status |
|---|---|
| Component | ⬜ |
| Story | ⬜ |
| Skeleton | ⬜ |
| Unit Tests | ⬜ |
| Visual Tests | ⬜ |
| Documentation | ⬜ |

---

### Design Rules
- All colors are **cool blue-blacks** — no warm tones
- **Monochrome** — pure white accent on dark, near-black on light
- **Zero color** in base UI — color ONLY for errors, warnings, success
- Light mode = **panda** (white canvas, dark/black cards)
- Dark mode = **ink** (deep blue-black canvas, lighter card surfaces)
- **Lucide React** for all icons — inherit `currentColor`
- Every component has a **skeleton loading state**
- **Shared tokens** — sizes, weights, colors are universal enums in `src/tokens/shared.ts`
- Based on **Untitled UI** patterns
- Use ONLY kit color tokens — **no hardcoded rgba/hex values** in component styles

### Quality Gates
- **Unit Tests**: Vitest — render, props, a11y (aria attributes, keyboard nav)
- **Visual Tests**: Playwright — screenshot comparison for dark + light mode
- **Documentation**: Docsify — props table, usage examples, live code blocks
