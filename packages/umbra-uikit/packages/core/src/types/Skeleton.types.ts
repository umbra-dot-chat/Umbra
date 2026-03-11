import type React from 'react';

/** Tuple of all supported {@link SkeletonVariant} values. */
export const skeletonVariants = ['text', 'circular', 'rectangular'] as const;

/**
 * Union of supported skeleton shape variants.
 *
 * @remarks
 * Derived from the {@link skeletonVariants} tuple so the two stay in sync automatically.
 */
export type SkeletonVariant = (typeof skeletonVariants)[number];

/** Tuple of all supported {@link SkeletonAnimation} values. */
export const skeletonAnimations = ['pulse', 'wave', 'none'] as const;

/**
 * Union of supported skeleton animation modes.
 *
 * @remarks
 * Derived from the {@link skeletonAnimations} tuple so the two stay in sync automatically.
 */
export type SkeletonAnimation = (typeof skeletonAnimations)[number];

/**
 * Props accepted by the {@link Skeleton} component.
 *
 * @remarks
 * Extends the native `HTMLDivElement` attributes so standard DOM props such as
 * `className`, `id`, and event handlers are forwarded to the root element.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape variant of the skeleton placeholder. @default 'rectangular' */
  variant?: SkeletonVariant;
  /** Explicit width of the skeleton element (number treated as `px`). */
  width?: number | string;
  /** Explicit height of the skeleton element (number treated as `px`). */
  height?: number | string;
  /** Number of text lines to render when `variant` is `'text'`. @default 3 */
  lines?: number;
  /** Height of each individual text line in pixels. @default 16 */
  lineHeight?: number;
  /** Vertical spacing between text lines in pixels. @default 8 */
  lineSpacing?: number;
  /** Border-radius override (number treated as `px`). Falls back to variant-specific defaults. */
  radius?: number | string;
  /** Animation style applied to the placeholder. @default 'pulse' */
  animation?: SkeletonAnimation;
}
