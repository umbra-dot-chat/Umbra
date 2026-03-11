/**
 * @module @wisp-ui/core
 * @description Root barrel export for the Wisp UI core package.
 *
 * Re-exports every public API surface: design tokens, theme system,
 * variant definitions, component styles, component types, animation
 * presets, and utility functions.
 *
 * @example
 * ```ts
 * // Design tokens
 * import { colors, spacing, radii } from '@wisp-ui/core';
 *
 * // Theme
 * import { createTheme, darkColors, lightColors } from '@wisp-ui/core';
 *
 * // Variants
 * import { type Appearance, type Size, appearances } from '@wisp-ui/core';
 *
 * // Component styles & types
 * import { getButtonStyles } from '@wisp-ui/core';
 * import type { ButtonProps } from '@wisp-ui/core';
 *
 * // Animation
 * import { fadeIn, DEFAULT_DURATION } from '@wisp-ui/core';
 *
 * // Utilities
 * import { isWeb, contrastRatio } from '@wisp-ui/core';
 * ```
 */

// ---------------------------------------------------------------------------
// Framework-agnostic type aliases
// ---------------------------------------------------------------------------

export type { CSSStyleObject } from './types.js';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

export * from './tokens/index';

// ---------------------------------------------------------------------------
// Theme system
// ---------------------------------------------------------------------------

export * from './theme/index';

// ---------------------------------------------------------------------------
// Variant definitions
// ---------------------------------------------------------------------------

export * from './variants/index';

// ---------------------------------------------------------------------------
// Component styles
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Component types
// ---------------------------------------------------------------------------

export * from './types/index';

// ---------------------------------------------------------------------------
// Animation presets & constants
// ---------------------------------------------------------------------------

export * from './animation/index';

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

export * from './utils/index';
