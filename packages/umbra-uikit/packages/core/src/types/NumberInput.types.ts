import type React from 'react';
import type { InputSizeConfig } from './Input.types';

// ---------------------------------------------------------------------------
// Size subset — NumberInput supports sm | md | lg
// ---------------------------------------------------------------------------

/** Available size variants for the {@link NumberInput} primitive. */
export const numberInputSizes = ['sm', 'md', 'lg'] as const;

/** Union of supported NumberInput size values. */
export type NumberInputSize = (typeof numberInputSizes)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the {@link NumberInput} component.
 *
 * @remarks
 * Extends the native `HTMLDivElement` attributes with `onChange` and
 * `defaultValue` overridden to accept numeric signatures. Supports both
 * controlled (`value` + `onChange`) and uncontrolled (`defaultValue`) modes.
 */
export interface NumberInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Current numeric value when used as a controlled component. */
  value?: number;

  /**
   * Initial value when used as an uncontrolled component.
   * @default 0
   */
  defaultValue?: number;

  /** Callback invoked with the clamped numeric value whenever it changes. */
  onChange?: (value: number) => void;

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
  size?: NumberInputSize;

  /**
   * When `true`, the input and stepper buttons are non-interactive.
   * @default false
   */
  disabled?: boolean;

  /**
   * When `true`, applies error styling to the container border.
   * @default false
   */
  error?: boolean;

  /** Placeholder text displayed when the input value is empty. */
  placeholder?: string;

  /**
   * When `true`, the component stretches to fill its parent width.
   * @default false
   */
  fullWidth?: boolean;

  /** Accessible label rendered above the input. */
  label?: string;

  /** Hint or helper text rendered below the input. */
  hint?: string;
}
