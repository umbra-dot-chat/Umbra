/**
 * @module Button
 */
import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import type { ComponentSize } from '../tokens/shared';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// Re-export shared tokens
export { componentSizes as buttonSizes } from '../tokens/shared';
export type { ComponentSize as ButtonSize } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Appearance variants
// ---------------------------------------------------------------------------

/**
 * All supported button appearance variants as a readonly tuple.
 *
 * @remarks
 * Includes monochrome variants (`primary`, `secondary`, `tertiary`) and
 * status variants (`destructive`, `success`, `warning`, `info`) with solid,
 * outline, and ghost sub-variants where applicable.
 */
export const buttonVariants = [
  'primary',
  'secondary',
  'tertiary',
  'destructive',
  'destructive-outline',
  'destructive-ghost',
  'success',
  'success-outline',
  'success-ghost',
  'warning',
  'warning-outline',
  'warning-ghost',
  'info-ghost',
  'brand',
  'brand-outline',
  'brand-ghost',
] as const;

/**
 * Union type derived from {@link buttonVariants}.
 * Represents every valid appearance variant for the Button primitive.
 */
export type ButtonVariant = (typeof buttonVariants)[number];

// ---------------------------------------------------------------------------
// Shape variants
// ---------------------------------------------------------------------------

/**
 * All supported button shape variants as a readonly tuple.
 *
 * @remarks
 * - `rounded` -- standard border-radius (8 px).
 * - `pill` -- fully rounded ends (9999 px radius).
 * - `square` -- sharp corners (0 px radius).
 */
export const buttonShapes = ['rounded', 'pill', 'square'] as const;

/**
 * Union type derived from {@link buttonShapes}.
 * Represents every valid shape for the Button primitive.
 */
export type ButtonShape = (typeof buttonShapes)[number];

// ---------------------------------------------------------------------------
// Shape -> border-radius map
// ---------------------------------------------------------------------------

/**
 * Maps each {@link ButtonShape} to its corresponding CSS `border-radius` value in pixels.
 */
export const shapeRadiusMap: Record<ButtonShape, keyof ThemeRadii> = {
  rounded: 'md',
  pill: 'full',
  square: 'none',
};

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Dimension and typography tokens for a single button size step.
 *
 * @remarks
 * Used by {@link buildButtonStyle} in `Button.styles.ts` to produce the
 * complete inline style object for the rendered `<button>` element.
 */
export interface ButtonSizeConfig {
  /** Overall button height in pixels. */
  height: number;
  /** Horizontal padding in pixels. */
  paddingX: number;
  /** Vertical padding in pixels. */
  paddingY: number;
  /** Font size in pixels for the button label. */
  fontSize: number;
  /** Line height in pixels for the button label. */
  lineHeight: number;
  /** Width and height in pixels for left/right icon slots. */
  iconSize: number;
  /** Gap in pixels between icon and label. */
  gap: number;
  /** Padding in pixels applied when the button is in icon-only mode (no children). */
  iconOnlyPadding: number;
}

/**
 * Maps each {@link ComponentSize} to its {@link ButtonSizeConfig} dimension tokens.
 *
 * @remarks
 * Provides five size steps from `xs` (28 px tall) through `xl` (48 px tall).
 */
export const buttonSizeMap: Record<ComponentSize, ButtonSizeConfig> = {
  xs: { height: 28, paddingX: defaultSpacing.md, paddingY: defaultSpacing.xs, fontSize: defaultTypography.sizes.xs.fontSize, lineHeight: 18, iconSize: 14, gap: defaultSpacing.xs, iconOnlyPadding: 6 },
  sm: { height: 32, paddingX: defaultSpacing.md, paddingY: defaultSpacing.sm, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 20, iconSize: 16, gap: defaultSpacing.sm, iconOnlyPadding: 7 },
  md: { height: 36, paddingX: defaultSpacing.lg, paddingY: defaultSpacing.sm, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 20, iconSize: 16, gap: defaultSpacing.sm, iconOnlyPadding: 9 },
  lg: { height: 40, paddingX: defaultSpacing.lg, paddingY: defaultSpacing.md, fontSize: defaultTypography.sizes.base.fontSize, lineHeight: 24, iconSize: 20, gap: defaultSpacing.sm, iconOnlyPadding: 9 },
  xl: { height: 48, paddingX: defaultSpacing.xl, paddingY: defaultSpacing.md, fontSize: defaultTypography.sizes.base.fontSize, lineHeight: 24, iconSize: 20, gap: defaultSpacing.sm, iconOnlyPadding: 13 },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Button} component.
 *
 * @remarks
 * Extends native `<button>` HTML attributes (excluding `disabled`, which is
 * re-declared here for tighter typing). All props are optional; sensible
 * defaults produce a medium, rounded, primary button.
 */
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  /** Button content (label text or arbitrary React nodes). */
  children?: React.ReactNode;

  /**
   * Appearance variant controlling background, text, and border colors.
   * @default 'primary'
   */
  variant?: ButtonVariant;

  /**
   * When `true`, adapts secondary and tertiary variants for dark / raised
   * surfaces (e.g. inside Dialogs, Popovers, Sheets). Uses light text and
   * borders instead of canvas-level tokens.
   * @default false
   */
  onSurface?: boolean;

  /**
   * Button size controlling height, padding, font size, and icon dimensions.
   * @default 'md'
   */
  size?: ComponentSize;

  /**
   * Button shape controlling border-radius.
   * @default 'rounded'
   */
  shape?: ButtonShape;

  /** Icon rendered before the text content. Use the Wisp {@link Icon} primitive. */
  iconLeft?: React.ReactNode;

  /** Icon rendered after the text content. Use the Wisp {@link Icon} primitive. */
  iconRight?: React.ReactNode;

  /**
   * When `true`, shows a spinning indicator and disables interaction.
   * The label is dimmed but still visible to communicate ongoing activity.
   * @default false
   */
  isLoading?: boolean;

  /**
   * Disabled state -- applies muted colors and `cursor: not-allowed`.
   * @default false
   */
  disabled?: boolean;

  /**
   * When `true`, the button stretches to 100 % of its container width.
   * @default false
   */
  fullWidth?: boolean;

  /**
   * When `true`, renders a skeleton shimmer placeholder instead of the button.
   * Useful for loading / suspense states.
   * @default false
   */
  skeleton?: boolean;

  /**
   * When `true`, plays a repeating outward pulse animation as a call-to-action.
   * The pulse radiates outward from the button edges using the variant's accent color.
   * @default false
   */
  pulse?: boolean;
}
