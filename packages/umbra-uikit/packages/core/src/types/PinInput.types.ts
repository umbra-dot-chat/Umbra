/**
 * @module primitives/pin-input
 * @description Type definitions for the Wisp PinInput primitive.
 *
 * PinInput renders a row of single-character input cells for entering
 * verification codes, OTPs, or PINs. Supports numeric-only and
 * alphanumeric modes, auto-advance, paste handling, and masked display.
 */

import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import type { ComponentSize } from '../tokens/shared';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

/** Re-export of shared component size constants scoped to PinInput. */
export { componentSizes as pinInputSizes } from '../tokens/shared';

/** Re-export of the shared component size union scoped to PinInput. */
export type { ComponentSize as PinInputSize } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Input type
// ---------------------------------------------------------------------------

/** Restricts which characters are accepted by each cell. */
export const pinInputTypes = ['number', 'text'] as const;

/** Input mode: `'number'` for digits only, `'text'` for alphanumeric. */
export type PinInputType = (typeof pinInputTypes)[number];

// ---------------------------------------------------------------------------
// Size configuration
// ---------------------------------------------------------------------------

/** Dimension values for a single size preset. */
export interface PinInputSizeConfig {
  /** Width and height of each cell (square). */
  cellSize: number;
  /** Font size for the character inside each cell. */
  fontSize: number;
  /** Border radius of each cell. */
  borderRadius: keyof ThemeRadii;
  /** Horizontal gap between cells. */
  gap: number;
  /** Font size for the label text above. */
  labelFontSize: number;
  /** Font size for the hint/error text below. */
  hintFontSize: number;
}

/**
 * Maps each {@link PinInputSize} to its corresponding dimension values.
 *
 * @remarks
 * Used by style builders in `PinInput.styles.ts` to resolve cell
 * dimensions, gaps, border radii, and typography sizes.
 */
export const pinInputSizeMap: Record<ComponentSize, PinInputSizeConfig> = {
  xs: { cellSize: 28, fontSize: defaultTypography.sizes.sm.fontSize, borderRadius: 'md', gap: defaultSpacing.sm, labelFontSize: 12, hintFontSize: 11 },
  sm: { cellSize: 34, fontSize: defaultTypography.sizes.base.fontSize, borderRadius: 'md', gap: defaultSpacing.sm, labelFontSize: 13, hintFontSize: 12 },
  md: { cellSize: 40, fontSize: defaultTypography.sizes.lg.fontSize, borderRadius: 'md', gap: defaultSpacing.sm, labelFontSize: 14, hintFontSize: 13 },
  lg: { cellSize: 48, fontSize: defaultTypography.sizes['2xl'].fontSize, borderRadius: 'md', gap: defaultSpacing.md, labelFontSize: 15, hintFontSize: 14 },
  xl: { cellSize: 56, fontSize: defaultTypography.sizes['2xl'].fontSize, borderRadius: 'lg', gap: defaultSpacing.md, labelFontSize: 16, hintFontSize: 15 } };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for the {@link PinInput} component. */
export interface PinInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Number of input cells. @default 6 */
  length?: number;

  /** Cell and typography size preset. @default 'md' */
  size?: ComponentSize;

  /** Input mode: `'number'` for digits only, `'text'` for alphanumeric. @default 'number' */
  type?: PinInputType;

  /** Controlled value — a string of length ≤ `length`. */
  value?: string;

  /** Initial value for uncontrolled mode. */
  defaultValue?: string;

  /** Called whenever the value changes. Receives the full string. */
  onChange?: (value: string) => void;

  /** Called when every cell is filled. Receives the complete string. */
  onComplete?: (value: string) => void;

  /** Label text rendered above the cells. */
  label?: string;

  /** Hint text rendered below the cells. */
  hint?: string;

  /** Error state — string shows as error message, boolean just shows error border. */
  error?: string | boolean;

  /** Warning state — string shows as warning message, boolean just shows warning border. */
  warning?: string | boolean;

  /** Auto-focus the first cell on mount. @default false */
  autoFocus?: boolean;

  /** Disables all cells. @default false */
  disabled?: boolean;

  /** Show skeleton loading placeholder. @default false */
  skeleton?: boolean;

  /** Mask entered characters (show dots instead). @default false */
  mask?: boolean;

  /** Placeholder character for empty cells. @default '' */
  placeholder?: string;
}
