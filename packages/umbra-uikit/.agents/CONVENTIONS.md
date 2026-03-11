# Wisp Component Conventions

> These rules apply to EVERY component. Do not deviate.

## Architecture: 3-Layer Pattern

Every component spans three packages. Types and styles live in **core**, rendering in the platform package:

```
packages/core/src/types/Button.types.ts        <- Type definitions (shared across platforms)
packages/core/src/styles/Button.styles.ts       <- Style builder functions (shared)
packages/react/src/primitives/button/Button.tsx  <- React DOM rendering
packages/react/src/primitives/button/index.ts    <- Barrel export
website/src/registry/primitives/button.tsx        <- Docs registry entry
```

Core is **framework-agnostic** — no React imports, no hooks, no DOM. It exports types, token maps, and pure functions that return `CSSStyleObject`.

---

## File Patterns

### 1. Core Types (`packages/core/src/types/Component.types.ts`)

```typescript
import type React from 'react';

// Token arrays as const tuples
export const componentVariants = ['default', 'info', 'success', 'warning'] as const;
export type ComponentVariant = (typeof componentVariants)[number];

export const componentSizes = ['sm', 'md', 'lg'] as const;
export type ComponentSize = (typeof componentSizes)[number];

// Size config — all dimensional values for each size
export interface ComponentSizeConfig {
  height: number;
  fontSize: number;
  paddingX: number;
  iconSize: number;
}

export const componentSizeMap: Record<ComponentSize, ComponentSizeConfig> = {
  sm: { height: 28, fontSize: 12, paddingX: 8, iconSize: 14 },
  md: { height: 36, fontSize: 14, paddingX: 12, iconSize: 16 },
  lg: { height: 44, fontSize: 16, paddingX: 16, iconSize: 20 },
};

// Props interface extends native HTML attributes
export interface ComponentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  children: React.ReactNode;
  size?: ComponentSize;
  variant?: ComponentVariant;
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
}
```

**Rules:**
- Token arrays are `as const` tuples
- Types derive from arrays: `(typeof arr)[number]`
- SizeConfig holds ALL dimensional values — no magic numbers in components
- Props extend the appropriate HTML element attributes
- Icons typed as component types (not JSX elements)

### 2. Core Styles (`packages/core/src/styles/Component.styles.ts`)

```typescript
import type { CSSStyleObject } from '../types';
import type { ThemeColors } from '../theme/types';
import type { ComponentVariant, ComponentSizeConfig } from '../types/Component.types';

export interface ComponentColors {
  bg: string;
  text: string;
  border: string;
}

export function resolveComponentColors(
  variant: ComponentVariant,
  themeColors: ThemeColors,
): ComponentColors {
  switch (variant) {
    case 'info': return { bg: themeColors.status.infoSurface, text: themeColors.status.info, border: themeColors.status.infoBorder };
    case 'success': return { bg: themeColors.status.successSurface, ... };
    default: return { bg: themeColors.background.raised, text: themeColors.text.primary, ... };
  }
}

export function buildComponentStyle(sizeConfig: ComponentSizeConfig, colors: ComponentColors): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: sizeConfig.height,
    fontSize: sizeConfig.fontSize,
    backgroundColor: colors.bg,
    color: colors.text,
  };
}
```

**Rules:**
- Pure functions — no hooks, no theme access, no side effects
- Return `CSSStyleObject` (`Record<string, string | number | undefined>`)
- Take `themeColors` as argument — never import theme directly
- One `resolve*Colors()` per component
- Multiple `build*Style()` functions for sub-elements
- Import types from `../types/Component.types` (relative within core)

### 3. React Component (`packages/react/src/{primitives|components}/component-name/Component.tsx`)

```typescript
import React, { forwardRef, useMemo } from 'react';
import type { ComponentProps } from '@wisp-ui/core/types/Component.types';
import { componentSizeMap } from '@wisp-ui/core/types/Component.types';
import { resolveComponentColors, buildComponentStyle } from '@wisp-ui/core/styles/Component.styles';
import { useThemeColors } from '../../providers';

export const Component = forwardRef<HTMLDivElement, ComponentProps>(function Component(
  { children, size = 'md', variant = 'default', icon: Icon, className, style: userStyle, ...rest },
  ref,
) {
  const themeColors = useThemeColors();
  const sizeConfig = componentSizeMap[size];
  const colors = useMemo(() => resolveComponentColors(variant, themeColors), [variant, themeColors]);
  const containerStyle = useMemo(() => buildComponentStyle(sizeConfig, colors), [sizeConfig, colors]);

  return (
    <div ref={ref} className={className} style={{ ...containerStyle, ...userStyle }} {...rest}>
      {Icon && <Icon size={sizeConfig.iconSize} color={colors.text} strokeWidth={2} />}
      {children}
    </div>
  );
});

Component.displayName = 'Component';
```

**Rules:**
- Always `forwardRef` with typed ref
- Theme via `useThemeColors()` from `../../providers`
- ALL derived values memoized with `useMemo`
- `userStyle` spread LAST (user always wins)
- `className` passed through
- `...rest` spread onto DOM element
- Named function in forwardRef: `forwardRef<T, P>(function Name(...) {})`
- Set `displayName`

### 4. Index (`packages/react/src/{primitives|components}/component-name/index.ts`)

```typescript
export { Component } from './Component';
export type { ComponentProps, ComponentSize, ComponentVariant } from '@wisp-ui/core/types/Component.types';
export { componentSizes, componentSizeMap, componentVariants } from '@wisp-ui/core/types/Component.types';
```

### 5. Registry (`website/src/registry/{primitives|components}/component-name.tsx`)

```typescript
import React from 'react';
import { Component, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const componentEntry: ComponentEntry = {
  slug: 'component-name',
  name: 'ComponentName',
  category: 'primitives',   // or 'components' or 'layouts'
  description: 'One-line description.',
  variantCount: 3,
  keywords: ['search', 'terms'],

  cardPreview: (
    <div style={{ display: 'flex', gap: 8, pointerEvents: 'none' }}>
      <Component variant="info">Preview</Component>
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: <Component variant="info">Example</Component>,
      code: `import { Component } from '@wisp-ui/react';\n\n<Component variant="info">Example</Component>`,
      rnCode: `import { Component } from '@wisp-ui/react-native';\n\n<Component variant="info">Example</Component>`,
    },
  ],

  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Content.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset.' },
    { name: 'variant', type: "'default' | 'info' | 'success'", default: "'default'", description: 'Color variant.' },
  ],
};
```

**Registry types** (from `website/src/registry/types.ts`):
- `ComponentEntry` — slug, name, category, description, cardPreview, examples, props, keywords
- `ExampleDef` — title, render (JSX), code (string), rnCode (optional string)
- `PropDef` — name, type, default, required, description

---

## Barrel Export Checklist

When adding a component, update these files:

| # | File | What to add |
|---|------|-------------|
| 1 | `packages/core/src/types/index.ts` | `export * from './ComponentName.types'` |
| 2 | `packages/react/src/{primitives\|components}/index.ts` | Component + type + token exports |
| 3 | `packages/react/src/index.ts` | Component + type + token exports |
| 4 | `website/src/registry/{primitives\|components}/index.ts` | Import entry, add to array |

---

## Design Rules

### Colors
- **Monochrome base** — black, white, gray for all base UI
- **Color only for status** — error (red), warning (amber), success (green), info (blue)
- All colors resolve through `useThemeColors()` — never hardcode hex in components

### Semantic Color Variants
Components with text support: primary, secondary, tertiary, disabled, white, inverse, error, warning, success, brand

### Shared Tokens (`packages/core/src/tokens/shared.ts`)
- `TextSize` — 11 steps (xs through display-2xl)
- `FontWeightKey` — regular, medium, semibold, bold
- `SemanticColor` — 10 variants
- `ComponentSize` — xs, sm, md, lg, xl
- `resolveSemanticColor(color, themeColors)` — universal color resolver

### Icons
- Use Lucide React icons
- Pass as component type: `icon={Search}` not `icon={<Search />}`
- Icon sizes: xs=14, sm=16, md=20, lg=24, xl=32
- Default color: `currentColor`

### Animation
- Singleton keyframe injection pattern for CSS animations
- Module-level `let injected = false` guard
- Keyframe names prefixed with `wisp-`

### Component Categories

| Category | React Path | Registry Path |
|----------|-----------|---------------|
| Primitives | `primitives/component-name/` | `registry/primitives/` |
| Components | `components/component-name/` | `registry/components/` |
| Layouts | `layouts/component-name/` | `registry/layouts/` |
