# React Native Component Guide

> Architecture, conventions, and parity status for `@wisp-ui/react-native`.

---

## Architecture

React Native components follow the same **3-layer pattern** as React DOM:

```
packages/core/src/types/Component.types.ts      <- Shared types (reused as-is)
packages/core/src/styles/Component.styles.ts     <- Style builders (reused, filtered)
packages/react-native/src/primitives/component-name/ComponentName.tsx  <- RN rendering
packages/react-native/src/primitives/component-name/index.ts          <- Barrel export
```

**What to reuse from core:**
- Type definitions, variant unions, size maps — import directly
- Color resolver functions (`resolveVariantColors`, `resolveSemanticColor`) — work as-is
- Size config objects (`buttonSizeMap`, `sizeMap`) — work as-is

**What to rewrite for RN:**
- JSX rendering (View/Text/Pressable instead of div/button/input)
- Animations (Animated API instead of CSS transitions/keyframes)
- Shadows (`toRNShadow()` helper instead of CSS box-shadow)
- Some style properties need filtering via `stripWebProps()`

---

## Key Differences from React DOM

| Web (React DOM) | React Native |
|---|---|
| `<button onClick>` | `<Pressable onPress>` |
| `<input onChange>` | `<TextInput onChangeText>` |
| `className` | `style` prop (ViewStyle/TextStyle) |
| CSS `transition`/`animation` | `Animated` API or `LayoutAnimation` |
| `cursor: 'pointer'` | Strip (not supported) |
| `box-shadow` | `toRNShadow()` helper |
| `display: 'flex'` | Default on RN (strip) |
| CSS `gap` | `gap` prop (RN 0.71+) |
| `border-radius` shorthand | Individual `borderRadius` |
| `outline`/`boxSizing` | Strip (use `stripWebProps`) |
| `data-*` attributes | Strip |
| Polymorphic `as` prop | Not applicable |
| `::before`/`::after` | Use extra `<View>` elements |

---

## File Structure

```
packages/react-native/src/
  providers/
    WispProvider.tsx          # Theme context (mode, colors, toggleMode, setMode)
    index.ts
  primitives/
    component-name/
      ComponentName.tsx       # Main implementation
      index.ts                # Re-exports
    index.ts                  # All primitives barrel
  components/
    component-name/
      ComponentName.tsx
      index.ts
    index.ts
  layouts/
    component-name/
      ComponentName.tsx
      index.ts
    index.ts
  hooks/
    useLoading.ts
    useControllable.ts
    usePlatform.ts
    ...
    index.ts
  animation/
    Presence.tsx
    usePressAnimation.ts
    useSpring.ts
    ...
    index.ts
  utils/
    stripWebProps.ts          # Remove CSS-only properties from core style objects
    toRNShadow.ts             # Convert CSS box-shadow to RN shadow props
    index.ts
  index.ts                    # Package barrel
```

---

## Reference Components

### Button (interactive component reference)
- File: `packages/react-native/src/primitives/button/Button.tsx`
- Uses: `Pressable`, `ActivityIndicator`, `forwardRef<View>`, `useMemo`
- Imports core types: `ButtonVariant`, `ButtonShape`, `buttonSizeMap`, `shapeRadiusMap`
- Imports core styles: `resolveVariantColors`, `getDisabledColors`
- Pattern: Computes `baseStyle` via `useMemo`, uses `Pressable` callback style for press states

### Text (display component reference)
- File: `packages/react-native/src/primitives/text/Text.tsx`
- Uses: `RNText`, `View` for icon wrappers, `forwardRef<RNText>`
- Imports core styles: `resolveTextColor`, `sizeMap`
- Pattern: Maps font weights to RN string weights, computes `textStyle` via `useMemo`

### Input (form input reference)
- File: `packages/react-native/src/primitives/input/Input.tsx`
- Uses: `TextInput`, `View` for wrapper, `forwardRef<TextInput>`
- Pattern: Wrapper View with border, TextInput inside, optional label/hint/error Text

### Toggle (animated component reference)
- File: `packages/react-native/src/primitives/toggle/Toggle.tsx`
- Uses: `Pressable`, `Animated.Value`, `Animated.timing` for knob slide
- Pattern: `useRef(new Animated.Value())` for animation, `useEffect` to trigger

---

## Adding a New RN Component

1. **Read the React DOM version** at `packages/react/src/primitives/component-name/`
2. **Read core types** at `packages/core/src/types/Component.types.ts`
3. **Read core styles** at `packages/core/src/styles/Component.styles.ts`
4. **Create** `packages/react-native/src/primitives/component-name/ComponentName.tsx`
   - Import types and size maps from core
   - Import color resolvers from core styles
   - Use `useThemeColors()` from `../../providers`
   - Use `forwardRef` with proper RN ref type (`View`, `TextInput`, `Text`)
   - Filter core style objects through `stripWebProps()` where needed
   - Use `Animated` API for animations, `toRNShadow()` for shadows
5. **Create** `packages/react-native/src/primitives/component-name/index.ts`
6. **Export** from `packages/react-native/src/primitives/index.ts`
7. **Export** from `packages/react-native/src/index.ts`
8. **Create story** at `stories/react-native/ComponentName.stories.tsx`
9. **Typecheck** with `pnpm --filter @wisp-ui/react-native typecheck`

---

## Storybook

Stories use react-native-web for browser-based preview:

```tsx
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from '@wisp-ui/react-native';

const meta: Meta<typeof ComponentName> = {
  title: 'React Native/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
  },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: { /* default props */ },
};
```

Run storybook: `pnpm storybook` (port 6009)

---

## Import Paths

```typescript
// Types (variant unions, size maps, prop interfaces)
import type { ButtonVariant, ButtonShape } from '@wisp-ui/core/types/Button.types';
import { buttonSizeMap, shapeRadiusMap } from '@wisp-ui/core/types/Button.types';

// Style builders (pure functions -> CSSStyleObject)
import { resolveVariantColors } from '@wisp-ui/core/styles/Button.styles';
import { resolveTextColor, sizeMap } from '@wisp-ui/core/styles/Text.styles';

// Shared tokens
import type { ComponentSize, SemanticColor } from '@wisp-ui/core/tokens/shared';
import { resolveSemanticColor } from '@wisp-ui/core/tokens/shared';
```

---

## Parity Status

All 92 components have been implemented across 5 phases:

| Phase | Category | Count | Status |
|-------|----------|-------|--------|
| 1 | Core Primitives (Text, Badge, Button, Input, Toggle) | 5 | Done |
| 2 | Remaining Primitives (form controls, display, feedback) | 24 | Done |
| 3 | Layouts (Stack, Box, Grid, Card, Sidebar, etc.) | 19 | Done |
| 4 | Compound Components (Dialog, Tabs, Table, Calendar, etc.) | 33 | Done |
| 5 | Hooks & Animation (useLoading, useSpring, Presence, etc.) | 11 | Done |

### Storybook Stories Status

- Phase 1: All 5 stories complete
- Phase 2-4: Stories pending (components work, stories not yet written)

### Web-Only Components (no RN equivalent needed)

- `ContextMenu` — relies on right-click, no mobile equivalent
- `Sticky` — uses CSS `position: sticky`, limited on RN (use ScrollView stickyHeaders)

---

## Utility Functions

### `stripWebProps(style)`
Removes CSS-only properties that don't exist in React Native:
- `cursor`, `outline`, `boxSizing`, `boxShadow`, `transition`, `animation`
- `textOverflow`, `whiteSpace`, `WebkitLineClamp`, `WebkitBoxOrient`
- `backdropFilter`, `WebkitBackdropFilter`

### `toRNShadow(boxShadow)`
Converts a CSS `box-shadow` string to React Native shadow properties:
```typescript
const rnShadow = toRNShadow('0 2px 8px rgba(0,0,0,0.15)');
// => { shadowColor: 'rgba(0,0,0,0.15)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4 }
```
