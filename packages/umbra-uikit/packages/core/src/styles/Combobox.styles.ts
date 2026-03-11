import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { InputSizeConfig } from '../types/Input.types';
import { fontFamilyStacks, glassStyle } from '../tokens/shared';
import type { SurfaceVariant } from '../tokens/shared';
import { zIndex } from '../tokens/z-index';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Resolved combobox colors
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens consumed by the Combobox style builders.
 *
 * @remarks
 * Produced by {@link resolveComboboxColors} based on the current interaction
 * state (focused, error, disabled) and the active theme palette.
 */
export interface ComboboxColors {
  /** Border color of the trigger container. */
  border: string;
  /** Background color of the trigger container. */
  bg: string;
  /** Primary text color inside the input. */
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
// Resolve combobox colors based on state
// ---------------------------------------------------------------------------

/**
 * Derives a {@link ComboboxColors} palette from the current interaction state.
 *
 * @param focused - Whether the combobox dropdown is open / input is focused.
 * @param error - Whether the component is in an error state.
 * @param disabled - Whether the component is disabled.
 * @param themeColors - Active theme color tokens.
 * @returns A fully resolved {@link ComboboxColors} object.
 */
export function resolveComboboxColors(
  focused: boolean,
  error: boolean,
  disabled: boolean,
  theme: WispTheme,
): ComboboxColors {
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
// Wrapper style (vertical flex for label + trigger + hint)
// ---------------------------------------------------------------------------

/**
 * Builds the outer wrapper style (vertical flex column for label + trigger + hint).
 *
 * @param sizeConfig - Active {@link InputSizeConfig} for the chosen size variant.
 * @param fullWidth - Whether the wrapper should stretch to 100% width.
 * @returns CSS properties for the wrapper `<div>`.
 */
export function buildWrapperStyle(
  sizeConfig: InputSizeConfig,
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
// Trigger container style (the bordered wrapper around the input)
// ---------------------------------------------------------------------------

/**
 * Builds the trigger container style (the bordered box wrapping the input and icons).
 *
 * @param sizeConfig - Active {@link InputSizeConfig}.
 * @param colors - Resolved {@link ComboboxColors} for the current state.
 * @param disabled - Whether the trigger is disabled (controls cursor style).
 * @returns CSS properties for the trigger container `<div>`.
 */
export function buildTriggerStyle(
  sizeConfig: InputSizeConfig,
  colors: ComboboxColors,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: sizeConfig.paddingX > 10 ? 8 : 6,
    height: sizeConfig.height,
    paddingLeft: sizeConfig.paddingX,
    paddingRight: sizeConfig.paddingX - 2,
    backgroundColor: colors.bg,
    borderRadius: radii[sizeConfig.borderRadius],
    boxSizing: 'border-box',
    border: '1px solid ' + colors.border,
    boxShadow:
      colors.focusRing !== 'transparent'
        ? '0 0 0 2px ' + colors.focusRing + '25'
        : 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Input element style inside trigger
// ---------------------------------------------------------------------------

/**
 * Builds the inline input element style rendered inside the trigger container.
 *
 * @param sizeConfig - Active {@link InputSizeConfig}.
 * @param colors - Resolved {@link ComboboxColors}.
 * @returns CSS properties for the `<input>` element.
 */
export function buildComboboxInputStyle(
  sizeConfig: InputSizeConfig,
  colors: ComboboxColors,
): CSSStyleObject {
  return {
    margin: 0,
    padding: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    appearance: 'none',
    flex: 1,
    minWidth: 0,
    width: '100%',
    height: '100%',
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    lineHeight: sizeConfig.lineHeight,
    color: colors.text,
    cursor: 'inherit',
  };
}

// ---------------------------------------------------------------------------
// Label style
// ---------------------------------------------------------------------------

/**
 * Builds the label text style rendered above the trigger.
 *
 * @param sizeConfig - Active {@link InputSizeConfig}.
 * @param colors - Resolved {@link ComboboxColors}.
 * @returns CSS properties for the `<label>` element.
 */
export function buildLabelStyle(
  sizeConfig: InputSizeConfig,
  colors: ComboboxColors,
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
 * @param sizeConfig - Active {@link InputSizeConfig}.
 * @param colors - Resolved {@link ComboboxColors}.
 * @param isError - Whether the text represents an error message (used for future styling hooks).
 * @returns CSS properties for the hint / error `<span>`.
 */
export function buildHintStyle(
  sizeConfig: InputSizeConfig,
  colors: ComboboxColors,
  isError: boolean,
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
// Dropdown (portal) style
// ---------------------------------------------------------------------------

/**
 * Builds the portal-rendered dropdown listbox container style.
 *
 * @remarks
 * The returned styles provide base positioning; the consumer must merge
 * computed `top`, `left`, and `width` values from the trigger's bounding rect.
 *
 * @param themeColors - Active theme color tokens.
 * @param variant - Surface variant (`'solid'` | `'glass'`). Defaults to `'solid'`.
 * @returns CSS properties for the dropdown `<div>` with `role="listbox"`.
 */
export function buildDropdownStyle(
  theme: WispTheme,
  variant: SurfaceVariant = 'solid',
): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    position: 'absolute',
    zIndex: zIndex.dropdown,
    backgroundColor: themeColors.background.raised,
    border: '1px solid ' + themeColors.border.subtle,
    borderRadius: radii.md,
    boxShadow:
      '0 4px 12px ' + themeColors.background.overlay,
    maxHeight: 240,
    overflowY: 'auto',
    padding: `${spacing.xs}px 0`,
    boxSizing: 'border-box',
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
 * @param isHighlighted - Whether this option is keyboard-highlighted.
 * @param isSelected - Whether this option is the currently selected value.
 * @param isDisabled - Whether this option is disabled.
 * @returns CSS properties for the option `<div>` with `role="option"`.
 */
export function buildOptionStyle(
  theme: WispTheme,
  isHighlighted: boolean,
  isSelected: boolean,
  isDisabled: boolean,
): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm}px ${spacing.md}px`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: 1.43,
    color: isDisabled ? themeColors.text.muted : themeColors.text.onRaised,
    backgroundColor: isHighlighted
      ? themeColors.accent.highlightRaised
      : 'transparent',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    border: 'none',
    outline: 'none',
    width: '100%',
    textAlign: 'left' as const,
    boxSizing: 'border-box' as const,
  };
}

// ---------------------------------------------------------------------------
// Empty state style
// ---------------------------------------------------------------------------

/**
 * Builds the style for the empty-state message shown when filtering yields no results.
 *
 * @param themeColors - Active theme color tokens.
 * @returns CSS properties for the empty-state `<div>`.
 */
export function buildEmptyStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.lg}px ${spacing.md}px`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: 1.43,
    color: themeColors.text.muted,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Builds the skeleton loading placeholder style for the Combobox component.
 *
 * @param sizeConfig - Active {@link InputSizeConfig}.
 * @param themeColors - Active theme color tokens.
 * @returns CSS properties for the skeleton `<div>`.
 */
export function getComboboxSkeletonStyle(
  sizeConfig: InputSizeConfig,
  theme: WispTheme,
  fullWidth: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'block',
    width: fullWidth ? '100%' : 240,
    height: sizeConfig.height,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
