/**
 * @module FileUploadZone
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Drop zone container
// ---------------------------------------------------------------------------

export function buildFileUploadZoneStyle(
  theme: WispTheme,
  isDragOver: boolean,
  disabled: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radii.lg,
    border: `2px dashed ${isDragOver ? themeColors.accent.primary : themeColors.border.strong}`,
    backgroundColor: isDragOver ? themeColors.accent.highlight : 'transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontFamily: fontFamilyStacks.sans,
    textAlign: 'center',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}, background-color ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
    position: 'relative',
    minHeight: 120,
  };
}

// ---------------------------------------------------------------------------
// Active overlay (drag highlight)
// ---------------------------------------------------------------------------

export function buildFileUploadZoneActiveStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    position: 'absolute',
    inset: 0,
    borderRadius: radii.lg,
    backgroundColor: themeColors.accent.highlight,
    opacity: 0.5,
    pointerEvents: 'none',
  };
}

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

export function buildFileUploadZoneIconStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: themeColors.accent.highlight,
    color: themeColors.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Instruction text
// ---------------------------------------------------------------------------

export function buildFileUploadZoneTextStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.regular,
    lineHeight: 1.4,
    color: themeColors.text.muted,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Browse link
// ---------------------------------------------------------------------------

export function buildFileUploadZoneLinkStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    color: themeColors.accent.primary,
    fontWeight: typography.weights.semibold,
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: 2,
  };
}

// ---------------------------------------------------------------------------
// Progress bar (uploading state)
// ---------------------------------------------------------------------------

export function buildFileUploadZoneProgressStyle(
  theme: WispTheme,
  progress: number,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    width: '100%',
    height: 4,
    borderRadius: radii.full,
    backgroundColor: themeColors.border.subtle,
    overflow: 'hidden',
    position: 'relative',
  };
}

export function buildFileUploadZoneProgressBarStyle(
  theme: WispTheme,
  progress: number,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    height: '100%',
    width: `${Math.min(100, Math.max(0, progress))}%`,
    borderRadius: radii.full,
    backgroundColor: themeColors.accent.primary,
    transition: `width ${durations.normal}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// File name label (uploading state)
// ---------------------------------------------------------------------------

export function buildFileUploadZoneFileNameStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    color: themeColors.text.secondary,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  };
}
