import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { LocalePickerSizeConfig } from '../types/LocalePicker.types';
import { fontFamilyStacks } from '../tokens/shared';
import { zIndex } from '../tokens/z-index';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Resolved locale-picker colors
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens consumed by the LocalePicker style builders.
 *
 * @remarks
 * Produced by {@link resolveLocalePickerColors} based on the current
 * interaction state (focused, disabled) and the active theme palette.
 */
export interface LocalePickerColors {
  /** Border color of the trigger. */
  border: string;
  /** Background color of the trigger. */
  bg: string;
  /** Primary text color inside the trigger. */
  text: string;
  /** Color used for placeholder text. */
  placeholder: string;
  /** Color applied to the globe and chevron icons. */
  icon: string;
  /** Color of the label text above the trigger. */
  label: string;
  /** Outer focus-ring color (set to `'transparent'` when inactive). */
  focusRing: string;
}

// ---------------------------------------------------------------------------
// Resolve colors based on state
// ---------------------------------------------------------------------------

/**
 * Derives a {@link LocalePickerColors} palette from the current interaction state.
 *
 * @param focused - Whether the dropdown is currently open / focused.
 * @param disabled - Whether the component is disabled.
 * @param themeColors - Active theme color tokens.
 * @returns A fully resolved {@link LocalePickerColors} object.
 */
export function resolveLocalePickerColors(
  focused: boolean,
  disabled: boolean,
  theme: WispTheme,
): LocalePickerColors {
  const { colors: themeColors } = theme;
  if (disabled) {
    return {
      border: themeColors.border.subtle,
      bg: themeColors.border.subtle,
      text: themeColors.text.muted,
      placeholder: themeColors.text.muted,
      icon: themeColors.text.muted,
      label: themeColors.text.muted,
      focusRing: 'transparent',
    };
  }

  if (focused) {
    return {
      border: themeColors.accent.primary,
      bg: 'transparent',
      text: themeColors.text.primary,
      placeholder: themeColors.text.muted,
      icon: themeColors.text.muted,
      label: themeColors.text.primary,
      focusRing: themeColors.accent.primary,
    };
  }

  return {
    border: themeColors.border.strong,
    bg: 'transparent',
    text: themeColors.text.primary,
    placeholder: themeColors.text.muted,
    icon: themeColors.text.muted,
    label: themeColors.text.primary,
    focusRing: 'transparent',
  };
}

// ---------------------------------------------------------------------------
// Wrapper style
// ---------------------------------------------------------------------------

/**
 * Builds the outer wrapper style (vertical flex column for label + trigger).
 *
 * @param sizeConfig - Active {@link LocalePickerSizeConfig} for the chosen size variant.
 * @returns CSS properties for the wrapper `<div>`.
 */
export function buildWrapperStyle(
  sizeConfig: LocalePickerSizeConfig,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    flexDirection: 'column',
    gap: sizeConfig.paddingX > 10 ? 6 : 4,
    position: 'relative',
  };
}

// ---------------------------------------------------------------------------
// Label style
// ---------------------------------------------------------------------------

/**
 * Builds the label text style rendered above the trigger.
 *
 * @param sizeConfig - Active {@link LocalePickerSizeConfig}.
 * @param colors - Resolved {@link LocalePickerColors}.
 * @returns CSS properties for the label `<span>`.
 */
export function buildLabelStyle(
  sizeConfig: LocalePickerSizeConfig,
  colors: LocalePickerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.medium,
    color: colors.label,
    cursor: 'default',
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Trigger style
// ---------------------------------------------------------------------------

/**
 * Builds the trigger button style (the clickable area that opens the dropdown).
 *
 * @param sizeConfig - Active {@link LocalePickerSizeConfig}.
 * @param colors - Resolved {@link LocalePickerColors} for the current state.
 * @param disabled - Whether the trigger is disabled (controls cursor style).
 * @returns CSS properties for the trigger `<button>`.
 */
export function buildTriggerStyle(
  sizeConfig: LocalePickerSizeConfig,
  colors: LocalePickerColors,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sizeConfig.paddingX > 10 ? 8 : 6,
    height: sizeConfig.inputHeight,
    paddingLeft: sizeConfig.paddingX,
    paddingRight: sizeConfig.paddingX,
    backgroundColor: colors.bg === 'transparent' ? 'transparent' : colors.bg,
    borderRadius: radii[sizeConfig.borderRadius],
    boxSizing: 'border-box',
    border: '1px solid ' + colors.border,
    boxShadow: colors.focusRing !== 'transparent'
      ? '0 0 0 2px ' + colors.focusRing + '25'
      : 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    lineHeight: 1.4,
    color: colors.text,
    outline: 'none',
    margin: 0,
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  };
}

// ---------------------------------------------------------------------------
// Trigger text style
// ---------------------------------------------------------------------------

/**
 * Builds the text style for the selected label or placeholder inside the trigger.
 *
 * @param colors - Resolved {@link LocalePickerColors}.
 * @param isPlaceholder - `true` when no locale is selected and placeholder text is shown.
 * @returns CSS properties for the trigger text `<span>`.
 */
export function buildTriggerTextStyle(
  colors: LocalePickerColors,
  isPlaceholder: boolean,
): CSSStyleObject {
  return {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: isPlaceholder ? colors.placeholder : colors.text,
  };
}

// ---------------------------------------------------------------------------
// Dropdown style
// ---------------------------------------------------------------------------

/**
 * Builds the dropdown container style.
 *
 * @param themeColors - Active theme color tokens.
 * @returns CSS properties for the dropdown `<div>`.
 */
export function buildDropdownStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing, shadows } = theme;
  return {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: zIndex.dropdown,
    boxSizing: 'border-box',
    backgroundColor: themeColors.background.raised,
    border: '1px solid ' + themeColors.border.subtle,
    borderRadius: radii.lg,
    boxShadow: shadows.md,
    maxHeight: 300,
    overflow: 'hidden',
    marginTop: spacing.xs,
    display: 'flex',
    flexDirection: 'column',
  };
}

// ---------------------------------------------------------------------------
// Search input style
// ---------------------------------------------------------------------------

/**
 * Builds the style for the search input inside the dropdown.
 *
 * @param sizeConfig - Active {@link LocalePickerSizeConfig}.
 * @param themeColors - Active theme color tokens.
 * @returns CSS properties for the search `<input>`.
 */
export function buildSearchInputStyle(
  sizeConfig: LocalePickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'block',
    width: '100%',
    height: sizeConfig.searchHeight,
    padding: '0 ' + sizeConfig.paddingX + 'px',
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid ' + themeColors.border.subtle,
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    lineHeight: 1.4,
    color: themeColors.text.onRaised,
    outline: 'none',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Group header style
// ---------------------------------------------------------------------------

/**
 * Builds the style for a region group header inside the dropdown.
 *
 * @param sizeConfig - Active {@link LocalePickerSizeConfig}.
 * @param themeColors - Active theme color tokens.
 * @returns CSS properties for the group header `<div>`.
 */
export function buildGroupHeaderStyle(
  sizeConfig: LocalePickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize - 1,
    fontWeight: typography.weights.semibold,
    lineHeight: 1.4,
    color: themeColors.text.onRaisedSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '8px ' + sizeConfig.paddingX + 'px 4px',
    userSelect: 'none',
    cursor: 'default',
  };
}

// ---------------------------------------------------------------------------
// Option style
// ---------------------------------------------------------------------------

/**
 * Builds the style for an individual locale option row inside the dropdown.
 *
 * @param sizeConfig - Active {@link LocalePickerSizeConfig}.
 * @param themeColors - Active theme color tokens.
 * @param isSelected - Whether this option is the currently selected locale.
 * @param isHighlighted - Whether this option is mouse-highlighted.
 * @returns CSS properties for the option `<div>`.
 */
export function buildOptionStyle(
  sizeConfig: LocalePickerSizeConfig,
  theme: WispTheme,
  isSelected: boolean,
  isHighlighted: boolean,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  let backgroundColor = 'transparent';
  if (isHighlighted) {
    backgroundColor = themeColors.accent.highlightRaised;
  }

  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: sizeConfig.optionHeight,
    padding: '0 ' + sizeConfig.paddingX + 'px',
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    lineHeight: 1.4,
    color: themeColors.text.onRaised,
    backgroundColor,
    cursor: 'pointer',
    userSelect: 'none',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Options list container style
// ---------------------------------------------------------------------------

/**
 * Builds the style for the scrollable options list container.
 *
 * @returns CSS properties for the options list `<div>`.
 */
export function buildOptionsListStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    overflowY: 'auto',
    flex: 1,
    padding: `${spacing.xs}px 0`,
  };
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Builds the skeleton loading placeholder style for the LocalePicker component.
 *
 * @param sizeConfig - Active {@link LocalePickerSizeConfig}.
 * @param themeColors - Active theme color tokens.
 * @returns CSS properties for the skeleton `<div>`.
 */
export function buildSkeletonStyle(
  sizeConfig: LocalePickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-block',
    width: '100%',
    height: sizeConfig.inputHeight,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
