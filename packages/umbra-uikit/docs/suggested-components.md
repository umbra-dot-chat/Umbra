# Suggested Components — Application UI

This is a reference checklist based on the [Untitled UI Application UI](https://www.untitledui.com/react/application-ui) component library. The goal is to support similar functionality composed in our own Wisp design system style, leveraging our existing 60+ primitives wherever possible.

Use this document to track which compound/application-level components we want to build, which Wisp primitives they compose, and overall progress.

---
## Page Headers (6 components)

Page headers sit at the top of a page and typically include a title, description, breadcrumbs, and action buttons.

- [ ] Page header variants (6 total) — title, subtitle, breadcrumb, and action bar layouts
  - Compose from: **Text, Button, Breadcrumb, HStack, Separator, Badge**
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Card Headers (2 components)

Card headers are the top section of a card, containing a title, optional subtitle, and action controls.

- [ ] Card header variants (2 total) — standard and with inline actions
  - Compose from: **Card, Text, Button, HStack, DropdownMenu, Icon**
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Section Headers (7 components)

Section headers divide content areas within a page, often with a title, description, and optional actions or tabs.

- [ ] Section header variants (7 total) — plain, with description, with tabs, with actions
  - Compose from: **Text, Button, Tabs, Separator, HStack, Badge**
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Section Footers (4 components)

Section footers appear at the bottom of content sections, typically with save/cancel actions or pagination.

- [ ] Section footer variants (4 total) — action bars, save/discard, with status text
  - Compose from: **Button, HStack, Separator, Text**
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Sidebar Navigations (5 components)

Vertical navigation panels for app layouts with links, icons, collapsible groups, and user profiles.

- [ ] Sidebar navigation variants (5 total) — simple, with icons, collapsible, multi-level, with user profile
  - Compose from: **Sidebar, Accordion, Avatar, Text, Icon, ScrollArea, Tooltip, Badge, Separator** | **Sidebar** already exists
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Header Navigations (2 components)

Horizontal top navigation bars with logo, links, dropdowns, and user menus.

- [ ] Header navigation variants (2 total) — standard top nav, with mega menu
  - Compose from: **HStack, Button, DropdownMenu, Avatar, Popover, Icon, Text**
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Modals (46 components)

Overlay dialogs for confirmations, forms, alerts, file uploads, and multi-step flows.

- [ ] Modal variants (46 total) — confirmation, form, alert, multi-step, file upload, success/error states
  - Compose from: **Dialog, Button, Text, Icon, Input, FormField, Progress, Separator** | **Dialog** already exists
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Command Menus (9 components)

Keyboard-driven command palettes (Cmd+K style) for search, navigation, and quick actions.

- [ ] Command menu variants (9 total) — search, navigation, action list, recent items, grouped
  - Compose from: **Command, Input, Icon, Kbd, ScrollArea, Text, Separator** | **Command** already exists
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Line & Bar Charts (4 components)

Data visualization components for displaying trends, comparisons, and time-series data as line or bar charts.

- [ ] Line & bar chart variants (4 total) — line chart, bar chart, stacked, multi-series
  - Compose from: **Card, Text, Tooltip** (requires charting library integration)
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Activity Gauges (4 components)

Circular or arc-shaped gauges showing progress toward a goal or KPI completion.

- [ ] Activity gauge variants (4 total) — single ring, multi-ring, with labels, with legend
  - Compose from: **CircularProgress, Text, Card, HStack** | **CircularProgress** already exists
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Pie Charts (4 components)

Pie and donut chart components for visualizing proportional data and category breakdowns.

- [ ] Pie chart variants (4 total) — pie, donut, with legend, with center label
  - Compose from: **Card, Text, ColorSwatch** (requires charting library integration) | **ColorSwatch** useful for legends
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Radar Charts (1 component)

Radar/spider chart for comparing multiple variables across categories.

- [ ] Radar chart variant (1 total) — multi-axis radar
  - Compose from: **Card, Text** (requires charting library integration)
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Metrics (16 components)

Stat cards and KPI displays showing numbers, trends, sparklines, and comparison data.

- [ ] Metric variants (16 total) — simple stat, with trend, with sparkline, with icon, with progress bar, grouped
  - Compose from: **Card, Text, Icon, Badge, Progress, HStack, VStack** | **Progress** already exists
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Slideout Menus (20 components)

Side panels that slide in from the edge of the screen for detail views, forms, filters, and settings.

- [ ] Slideout menu variants (20 total) — detail panel, form panel, filter panel, notification panel, multi-step
  - Compose from: **Sheet, Button, Text, Icon, Input, FormField, ScrollArea, Separator** | **Sheet** already exists
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Inline CTAs (7 components)

Inline call-to-action banners and promotional blocks embedded within page content.

- [ ] Inline CTA variants (7 total) — banner, with illustration, with dismiss, with action buttons
  - Compose from: **Card, Text, Button, Icon, HStack, Alert** | **Alert** covers some patterns
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Paginations (14 components)

Navigation controls for paging through lists, tables, and search results.

- [ ] Pagination variants (14 total) — numbered, previous/next, with page size, compact, with input
  - Compose from: **Pagination, Button, Text, Select, Input** | **Pagination** already exists
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Carousels (2 components)

Horizontal sliding content viewers for images, cards, or featured content.

- [ ] Carousel variants (2 total) — image carousel, card carousel
  - Compose from: **Button, Icon, HStack, ScrollArea** (new Carousel compound component needed)
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Progress Steps (18 components)

Multi-step indicators for wizards, onboarding flows, and checkout processes.

- [ ] Progress step variants (18 total) — horizontal stepper, vertical stepper, with icons, with descriptions, numbered, compact
  - Compose from: **Text, Icon, Separator, HStack, VStack, Badge, Progress** | **Progress** already exists
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Activity Feeds (4 components)

Chronological lists of events, actions, or updates within an application.

- [ ] Activity feed variants (4 total) — simple, with avatars, with icons, grouped by date
  - Compose from: **Avatar, Text, Icon, VStack, Separator, Badge, ListItem** | **Avatar, ListItem** already exist
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Messaging (4 components)

Chat interfaces, message threads, and conversation UI patterns.

- [ ] Messaging variants (4 total) — chat bubble, message thread, with attachments, with reactions
  - Compose from: **Avatar, Text, Input, Button, Icon, ScrollArea, VStack, HStack**
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Tabs (10 components)

Tab navigation components for switching between views within the same context.

- [ ] Tab variants (10 total) — underline, pill, boxed, with icons, with badges, vertical, segmented
  - Compose from: **Tabs, SegmentedControl, Badge, Icon, Text** | **Tabs, SegmentedControl** already exist
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Tables (12 components)

Data tables for displaying, sorting, filtering, and interacting with structured data.

- [ ] Table variants (12 total) — simple, sortable, with selection, with pagination, with inline editing, with filters, expandable rows
  - Compose from: **Table, Checkbox, Pagination, Button, Input, Badge, Avatar, DropdownMenu, Text** | **Table, Pagination** already exist
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Breadcrumbs (3 components)

Hierarchical navigation trails showing the user's current location within the app.

- [ ] Breadcrumb variants (3 total) — simple, with icons, with dropdown
  - Compose from: **Breadcrumb, Icon, Text, DropdownMenu** | **Breadcrumb** already exists
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Alerts (12 components)

Contextual alert messages for success, warning, error, and informational states.

- [ ] Alert variants (12 total) — inline, banner, with actions, with icon, dismissible, with description, toast-style
  - Compose from: **Alert, Toast, Icon, Text, Button, HStack** | **Alert, Toast** already exist
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Notifications (9 components)

Notification cards and dropdown panels for in-app notification systems.

- [ ] Notification variants (9 total) — simple, with avatar, with actions, grouped, notification panel, badge count
  - Compose from: **Card, Avatar, Text, Badge, Button, Popover, ScrollArea, Icon, Separator** | **Badge, Avatar, Popover** already exist
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Date Pickers (6 components)

Date and date-range selection inputs with calendar dropdowns.

- [ ] Date picker variants (6 total) — single date, date range, with presets, with time, inline calendar
  - Compose from: **Input, Popover, Button, Icon, Text** (new DatePicker compound component needed)
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Calendars (3 components)

Full calendar views for scheduling, event display, and date-based interfaces.

- [ ] Calendar variants (3 total) — month view, week view, with events
  - Compose from: **Card, Text, Button, Badge, Grid** (new Calendar compound component needed)
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## File Uploaders (5 components)

Drag-and-drop and click-to-upload file input components with preview and progress.

- [ ] File uploader variants (5 total) — dropzone, with preview, with progress, multi-file, with validation
  - Compose from: **Card, Text, Icon, Button, Progress, Badge** (new FileUploader compound component needed) | **Progress** already exists
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Content Dividers (18 components)

Horizontal and vertical dividers with optional labels, icons, or actions between content sections.

- [ ] Content divider variants (18 total) — simple line, with label, with icon, with button, vertical, dashed, with spacing variants
  - Compose from: **Separator, Text, Icon, Button** | **Separator** already exists
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Loading Indicators (3 components)

Skeleton screens, spinners, and loading state placeholders.

- [ ] Loading indicator variants (3 total) — spinner, skeleton, progress bar
  - Compose from: **Spinner, Skeleton, Progress** | **Spinner, Skeleton, Progress** already exist
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Empty States (3 components)

Placeholder content for when lists, tables, or views have no data to display.

- [ ] Empty state variants (3 total) — with illustration, with action, minimal
  - Compose from: **EmptyState, Text, Button, Icon** | **EmptyState** already exists
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Code Snippets (1 component)

Syntax-highlighted code blocks with copy functionality.

- [ ] Code snippet variant (1 total) — with syntax highlighting and copy button
  - Compose from: **Card, Text, Button, Icon, Kbd, ScrollArea**
  - [Reference](https://www.untitledui.com/react/application-ui)

---

## Summary

| Metric | Count |
|--------|-------|
| Total categories | 32 |
| Total components | 269 |

### Wisp Primitive Coverage

The following existing Wisp primitives directly map to or substantially cover Application UI categories:

| Category | Wisp Primitive |
|----------|---------------|
| Sidebar Navigations | `Sidebar` |
| Modals | `Dialog` |
| Command Menus | `Command` |
| Activity Gauges | `CircularProgress` |
| Slideout Menus | `Sheet` |
| Paginations | `Pagination` |
| Tabs | `Tabs`, `SegmentedControl` |
| Tables | `Table` |
| Breadcrumbs | `Breadcrumb` |
| Alerts | `Alert`, `Toast` |
| Content Dividers | `Separator` |
| Loading Indicators | `Spinner`, `Skeleton`, `Progress` |
| Empty States | `EmptyState` |

### New Compound Components Needed

These categories require new compound components that don't have a direct Wisp primitive:

- **Page Headers** — compose from Text, Button, Breadcrumb
- **Card Headers** — compose from Card, Text, Button
- **Section Headers / Footers** — compose from Text, Button, Tabs, Separator
- **Header Navigations** — compose from HStack, Button, DropdownMenu, Avatar
- **Charts (Line, Bar, Pie, Radar)** — requires charting library integration
- **Metrics** — compose from Card, Text, Icon, Progress
- **Inline CTAs** — compose from Card, Text, Button (overlaps with Alert)
- **Carousels** — new compound component needed
- **Progress Steps** — new Stepper compound component needed
- **Activity Feeds** — compose from Avatar, Text, ListItem
- **Messaging** — new Chat compound component needed
- **Notifications** — compose from Card, Avatar, Badge, Popover
- **Date Pickers** — new DatePicker compound component needed
- **Calendars** — new Calendar compound component needed
- **File Uploaders** — new FileUploader compound component needed
- **Code Snippets** — compose from Card, Text, Button
