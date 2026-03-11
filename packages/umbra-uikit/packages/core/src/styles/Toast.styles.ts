import type { CSSStyleObject } from '../types';
import { fontFamilyStacks, glassStyle } from '../tokens/shared';
import type { SurfaceVariant } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ToastVariant } from '../types/Toast.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Variant -> colors (theme-aware)
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens for a toast instance.
 *
 * @remarks
 * Produced by {@link resolveToastColors} and consumed by the style builders.
 */
export interface ToastColors {
  /** Background color. */
  bg: string;
  /** Border color. */
  border: string;
  /** Title text color. */
  text: string;
  /** Description text color. */
  description: string;
  /** Dismiss button icon color (rest state). */
  dismiss: string;
  /** Dismiss button icon color (hover state). */
  dismissHover: string;
}

/**
 * Maps a {@link ToastVariant} to its theme-aware {@link ToastColors}.
 *
 * @remarks
 * The `'default'` variant uses a raised surface with inverse text for
 * contrast in both light and dark modes.
 *
 * @param variant - The semantic color variant.
 * @param themeColors - Current theme color tokens.
 * @returns Resolved color set for the given variant.
 */
export function resolveToastColors(
  variant: ToastVariant,
  theme: WispTheme,
): ToastColors {
  const { colors: themeColors } = theme;
  const base = {
    description: themeColors.text.secondary,
    dismiss: themeColors.text.muted,
    dismissHover: themeColors.text.primary,
  };

  switch (variant) {
    case 'default':
      // Default toast uses raised surface which is dark in both modes,
      // so text must use onRaised tokens (always light) for contrast.
      return {
        description: themeColors.text.onRaisedSecondary,
        dismiss: themeColors.text.onRaisedSecondary,
        dismissHover: themeColors.text.onRaised,
        bg: themeColors.background.raised,
        border: themeColors.accent.dividerRaised,
        text: themeColors.text.onRaised,
      };

    case 'success':
      return {
        ...base,
        bg: themeColors.status.successSurface,
        border: themeColors.status.successBorder,
        text: themeColors.status.success,
      };

    case 'warning':
      return {
        ...base,
        bg: themeColors.status.warningSurface,
        border: themeColors.status.warningBorder,
        text: themeColors.status.warning,
      };

    case 'danger':
      return {
        ...base,
        bg: themeColors.status.dangerSurface,
        border: themeColors.status.dangerBorder,
        text: themeColors.status.danger,
      };

    case 'info':
      return {
        ...base,
        bg: themeColors.status.infoSurface,
        border: themeColors.status.infoBorder,
        text: themeColors.status.info,
      };

    default:
      return resolveToastColors('default', theme);
  }
}

// ---------------------------------------------------------------------------
// Root container style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the toast root container.
 *
 * @param colors - Resolved color tokens from {@link resolveToastColors}.
 * @param surface - Surface variant (`'solid'` | `'glass'`). Defaults to `'solid'`.
 * @returns A `CSSStyleObject` object ready to spread onto the toast `<div>`.
 */
export function buildToastStyle(
  colors: ToastColors,
  surface: SurfaceVariant = 'solid',
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    boxSizing: 'border-box',
    padding: `${spacing.md}px ${spacing.md}px`,
    borderRadius: radii.lg,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    fontFamily: fontFamilyStacks.sans,
    position: 'relative',
    ...(surface === 'glass' ? glassStyle : undefined),
  };
}

// ---------------------------------------------------------------------------
// Icon wrapper style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the leading icon wrapper.
 *
 * @param colors - Resolved color tokens from {@link resolveToastColors}.
 * @returns A `CSSStyleObject` object for the icon `<span>`.
 */
export function buildIconStyle(colors: ToastColors): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 20,
    height: 20,
    color: colors.text,
  };
}

// ---------------------------------------------------------------------------
// Content column style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the content column (title + description).
 *
 * @returns A `CSSStyleObject` object for the content `<div>`.
 */
export function buildContentStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2xs'],
    flex: 1,
    minWidth: 0,
  };
}

// ---------------------------------------------------------------------------
// Title style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the toast title paragraph.
 *
 * @param colors - Resolved color tokens from {@link resolveToastColors}.
 * @returns A `CSSStyleObject` object for the title `<p>`.
 */
export function buildTitleStyle(colors: ToastColors, theme: WispTheme): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: colors.text,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Description style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the toast description paragraph.
 *
 * @param colors - Resolved color tokens from {@link resolveToastColors}.
 * @returns A `CSSStyleObject` object for the description `<p>`.
 */
export function buildDescriptionStyle(colors: ToastColors, theme: WispTheme): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.description,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Action wrapper style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the trailing action slot wrapper.
 *
 * @returns A `CSSStyleObject` object for the action `<div>`.
 */
export function buildActionStyle(): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 'auto',
  };
}

// ---------------------------------------------------------------------------
// Dismiss button style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the dismiss (X) close button.
 *
 * @param colors - Resolved color tokens from {@link resolveToastColors}.
 * @returns A `CSSStyleObject` object for the dismiss `<button>`.
 */
export function buildDismissStyle(colors: ToastColors, theme: WispTheme): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 24,
    height: 24,
    padding: 0,
    margin: 0,
    border: 'none',
    borderRadius: radii.sm,
    backgroundColor: 'transparent',
    color: colors.dismiss,
    cursor: 'pointer',
    transition: `color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}
