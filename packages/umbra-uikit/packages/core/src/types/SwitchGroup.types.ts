import type React from 'react';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/** Layout direction for option items within a {@link SwitchGroup} or {@link CheckboxGroup}. */
export type SwitchGroupOrientation = 'vertical' | 'horizontal';

/** Describes a single selectable option within a {@link SwitchGroup} or {@link CheckboxGroup}. */
export interface SwitchGroupOption {
  /** Unique value identifier for this option, used in the selected values array. */
  value: string;
  /** Human-readable display label shown beside the toggle or checkbox. */
  label: string;
  /** Optional description text rendered below the label. */
  description?: string;
  /**
   * When `true`, this individual option is non-interactive regardless of the group disabled state.
   * @default false
   */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// SwitchGroup Props
// ---------------------------------------------------------------------------

/**
 * Props for the {@link SwitchGroup} component.
 *
 * @remarks
 * Extends native `HTMLDivElement` attributes with `onChange` and `defaultValue`
 * overridden to accept string-array signatures for multi-select behavior.
 */
export interface SwitchGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Accessible group label rendered above the options. */
  label?: string;
  /** Descriptive text rendered below the group label. */
  description?: string;
  /** Array of option definitions to render as toggle switches. */
  options: SwitchGroupOption[];
  /** Currently selected option values when used as a controlled component. */
  value?: string[];
  /**
   * Initial selected option values when used as an uncontrolled component.
   * @default []
   */
  defaultValue?: string[];
  /** Callback invoked with the updated selected values array whenever selection changes. */
  onChange?: (value: string[]) => void;
  /**
   * Layout direction for the option items.
   * @default 'vertical'
   */
  orientation?: SwitchGroupOrientation;
  /**
   * When `true`, all options in the group are non-interactive.
   * @default false
   */
  disabled?: boolean;
  /** Error message rendered below the options list. */
  error?: string;
}

// ---------------------------------------------------------------------------
// CheckboxGroup Props
// ---------------------------------------------------------------------------

/**
 * Props for the {@link CheckboxGroup} component.
 *
 * @remarks
 * Mirrors {@link SwitchGroupProps} but renders {@link Checkbox} controls
 * instead of Toggle switches.
 */
export interface CheckboxGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Accessible group label rendered above the options. */
  label?: string;
  /** Descriptive text rendered below the group label. */
  description?: string;
  /** Array of option definitions to render as checkboxes. */
  options: SwitchGroupOption[];
  /** Currently selected option values when used as a controlled component. */
  value?: string[];
  /**
   * Initial selected option values when used as an uncontrolled component.
   * @default []
   */
  defaultValue?: string[];
  /** Callback invoked with the updated selected values array whenever selection changes. */
  onChange?: (value: string[]) => void;
  /**
   * Layout direction for the option items.
   * @default 'vertical'
   */
  orientation?: SwitchGroupOrientation;
  /**
   * When `true`, all options in the group are non-interactive.
   * @default false
   */
  disabled?: boolean;
  /** Error message rendered below the options list. */
  error?: string;
}
