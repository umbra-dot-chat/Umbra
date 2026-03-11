# Website & Registry Guide

> How the documentation website works and how to add new component pages.

---

## Overview

The website is a React SPA at `website/` that serves as the living documentation for the Wisp UI kit. It uses React Router (HashRouter), renders with `@wisp-ui/react` components, and features a registry system where each component's docs are defined as a declarative `ComponentEntry` object.

**Run locally:** `pnpm --filter website dev`
**Build:** `pnpm --filter website build`

---

## Route Structure

| Path | Page | Purpose |
|------|------|---------|
| `/` | `Landing` | Hero page with category links |
| `/docs` | `DocsPage` | Getting started documentation |
| `/tokens` | `TokensPage` | Design token gallery |
| `/tokens/:slug` | `ComponentDetail` | Token detail page |
| `/primitives` | `PrimitivesPage` | Primitives gallery grid |
| `/primitives/:slug` | `ComponentDetail` | Primitive detail page |
| `/layouts` | `LayoutsPage` | Layouts gallery grid |
| `/layouts/:slug` | `ComponentDetail` | Layout detail page |
| `/components` | `ComponentsPage` | Components gallery grid |
| `/components/:slug` | `ComponentDetail` | Component detail page |

---

## App Shell

```
+--------------------------------------------------+
| TopBar (64px) — search trigger, theme toggle, nav |
+--------+-----------------------------------------+
| Nav    | Content (scrollable)                     |
| Sidebar|                                          |
| (240px)|  <Route pages render here>               |
|        |                                          |
+--------+-----------------------------------------+
```

- **Landing page** renders without the sidebar/topbar shell
- All other pages use the `Layout` wrapper (sidebar + topbar + content)
- Global `Cmd+K` / `Ctrl+K` opens the `SearchPalette`

---

## Registry System

The registry is the core of the docs site. Each component is represented by a `ComponentEntry` object.

### Types (`website/src/registry/types.ts`)

```typescript
interface ComponentEntry {
  slug: string;                    // URL slug: 'button', 'chat-bubble'
  name: string;                    // Display name: 'Button', 'ChatBubble'
  category: ComponentCategory;     // 'tokens' | 'primitives' | 'layouts' | 'components'
  description: string;             // One-line description
  cardPreview: React.ReactNode;    // JSX rendered in gallery card
  variantCount?: number;           // Badge count on gallery card
  examples: ExampleDef[];          // Array of example sections
  props: PropDef[];                // Props documentation table
  keywords?: string[];             // Search keywords
}

interface ExampleDef {
  title: string;                   // Section heading
  render: React.ReactNode;         // Live JSX preview
  code: string;                    // React code snippet (string)
  rnCode?: string;                 // Optional React Native code snippet
}

interface PropDef {
  name: string;                    // Prop name
  type: string;                    // Type string for display
  default?: string;                // Default value
  required?: boolean;              // Required badge
  description: string;             // Description text
}
```

### File Structure

```
website/src/registry/
  types.ts                         # ComponentEntry, ExampleDef, PropDef
  index.ts                         # allEntries[], findEntry(), entriesByCategory()
  tokens.ts                        # Token entries
  primitives/
    index.ts                       # Imports all entries, exports primitiveEntries[]
    button.tsx                     # buttonEntry: ComponentEntry
    text.tsx
    badge.tsx
    ...
  layouts/
    index.ts                       # layoutEntries[]
    card.tsx
    stack.tsx
    ...
  components/
    index.ts                       # componentEntries[]
    dialog.tsx
    chat-bubble.tsx
    ...
```

### Registry Index (`website/src/registry/index.ts`)

Exports:
- `allEntries` — flat array of all ComponentEntry objects
- `findEntry(category, slug)` — lookup by category + slug
- `entriesByCategory(category)` — filter entries by category

---

## Adding a New Component to the Registry

### 1. Create the registry entry file

```
website/src/registry/{category}/{slug}.tsx
```

```typescript
import React from 'react';
import { Component, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const componentEntry: ComponentEntry = {
  slug: 'component-name',
  name: 'ComponentName',
  category: 'primitives',       // or 'layouts' or 'components'
  description: 'One-line description of the component.',
  variantCount: 5,
  keywords: ['search', 'terms', 'for', 'palette'],

  cardPreview: (
    <div style={{ display: 'flex', gap: 8, pointerEvents: 'none' }}>
      <Component variant="default">Preview</Component>
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: <Component>Example content</Component>,
      code: `import { Component } from '@wisp-ui/react';\n\n<Component>Example content</Component>`,
      rnCode: `import { Component } from '@wisp-ui/react-native';\n\n<Component>Example content</Component>`,
    },
    {
      title: 'Variants',
      render: (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Component variant="default">Default</Component>
          <Component variant="info">Info</Component>
          <Component variant="success">Success</Component>
        </div>
      ),
      code: `<Component variant="info">Info</Component>`,
    },
  ],

  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Content.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset.' },
    { name: 'variant', type: "'default' | 'info' | 'success'", default: "'default'", description: 'Color variant.' },
  ],
};
```

### 2. Export from category index

Add to `website/src/registry/{category}/index.ts`:

```typescript
import { componentEntry } from './component-name';

export const categoryEntries: ComponentEntry[] = [
  // ... existing entries
  componentEntry,
];
```

### 3. Verify

- Run `pnpm --filter website dev`
- Navigate to the category page — the card should appear in the grid
- Click the card — the detail page should render with all examples
- Test `Cmd+K` search — keywords should surface the component

---

## Shared Components

### `PreviewCard` — Gallery card

Displays a component's `cardPreview` in a 160px-tall card with the component name and variant count badge. Clickable — navigates to detail page. Each card has its own nested `WispProvider` for isolated rendering.

### `PreviewFrame` — Example preview wrapper

Wraps each example's `render` JSX on detail pages. Features:
- Independent theme toggle (dark/light) per frame
- Nested `WispProvider` with its own mode state
- 24px padding, 120px min height
- Optional label header
- `hideToggle` prop to disable the toggle

### `DemoBox` — Theme-aware placeholder

A styled container for demos with three intensity levels:
- `subtle` — uses `accent.highlight` background
- `medium` (default) — uses `border.subtle` background
- `strong` — uses `border.strong` background

Accepts shorthand props: `p` (padding), `radius`, `display`, `position`.

### `ComponentPage` — Detail page template

The generic template that renders any `ComponentEntry`:
1. Breadcrumb: Home > Category > Component Name
2. Display title + description
3. Separator
4. For each example: SectionHeading + PreviewFrame + CodeToggle
5. Separator
6. PropsTable (if props exist)

### `CodeToggle` — Collapsible code display

Toggle to show/hide code snippets. If `rnCode` is provided, shows React/React Native tabs.

### `CodeBlock` — Syntax-highlighted code

Uses Shiki for syntax highlighting. Supports: tsx, jsx, ts, js, html, css, json, bash, text. Includes copy-to-clipboard button.

### `SearchPalette` — Command palette (Cmd+K)

Global search that queries `allEntries` by name and keywords. Groups results by category. Keyboard navigation supported.

### `CategoryGrid` — Responsive card grid

CSS grid with `auto-fill` at 280px minimum column width. 16px gap.

---

## Theme in the Website

### Global theme
The app is wrapped in `WispProvider`. Theme mode is persisted to `localStorage` via the headless `ThemePersistence` component.

### Preview isolation
Both `PreviewCard` and `PreviewFrame` wrap content in nested `WispProvider` instances with `injectCssVars={false}`. This allows each preview to have an independent light/dark mode without affecting the rest of the page.

### Light/dark considerations for previews
- `cardPreview` JSX should look reasonable in both light and dark mode since the frame can be toggled
- Use `pointerEvents: 'none'` on `cardPreview` to prevent interaction in the gallery
- Example `render` JSX is wrapped in `PreviewFrame` which handles its own theme — no special handling needed in registry entries

---

## File Locations Quick Reference

| Purpose | Path |
|---------|------|
| App entry | `website/src/main.tsx` |
| Routes | `website/src/routes.tsx` |
| App shell | `website/src/App.tsx` |
| Pages | `website/src/pages/` |
| Shared components | `website/src/shared/` |
| Registry types | `website/src/registry/types.ts` |
| Registry index | `website/src/registry/index.ts` |
| Primitive entries | `website/src/registry/primitives/` |
| Layout entries | `website/src/registry/layouts/` |
| Component entries | `website/src/registry/components/` |
| Shiki highlighter | `website/src/shared/useShikiHighlighter.ts` |
