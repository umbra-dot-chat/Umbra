/**
 * @module SystemMessageRenderer
 * @description Style builders for the SystemMessageRenderer component.
 * Centered text with muted colors and horizontal divider lines on each side.
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Container — flex row with lines + centered content
// ---------------------------------------------------------------------------

export function buildSystemMessageContainerStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.sm}px 0`,
    width: '100%',
  };
}

// ---------------------------------------------------------------------------
// Horizontal line (before & after)
// ---------------------------------------------------------------------------

export function buildSystemMessageLineStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: tc } = theme;
  return {
    flex: 1,
    height: 1,
    backgroundColor: tc.border.subtle,
  };
}

// ---------------------------------------------------------------------------
// Inner content area (icon + text + timestamp)
// ---------------------------------------------------------------------------

export function buildSystemMessageContentStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Text style
// ---------------------------------------------------------------------------

export function buildSystemMessageTextStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: tc, typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.regular,
    color: tc.text.muted,
    fontFamily: fontFamilyStacks.sans,
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Timestamp style
// ---------------------------------------------------------------------------

export function buildSystemMessageTimestampStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: tc, typography } = theme;
  return {
    fontSize: typography.sizes['2xs'].fontSize,
    fontWeight: typography.weights.regular,
    color: tc.text.muted,
    fontFamily: fontFamilyStacks.sans,
    opacity: 0.7,
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Icon color
// ---------------------------------------------------------------------------

export function resolveSystemMessageIconColor(
  theme: WispTheme,
): string {
  return theme.colors.text.muted;
}
