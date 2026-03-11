# Wisp Theme System

> Complete reference for the theme token structure and how to consume it.

---

## Overview

Wisp uses a **monochrome-first** theme system. Base UI is black, white, and gray. Color is reserved for **status feedback** (success, warning, danger, info) and **brand accents**.

The theme is provided via `WispProvider` and consumed through two hooks:
- `useTheme()` — returns `{ mode, colors, toggleMode, setMode, theme }`
- `useThemeColors()` — shorthand, returns just the `ThemeColors` object

---

## Color Token Groups

### `colors.background` — Elevation layers

| Token | Purpose | Dark | Light |
|-------|---------|------|-------|
| `canvas` | Root page/screen background | Near-black | White |
| `sunken` | Recessed areas (wells, code blocks, inputs) | Darker than canvas | Light gray |
| `surface` | Cards, panels, content containers | Dark gray | White |
| `raised` | Elevated elements (popovers, tooltips) | Dark (both themes) | Dark (both themes) |
| `overlay` | Semi-transparent scrim behind modals | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.5)` |

> **Note:** `raised` surfaces are **always dark** in both themes. Text on raised surfaces uses `text.onRaised` and `text.onRaisedSecondary`.

### `colors.text` — Foreground/typography

| Token | Purpose |
|-------|---------|
| `primary` | Default body text |
| `secondary` | Supporting/less-prominent text |
| `muted` | Disabled or placeholder text |
| `inverse` | Text on opposite-mode surface |
| `link` | Hyperlink and interactive text |
| `onRaised` | Primary text on raised surfaces (always light) |
| `onRaisedSecondary` | Secondary text on raised surfaces |

### `colors.border` — Borders and outlines

| Token | Purpose |
|-------|---------|
| `subtle` | Low-contrast dividers and separators |
| `strong` | High-contrast borders for emphasis |
| `focus` | Focus ring color (accessibility) |
| `active` | Active/pressed border state |

### `colors.accent` — Interactive highlights

| Token | Purpose |
|-------|---------|
| `primary` | Primary brand/action color |
| `primaryHover` | Hover state of primary accent |
| `primaryActive` | Pressed state of primary accent |
| `secondary` | Secondary accent for supporting actions |
| `highlight` | Selection/hover highlight on canvas |
| `highlightRaised` | Hover highlight on raised surfaces |
| `mutedRaised` | Muted foreground on raised surfaces |
| `dividerRaised` | Low-contrast divider on raised surfaces |

### `colors.status` — Feedback colors

Each status provides a **triplet**: foreground, surface tint, and border.

| Group | Foreground | Surface | Border |
|-------|-----------|---------|--------|
| Success (green) | `success` | `successSurface` | `successBorder` |
| Warning (amber) | `warning` | `warningSurface` | `warningBorder` |
| Danger (red) | `danger` | `dangerSurface` | `dangerBorder` |
| Info (blue) | `info` | `infoSurface` | `infoBorder` |

### `colors.brand` — Brand accent

| Token | Purpose |
|-------|---------|
| `primary` | Main brand color |
| `hover` | Hover state |
| `active` | Pressed state |
| `surface` | Tinted background for brand containers |
| `border` | Subtle border for brand containers |
| `text` | Text color on brand backgrounds |

### `colors.data` — Data visualization

Five distinct hues for charts and graphs: `blue`, `violet`, `amber`, `emerald`, `cyan`.

### `colors.palette` — Extended decorative palette

20 vibrant hues for avatars, tags, and expressive elements:
`creamyPeach`, `rosyHighlight`, `softBlue`, `brewedMustard`, `oldGeranium`, `sawtoothOak`, `summertime`, `cornflower`, `tigerlily`, `deepRose`, `purpleMountainMajesty`, `roguePink`, `squeaky`, `appleValley`, `pencilLead`, `purpleCorallite`, `flamingoPink`, `blueCuracao`, `porcelainRose`, `biscay`

---

## Spacing Scale

Based on a 4px grid:

| Token | Value |
|-------|-------|
| `none` | 0 |
| `2xs` | 2px |
| `xs` | 4px |
| `sm` | 8px |
| `md` | 12px |
| `lg` | 16px |
| `xl` | 24px |
| `2xl` | 32px |
| `3xl` | 48px |
| `4xl` | 64px |

---

## Typography Scale

| Step | Font Size | Line Height |
|------|-----------|-------------|
| `2xs` | 10 | 14 |
| `xs` | 12 | 16 |
| `sm` | 14 | 20 |
| `base` | 16 | 24 |
| `lg` | 18 | 28 |
| `xl` | 20 | 28 |
| `2xl` | 24 | 32 |
| `3xl` | 30 | 36 |
| `4xl` | 36 | 40 |

**Font Weights:** regular (400), medium (500), semibold (600), bold (700)

**Font Families:**
- `sans` — system font stack (SF Pro, Segoe UI, Roboto, etc.)
- `mono` — monospace stack (SF Mono, Fira Code, Menlo, etc.)

---

## Text Size Tokens (via `sizeMap` in Text.styles.ts)

| Size | fontSize | lineHeight | iconSize | iconGap |
|------|----------|------------|----------|---------|
| `xs` | 12 | 18 | 14 | 4 |
| `sm` | 14 | 20 | 14 | 6 |
| `md` | 16 | 24 | 16 | 6 |
| `lg` | 18 | 28 | 18 | 8 |
| `xl` | 20 | 30 | 20 | 8 |
| `display-xs` | 24 | 32 | 20 | 8 |
| `display-sm` | 30 | 38 | 24 | 10 |
| `display-md` | 36 | 44 | 24 | 10 |
| `display-lg` | 48 | 60 | 28 | 12 |
| `display-xl` | 60 | 72 | 32 | 12 |
| `display-2xl` | 72 | 90 | 36 | 14 |

---

## Border Radius Scale

| Token | Value |
|-------|-------|
| `none` | 0 |
| `sm` | 4px |
| `md` | 8px |
| `lg` | 12px |
| `xl` | 16px |
| `full` | 9999px |

---

## Shadow Scale

| Token | Purpose |
|-------|---------|
| `none` | No shadow |
| `sm` | Subtle lift (cards, inputs) |
| `md` | Medium elevation (dropdowns, popovers) |
| `lg` | High elevation (modals, dialogs) |
| `xl` | Maximum elevation (toasts, notifications) |

---

## Semantic Color Variants

The `resolveSemanticColor()` function maps these tokens to theme values:

| Token | Resolves to |
|-------|-------------|
| `primary` | `text.primary` |
| `secondary` | `text.secondary` |
| `tertiary` | `text.muted` |
| `disabled` | `border.strong` |
| `white` | `#FFFFFF` |
| `inverse` | `text.inverse` |
| `inherit` | `inherit` |
| `error` | `status.danger` |
| `warning` | `status.warning` |
| `success` | `status.success` |
| `brand` | `accent.primary` |

Raw hex strings pass through unchanged.

---

## Thickness Tokens

For progress bars, spinners, dividers:

| Token | Value |
|-------|-------|
| `thin` | 2px |
| `regular` | 4px |
| `medium` | 6px |
| `thick` | 8px |
| `heavy` | 12px |

---

## Surface Variants

Overlay components (Popover, Dialog, Sheet, Tooltip, Toast) support:
- `solid` — opaque background using raised surface color
- `glass` — frosted-glass effect with backdrop blur

Glass style: `backdrop-filter: blur(16px) saturate(180%)`, `background: rgba(10,10,10,0.72)`, `border: 1px solid rgba(255,255,255,0.08)`

---

## Component Size Tokens

Shared `ComponentSize` for interactive components: `xs`, `sm`, `md`, `lg`, `xl`

Icon sizes per component size: xs=14, sm=16, md=20, lg=24, xl=32

---

## Consuming the Theme

### In React components:

```typescript
import { useThemeColors } from '../../providers';

const colors = useThemeColors();
const bgColor = colors.background.canvas;
const textColor = colors.text.primary;
```

### In core style builders:

```typescript
import type { ThemeColors } from '../theme/types';

export function resolveColors(variant: string, themeColors: ThemeColors) {
  return {
    bg: themeColors.background.surface,
    text: themeColors.text.primary,
    border: themeColors.border.subtle,
  };
}
```

### Key rule: Never hardcode hex values in components

All colors must resolve through `useThemeColors()` or be passed as `themeColors` argument to style builder functions. The only exceptions are the ChatBubble component (hardcoded black/white for messaging contrast) and `resolveSemanticColor('white')` which returns `#FFFFFF`.
