/**
 * @module FileTransferList
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// List container
// ---------------------------------------------------------------------------

export function buildTransferListRootStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Header (title + clear button)
// ---------------------------------------------------------------------------

export function buildTransferListHeaderStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  };
}

export function buildTransferListTitleStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: themeColors.text.primary,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Summary badges (uploads, downloads, complete)
// ---------------------------------------------------------------------------

export function buildTransferListSummaryStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  };
}

export function buildTransferListBadgeStyle(
  theme: WispTheme,
  variant: 'upload' | 'download' | 'complete' | 'error',
): CSSStyleObject {
  const { colors: themeColors, typography, radii, spacing } = theme;
  const bgMap: Record<string, string> = {
    upload: themeColors.status.success,
    download: themeColors.accent.primary,
    complete: themeColors.status.success,
    error: themeColors.status.danger,
  };
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing['2xs'],
    padding: `2px ${spacing.xs}px`,
    borderRadius: radii.full,
    backgroundColor: bgMap[variant] ?? themeColors.accent.primary,
    color: themeColors.text.onAccent,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.medium,
  };
}

// ---------------------------------------------------------------------------
// Items container
// ---------------------------------------------------------------------------

export function buildTransferListItemsStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    maxHeight: 400,
    overflowY: 'auto',
  };
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function buildTransferListEmptyStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography, spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    fontSize: typography.sizes.sm.fontSize,
    color: themeColors.text.muted,
    margin: 0,
  };
}
