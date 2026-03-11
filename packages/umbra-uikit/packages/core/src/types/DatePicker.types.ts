/**
 * @module DatePicker.types
 * @description Type definitions for the Wisp DatePicker component.
 */

import type { ThemeRadii } from '../theme/types';
import type { HTMLAttributes } from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

/** Available size presets for the DatePicker component. */
export const datePickerSizes = ['sm', 'md', 'lg'] as const;

/** Union of allowed DatePicker size values. */
export type DatePickerSize = (typeof datePickerSizes)[number];

/** Dimensional configuration for a single DatePicker size preset. */
export interface DatePickerSizeConfig {
  /** Total height of the trigger input in pixels. */
  inputHeight: number;
  /** Font size in pixels for the trigger text. */
  fontSize: number;
  /** Size of leading and clear icons in pixels. */
  iconSize: number;
  /** Border radius of the trigger in pixels. */
  borderRadius: keyof ThemeRadii;
  /** Horizontal padding inside the trigger in pixels. */
  paddingX: number;
}

/**
 * Maps each {@link DatePickerSize} to its {@link DatePickerSizeConfig}.
 *
 * @remarks
 * Used internally by the DatePicker component and its style builders to
 * resolve sizing tokens.
 */
export const datePickerSizeMap: Record<DatePickerSize, DatePickerSizeConfig> = {
  sm: { inputHeight: 28, fontSize: defaultTypography.sizes.xs.fontSize, iconSize: 14, borderRadius: 'md', paddingX: defaultSpacing.md },
  md: { inputHeight: 34, fontSize: defaultTypography.sizes.sm.fontSize, iconSize: 16, borderRadius: 'md', paddingX: defaultSpacing.md },
  lg: { inputHeight: 40, fontSize: defaultTypography.sizes.sm.fontSize, iconSize: 18, borderRadius: 'md', paddingX: defaultSpacing.lg } };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link DatePicker} component.
 *
 * @remarks
 * Supports both controlled (`value` + `onChange`) and uncontrolled
 * (`defaultValue`) patterns. Pass `error` as a string to surface an inline
 * validation message, or as `true` to highlight the trigger without a message.
 */
export interface DatePickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /**
   * The currently selected date (controlled).
   * When provided the component is fully controlled.
   */
  value?: Date;
  /**
   * The initially selected date (uncontrolled).
   * Ignored when {@link DatePickerProps.value} is provided.
   */
  defaultValue?: Date;
  /** Callback fired when the user selects or clears a date. */
  onChange?: (date: Date | null) => void;
  /**
   * Visual size variant controlling height, padding, and typography.
   * @default 'md'
   */
  size?: DatePickerSize;
  /**
   * Placeholder text shown when no date is selected.
   * @default 'Select date'
   */
  placeholder?: string;
  /**
   * Date display format string.
   * @default 'MM/DD/YYYY'
   */
  format?: string;
  /** The earliest selectable date. Days before this are disabled. */
  minDate?: Date;
  /** The latest selectable date. Days after this are disabled. */
  maxDate?: Date;
  /** An array of specific dates that should be disabled. */
  disabledDates?: Date[];
  /**
   * Whether the date picker is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * When `true` a pulsing skeleton placeholder is rendered instead of the component.
   * @default false
   */
  skeleton?: boolean;
  /** Label text rendered above the trigger. */
  label?: string;
  /**
   * Error state. Pass `true` for a visual error indicator only, or a `string`
   * to display an inline error message below the trigger.
   */
  error?: string | boolean;
  /**
   * When `true` a clear button is shown when a date is selected.
   * @default true
   */
  clearable?: boolean;
}
