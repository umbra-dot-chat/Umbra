/**
 * @module Tooltip.styles
 * @description Style builders for the Wisp Tooltip primitive.
 */

import type { CSSStyleObject } from '../types';
import { fontFamilyStacks, glassStyle } from '../tokens/shared';
import type { SurfaceVariant } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { TooltipPlacement } from '../types/Tooltip.types';
import { zIndex } from '../tokens/z-index';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Arrow size constant
// ---------------------------------------------------------------------------

/** Size of the CSS-border triangle arrow in pixels. */
export const ARROW_SIZE = 5;

/** Distance in pixels between the trigger edge and the tooltip bubble (excluding arrow). */
export const TOOLTIP_OFFSET = 8;

// ---------------------------------------------------------------------------
// Resolve tooltip colors (inverted: uses text.primary as bg)
// ---------------------------------------------------------------------------

/** Resolved color pair used by the tooltip bubble and arrow. */
export interface TooltipColors {
  /** Background color of the tooltip (inverted text.primary). */
  bg: string;
  /** Foreground text color of the tooltip (inverted text.inverse). */
  text: string;
}

/**
 * Derives the high-contrast tooltip color pair from the active theme.
 *
 * @param themeColors - Resolved theme color tokens.
 * @returns A {@link TooltipColors} object with inverted background and text.
 */
export function resolveTooltipColors(theme: WispTheme): TooltipColors {
  const { colors: themeColors } = theme;
  return {
    bg: themeColors.text.primary,
    text: themeColors.text.inverse,
  };
}

// ---------------------------------------------------------------------------
// Build tooltip bubble style
// ---------------------------------------------------------------------------

/**
 * Builds the style for the tooltip bubble element.
 *
 * @param colors - Resolved tooltip color pair from {@link resolveTooltipColors}.
 * @param maxWidth - Maximum width of the bubble in pixels.
 * @param visible - Whether the tooltip is currently visible (controls opacity and transform).
 * @param placement - Which side of the trigger the tooltip appears on.
 * @param variant - Surface variant (`'solid'` | `'glass'`). Defaults to `'solid'`.
 * @returns A `CSSStyleObject` object with absolute positioning, colors, typography,
 *   and a fade/slide transition keyed to visibility.
 */
export function buildTooltipStyle(
  colors: TooltipColors,
  maxWidth: number,
  visible: boolean,
  placement: TooltipPlacement,
  variant: SurfaceVariant = 'solid',
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  const translateMap: Record<TooltipPlacement, string> = {
    top: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(4px)',
    bottom: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-4px)',
    left: visible ? 'translateX(0) translateY(-50%)' : 'translateX(4px) translateY(-50%)',
    right: visible ? 'translateX(0) translateY(-50%)' : 'translateX(-4px) translateY(-50%)',
  };

  return {
    position: 'relative',
    zIndex: zIndex.tooltip,
    maxWidth,
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: radii.md,
    backgroundColor: colors.bg,
    color: colors.text,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.medium,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    pointerEvents: 'none',
    opacity: visible ? 1 : 0,
    transform: translateMap[placement],
    transition: `opacity ${durations.fast}ms ${easings.easeOut.css}, transform ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
    ...(variant === 'glass' ? glassStyle : undefined),
  };
}

// ---------------------------------------------------------------------------
// Build arrow style
// ---------------------------------------------------------------------------

/**
 * Builds the CSS-border-trick triangle arrow that points from the tooltip
 * bubble toward the trigger element.
 *
 * @param colors - Resolved tooltip color pair.
 * @param placement - Which side of the trigger the tooltip appears on (determines arrow direction).
 * @returns A `CSSStyleObject` object for a zero-width/height element with colored borders.
 */
export function buildArrowStyle(
  colors: TooltipColors,
  placement: TooltipPlacement,
): CSSStyleObject {
  const base: CSSStyleObject = {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
  };

  const s = ARROW_SIZE;

  switch (placement) {
    case 'top':
      return {
        ...base,
        bottom: -s,
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: s + 'px ' + s + 'px 0 ' + s + 'px',
        borderColor: colors.bg + ' transparent transparent transparent',
      };
    case 'bottom':
      return {
        ...base,
        top: -s,
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: '0 ' + s + 'px ' + s + 'px ' + s + 'px',
        borderColor: 'transparent transparent ' + colors.bg + ' transparent',
      };
    case 'left':
      return {
        ...base,
        right: -s,
        top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: s + 'px 0 ' + s + 'px ' + s + 'px',
        borderColor: 'transparent transparent transparent ' + colors.bg,
      };
    case 'right':
      return {
        ...base,
        left: -s,
        top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: s + 'px ' + s + 'px ' + s + 'px 0',
        borderColor: 'transparent ' + colors.bg + ' transparent transparent',
      };
    default:
      return base;
  }
}

// ---------------------------------------------------------------------------
// Calculate absolute position for the tooltip
// ---------------------------------------------------------------------------

/**
 * Calculates the absolute page-level coordinates for the tooltip anchor point
 * based on the trigger element bounding rect and the chosen placement.
 *
 * @param triggerRect - The `DOMRect` of the trigger element.
 * @param placement - Which side of the trigger the tooltip appears on.
 * @returns An object with `top` and `left` values in page-absolute pixels
 *   (accounting for scroll offsets).
 */
export function calculatePosition(
  triggerRect: DOMRect,
  placement: TooltipPlacement,
): { top: number; left: number } {
  const scrollX = window.scrollX ?? window.pageXOffset;
  const scrollY = window.scrollY ?? window.pageYOffset;
  const offset = TOOLTIP_OFFSET + ARROW_SIZE;

  switch (placement) {
    case 'top':
      return {
        top: triggerRect.top + scrollY - offset,
        left: triggerRect.left + scrollX + triggerRect.width / 2,
      };
    case 'bottom':
      return {
        top: triggerRect.bottom + scrollY + offset,
        left: triggerRect.left + scrollX + triggerRect.width / 2,
      };
    case 'left':
      return {
        top: triggerRect.top + scrollY + triggerRect.height / 2,
        left: triggerRect.left + scrollX - offset,
      };
    case 'right':
      return {
        top: triggerRect.top + scrollY + triggerRect.height / 2,
        left: triggerRect.right + scrollX + offset,
      };
    default:
      return { top: 0, left: 0 };
  }
}

// ---------------------------------------------------------------------------
// Positional anchor styles applied to the outer portal wrapper
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the outermost portal wrapper that anchors the
 * tooltip at the calculated absolute position and applies a placement-aware
 * CSS transform.
 *
 * @param pos - Absolute `top`/`left` coordinates from {@link calculatePosition}.
 * @param placement - Which side of the trigger the tooltip appears on.
 * @returns A `CSSStyleObject` object with absolute positioning and a
 *   directional transform offset.
 */
export function buildPortalPositionStyle(
  pos: { top: number; left: number },
  placement: TooltipPlacement,
): CSSStyleObject {
  const base: CSSStyleObject = {
    position: 'absolute',
    top: pos.top,
    left: pos.left,
    zIndex: zIndex.tooltip,
  };

  switch (placement) {
    case 'top':
      return { ...base, transform: 'translateX(-50%) translateY(-100%)' };
    case 'bottom':
      return { ...base, transform: 'translateX(-50%)' };
    case 'left':
      return { ...base, transform: 'translateX(-100%) translateY(-50%)' };
    case 'right':
      return { ...base, transform: 'translateY(-50%)' };
    default:
      return base;
  }
}
