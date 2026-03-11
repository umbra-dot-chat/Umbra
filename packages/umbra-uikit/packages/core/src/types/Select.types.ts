import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import type { ComponentSize, SurfaceVariant } from '../tokens/shared';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

export { componentSizes as selectSizes } from '../tokens/shared';
export type { ComponentSize as SelectSize } from '../tokens/shared';

/**
 * Describes a single option rendered inside the {@link Select} dropdown.
 *
 * @remarks
 * Each option must have a unique `value`. An optional `icon` and `description`
 * provide richer visual representations in both the trigger and the dropdown.
 */
export interface SelectOption {
  /** Unique value for the option. */
  value: string;
  /** Display label for the option. */
  label: string;
  /** Secondary text shown to the right of the label (e.g. "@handle", metadata). */
  description?: string;
  /** Leading icon or avatar rendered before the label. Accepts any React node (e.g. Lucide icon, Avatar). */
  icon?: React.ReactNode;
  /** Whether the option is disabled. */
  disabled?: boolean;
}

/**
 * Size configuration values used to derive dimensions and typography for a
 * specific {@link Select} size variant.
 */
export interface SelectSizeConfig {
  /** Total height of the trigger button in pixels. */
  height: number;
  /** Horizontal padding inside the trigger in pixels. */
  paddingX: number;
  /** Vertical padding inside the trigger in pixels. */
  paddingY: number;
  /** Font size for the trigger and option text in pixels. */
  fontSize: number;
  /** CSS line-height multiplier for the trigger and option text. */
  lineHeight: number;
  /** Border radius of the trigger button in pixels. */
  borderRadius: keyof ThemeRadii;
  /** Size of leading and chevron icons in pixels. */
  iconSize: number;
  /** Font size for the label text in pixels. */
  labelFontSize: number;
  /** Font size for the hint / error text in pixels. */
  hintFontSize: number;
}

/**
 * Pre-defined size configurations keyed by {@link ComponentSize}.
 *
 * @remarks
 * Maps each size token (`xs` through `xl`) to a complete
 * {@link SelectSizeConfig} used for layout and typography calculations.
 */
export const selectSizeMap: Record<ComponentSize, SelectSizeConfig> = {
  xs: { height: 28, paddingX: defaultSpacing.sm, paddingY: defaultSpacing.xs, fontSize: defaultTypography.sizes.xs.fontSize, lineHeight: 1.33, borderRadius: 'md', iconSize: 14, labelFontSize: 12, hintFontSize: 11 },
  sm: { height: 32, paddingX: defaultSpacing.md, paddingY: defaultSpacing.sm, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 1.38, borderRadius: 'md', iconSize: 16, labelFontSize: 13, hintFontSize: 12 },
  md: { height: 38, paddingX: defaultSpacing.md, paddingY: defaultSpacing.sm, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 1.43, borderRadius: 'md', iconSize: 18, labelFontSize: 14, hintFontSize: 13 },
  lg: { height: 44, paddingX: defaultSpacing.lg, paddingY: defaultSpacing.md, fontSize: defaultTypography.sizes.base.fontSize, lineHeight: 1.47, borderRadius: 'md', iconSize: 20, labelFontSize: 15, hintFontSize: 14 },
  xl: { height: 52, paddingX: defaultSpacing.lg, paddingY: defaultSpacing.md, fontSize: defaultTypography.sizes.base.fontSize, lineHeight: 1.5, borderRadius: 'lg', iconSize: 22, labelFontSize: 16, hintFontSize: 15 } };

/**
 * Props accepted by the {@link Select} component.
 *
 * @remarks
 * Supports both controlled (`value` + `onChange`) and uncontrolled
 * (`defaultValue`) patterns. Pass `error` as a string to surface an inline
 * validation message, or as `true` to highlight the trigger without a message.
 */
export interface SelectProps {
  /** Controlled selected value. When provided the component is fully controlled. */
  value?: string;
  /**
   * Initial value for uncontrolled usage.
   *
   * @remarks
   * Ignored when {@link SelectProps.value} is provided.
   */
  defaultValue?: string;
  /** Callback fired when the user selects an option. Receives the option's `value`. */
  onChange?: (value: string) => void;
  /** Array of {@link SelectOption} items to display in the dropdown. */
  options: SelectOption[];
  /**
   * Placeholder text shown when no option is selected.
   *
   * @default 'Select...'
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
   * Whether the select is disabled.
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
  /** Leading icon shown in the trigger (static). When an option with an `icon` is selected, the option's icon is shown instead. */
  leadingIcon?: React.ReactNode;
  /** Additional CSS class applied to the outermost wrapper element. */
  className?: string;
  /** Inline styles merged onto the outermost wrapper element. */
  style?: React.CSSProperties;
  /** Surface variant. @default 'solid' */
  variant?: SurfaceVariant;
}
