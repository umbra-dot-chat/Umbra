/**
 * @module styles/StickerManagementPanel
 * @description Pure style-builder functions for the StickerManagementPanel component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface StickerManagementPanelColors {
  bg: string;
  cardBg: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  hoverBg: string;
  danger: string;
  dangerSurface: string;
}

export function resolveStickerManagementPanelColors(theme: WispTheme): StickerManagementPanelColors {
  const { colors } = theme;
  return {
    bg: colors.background.canvas,
    cardBg: colors.background.surface,
    border: colors.border.subtle,
    text: colors.text.primary,
    textSecondary: colors.text.secondary,
    textMuted: colors.text.muted,
    hoverBg: colors.background.sunken,
    danger: colors.status.danger,
    dangerSurface: colors.status.dangerSurface,
  };
}

// ---------------------------------------------------------------------------
// Style builders
// ---------------------------------------------------------------------------

export function buildStickerManagementPanelContainerStyle(
  colors: StickerManagementPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.cardBg,
    borderRadius: radii.lg,
    border: `1px solid ${colors.border}`,
  };
}

export function buildStickerManagementPanelHeaderStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  };
}

export function buildStickerManagementPanelTitleStyle(
  colors: StickerManagementPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.base.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  };
}

export function buildStickerManagementPanelGridStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: spacing.sm,
  };
}

export function buildStickerManagementPanelStickerCardStyle(
  colors: StickerManagementPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    position: 'relative',
  };
}

export function buildStickerManagementPanelStickerImageStyle(): CSSStyleObject {
  return {
    width: 64,
    height: 64,
    objectFit: 'contain',
  };
}

export function buildStickerManagementPanelStickerNameStyle(
  colors: StickerManagementPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  };
}

export function buildStickerManagementPanelDeleteButtonStyle(
  colors: StickerManagementPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: radii.full,
    backgroundColor: colors.dangerSurface,
    color: colors.danger,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    lineHeight: 1,
    padding: 0,
    opacity: 0,
    transition: 'opacity 150ms ease',
  };
}

export function buildStickerManagementPanelUploadSectionStyle(
  colors: StickerManagementPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    border: `1px dashed ${colors.border}`,
    backgroundColor: colors.bg,
  };
}

export function buildStickerManagementPanelUploadRowStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'flex-end',
    gap: spacing.sm,
    flexWrap: 'wrap',
  };
}

export function buildStickerManagementPanelCreateRowStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'flex-end',
    gap: spacing.sm,
  };
}

export function buildStickerManagementPanelSkeletonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors, radii } = theme;
  return {
    display: 'block',
    width: '100%',
    height: 400,
    borderRadius: radii.lg,
    backgroundColor: colors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
