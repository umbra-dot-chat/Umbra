/**
 * @module FileUploader
 */
import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Dropzone container
// ---------------------------------------------------------------------------

export function buildDropzoneStyle(
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
    padding: `${spacing['2xl']}px ${spacing.xl}px`,
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
  };
}

// ---------------------------------------------------------------------------
// Icon wrapper
// ---------------------------------------------------------------------------

export function buildDropzoneIconStyle(
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
// Text
// ---------------------------------------------------------------------------

export function buildDropzoneTitleStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.semibold,
    lineHeight: 1.4,
    color: themeColors.text.primary,
    margin: 0,
  };
}

export function buildDropzoneDescriptionStyle(
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
// Browse link highlight
// ---------------------------------------------------------------------------

export function buildDropzoneLinkStyle(
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
