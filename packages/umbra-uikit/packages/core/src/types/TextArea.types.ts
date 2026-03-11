import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import type { ComponentSize } from '../tokens/shared';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

/**
 * Re-exported tuple of valid textarea size literals.
 *
 * @remarks
 * Alias of {@link ComponentSize} values: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`.
 */
export { componentSizes as textAreaSizes } from '../tokens/shared';

/**
 * Union type representing the available textarea sizes.
 *
 * @remarks
 * Alias of {@link ComponentSize}: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`.
 */
export type { ComponentSize as TextAreaSize } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Dimension and typography tokens for a single {@link TextAreaSize} step.
 *
 * @remarks
 * Each field maps directly to a CSS property applied by the style builders
 * in {@link ../TextArea.styles}.
 */
export interface TextAreaSizeConfig {
  /** Minimum height of the textarea */
  minHeight: number;
  /** Horizontal padding inside the textarea container */
  paddingX: number;
  /** Vertical padding inside the textarea container */
  paddingY: number;
  /** Font size for the textarea text */
  fontSize: number;
  /** Line height multiplier */
  lineHeight: number;
  /** Border radius of the textarea container */
  borderRadius: keyof ThemeRadii;
  /** Font size for the label text */
  labelFontSize: number;
  /** Font size for the hint/error text */
  hintFontSize: number;
}

/**
 * Lookup from {@link ComponentSize} to the corresponding {@link TextAreaSizeConfig}.
 *
 * @remarks
 * Used internally by the {@link TextArea} component to resolve pixel
 * dimensions, font sizes, and border radii for each size variant.
 */
export const textAreaSizeMap: Record<ComponentSize, TextAreaSizeConfig> = {
  xs: { minHeight: 60, paddingX: defaultSpacing.sm, paddingY: defaultSpacing.sm, fontSize: defaultTypography.sizes.xs.fontSize, lineHeight: 1.5, borderRadius: 'md', labelFontSize: 12, hintFontSize: 11 },
  sm: { minHeight: 72, paddingX: defaultSpacing.md, paddingY: defaultSpacing.sm, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 1.5, borderRadius: 'md', labelFontSize: 13, hintFontSize: 12 },
  md: { minHeight: 88, paddingX: defaultSpacing.md, paddingY: defaultSpacing.md, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 1.57, borderRadius: 'md', labelFontSize: 14, hintFontSize: 13 },
  lg: { minHeight: 104, paddingX: defaultSpacing.lg, paddingY: defaultSpacing.md, fontSize: defaultTypography.sizes.base.fontSize, lineHeight: 1.6, borderRadius: 'md', labelFontSize: 15, hintFontSize: 14 },
  xl: { minHeight: 120, paddingX: defaultSpacing.lg, paddingY: defaultSpacing.lg, fontSize: defaultTypography.sizes.base.fontSize, lineHeight: 1.625, borderRadius: 'lg', labelFontSize: 16, hintFontSize: 15 } };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link TextArea} component.
 *
 * @remarks
 * Extends the native `<textarea>` HTML attributes (except `size`, which is
 * replaced by the design-system {@link ComponentSize} scale). All native
 * textarea props such as `placeholder`, `rows`, `maxLength`, `onChange`,
 * etc. are forwarded to the underlying element.
 */
export interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** Visual size of the textarea. @default 'md' */
  size?: ComponentSize;

  /** Label text rendered above the textarea. */
  label?: string;

  /** Hint text rendered below the textarea. Overridden by `error` or `warning` messages when present. */
  hint?: string;

  /**
   * Error state.
   *
   * @remarks
   * When a `string` is provided it renders as an error message below the textarea.
   * When `true` is provided only the danger-colored border is shown.
   */
  error?: string | boolean;

  /**
   * Warning state.
   *
   * @remarks
   * When a `string` is provided it renders as a warning message below the textarea.
   * When `true` is provided only the warning-colored border is shown.
   * Error state takes precedence over warning when both are set.
   */
  warning?: string | boolean;

  /** Stretch to 100 % of the container width. @default false */
  fullWidth?: boolean;

  /** Show a skeleton shimmer placeholder instead of the textarea. @default false */
  skeleton?: boolean;

  /** CSS resize direction of the textarea. @default 'vertical' */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}
