/**
 * Style builders for the Wisp Sheet primitive.
 *
 * @module primitives/sheet/styles
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { SheetSize } from '../types/Sheet.types';
import { sheetSizeMap } from '../types/Sheet.types';
import { fontFamilyStacks, glassStyle } from '../tokens/shared';
import type { SurfaceVariant } from '../tokens/shared';
import { zIndex } from '../tokens/z-index';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the full-viewport overlay backdrop.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the overlay element.
 */
export function buildOverlayStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: zIndex.overlay,
    backgroundColor: themeColors.background.overlay,
    transition: `opacity ${durations.normal}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Sheet panel -- always slides up from the bottom
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the sheet panel, including slide-up position
 * and drag offset transform.
 *
 * @param size - The height preset for the sheet.
 * @param isOpen - Whether the open animation is active.
 * @param dragOffset - Current vertical drag offset in pixels.
 * @param themeColors - Resolved theme colour tokens.
 * @param variant - Surface variant (`'solid'` | `'glass'`). Defaults to `'solid'`.
 * @param userStyle - Optional consumer-provided style overrides.
 * @returns A `CSSStyleObject` object for the sheet panel.
 */
export function buildSheetStyle(
  size: SheetSize,
  isOpen: boolean,
  dragOffset: number,
  theme: WispTheme,
  variant: SurfaceVariant = 'solid',
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  const maxHeight = sheetSizeMap[size];
  const translateY = isOpen ? dragOffset : window?.innerHeight ?? 1000;

  return {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: zIndex.modal,
    maxHeight,
    backgroundColor: themeColors.background.canvas,
    fontFamily: fontFamilyStacks.sans,
    color: themeColors.text.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    boxShadow: `0 -4px 24px ${themeColors.background.overlay}`,
    overflowY: 'auto',
    transform: `translateY(${translateY}px)`,
    transition: dragOffset === 0 ? 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
    outline: 'none',
    touchAction: 'none',
    ...(variant === 'glass' ? glassStyle : undefined),
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// Drag handle -- the small pill at the top
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the drag handle bar container.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the handle bar area.
 */
export function buildHandleBarStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: `${spacing.md}px 0 ${spacing.xs}px 0`,
    cursor: 'grab',
    touchAction: 'none',
    userSelect: 'none',
  };
}

/**
 * Builds inline styles for the small rounded pill inside the drag handle.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the handle pill.
 */
export function buildHandlePillStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    width: 36,
    height: 4,
    borderRadius: radii.sm,
    backgroundColor: themeColors.border.subtle,
  };
}
