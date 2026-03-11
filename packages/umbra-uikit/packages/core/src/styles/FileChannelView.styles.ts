/**
 * @module FileChannelView
 */
import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { WispTheme } from '../theme/types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Root container (split layout)
// ---------------------------------------------------------------------------

export function buildFileChannelRootStyle(
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    fontFamily: fontFamilyStacks.sans,
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// Sidebar (folder tree)
// ---------------------------------------------------------------------------

export function buildFileChannelSidebarStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    width: 240,
    minWidth: 200,
    borderRight: `1px solid ${themeColors.border.subtle}`,
    backgroundColor: themeColors.background.surface,
    padding: `${spacing.md}px`,
    overflowY: 'auto',
    flexShrink: 0,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Main content area
// ---------------------------------------------------------------------------

export function buildFileChannelContentStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  };
}

// ---------------------------------------------------------------------------
// Toolbar (breadcrumb + actions)
// ---------------------------------------------------------------------------

export function buildFileChannelToolbarStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderBottom: `1px solid ${themeColors.border.subtle}`,
    backgroundColor: themeColors.background.surface,
    flexShrink: 0,
    flexWrap: 'wrap',
  };
}

// ---------------------------------------------------------------------------
// Breadcrumb wrapper
// ---------------------------------------------------------------------------

export function buildFileChannelBreadcrumbStyle(
  theme: WispTheme,
): CSSStyleObject {
  return {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
  };
}

// ---------------------------------------------------------------------------
// Actions wrapper (view toggle + buttons)
// ---------------------------------------------------------------------------

export function buildFileChannelActionsStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// File grid
// ---------------------------------------------------------------------------

export function buildFileChannelGridStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: spacing.md,
    padding: spacing.md,
    overflowY: 'auto',
    flex: 1,
  };
}

// ---------------------------------------------------------------------------
// File list
// ---------------------------------------------------------------------------

export function buildFileChannelListStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    padding: spacing.md,
    overflowY: 'auto',
    flex: 1,
  };
}

// ---------------------------------------------------------------------------
// File list row
// ---------------------------------------------------------------------------

export function buildFileChannelListRowStyle(
  theme: WispTheme,
  hovered: boolean,
): CSSStyleObject {
  const { colors: themeColors, spacing, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    borderRadius: radii.md,
    backgroundColor: hovered ? themeColors.background.raised : 'transparent',
    cursor: 'pointer',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function buildFileChannelEmptyStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: spacing.sm,
    padding: spacing['2xl'],
    color: themeColors.text.muted,
    fontSize: typography.sizes.sm.fontSize,
    textAlign: 'center',
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function buildFileChannelSkeletonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    backgroundColor: themeColors.border.subtle,
    borderRadius: radii.md,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
