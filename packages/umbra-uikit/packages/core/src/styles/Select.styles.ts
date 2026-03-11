import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { SelectSizeConfig } from '../types/Select.types';
import { fontFamilyStacks, glassStyle } from '../tokens/shared';
import type { SurfaceVariant } from '../tokens/shared';
import { zIndex } from '../tokens/z-index';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Resolved select colors
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens consumed by the Select style builders.
 *
 * @remarks
 * Produced by {@link resolveSelectColors} based on the current interaction
 * state (focused, error, disabled) and the active theme palette.
 */
export interface SelectColors {
  /** Border color of the trigger. */
  border: string;
  /** Background color of the trigger. */
  bg: string;
  /** Primary text color inside the trigger. */
  text: string;
  /** Color used for placeholder text. */
  placeholder: string;
  /** Color applied to leading and chevron icons. */
  icon: string;
  /** Color of the label text above the trigger. */
  label: string;
  /** Color of the hint or error text below the trigger. */
  hint: string;
  /** Outer focus-ring color (set to `'transparent'` when inactive). */
  focusRing: string;
}

// ---------------------------------------------------------------------------
// Resolve select colors based on state
// ---------------------------------------------------------------------------

/**
 * Derives a {@link SelectColors} palette from the current interaction state.
 *
 * @param focused - Whether the dropdown is currently open / focused.
 * @param error - Whether the component is in an error state.
 * @param disabled - Whether the component is disabled.
 * @param themeColors - Active theme color tokens.
 * @returns A fully resolved {@link SelectColors} object.
 */
export function resolveSelectColors(
  focused: boolean,
  error: boolean,
  disabled: boolean,
  theme: WispTheme,
): SelectColors {
  const { colors: themeColors } = theme;
  if (disabled) {
    return {
      border: themeColors.border.subtle,
      bg: themeColors.border.subtle,
      text: themeColors.text.muted,
      placeholder: themeColors.text.muted,
      icon: themeColors.text.muted,
      label: themeColors.text.muted,
      hint: themeColors.text.muted,
      focusRing: 'transparent',
    };
  }

  if (error) {
    return {
      border: themeColors.status.danger,
      bg: 'transparent',
      text: themeColors.text.primary,
      placeholder: themeColors.text.muted,
      icon: themeColors.text.muted,
      label: themeColors.text.primary,
      hint: themeColors.status.danger,
      focusRing: focused ? themeColors.status.danger : 'transparent',
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
      hint: themeColors.text.muted,
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
    hint: themeColors.text.muted,
    focusRing: 'transparent',
  };
}

// ---------------------------------------------------------------------------
// Wrapper style
// ---------------------------------------------------------------------------

/**
 * Builds the outer wrapper style (vertical flex column for label + trigger + hint).
 *
 * @param sizeConfig - Active {@link SelectSizeConfig} for the chosen size variant.
 * @param fullWidth - Whether the wrapper should stretch to 100% width.
 * @returns CSS properties for the wrapper `<div>`.
 */
export function buildWrapperStyle(
  sizeConfig: SelectSizeConfig,
  fullWidth: boolean,
): CSSStyleObject {
  return {
    display: fullWidth ? 'flex' : 'inline-flex',
    flexDirection: 'column',
    gap: sizeConfig.paddingY > 6 ? 6 : 4,
    width: fullWidth ? '100%' : undefined,
    position: 'relative',
  };
}

// ---------------------------------------------------------------------------
// Trigger style
// ---------------------------------------------------------------------------

/**
 * Builds the trigger button style (the clickable area that opens the dropdown).
 *
 * @param sizeConfig - Active {@link SelectSizeConfig}.
 * @param colors - Resolved {@link SelectColors} for the current state.
 * @param disabled - Whether the trigger is disabled (controls cursor style).
 * @returns CSS properties for the trigger `<button>`.
 */
export function buildTriggerStyle(
  sizeConfig: SelectSizeConfig,
  colors: SelectColors,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sizeConfig.paddingX > 10 ? 8 : 6,
    height: sizeConfig.height,
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
    lineHeight: sizeConfig.lineHeight,
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
 * @param colors - Resolved {@link SelectColors}.
 * @param isPlaceholder - `true` when no option is selected and placeholder text is shown.
 * @returns CSS properties for the trigger text `<span>`.
 */
export function buildTriggerTextStyle(
  colors: SelectColors,
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
 * Builds the dropdown listbox container style.
 *
 * @param themeColors - Active theme color tokens.
 * @param variant - Surface variant (`'solid'` | `'glass'`). Defaults to `'solid'`.
 * @returns CSS properties for the dropdown `<div>` with `role="listbox"`.
 */
export function buildDropdownStyle(
  theme: WispTheme,
  variant: SurfaceVariant = 'solid',
): CSSStyleObject {
  const { colors: themeColors, radii, spacing, shadows } = theme;
  return {
    position: 'absolute',
    zIndex: zIndex.dropdown,
    boxSizing: 'border-box',
    backgroundColor: themeColors.background.raised,
    border: '1px solid ' + themeColors.border.subtle,
    borderRadius: radii.md,
    boxShadow: shadows.md,
    maxHeight: 240,
    overflowY: 'auto',
    padding: `${spacing.xs}px 0`,
    marginTop: spacing.xs,
    ...(variant === 'glass' ? glassStyle : undefined),
    ...(variant === 'glass' ? { borderRadius: radii.md, overflow: 'hidden' } : undefined),
  };
}

// ---------------------------------------------------------------------------
// Option style
// ---------------------------------------------------------------------------

/**
 * Builds the style for an individual option row inside the dropdown.
 *
 * @param themeColors - Active theme color tokens.
 * @param isSelected - Whether this option is the currently selected value.
 * @param isHighlighted - Whether this option is keyboard-highlighted.
 * @param isDisabled - Whether this option is disabled.
 * @param fontSize - Font size in pixels (derived from the active size config).
 * @param lineHeight - CSS line-height multiplier.
 * @returns CSS properties for the option `<div>` with `role="option"`.
 */
export function buildOptionStyle(
  theme: WispTheme,
  isSelected: boolean,
  isHighlighted: boolean,
  isDisabled: boolean,
  fontSize: number,
  lineHeight: number,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  let backgroundColor = 'transparent';
  if (isHighlighted && !isDisabled) {
    backgroundColor = themeColors.accent.highlightRaised;
  }

  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm}px ${spacing.md}px`,
    fontFamily: fontFamilyStacks.sans,
    fontSize,
    lineHeight,
    color: isDisabled ? themeColors.text.muted : themeColors.text.onRaised,
    backgroundColor,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Label style
// ---------------------------------------------------------------------------

/**
 * Builds the label text style rendered above the trigger.
 *
 * @param sizeConfig - Active {@link SelectSizeConfig}.
 * @param colors - Resolved {@link SelectColors}.
 * @returns CSS properties for the label `<span>`.
 */
export function buildLabelStyle(
  sizeConfig: SelectSizeConfig,
  colors: SelectColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.labelFontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.medium,
    color: colors.label,
    cursor: 'default',
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Hint / error style
// ---------------------------------------------------------------------------

/**
 * Builds the hint or error message text style rendered below the trigger.
 *
 * @param sizeConfig - Active {@link SelectSizeConfig}.
 * @param colors - Resolved {@link SelectColors} (the `hint` token adapts to error state).
 * @returns CSS properties for the hint / error `<span>`.
 */
export function buildHintStyle(
  sizeConfig: SelectSizeConfig,
  colors: SelectColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.hintFontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.regular,
    color: colors.hint,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Builds the skeleton loading placeholder style for the Select component.
 *
 * @param sizeConfig - Active {@link SelectSizeConfig}.
 * @param themeColors - Active theme color tokens.
 * @returns CSS properties for the skeleton `<div>`.
 */
export function getSelectSkeletonStyle(
  sizeConfig: SelectSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-block',
    width: '100%',
    height: sizeConfig.height,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
