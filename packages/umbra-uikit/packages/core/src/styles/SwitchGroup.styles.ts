import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { SwitchGroupOrientation } from '../types/SwitchGroup.types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Group container
// ---------------------------------------------------------------------------

/**
 * Builds the outer group container style (vertical column for header + options + error).
 *
 * @param orientation - Layout direction of the option items.
 * @param themeColors - Resolved theme color palette.
 * @param userStyle - Optional user-supplied style overrides merged last.
 * @returns CSS properties for the group container `div`.
 */
export function buildGroupStyle(
  orientation: SwitchGroupOrientation,
  theme: WispTheme,
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    fontFamily: fontFamilyStacks.sans,
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// Group label
// ---------------------------------------------------------------------------

/**
 * Builds the style for the group label text.
 *
 * @param themeColors - Resolved theme color palette.
 * @returns CSS properties for the label `p` element.
 */
export function buildGroupLabelStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: 1.43,
    color: themeColors.text.primary,
    fontFamily: fontFamilyStacks.sans,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Group description
// ---------------------------------------------------------------------------

/**
 * Builds the style for the group description text below the label.
 *
 * @param themeColors - Resolved theme color palette.
 * @returns CSS properties for the description `p` element.
 */
export function buildGroupDescriptionStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: 1.38,
    color: themeColors.text.secondary,
    fontFamily: fontFamilyStacks.sans,
    margin: 0,
    marginTop: spacing['2xs'],
  };
}

// ---------------------------------------------------------------------------
// Options container
// ---------------------------------------------------------------------------

/**
 * Builds the flex container style for the list of option items.
 *
 * @param orientation - `'vertical'` stacks options in a column; `'horizontal'` lays them in a wrapping row.
 * @returns CSS properties for the options container `div`.
 */
export function buildOptionsStyle(orientation: SwitchGroupOrientation): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    gap: orientation === 'vertical' ? 8 : 16,
    flexWrap: orientation === 'horizontal' ? 'wrap' : undefined,
  };
}

// ---------------------------------------------------------------------------
// Individual option row
// ---------------------------------------------------------------------------

/**
 * Builds the style for an individual option row (toggle/checkbox + label area).
 *
 * @param themeColors - Resolved theme color palette.
 * @returns CSS properties for the option row `div`.
 */
export function buildOptionStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Option label text
// ---------------------------------------------------------------------------

/**
 * Builds the style for an individual option's label text.
 *
 * @param disabled - Whether the option is disabled (dims the text).
 * @param themeColors - Resolved theme color palette.
 * @returns CSS properties for the option label `span`.
 */
export function buildOptionLabelStyle(
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: 1.43,
    color: disabled ? themeColors.text.muted : themeColors.text.primary,
    fontFamily: fontFamilyStacks.sans,
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Option description text
// ---------------------------------------------------------------------------

/**
 * Builds the style for an individual option's description text.
 *
 * @param themeColors - Resolved theme color palette.
 * @returns CSS properties for the option description `span`.
 */
export function buildOptionDescriptionStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: 1.38,
    color: themeColors.text.secondary,
    fontFamily: fontFamilyStacks.sans,
    margin: 0,
    marginTop: spacing['2xs'],
  };
}

// ---------------------------------------------------------------------------
// Error message
// ---------------------------------------------------------------------------

/**
 * Builds the style for the error message rendered below the options.
 *
 * @param themeColors - Resolved theme color palette.
 * @returns CSS properties for the error `p` element.
 */
export function buildErrorStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: 1.38,
    color: themeColors.status.danger,
    fontFamily: fontFamilyStacks.sans,
    margin: 0,
  };
}
