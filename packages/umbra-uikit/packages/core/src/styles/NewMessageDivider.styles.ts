import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';

// ---------------------------------------------------------------------------
// Divider container
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the new-message divider wrapper.
 *
 * Renders as a horizontal line with a centered label.
 */
export function buildNewMessageDividerStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    boxSizing: 'border-box',
    padding: `${spacing.sm}px 0`,
  };
}

// ---------------------------------------------------------------------------
// Line segment
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for one of the two line segments flanking the label.
 *
 * @param color - Line color (typically `status.danger`).
 */
export function buildLineStyle(color: string): CSSStyleObject {
  return {
    flex: 1,
    height: 1,
    backgroundColor: color,
  };
}

// ---------------------------------------------------------------------------
// Label text
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the centered label text (e.g. "New").
 *
 * @param color - Label text color (typically matches the line color).
 */
export function buildLabelStyle(color: string, theme: WispTheme): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    fontFamily: fontFamilyStacks.sans,
    color,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    flexShrink: 0,
    userSelect: 'none',
  };
}
