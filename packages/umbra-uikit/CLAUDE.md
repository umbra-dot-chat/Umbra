# Wisp — AI Agent Guide

> This file is auto-loaded by Claude Code. For deeper reference, see `.agents/`.

## Project Overview

Wisp is a monochrome, cross-platform UI kit. It's a **pnpm monorepo** with 4 packages:

| Package | Path | Purpose |
|---------|------|---------|
| `@wisp-ui/core` | `packages/core/` | Framework-agnostic tokens, types, styles, theme system |
| `@wisp-ui/react` | `packages/react/` | React DOM components (90+ components) |
| `@wisp-ui/react-native` | `packages/react-native/` | React Native components (92 components) |
| `@wisp/website` | `website/` | Documentation site with component registry |

### Architecture

```
@wisp-ui/core (types + styles)
    |
    +--> @wisp-ui/react (React DOM)
    |        |
    |        +--> website (docs + registry)
    |
    +--> @wisp-ui/react-native (React Native)
```

Core is **framework-agnostic** — it exports types, token maps, and pure style builder functions. Platform packages import from core and add rendering.

---

## Key Commands

```bash
pnpm --filter website build        # Build website (verifies everything compiles)
pnpm --filter website dev          # Dev server for docs site
pnpm --filter @wisp-ui/react-native typecheck   # Typecheck RN package
pnpm test                          # Run all tests
pnpm storybook                     # Launch Storybook (port 6009)
```

---

## How to Add a New Component

Every component spans 3 layers. Follow this exact file structure:

### Step 1: Core Types
Create `packages/core/src/types/ComponentName.types.ts`
- Define token arrays as `const` tuples (sizes, variants)
- Derive union types from arrays
- Define `SizeConfig` interface and `sizeMap` record
- Define `Props` interface extending `React.HTMLAttributes<HTMLElement>`

### Step 2: Core Styles
Create `packages/core/src/styles/ComponentName.styles.ts`
- Define `Colors` interface (bg, text, border, etc.)
- Create `resolveComponentColors(variant, themeColors)` function
- Create `buildComponentStyle(...)` functions returning `CSSStyleObject`
- Import types from `../types/ComponentName.types`

### Step 3: React Component
Create `packages/react/src/{primitives|components}/component-name/ComponentName.tsx`
- Use `forwardRef` with typed ref
- Get theme via `useThemeColors()` from `../../providers`
- Resolve colors with `useMemo`
- Build all styles with `useMemo`
- Spread `userStyle` last (user always wins)
- Set `displayName`

### Step 4: Component Index
Create `packages/react/src/{primitives|components}/component-name/index.ts`
- Export the component
- Re-export types from `@wisp-ui/core/types/ComponentName.types`

### Step 5: Website Registry
Create `website/src/registry/{primitives|components}/component-name.tsx`
- Export a `ComponentEntry` object with: slug, name, category, description, cardPreview, examples, props, keywords

### Step 6: Update Barrel Exports (6 files)

| File | What to add |
|------|-------------|
| `packages/core/src/types/index.ts` | `export * from './ComponentName.types'` |
| `packages/react/src/{primitives\|components}/index.ts` | Component + type exports |
| `packages/react/src/index.ts` | Component + type exports |
| `website/src/registry/{primitives\|components}/index.ts` | Add entry to array |

### Step 7: Verify
```bash
pnpm --filter website build   # Must pass
```

---

## Primitives vs Components

- **Primitives** = atomic UI elements (Button, Badge, Input, Text, etc.)
  - Path: `packages/react/src/primitives/`
  - Registry: `website/src/registry/primitives/`
- **Components** = composed/compound elements (Dialog, Accordion, DataTable, etc.)
  - Path: `packages/react/src/components/`
  - Registry: `website/src/registry/components/`
- **Layouts** = structural containers (Stack, Box, Card, Grid, etc.)
  - Path: `packages/react/src/layouts/`
  - Registry: `website/src/registry/layouts/`

---

## Design Rules

1. **Monochrome palette** — black, white, gray only for base UI
2. **Color only for status** — error (red), warning (amber), success (green), info (blue)
3. **Theme-aware** — all colors resolve through `useThemeColors()`
4. **Style merging** — computed styles first, user `style` prop spread last
5. **forwardRef always** — every component uses `forwardRef`
6. **useMemo everything** — memoize all derived styles and color resolutions
7. **Icons** — use Lucide React icons, pass as component type (not JSX element)

---

## Standing Rules

- Always run `pnpm --filter website build` before considering work done
- Commit messages: conventional commits style (feat/fix/chore)
- Commit frequently with small changes
- Write unit tests for all new functionality
- **No `Co-Authored-By`** lines in commits
- Use Storybook stories for visual verification
- Always update components in both React and React Native packages
- Write clear, concise documentation for new components and props

---

## Further Reference

| Doc | Description |
|-----|-------------|
| `.agents/CONVENTIONS.md` | Detailed component architecture patterns |
| `.agents/REACT_NATIVE.md` | React Native implementation guide + parity checklist |
| `.agents/THEME.md` | Theme token reference (all color groups, spacing, typography) |
| `.agents/WEBSITE.md` | Website registry system and preview patterns |
