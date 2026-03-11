import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

/** Describes a single selectable segment within a {@link SegmentedControl}. */
export interface SegmentedControlOption {
  /** Unique value identifying this segment. */
  value: string;
  /** Visible label rendered inside the segment button. */
  label: string | React.ReactNode;
  /** Optional icon displayed before the label. */
  icon?: React.ReactNode;
  /**
   * Whether this individual segment is disabled.
   * @default false
   */
  disabled?: boolean;
}

/** Available size presets for the {@link SegmentedControl}. */
export type SegmentedControlSize = 'sm' | 'md' | 'lg';

/** Pixel dimensions derived from a {@link SegmentedControlSize} preset. */
export interface SegmentedControlSizeConfig {
  /** Total height of each segment button in pixels. */
  height: number;
  /** Font size in pixels. */
  fontSize: number;
  /** Horizontal padding in pixels. */
  paddingX: number;
}

/**
 * Maps each {@link SegmentedControlSize} to its corresponding
 * {@link SegmentedControlSizeConfig}.
 */
export const segmentedControlSizeMap: Record<SegmentedControlSize, SegmentedControlSizeConfig> = {
  sm: { height: 28, fontSize: defaultTypography.sizes.xs.fontSize, paddingX: defaultSpacing.md },
  md: { height: 34, fontSize: defaultTypography.sizes.sm.fontSize, paddingX: defaultSpacing.lg },
  lg: { height: 40, fontSize: defaultTypography.sizes.base.fontSize, paddingX: defaultSpacing.lg },
};

/**
 * Props for the {@link SegmentedControl} component.
 *
 * @remarks
 * Supports both controlled (`value` + `onChange`) and uncontrolled
 * (`defaultValue`) usage. The `onChange` and `defaultValue` HTML attributes
 * are omitted from the base `div` props to avoid conflicts.
 */
export interface SegmentedControlProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Array of segment definitions to render. */
  options: SegmentedControlOption[];
  /** Controlled selected value. When set the component is controlled. */
  value?: string;
  /** Initial selected value for uncontrolled mode. */
  defaultValue?: string;
  /** Callback fired when the selected segment changes. Receives the new value string. */
  onChange?: (value: string) => void;
  /**
   * Size preset controlling height, font size, and padding.
   * @default 'md'
   */
  size?: SegmentedControlSize;
  /**
   * When `true` the control stretches to fill its container width.
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Disables all segments.
   * @default false
   */
  disabled?: boolean;
  /** Optional CSS class applied to the root container. */
  className?: string;
  /** Optional inline styles merged onto the root container. */
  style?: React.CSSProperties;
}
