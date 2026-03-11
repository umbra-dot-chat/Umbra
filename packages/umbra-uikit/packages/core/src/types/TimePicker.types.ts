import type { ThemeRadii } from '../theme/types';
import type { HTMLAttributes } from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// TimePicker Size
// ---------------------------------------------------------------------------

/**
 * Available size tokens for the {@link TimePicker} component.
 *
 * @remarks
 * Three sizes cover the majority of layout needs: `sm` for compact UIs,
 * `md` as the default, and `lg` for spacious / touch-friendly contexts.
 */
export const timePickerSizes = ['sm', 'md', 'lg'] as const;

/**
 * Union of valid TimePicker size token strings.
 *
 * @remarks
 * Derived from the {@link timePickerSizes} tuple.
 */
export type TimePickerSize = (typeof timePickerSizes)[number];

// ---------------------------------------------------------------------------
// TimePicker Size Config
// ---------------------------------------------------------------------------

/**
 * Size configuration values used to derive dimensions and typography for a
 * specific {@link TimePicker} size variant.
 */
export interface TimePickerSizeConfig {
  /** Total height of the trigger input in pixels. */
  inputHeight: number;
  /** Font size for the trigger and option text in pixels. */
  fontSize: number;
  /** Size of the clock icon in pixels. */
  iconSize: number;
  /** Border radius of the trigger in pixels. */
  borderRadius: keyof ThemeRadii;
  /** Horizontal padding inside the trigger in pixels. */
  paddingX: number;
  /** Width of each column (hours, minutes, AM/PM) in the dropdown in pixels. */
  columnWidth: number;
}

/**
 * Pre-defined size configurations keyed by {@link TimePickerSize}.
 *
 * @remarks
 * Maps each size token to a complete {@link TimePickerSizeConfig}
 * used for layout and typography calculations.
 */
export const timePickerSizeMap: Record<TimePickerSize, TimePickerSizeConfig> = {
  sm: { inputHeight: 28, fontSize: defaultTypography.sizes.xs.fontSize, iconSize: 14, borderRadius: 'md', paddingX: defaultSpacing.md, columnWidth: 48 },
  md: { inputHeight: 34, fontSize: defaultTypography.sizes.sm.fontSize, iconSize: 16, borderRadius: 'md', paddingX: defaultSpacing.md, columnWidth: 56 },
  lg: { inputHeight: 40, fontSize: defaultTypography.sizes.sm.fontSize, iconSize: 18, borderRadius: 'md', paddingX: defaultSpacing.lg, columnWidth: 64 } };

// ---------------------------------------------------------------------------
// TimePicker Format
// ---------------------------------------------------------------------------

/**
 * Time display format for the {@link TimePicker} component.
 *
 * - `'12h'` -- 12-hour format with AM/PM column (default).
 * - `'24h'` -- 24-hour format without AM/PM.
 */
export type TimePickerFormat = '12h' | '24h';

// ---------------------------------------------------------------------------
// TimePicker Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link TimePicker} component.
 *
 * @remarks
 * Supports both controlled (`value` + `onChange`) and uncontrolled
 * (`defaultValue`) patterns. The `value` and emitted `onChange` strings
 * always use 24-hour format (`"HH:MM"`) regardless of the display format.
 *
 * Pass `error` as a string to surface an inline validation message, or
 * as `true` to highlight the trigger without a message.
 */
export interface TimePickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /**
   * Controlled time value in 24-hour format (e.g. `"14:30"`).
   * When provided the component is fully controlled.
   */
  value?: string;

  /**
   * Initial time value for uncontrolled usage in 24-hour format.
   *
   * @remarks
   * Ignored when {@link TimePickerProps.value} is provided.
   */
  defaultValue?: string;

  /**
   * Callback fired when the user selects a time.
   * Receives a 24-hour formatted string (e.g. `"14:30"`).
   */
  onChange?: (time: string) => void;

  /**
   * Visual size variant controlling height, padding, and typography.
   *
   * @default 'md'
   */
  size?: TimePickerSize;

  /**
   * Time display format.
   *
   * @default '12h'
   */
  format?: TimePickerFormat;

  /**
   * Minute step interval. Only minutes divisible by this value are shown.
   *
   * @default 1
   */
  minuteStep?: number;

  /**
   * Placeholder text shown when no time is selected.
   *
   * @default 'Select time'
   */
  placeholder?: string;

  /**
   * Whether the time picker is disabled.
   *
   * @default false
   */
  disabled?: boolean;

  /**
   * When `true` a pulsing skeleton placeholder is rendered instead of the component.
   *
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
}
