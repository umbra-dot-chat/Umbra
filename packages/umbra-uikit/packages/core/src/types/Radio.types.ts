import type React from 'react';
import type { ComponentSize } from '../tokens/shared';
import { defaultSpacing } from '../theme/create-theme';

/**
 * Ordered tuple of valid radio sizes, re-exported from shared tokens.
 *
 * @remarks
 * Alias of {@link ComponentSize} values: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`.
 */
export { componentSizes as radioSizes } from '../tokens/shared';

/** Union type representing the allowed radio size values. */
export type { ComponentSize as RadioSize } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Dimension configuration for a single radio size tier.
 *
 * @remarks
 * Each property maps directly to a CSS measurement used by the radio
 * indicator circle, its inner dot, and the accompanying label text.
 */
export interface RadioSizeConfig {
  /** Diameter (px) of the outer circle. */
  outerSize: number;
  /** Diameter (px) of the inner dot shown when selected. */
  innerSize: number;
  /** Border width (px) of the outer circle. */
  borderWidth: number;
  /** Font size (px) for the label text. */
  labelFontSize: number;
  /** Unitless CSS `line-height` for the label text. */
  labelLineHeight: number;
  /** Gap (px) between the radio indicator and the label text. */
  gap: number;
}

/**
 * Maps each {@link ComponentSize} to its corresponding {@link RadioSizeConfig}.
 *
 * @remarks
 * Used internally by {@link Radio} and {@link RadioGroup} to derive pixel
 * dimensions for the indicator, dot, and typography at every size tier.
 */
export const radioSizeMap: Record<ComponentSize, RadioSizeConfig> = {
  xs: { outerSize: 14, innerSize: 6, borderWidth: 1.5, labelFontSize: 12, labelLineHeight: 1.33, gap: defaultSpacing.sm },
  sm: { outerSize: 16, innerSize: 7, borderWidth: 1.5, labelFontSize: 13, labelLineHeight: 1.38, gap: defaultSpacing.sm },
  md: { outerSize: 18, innerSize: 8, borderWidth: 2, labelFontSize: 14, labelLineHeight: 1.43, gap: defaultSpacing.sm },
  lg: { outerSize: 20, innerSize: 9, borderWidth: 2, labelFontSize: 15, labelLineHeight: 1.47, gap: defaultSpacing.md },
  xl: { outerSize: 24, innerSize: 10, borderWidth: 2, labelFontSize: 16, labelLineHeight: 1.5, gap: defaultSpacing.md },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the {@link Radio} component.
 *
 * @remarks
 * A `Radio` must be rendered inside a {@link RadioGroup} which provides
 * the shared `value`, `size`, `disabled`, and `error` context.
 */
export interface RadioProps {
  /** Unique string value that identifies this option within the group. */
  value: string;
  /** Primary label rendered beside the radio indicator. Accepts text or JSX. */
  label?: React.ReactNode;
  /** Secondary description rendered below the label in a smaller font. */
  description?: string;
  /**
   * Whether this individual radio is disabled.
   *
   * @remarks
   * Merges with the group-level `disabled` flag -- if either is `true` the radio is disabled.
   *
   * @default false
   */
  disabled?: boolean;
  /** Optional CSS class name applied to the root `<label>` element. */
  className?: string;
  /** Optional inline styles merged onto the root `<label>` element. */
  style?: React.CSSProperties;
}

/**
 * Props for the {@link RadioGroup} component.
 *
 * @remarks
 * Supports both controlled (`value` + `onChange`) and uncontrolled
 * (`defaultValue`) usage patterns. All visual and state props propagate
 * to child {@link Radio} components via React context.
 */
export interface RadioGroupProps {
  /** Currently selected value. Pass this for controlled mode. */
  value?: string;
  /** Initial value used when operating in uncontrolled mode. */
  defaultValue?: string;
  /** Callback invoked with the new value whenever the selection changes. */
  onChange?: (value: string) => void;
  /** HTML `name` attribute applied to every nested `<input type="radio">` for form submission. */
  name?: string;
  /**
   * Size tier applied to every child radio indicator and label.
   *
   * @default 'md'
   */
  size?: ComponentSize;
  /**
   * When `true`, disables every radio in the group.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * When `true`, renders all radio indicators in the error (danger) color.
   *
   * @default false
   */
  error?: boolean;
  /**
   * Layout direction for the radios.
   *
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal';
  /** Child {@link Radio} elements (or any valid React children). */
  children: React.ReactNode;
  /** Optional CSS class name applied to the root `<div>` element. */
  className?: string;
  /** Optional inline styles merged onto the root `<div>` element. */
  style?: React.CSSProperties;
  /** Accessible label for the radiogroup role, announced by screen readers. */
  'aria-label'?: string;
  /**
   * When `true`, renders a pulsing skeleton placeholder instead of interactive radios.
   *
   * @default false
   */
  skeleton?: boolean;
}
