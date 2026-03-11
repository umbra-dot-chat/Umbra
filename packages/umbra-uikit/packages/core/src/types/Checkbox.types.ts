import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import type { ComponentSize } from '../tokens/shared';
import { defaultSpacing} from '../theme/create-theme';

/**
 * Re-exported tuple of valid checkbox size literals.
 *
 * @remarks
 * Alias of {@link ComponentSize} values: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`.
 */
export { componentSizes as checkboxSizes } from '../tokens/shared';

/**
 * Union type representing the available checkbox sizes.
 *
 * @remarks
 * Alias of {@link ComponentSize}: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`.
 */
export type { ComponentSize as CheckboxSize } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Dimension and typography tokens for a single {@link CheckboxSize} step.
 *
 * @remarks
 * Each field maps directly to a CSS property applied by the style builders
 * in {@link ../Checkbox.styles}.
 */
export interface CheckboxSizeConfig {
  /** Width and height of the checkbox square in pixels. */
  boxSize: number;
  /** Border radius of the checkbox square in pixels. */
  borderRadius: keyof ThemeRadii;
  /** Width and height of the checkmark / dash SVG icon in pixels. */
  iconSize: number;
  /** SVG `strokeWidth` for the checkmark / dash path. */
  iconStrokeWidth: number;
  /** Font size for the label text in pixels. */
  labelFontSize: number;
  /** Line-height multiplier for the label text. */
  labelLineHeight: number;
  /** Gap between the checkbox square and the label/description text in pixels. */
  gap: number;
}

/**
 * Lookup from {@link ComponentSize} to the corresponding {@link CheckboxSizeConfig}.
 *
 * @remarks
 * Used internally by the {@link Checkbox} component to resolve pixel
 * dimensions, font sizes, and border radii for each size variant.
 */
export const checkboxSizeMap: Record<ComponentSize, CheckboxSizeConfig> = {
  xs: { boxSize: 14, borderRadius: 'sm', iconSize: 10, iconStrokeWidth: 2.5, labelFontSize: 12, labelLineHeight: 1.33, gap: defaultSpacing.sm },
  sm: { boxSize: 16, borderRadius: 'sm', iconSize: 12, iconStrokeWidth: 2.5, labelFontSize: 13, labelLineHeight: 1.38, gap: defaultSpacing.sm },
  md: { boxSize: 18, borderRadius: 'sm', iconSize: 14, iconStrokeWidth: 2, labelFontSize: 14, labelLineHeight: 1.43, gap: defaultSpacing.sm },
  lg: { boxSize: 20, borderRadius: 'sm', iconSize: 16, iconStrokeWidth: 2, labelFontSize: 15, labelLineHeight: 1.47, gap: defaultSpacing.md },
  xl: { boxSize: 24, borderRadius: 'md', iconSize: 18, iconStrokeWidth: 2, labelFontSize: 16, labelLineHeight: 1.5, gap: defaultSpacing.md } };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Checkbox} component.
 *
 * @remarks
 * Extends native `<label>` HTML attributes (except `onChange`, which is
 * replaced by a boolean callback). The component can operate in controlled
 * mode (via `checked` + `onChange`) or uncontrolled mode (via `defaultChecked`).
 */
export interface CheckboxProps extends Omit<React.HTMLAttributes<HTMLLabelElement>, 'onChange'> {
  /** Controlled checked state. When provided the component enters controlled mode. */
  checked?: boolean;

  /** Initial checked state for uncontrolled mode. @default false */
  defaultChecked?: boolean;

  /** When `true`, displays a horizontal dash instead of a checkmark. @default false */
  indeterminate?: boolean;

  /** Callback fired when the checked state changes. Receives the next `boolean` value. */
  onChange?: (checked: boolean) => void;

  /** Visual size of the checkbox. @default 'md' */
  size?: ComponentSize;

  /** Whether the checkbox is disabled. @default false */
  disabled?: boolean;

  /** Label text or React node rendered beside the checkbox square. */
  label?: React.ReactNode;

  /** Description text rendered below the label in a smaller font. */
  description?: string;

  /** Error state -- renders a danger-colored border around the checkbox square. @default false */
  error?: boolean;

  /** Warning state -- renders a warning-colored border around the checkbox square. @default false */
  warning?: boolean;

  /** Show a skeleton shimmer placeholder instead of the checkbox. @default false */
  skeleton?: boolean;

  /** HTML `name` attribute forwarded to the hidden `<input type="checkbox">`. */
  name?: string;

  /** HTML `value` attribute forwarded to the hidden `<input type="checkbox">`. */
  value?: string;
}
