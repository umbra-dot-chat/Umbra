/**
 * @module FileDetailPanel
 */
import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { WispTheme } from '../theme/types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Panel root
// ---------------------------------------------------------------------------

export function buildDetailPanelStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    fontFamily: fontFamilyStacks.sans,
    backgroundColor: themeColors.background.surface,
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: radii.lg,
    padding: spacing.lg,
    boxSizing: 'border-box',
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// Header (title + close button)
// ---------------------------------------------------------------------------

export function buildDetailPanelHeaderStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Preview area
// ---------------------------------------------------------------------------

export function buildDetailPanelPreviewStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    backgroundColor: themeColors.background.raised,
    borderRadius: radii.md,
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// Preview image
// ---------------------------------------------------------------------------

export function buildDetailPanelPreviewImageStyle(): CSSStyleObject {
  return {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  };
}

// ---------------------------------------------------------------------------
// Metadata grid
// ---------------------------------------------------------------------------

export function buildDetailPanelMetadataStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Metadata item
// ---------------------------------------------------------------------------

export function buildDetailPanelMetaItemStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };
}

// ---------------------------------------------------------------------------
// Meta label
// ---------------------------------------------------------------------------

export function buildDetailPanelMetaLabelStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.semibold,
    color: themeColors.text.muted,
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  };
}

// ---------------------------------------------------------------------------
// Meta value
// ---------------------------------------------------------------------------

export function buildDetailPanelMetaValueStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.regular,
    color: themeColors.text.primary,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Actions row
// ---------------------------------------------------------------------------

export function buildDetailPanelActionsStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    gap: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Version history section
// ---------------------------------------------------------------------------

export function buildDetailPanelVersionSectionStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Version history title
// ---------------------------------------------------------------------------

export function buildDetailPanelVersionTitleStyle(
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
// Version item
// ---------------------------------------------------------------------------

export function buildDetailPanelVersionItemStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function buildDetailPanelSkeletonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: themeColors.background.surface,
    borderRadius: radii.lg,
    border: `1px solid ${themeColors.border.subtle}`,
  };
}

export function buildDetailPanelSkeletonBlockStyle(
  theme: WispTheme,
  width: string,
  height: number,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    width,
    height,
    borderRadius: radii.sm,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
