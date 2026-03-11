# Wisp Multi-Framework Architecture

> How every component works, what's shared, and what's framework-specific.

## Package Structure

```
packages/
├── core/          @wisp-ui/core      Framework-agnostic foundation
├── react/         @wisp-ui/react     React adapter
├── vue/           @wisp-ui/vue       Vue adapter
├── svelte/        @wisp-ui/svelte    Svelte adapter
├── angular/       @wisp-ui/angular   Angular adapter
├── react-native/  @wisp-ui/react-native  React Native adapter
└── website/       Documentation site with framework switcher
```

---

## How a Component is Structured

Every Wisp component is built from 4 layers. The first 3 are shared across all frameworks (~72% of code). Only the 4th layer is framework-specific (~28%).

### Layer 1: Types (`@wisp-ui/core/types`)

Pure TypeScript interfaces and constants that define the component API.

```
core/src/types/Button.types.ts
├── ButtonVariant        (union type: 'primary' | 'secondary' | ...)
├── ButtonShape          (union type: 'rounded' | 'pill' | 'square')
├── buttonSizeMap        (Record<ComponentSize, ButtonSizeConfig>)
├── shapeRadiusMap        (Record<ButtonShape, number>)
└── ButtonProps          (full props interface)
```

**Used by:** Style builders, logic functions, and every framework adapter.

### Layer 2: Style Builders (`@wisp-ui/core/styles`)

Pure functions that take theme + props and return CSS style objects. Zero framework dependency.

```
core/src/styles/Button.styles.ts
├── resolveVariantColors(variant, themeColors) → VariantColors
├── buildButtonStyle(opts) → CSSStyleObject
├── getDisabledColors(themeColors) → VariantColors
├── getButtonSkeletonStyle(...) → CSSStyleObject
└── getSpinnerStyle(size, color) → CSSStyleObject
```

**Pattern:**
```typescript
import type { CSSStyleObject } from '@wisp-ui/core';

export function buildButtonStyle(opts: {
  size: ComponentSize;
  shape: ButtonShape;
  variantColors: VariantColors;
  // ...
}): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: sizeConfig.height,
    backgroundColor: opts.variantColors.bg,
    // ... pure CSS properties
  };
}
```

**Why this matters:** Every framework uses the exact same style functions. A Button in React, Vue, Svelte, and Angular will produce identical CSS — pixel-perfect parity guaranteed.

### Layer 3: Headless Logic (`@wisp-ui/core/logic`)

Pure state machines for compound components. No framework dependency.

```
core/src/logic/accordion.ts
├── toggleAccordion(config) → string[]
├── normalizeValue(value) → string[]
└── isItemOpen(openValues, itemValue) → boolean
```

Used by compound components (Accordion, Tabs, Dialog, etc.) across all frameworks. The state management logic is identical — only the reactive wiring differs.

### Layer 4: Framework Component (per-framework package)

The thin rendering layer that wires everything together using the framework's native primitives.

| Concern | What it does | Framework-specific? |
|---|---|---|
| Template/JSX | Renders DOM elements | Yes |
| State management | Holds reactive state | Yes |
| Context/DI | Distributes theme, compound state | Yes |
| Event handlers | Responds to user interaction | Yes |
| Style application | Passes style objects to elements | Minimal |
| Ref forwarding | Exposes element refs | Yes |

---

## Shared Foundation (`@wisp-ui/core`)

```
core/src/
├── tokens/      Design tokens (spacing, colors, typography, radii, shadows, etc.)
├── theme/       Theme creation, dark/light palettes, CSS variable injection
├── variants/    Appearance, size, shape, intent, orientation mappings
├── styles/      78 component style builder files
├── types/       80 component type definition files
├── logic/       8 headless state machine files
├── utils/       Style helpers, platform detection, a11y, contrast
├── animation/   Animation presets and constants (data only)
└── types.ts     CSSStyleObject type alias
```

### Design Tokens

All components use the same token system from `core/src/tokens/shared.ts`:

| Token | Values | Used By |
|---|---|---|
| ComponentSize | xs, sm, md, lg, xl | Button, Input, Badge, Toggle, ... |
| TextSize | xs, sm, md, lg, xl, display-xs...2xl | Text |
| FontWeightKey | regular, medium, semibold, bold | Text, Button |
| SemanticColor | primary, secondary, ..., brand | Text, Icon, Button |

### Theme System

Two modes: dark ("ink") and light ("panda"). Theme resolution is pure:

```typescript
import { createTheme } from '@wisp-ui/core/theme';

const theme = createTheme({ mode: 'dark' });
// theme.colors.background.canvas → '#09090B'
// theme.colors.text.primary → '#FAFAFA'
```

CSS variables are injected via `applyCssVars()` — framework providers call this on mount.

### Variant System

Maps semantic names to concrete style values:

```typescript
import { getAppearanceColors } from '@wisp-ui/core/variants';

const colors = getAppearanceColors('primary', themeColors);
// { bg, text, border, hoverBg }
```

---

## Framework Adapters

### How Theme Provision Works

| Framework | Provider Pattern | Consumer Pattern |
|---|---|---|
| React | `<WispProvider>` + `createContext` | `useTheme()` / `useThemeColors()` |
| Vue | `<WispProvider>` + `provide()` | `useTheme()` composable via `inject()` |
| Svelte | `<WispProvider>` + `setContext()` | `getThemeColors()` via `getContext()` |
| Angular | `WispThemeService` (`@Injectable`) | `inject(WispThemeService)` |
| React Native | `<WispProvider>` + `createContext` | `useTheme()` / `useThemeColors()` |

### How Compound Components Work

Compound components (Accordion, Tabs, Dialog, etc.) share state between parent and children using framework-native context:

1. **Core logic** (pure functions) lives in `@wisp-ui/core/logic`
2. **Parent component** creates state + provides context
3. **Child components** read context + call core logic functions

| Pattern | React | Vue | Svelte | Angular |
|---|---|---|---|---|
| Parent state | createContext + useState | provide + ref() | setContext + $state | Injectable service |
| Child reads | useContext() | inject() | getContext() | inject() |
| State logic | `@wisp-ui/core/logic` | Same | Same | Same |

### Icon Strategy

Each framework uses its native Lucide package:

| Framework | Package |
|---|---|
| React | lucide-react |
| Vue | lucide-vue-next |
| Svelte | lucide-svelte |
| Angular | lucide-angular |
| React Native | lucide-react-native |

Components accept icons as framework-native elements (React nodes, Vue slots, Svelte slots, Angular content projection).

---

## Adding a New Component

1. **Define types** in `core/src/types/NewComponent.types.ts`
   - Export variant unions, size maps, base prop interfaces

2. **Build styles** in `core/src/styles/NewComponent.styles.ts`
   - Pure functions: `buildNewComponentStyle(opts) → CSSStyleObject`
   - Import theme colors and tokens from core

3. **Extract logic** (if compound) in `core/src/logic/new-component.ts`
   - Pure state machine functions

4. **Implement per framework:**
   - React: `react/src/components/NewComponent.tsx`
   - Vue: `vue/src/components/NewComponent.vue`
   - Svelte: `svelte/src/components/NewComponent.svelte`
   - Angular: `angular/src/components/new-component.component.ts`

5. **Update barrel exports** in each package

6. **Add documentation** with framework-tabbed code examples

---

## Code Reuse Breakdown

| Layer | Shared? | Approx % |
|---|---|---|
| Design tokens | 100% shared | ~5% |
| Theme system | 100% shared | ~5% |
| Variant mappings | 100% shared | ~3% |
| Style builders | 100% shared | ~30% |
| Base type definitions | 100% shared | ~10% |
| Headless state logic | 100% shared | ~12% |
| Utils / a11y / contrast | 100% shared | ~5% |
| Animation presets | 100% shared | ~2% |
| **Total shared** | | **~72%** |
| Framework components | Per-framework | ~20% |
| Framework providers | Per-framework | ~5% |
| Tests & stories | Per-framework | ~3% |
| **Total framework-specific** | | **~28%** |
