import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { InputSizeConfig } from '../types/Input.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Resolved input colors
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens consumed by the Input style builders.
 *
 * @remarks
 * Produced by {@link resolveInputColors} and then passed into every
 * `build*Style` helper so that colors stay consistent across the entire
 * Input anatomy (container, label, hint, icons, focus ring).
 */
export interface InputColors {
  /** Border color for the input container. */
  border: string;
  /** Background color for the input container. */
  bg: string;
  /** Text color for the `<input>` element value. */
  text: string;
  /** Color used for the placeholder text. */
  placeholder: string;
  /** Color applied to leading and trailing icons. */
  icon: string;
  /** Color for the label text above the input. */
  label: string;
  /** Color for the hint or status message below the input. */
  hint: string;
  /** Color of the outer focus/status ring (transparent when inactive). */
  focusRing: string;
}

// ---------------------------------------------------------------------------
// Resolve input colors based on state
// ---------------------------------------------------------------------------

/**
 * Derives a complete {@link InputColors} palette based on the current
 * interaction state and theme.
 *
 * @remarks
 * State priority (highest to lowest): disabled > error > warning > focused > default.
 *
 * @param focused  - Whether the input is currently focused.
 * @param error    - Whether the input is in an error state.
 * @param warning  - Whether the input is in a warning state.
 * @param disabled - Whether the input is disabled.
 * @param themeColors - The active {@link ThemeColors} from the theme provider.
 * @returns A fully resolved {@link InputColors} object.
 */
export function resolveInputColors(
  focused: boolean,
  error: boolean,
  warning: boolean,
  disabled: boolean,
  theme: WispTheme,
): InputColors {
  const { colors: themeColors } = theme;
  // Disabled state
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

  // Error state (takes precedence over warning)
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

  // Warning state
  if (warning) {
    return {
      border: themeColors.status.warning,
      bg: 'transparent',
      text: themeColors.text.primary,
      placeholder: themeColors.text.muted,
      icon: themeColors.text.muted,
      label: themeColors.text.primary,
      hint: themeColors.status.warning,
      focusRing: focused ? themeColors.status.warning : 'transparent',
    };
  }

  // Focused state
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

  // Default state
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
// Wrapper style (vertical flex for label + input + hint)
// ---------------------------------------------------------------------------

/**
 * Builds the outermost wrapper style (vertical flex column containing the
 * label, input container, and hint/error text).
 *
 * @param sizeConfig - Dimension tokens for the active size.
 * @param fullWidth  - When `true`, the wrapper stretches to 100 % width.
 * @returns `CSSStyleObject` for the wrapper `<div>`.
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
  };
}

// ---------------------------------------------------------------------------
// Input container style (the bordered wrapper around the input)
// ---------------------------------------------------------------------------

/**
 * Builds styles for the bordered container that wraps the `<input>` element
 * and its optional leading/trailing icons.
 *
 * @param sizeConfig      - Dimension tokens for the active size.
 * @param colors          - Resolved {@link InputColors} for the current state.
 * @param disabled        - Whether the input is disabled (affects cursor).
 * @param hasIcon         - Whether a leading icon is present (adjusts left padding).
 * @param hasTrailingIcon - Whether a trailing icon is present (adjusts right padding).
 * @returns `CSSStyleObject` for the input container `<div>`.
 */
export function buildInputContainerStyle(
  sizeConfig: InputSizeConfig,
  colors: InputColors,
  disabled: boolean,
  hasIcon: boolean,
  hasTrailingIcon: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: sizeConfig.paddingX > 10 ? 8 : 6,
    height: sizeConfig.height,
    paddingLeft: hasIcon ? sizeConfig.paddingX - 2 : sizeConfig.paddingX,
    paddingRight: hasTrailingIcon ? sizeConfig.paddingX - 2 : sizeConfig.paddingX,
    backgroundColor: colors.bg,
    borderRadius: radii[sizeConfig.borderRadius],
    boxSizing: 'border-box',
    border: `1px solid ${colors.border}`,
    boxShadow: colors.focusRing !== 'transparent'
      ? `0 0 0 2px ${colors.focusRing}25`
      : 'none',
    cursor: disabled ? 'not-allowed' : 'text',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Input element style (the actual <input>)
// ---------------------------------------------------------------------------

/**
 * Builds styles for the native `<input>` element itself, resetting
 * browser defaults and applying size-appropriate typography and colors.
 *
 * @param sizeConfig - Dimension tokens for the active size.
 * @param colors     - Resolved {@link InputColors} for the current state.
 * @returns `CSSStyleObject` for the `<input>` element.
 */
export function buildInputStyle(
  sizeConfig: InputSizeConfig,
  colors: InputColors,
): CSSStyleObject {
  return {
    // Reset
    margin: 0,
    padding: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    appearance: 'none',

    // Sizing
    flex: 1,
    minWidth: 0,
    width: '100%',
    height: '100%',

    // Typography
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    lineHeight: sizeConfig.lineHeight,

    // Colors
    color: colors.text,

    // Interaction
    cursor: 'inherit',
  };
}

// ---------------------------------------------------------------------------
// Label style
// ---------------------------------------------------------------------------

/**
 * Builds styles for the `<label>` element rendered above the input.
 *
 * @param sizeConfig - Dimension tokens for the active size.
 * @param colors     - Resolved {@link InputColors} for the current state.
 * @returns `CSSStyleObject` for the `<label>` element.
 */
export function buildLabelStyle(
  sizeConfig: InputSizeConfig,
  colors: InputColors,
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
 * Builds styles for the hint, error, or warning text rendered below the input.
 *
 * @param sizeConfig - Dimension tokens for the active size.
 * @param colors     - Resolved {@link InputColors} for the current state.
 * @param isError    - When `true`, the text is treated as an error/warning status
 *                     message (color may differ from a regular hint).
 * @returns `CSSStyleObject` for the hint/status `<span>`.
 */
export function buildHintStyle(
  sizeConfig: InputSizeConfig,
  colors: InputColors,
  isError: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.hintFontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.regular,
    color: isError ? colors.hint : colors.hint,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Builds styles for the skeleton shimmer placeholder shown when
 * `skeleton` is `true`.
 *
 * @param sizeConfig   - Dimension tokens for the active size (used for
 *                       height and border-radius).
 * @param themeColors  - The active {@link ThemeColors} providing the
 *                       skeleton background tint.
 * @returns `CSSStyleObject` for the skeleton `<div>`.
 */
export function getInputSkeletonStyle(
  sizeConfig: InputSizeConfig,
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
