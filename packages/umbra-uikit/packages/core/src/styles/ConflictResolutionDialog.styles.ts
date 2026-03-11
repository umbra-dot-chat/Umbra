/**
 * @module ConflictResolutionDialog
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Body content
// ---------------------------------------------------------------------------

export function buildConflictDialogBodyStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Warning banner
// ---------------------------------------------------------------------------

export function buildConflictDialogWarningStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography, spacing, radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: themeColors.status.warning + '1A', // 10% opacity
    border: `1px solid ${themeColors.status.warning}`,
    fontSize: typography.sizes.sm.fontSize,
    color: themeColors.text.primary,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Version comparison columns
// ---------------------------------------------------------------------------

export function buildConflictDialogCompareStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.md,
  };
}

export function buildConflictDialogVersionCardStyle(
  theme: WispTheme,
  highlighted: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    border: `1px solid ${highlighted ? themeColors.accent.primary : themeColors.border.subtle}`,
    backgroundColor: themeColors.background.surface,
    cursor: 'pointer',
  };
}

export function buildConflictDialogVersionTitleStyle(
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

export function buildConflictDialogVersionMetaStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2xs'],
    fontSize: typography.sizes.xs.fontSize,
    color: themeColors.text.muted,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Actions footer
// ---------------------------------------------------------------------------

export function buildConflictDialogFooterStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  };
}
