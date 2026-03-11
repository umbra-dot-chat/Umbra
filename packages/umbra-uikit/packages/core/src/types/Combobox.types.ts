import type React from 'react';
import type { ComponentSize, SurfaceVariant } from '../tokens/shared';

export { componentSizes as comboboxSizes } from '../tokens/shared';
export type { ComponentSize as ComboboxSize } from '../tokens/shared';

/**
 * Describes a single option rendered inside the {@link Combobox} dropdown.
 *
 * @remarks
 * Each option must have a unique `value`. An optional `icon` and `description`
 * provide richer visual representations in both the trigger and the dropdown.
 */
export interface ComboboxOption {
  /** Unique value for the option. */
  value: string;
  /** Display label for the option. Also used for type-ahead filtering. */
  label: string;
  /** Secondary text shown to the right of the label (e.g. "@handle", metadata). */
  description?: string;
  /** Leading icon or avatar rendered before the label. Accepts any React node (e.g. Lucide icon, Avatar). */
  icon?: React.ReactNode;
  /** Whether the option is disabled. */
  disabled?: boolean;
}

/**
 * Props accepted by the {@link Combobox} component.
 *
 * @remarks
 * Supports both controlled (`value` + `onChange`) and uncontrolled
 * (`defaultValue`) patterns. The input field performs case-insensitive
 * substring filtering against option labels as the user types.
 *
 * Pass `error` as a string to surface an inline validation message, or as
 * `true` to highlight the trigger without a message.
 */
export interface ComboboxProps {
  /** Controlled selected value. When provided the component is fully controlled. */
  value?: string;
  /**
   * Initial value for uncontrolled usage.
   *
   * @remarks
   * Ignored when {@link ComboboxProps.value} is provided.
   */
  defaultValue?: string;
  /** Callback fired when the user selects an option. Receives the option's `value`. */
  onChange?: (value: string) => void;
  /** Array of {@link ComboboxOption} items to display in the dropdown. */
  options: ComboboxOption[];
  /**
   * Placeholder text shown inside the input when no value is selected.
   *
   * @default ''
   */
  placeholder?: string;
  /**
   * Visual size variant controlling height, padding, and typography.
   *
   * @default 'md'
   */
  size?: ComponentSize;
  /** Label text rendered above the trigger. */
  label?: string;
  /** Hint text rendered below the trigger. Replaced by the error message when an error is active. */
  hint?: string;
  /**
   * Error state. Pass `true` for a visual error indicator only, or a `string`
   * to display an inline error message that replaces the hint.
   */
  error?: string | boolean;
  /**
   * Whether the combobox is disabled.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * When `true` the component stretches to fill its container width.
   *
   * @default false
   */
  fullWidth?: boolean;
  /**
   * When `true` a pulsing skeleton placeholder is rendered instead of the component.
   *
   * @default false
   */
  skeleton?: boolean;
  /**
   * Message displayed when the filter produces zero matching options.
   *
   * @default 'No results found'
   */
  emptyMessage?: string;
  /** Leading icon shown in the trigger (static). When an option with an `icon` is selected, the option's icon is shown instead. */
  leadingIcon?: React.ReactNode;
  /** Additional CSS class applied to the outermost wrapper element. */
  className?: string;
  /** Inline styles merged onto the outermost wrapper element. */
  style?: React.CSSProperties;
  /** Surface variant. @default 'solid' */
  variant?: SurfaceVariant;
}
