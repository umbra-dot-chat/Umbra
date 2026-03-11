/**
 * @module styles/EmojiManagementPanel
 * @description Pure style-builder functions for the EmojiManagementPanel component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface EmojiManagementPanelColors {
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

export function resolveEmojiManagementPanelColors(theme: WispTheme): EmojiManagementPanelColors {
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

export function buildEmojiManagementPanelContainerStyle(
  colors: EmojiManagementPanelColors,
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

export function buildEmojiManagementPanelHeaderStyle(
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

export function buildEmojiManagementPanelTitleStyle(
  colors: EmojiManagementPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.base.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  };
}

export function buildEmojiManagementPanelCountStyle(
  colors: EmojiManagementPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    color: colors.textMuted,
  };
}

export function buildEmojiManagementPanelGridStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: spacing.sm,
  };
}

export function buildEmojiManagementPanelEmojiCardStyle(
  colors: EmojiManagementPanelColors,
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
    cursor: 'default',
  };
}

export function buildEmojiManagementPanelEmojiImageStyle(): CSSStyleObject {
  return {
    width: 32,
    height: 32,
    objectFit: 'contain',
  };
}

export function buildEmojiManagementPanelEmojiNameStyle(
  colors: EmojiManagementPanelColors,
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

export function buildEmojiManagementPanelDeleteButtonStyle(
  colors: EmojiManagementPanelColors,
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

export function buildEmojiManagementPanelUploadSectionStyle(
  colors: EmojiManagementPanelColors,
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

export function buildEmojiManagementPanelUploadRowStyle(
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

export function buildEmojiManagementPanelSkeletonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors, radii } = theme;
  return {
    display: 'block',
    width: '100%',
    height: 320,
    borderRadius: radii.lg,
    backgroundColor: colors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
