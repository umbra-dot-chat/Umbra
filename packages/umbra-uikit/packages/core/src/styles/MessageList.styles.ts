import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { WispTheme } from '../theme/types';

// ---------------------------------------------------------------------------
// Container — flex column, full height, overflow hidden
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the outer message list container.
 */
export function buildContainerStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.colors.background.canvas,
  };
}

// ---------------------------------------------------------------------------
// Scroll area — flex 1, overflow-y auto, smooth scroll
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the scrollable area within the list.
 */
export function buildScrollAreaStyle(): CSSStyleObject {
  return {
    flex: 1,
    overflowY: 'auto',
    scrollBehavior: 'smooth',
  };
}

// ---------------------------------------------------------------------------
// Scroll inner — padding for message content
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the inner content wrapper inside the scroll area.
 */
export function buildScrollInnerStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    padding: `${spacing.md}px`,
  };
}

// ---------------------------------------------------------------------------
// Day separator — centered text with lines on each side
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for a day separator row.
 */
export function buildDaySeparatorStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    padding: `${spacing.sm}px 0`,
    userSelect: 'none',
  };
}

/**
 * Builds the inline style for the line segments flanking the day label.
 */
export function buildDaySeparatorLineStyle(theme: WispTheme): CSSStyleObject {
  return {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border.subtle,
    opacity: 0.5,
  };
}

/**
 * Builds the inline style for the day separator label text.
 */
export function buildDaySeparatorLabelStyle(theme: WispTheme): CSSStyleObject {
  const { colors, typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    fontFamily: fontFamilyStacks.sans,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// New message divider — accent color line with label
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the new message divider wrapper.
 */
export function buildNewMessageDividerStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    padding: `${spacing.sm}px 0`,
  };
}

// ---------------------------------------------------------------------------
// Scroll-to-bottom button — floating at bottom-right, round, shadow
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the floating scroll-to-bottom button.
 */
export function buildScrollToBottomStyle(theme: WispTheme): CSSStyleObject {
  const { colors, spacing } = theme;
  return {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.surface,
    border: `1px solid ${colors.border.subtle}`,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 10,
    transition: 'opacity 150ms ease',
  };
}

// ---------------------------------------------------------------------------
// Loading more spinner — at top
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the loading-more indicator at the top.
 */
export function buildLoadingMoreStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.md}px`,
  };
}

// ---------------------------------------------------------------------------
// Empty state — centered content
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the empty state container.
 */
export function buildEmptyStyle(theme: WispTheme): CSSStyleObject {
  const { colors, spacing, typography } = theme;
  return {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    color: colors.text.muted,
    fontSize: typography.sizes.sm.fontSize,
    fontFamily: fontFamilyStacks.sans,
  };
}
