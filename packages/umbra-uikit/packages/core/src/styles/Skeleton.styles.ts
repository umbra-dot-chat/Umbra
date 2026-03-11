import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { SkeletonAnimation } from '../types/Skeleton.types';

// ---------------------------------------------------------------------------
// Keyframe injection -- inject once per document
// ---------------------------------------------------------------------------

let skeletonStyleInjected = false;

/**
 * Inject the skeleton CSS `@keyframes` into the document `<head>` once.
 *
 * @remarks
 * Subsequent calls are no-ops. Safe to call in SSR environments where
 * `document` is undefined -- the function simply returns early.
 */
export function ensureSkeletonKeyframes(): void {
  if (skeletonStyleInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = [
    '@keyframes wisp-skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }',
    '@keyframes wisp-skeleton-wave { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }',
  ].join('\n');
  document.head.appendChild(style);
  skeletonStyleInjected = true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a dimension value to a CSS-compatible string.
 *
 * @param value - A number (interpreted as pixels) or a string (passed through).
 * @returns The value suffixed with `"px"` when numeric, otherwise the original string.
 */
function toPx(value: number | string): string {
  return typeof value === 'number' ? value + 'px' : value;
}

// ---------------------------------------------------------------------------
// Animation style resolver
// ---------------------------------------------------------------------------

/**
 * Resolve the CSS properties needed to apply a given {@link SkeletonAnimation}.
 *
 * @param animation - The desired animation mode.
 * @returns A `CSSStyleObject` object with the appropriate animation or
 *   overflow/position rules (for the `wave` variant).
 */
export function getAnimationStyle(animation: SkeletonAnimation): CSSStyleObject {
  switch (animation) {
    case 'pulse':
      return { animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite' };
    case 'wave':
      return { overflow: 'hidden', position: 'relative' as const };
    case 'none':
    default:
      return {};
  }
}

// ---------------------------------------------------------------------------
// Wave shimmer overlay style (the pseudo-element rendered as a child div)
// ---------------------------------------------------------------------------

/**
 * Build the inline style for the wave shimmer overlay `<div>`.
 *
 * @param themeColors - Current theme colour palette used for the gradient.
 * @returns A `CSSStyleObject` object positioned absolutely over the parent.
 */
export function buildWaveOverlayStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    animation: 'wisp-skeleton-wave 1.5s ease-in-out infinite',
    background: 'linear-gradient(90deg, transparent, ' + themeColors.background.raised + ', transparent)',
  };
}

// ---------------------------------------------------------------------------
// Base block style (single skeleton element)
// ---------------------------------------------------------------------------

/**
 * Build the inline style for a single block-shaped skeleton element.
 *
 * @param themeColors - Current theme colour palette.
 * @param opts - Dimension and animation options for the block.
 * @param opts.width - Block width (number or CSS string).
 * @param opts.height - Block height (number or CSS string).
 * @param opts.borderRadius - Corner radius (number or CSS string).
 * @param opts.animation - Active {@link SkeletonAnimation} mode.
 * @returns A `CSSStyleObject` object for the block `<div>`.
 */
export function buildBlockStyle(
  theme: WispTheme,
  opts: {
    width: number | string;
    height: number | string;
    borderRadius: number | string;
    animation: SkeletonAnimation;
  },
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'block',
    width: toPx(opts.width),
    height: toPx(opts.height),
    borderRadius: toPx(opts.borderRadius),
    backgroundColor: themeColors.border.subtle,
    ...getAnimationStyle(opts.animation),
  };
}

// ---------------------------------------------------------------------------
// Text container style (wraps multiple lines)
// ---------------------------------------------------------------------------

/**
 * Build the inline style for the text-variant container that wraps multiple lines.
 *
 * @param width - Overall container width (number or CSS string).
 * @returns A `CSSStyleObject` object for the container `<div>`.
 */
export function buildTextContainerStyle(width: number | string): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    width: toPx(width),
  };
}

// ---------------------------------------------------------------------------
// Text line style
// ---------------------------------------------------------------------------

/**
 * Build the inline style for a single text-variant shimmer line.
 *
 * @param themeColors - Current theme colour palette.
 * @param opts - Configuration for the text line.
 * @param opts.lineHeight - Height of the line in pixels.
 * @param opts.borderRadius - Corner radius (number or CSS string).
 * @param opts.animation - Active {@link SkeletonAnimation} mode.
 * @param opts.widthPercent - CSS width string (e.g. `"100%"` or `"60%"`).
 * @param opts.marginBottom - Bottom margin in pixels separating lines.
 * @returns A `CSSStyleObject` object for the line `<div>`.
 */
export function buildTextLineStyle(
  theme: WispTheme,
  opts: {
    lineHeight: number;
    borderRadius: number | string;
    animation: SkeletonAnimation;
    widthPercent: string;
    marginBottom: number;
  },
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'block',
    width: opts.widthPercent,
    height: opts.lineHeight,
    borderRadius: toPx(opts.borderRadius),
    backgroundColor: themeColors.border.subtle,
    marginBottom: opts.marginBottom,
    ...getAnimationStyle(opts.animation),
  };
}
