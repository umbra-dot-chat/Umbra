/**
 * @module styles/AttachmentPreview
 * @description Pure style-builder functions for the AttachmentPreview component.
 *
 * Cards sit on background.surface (always dark) — uses onRaised text tokens.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface AttachmentPreviewColors {
  cardBg: string;
  cardBorder: string;
  cardBorderError: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  removeBg: string;
  removeText: string;
  removeHoverBg: string;
  progressBg: string;
  progressFill: string;
  iconAreaBg: string;
  errorOverlay: string;
}

export function resolveAttachmentPreviewColors(
  theme: WispTheme,
): AttachmentPreviewColors {
  const { colors } = theme;
  return {
    // Cards sit on background.surface which is always dark
    cardBg: colors.background.surface,
    cardBorder: colors.accent.dividerRaised,
    cardBorderError: colors.status.danger,
    text: colors.text.onRaised,
    textSecondary: colors.text.onRaisedSecondary,
    textMuted: withAlpha(colors.text.onRaisedSecondary, 0.7),
    removeBg: withAlpha(colors.text.onRaised, 0.1),
    removeText: colors.text.onRaisedSecondary,
    removeHoverBg: withAlpha(colors.text.onRaised, 0.2),
    progressBg: withAlpha(colors.text.onRaised, 0.1),
    progressFill: colors.accent.primary,
    iconAreaBg: withAlpha(colors.text.onRaised, 0.06),
    errorOverlay: withAlpha(colors.status.danger, 0.1),
  };
}

// ---------------------------------------------------------------------------
// Container — horizontal scrollable row
// ---------------------------------------------------------------------------

export function buildAttachmentContainerStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    gap: spacing.sm,
    overflowX: 'auto',
    paddingBottom: spacing.xs,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export function buildAttachmentCardStyle(
  colors: AttachmentPreviewColors,
  error: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing } = theme;
  return {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: 140,
    minWidth: 140,
    borderRadius: radii.md,
    border: `1px solid ${error ? colors.cardBorderError : colors.cardBorder}`,
    backgroundColor: colors.cardBg,
    overflow: 'hidden',
    flexShrink: 0,
    boxSizing: 'border-box',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Thumbnail — image preview area
// ---------------------------------------------------------------------------

export function buildThumbnailStyle(
  theme: WispTheme,
): CSSStyleObject {
  return {
    width: '100%',
    height: 80,
    objectFit: 'cover',
    display: 'block',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// File icon area — for non-image files
// ---------------------------------------------------------------------------

export function buildFileIconAreaStyle(
  colors: AttachmentPreviewColors,
  theme: WispTheme,
): CSSStyleObject {
  return {
    width: '100%',
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.iconAreaBg,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// File info section
// ---------------------------------------------------------------------------

export function buildFileInfoStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    minWidth: 0,
  };
}

export function buildFileNameStyle(
  colors: AttachmentPreviewColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    lineHeight: `${typography.sizes['2xs'].lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

export function buildFileSizeStyle(
  colors: AttachmentPreviewColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    lineHeight: `${typography.sizes['2xs'].lineHeight}px`,
    color: colors.textMuted,
  };
}

// ---------------------------------------------------------------------------
// Remove button
// ---------------------------------------------------------------------------

export function buildRemoveButtonStyle(
  colors: AttachmentPreviewColors,
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
    border: 'none',
    backgroundColor: colors.removeBg,
    color: colors.removeText,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    zIndex: 1,
  };
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

export function buildProgressBarContainerStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  };
}

export function buildProgressBarFillStyle(
  colors: AttachmentPreviewColors,
  progress: number,
  theme: WispTheme,
): CSSStyleObject {
  return {
    height: '100%',
    width: `${Math.min(100, Math.max(0, progress))}%`,
    backgroundColor: colors.progressFill,
    transition: `width ${durations.normal}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Error overlay
// ---------------------------------------------------------------------------

export function buildErrorOverlayStyle(
  colors: AttachmentPreviewColors,
  theme: WispTheme,
): CSSStyleObject {
  return {
    position: 'absolute',
    inset: 0,
    backgroundColor: colors.errorOverlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };
}
