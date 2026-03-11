/**
 * @module Stepper
 */
import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import { defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Size subset -- Stepper supports sm | md | lg
// ---------------------------------------------------------------------------

/** Available size variants for the {@link Stepper} primitive. */
export const stepperSizes = ['sm', 'md', 'lg'] as const;

/** Union of supported Stepper size values. */
export type StepperSize = (typeof stepperSizes)[number];

// ---------------------------------------------------------------------------
// Size config
// ---------------------------------------------------------------------------

/**
 * Dimension tokens for a single stepper size step.
 *
 * @remarks
 * Consumed by the style builder functions in `Stepper.styles.ts` to produce
 * container, button, and value display inline styles.
 */
export interface StepperSizeConfig {
  /** Overall height of the stepper container in pixels. */
  height: number;
  /** Width (and height) of each increment/decrement button in pixels. */
  buttonWidth: number;
  /** Font size for the numeric value display in pixels. */
  fontSize: number;
  /** Icon size for the +/- SVG icons in pixels. */
  iconSize: number;
  /** Border radius for the outer container in pixels. */
  borderRadius: keyof ThemeRadii;
  /** Gap between child elements in pixels. */
  gap: number;
}

/**
 * Maps each {@link StepperSize} to its standard {@link StepperSizeConfig}.
 *
 * @remarks
 * Provides three size steps from `sm` (28 px tall) through `lg` (40 px tall).
 */
export const stepperSizeMap: Record<StepperSize, StepperSizeConfig> = {
  sm: { height: 28, buttonWidth: 28, fontSize: defaultTypography.sizes.sm.fontSize, iconSize: 14, borderRadius: 'md', gap: 0 },
  md: { height: 34, buttonWidth: 34, fontSize: defaultTypography.sizes.sm.fontSize, iconSize: 16, borderRadius: 'md', gap: 0 },
  lg: { height: 40, buttonWidth: 40, fontSize: defaultTypography.sizes.base.fontSize, iconSize: 18, borderRadius: 'md', gap: 0 } };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the {@link Stepper} component.
 *
 * @remarks
 * Extends the native `HTMLDivElement` attributes with `onChange` overridden
 * to accept a numeric signature. Supports both controlled (`value` + `onChange`)
 * and uncontrolled (`defaultValue`) modes.
 */
export interface StepperProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Current numeric value when used as a controlled component. */
  value?: number;

  /**
   * Initial value when used as an uncontrolled component.
   * @default 0
   */
  defaultValue?: number;

  /** Minimum allowed value. The stepper clamps below this bound. */
  min?: number;

  /** Maximum allowed value. The stepper clamps above this bound. */
  max?: number;

  /**
   * Amount to increment or decrement per step.
   * @default 1
   */
  step?: number;

  /**
   * Size variant controlling height, font size, and button dimensions.
   * @default 'md'
   */
  size?: StepperSize;

  /** Callback invoked with the clamped numeric value whenever it changes. */
  onChange?: (value: number) => void;

  /**
   * When `true`, the stepper buttons are non-interactive.
   * @default false
   */
  disabled?: boolean;

  /**
   * When `true`, the value is displayed but buttons are non-interactive.
   * @default false
   */
  readOnly?: boolean;

  /**
   * When `true`, renders a skeleton shimmer placeholder instead of the stepper.
   * @default false
   */
  skeleton?: boolean;
}
