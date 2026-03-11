import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { AlertVariant } from '../types/Alert.types';

// ---------------------------------------------------------------------------
// Variant -> colors (theme-aware)
// ---------------------------------------------------------------------------

/** Resolved colour tokens for a single {@link AlertVariant}. */
interface AlertVariantColors {
  /** Background fill colour. */
  bg: string;
  /** Border colour. */
  border: string;
  /** Icon tint colour. */
  icon: string;
}

/**
 * Map an {@link AlertVariant} to its theme-aware colour tokens.
 *
 * @param variant - The active alert variant.
 * @param themeColors - Current theme colour palette.
 * @returns An {@link AlertVariantColors} object with `bg`, `border`, and `icon` values.
 */
function resolveVariantColors(
  variant: AlertVariant,
  themeColors: ThemeColors,
): AlertVariantColors {
  switch (variant) {
    case 'success':
      return {
        bg: themeColors.status.successSurface,
        border: themeColors.status.successBorder,
        icon: themeColors.status.success,
      };

    case 'warning':
      return {
        bg: themeColors.status.warningSurface,
        border: themeColors.status.warningBorder,
        icon: themeColors.status.warning,
      };

    case 'danger':
      return {
        bg: themeColors.status.dangerSurface,
        border: themeColors.status.dangerBorder,
        icon: themeColors.status.danger,
      };

    case 'info':
      return {
        bg: themeColors.status.infoSurface,
        border: themeColors.status.infoBorder,
        icon: themeColors.status.info,
      };

    case 'default':
    default:
      return {
        bg: themeColors.background.raised,
        border: themeColors.accent.dividerRaised,
        icon: themeColors.text.onRaised,
      };
  }
}

// ---------------------------------------------------------------------------
// Root container style
// ---------------------------------------------------------------------------

/**
 * Build the inline style object for the root alert container.
 *
 * @param variant - The active {@link AlertVariant}.
 * @param themeColors - Current theme colour palette.
 * @param userStyle - Optional consumer-provided style overrides merged last.
 * @returns A `CSSStyleObject` object for the root `<div>`.
 */
export function buildAlertStyle(
  variant: AlertVariant,
  theme: WispTheme,
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  const colors = resolveVariantColors(variant, themeColors);

  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    boxSizing: 'border-box',
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderRadius: radii.lg,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    fontFamily: fontFamilyStacks.sans,
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// Title style
// ---------------------------------------------------------------------------

/**
 * Build the inline style object for the alert title paragraph.
 *
 * @param themeColors - Current theme colour palette.
 * @returns A `CSSStyleObject` object for the title `<p>`.
 */
export function buildTitleStyle(theme: WispTheme, variant: AlertVariant = 'default'): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  const isRaised = variant === 'default';
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: 1.43,
    fontWeight: typography.weights.semibold,
    color: isRaised ? themeColors.text.onRaised : themeColors.text.primary,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Description style
// ---------------------------------------------------------------------------

/**
 * Build the inline style object for the alert description paragraph.
 *
 * @param themeColors - Current theme colour palette.
 * @returns A `CSSStyleObject` object for the description `<p>`.
 */
export function buildDescriptionStyle(theme: WispTheme, variant: AlertVariant = 'default'): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  const isRaised = variant === 'default';
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: 1.43,
    fontWeight: typography.weights.regular,
    color: isRaised ? themeColors.text.onRaisedSecondary : themeColors.text.secondary,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Icon wrapper style
// ---------------------------------------------------------------------------

/**
 * Build the inline style object for the leading icon wrapper.
 *
 * @param variant - The active {@link AlertVariant}, used to resolve icon colour.
 * @param themeColors - Current theme colour palette.
 * @returns A `CSSStyleObject` object for the icon `<span>`.
 */
export function buildIconWrapperStyle(
  variant: AlertVariant,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  const colors = resolveVariantColors(variant, themeColors);

  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 20,
    height: 20,
    color: colors.icon,
  };
}

// ---------------------------------------------------------------------------
// Content column style
// ---------------------------------------------------------------------------

/**
 * Build the inline style object for the content column (title + description).
 *
 * @returns A `CSSStyleObject` object for the content wrapper `<div>`.
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
// Action wrapper style
// ---------------------------------------------------------------------------

/**
 * Build the inline style object for the trailing action slot.
 *
 * @returns A `CSSStyleObject` object for the action wrapper `<div>`.
 */
export function buildActionStyle(): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 'auto',
  };
}
