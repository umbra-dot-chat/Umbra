/**
 * Type definitions for the Wisp FormField layout primitive.
 *
 * @remarks
 * FormField wraps a form control (Input, Select, etc.) with a label,
 * optional description, and error message in a consistent layout.
 * Supports both vertical and horizontal orientations.
 *
 * @module primitives/form-field
 */

import type React from 'react';
import { defaultSpacing } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Size variants
// ---------------------------------------------------------------------------

/** Allowed size variant tokens for a {@link FormField}. */
export const formFieldSizes = ['sm', 'md', 'lg'] as const;
/** Union of {@link formFieldSizes} values. */
export type FormFieldSize = (typeof formFieldSizes)[number];

// ---------------------------------------------------------------------------
// Orientation
// ---------------------------------------------------------------------------

/** Allowed label-placement orientations for a {@link FormField}. */
export const formFieldOrientations = ['vertical', 'horizontal'] as const;
/** Union of {@link formFieldOrientations} values. */
export type FormFieldOrientation = (typeof formFieldOrientations)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the {@link FormField} component.
 *
 * @remarks
 * Extends standard `div` HTML attributes (excluding `children`) and adds
 * label, description, error, size, and orientation controls.
 */
export interface FormFieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The form control element (Input, Select, TextArea, etc.) */
  children: React.ReactNode;

  /** Label text displayed above or beside the control. */
  label?: React.ReactNode;

  /** Helper text displayed below the control. */
  description?: string;

  /** Error message — replaces description when present. */
  error?: string;

  /** Show a required indicator (*) next to the label. @default false */
  required?: boolean;

  /** Disable the field visually. @default false */
  disabled?: boolean;

  /** Size variant affecting label/hint text sizes. @default 'md' */
  size?: FormFieldSize;

  /** Label placement. @default 'vertical' */
  orientation?: FormFieldOrientation;

  /** Width of the label column in horizontal orientation. @default 120 */
  labelWidth?: string | number;

  /**
   * When `true`, adapts label and hint colors for dark / raised surfaces
   * (e.g. inside Dialogs, Popovers, Sheets). Uses `text.onRaised` and
   * `text.onRaisedSecondary` instead of canvas-level text colors.
   * @default false
   */
  onSurface?: boolean;
}

// ---------------------------------------------------------------------------
// Size config
// ---------------------------------------------------------------------------

/**
 * Resolved size configuration for a single {@link FormFieldSize} variant.
 *
 * @remarks
 * Each property is a pixel value used by the style builders in
 * {@link module:primitives/form-field | FormField.styles}.
 */
export interface FormFieldSizeConfig {
  /** Label font size in pixels. */
  labelFontSize: number;
  /** Hint / error font size in pixels. */
  hintFontSize: number;
  /** Vertical gap between label, control, and hint in pixels. */
  gap: number;
}

/** Map from {@link FormFieldSize} token to its resolved {@link FormFieldSizeConfig}. */
export const formFieldSizeMap: Record<FormFieldSize, FormFieldSizeConfig> = {
  sm: { labelFontSize: 12, hintFontSize: 11, gap: defaultSpacing.xs },
  md: { labelFontSize: 14, hintFontSize: 12, gap: defaultSpacing.sm },
  lg: { labelFontSize: 16, hintFontSize: 14, gap: defaultSpacing.sm },
};
