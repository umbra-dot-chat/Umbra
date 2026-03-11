import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { InputSizeConfig } from '../types/Input.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Size config for the circular stepper buttons
// ---------------------------------------------------------------------------

/** Dimension tokens for the circular stepper buttons inside {@link NumberInput}. */
export interface NumberInputButtonSizeConfig {
  /** Diameter of the circular button in pixels. */
  buttonSize: number;
  /** Icon size inside the button in pixels. */
  iconSize: number;
}

/** Maps each {@link NumberInputSize} to its corresponding button dimension tokens. */
export const numberInputButtonSizeMap: Record<'sm' | 'md' | 'lg', NumberInputButtonSizeConfig> = {
  sm: { buttonSize: 28, iconSize: 14 },
  md: { buttonSize: 36, iconSize: 16 },
  lg: { buttonSize: 44, iconSize: 20 },
};

// ---------------------------------------------------------------------------
// Wrapper style (vertical flex for label + container + hint)
// ---------------------------------------------------------------------------

/**
 * Builds the outer wrapper style for the NumberInput (label + container + hint column).
 *
 * @param fullWidth - When `true`, the wrapper stretches to 100% width.
 * @returns CSS properties for the wrapper `div`.
 */
export function buildWrapperStyle(fullWidth: boolean, theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: fullWidth ? 'flex' : 'inline-flex',
    flexDirection: 'column',
    gap: spacing.sm,
    width: fullWidth ? '100%' : undefined,
  };
}

// ---------------------------------------------------------------------------
// Container style (the bordered row with [○−] [input] [+○])
// ---------------------------------------------------------------------------

/**
 * Builds the bordered row container style that houses the stepper buttons and input.
 *
 * @param sizeConfig - Dimension tokens derived from the active size variant.
 * @param disabled - Whether the component is disabled.
 * @param error - Whether the component is in an error state.
 * @param focused - Whether the inner input currently has focus.
 * @param themeColors - Resolved theme color palette.
 * @returns CSS properties for the container `div`.
 */
export function buildContainerStyle(
  sizeConfig: InputSizeConfig,
  disabled: boolean,
  error: boolean,
  focused: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing, radii } = theme;
  // Resolve border color
  let borderColor: string;
  let focusRing: string = 'transparent';

  if (disabled) {
    borderColor = themeColors.border.subtle;
  } else if (error) {
    borderColor = themeColors.status.danger;
    if (focused) focusRing = themeColors.status.danger;
  } else if (focused) {
    borderColor = themeColors.accent.primary;
    focusRing = themeColors.accent.primary;
  } else {
    borderColor = themeColors.border.strong;
  }

  return {
    display: 'flex',
    alignItems: 'center',
    height: sizeConfig.height + 16, // more spacious than standard input
    padding: `0 ${spacing.sm}px`,
    border: `1px solid ${borderColor}`,
    borderRadius: radii[sizeConfig.borderRadius] + 4,
    background: disabled ? themeColors.border.subtle : 'transparent',
    boxSizing: 'border-box',
    boxShadow:
      focusRing !== 'transparent'
        ? `0 0 0 2px ${focusRing}25`
        : 'none',
    cursor: disabled ? 'not-allowed' : 'text',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Input element style (the center text field)
// ---------------------------------------------------------------------------

/**
 * Builds the style for the centered text input element.
 *
 * @param sizeConfig - Dimension tokens derived from the active size variant.
 * @param themeColors - Resolved theme color palette.
 * @returns CSS properties for the `input` element.
 */
export function buildInputStyle(
  sizeConfig: InputSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    // Reset
    margin: 0,
    padding: `0 ${sizeConfig.paddingX}px`,
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
    fontSize: sizeConfig.fontSize + 1,
    fontWeight: typography.weights.medium,
    lineHeight: sizeConfig.lineHeight,
    textAlign: 'center',

    // Colors
    color: themeColors.text.primary,

    // Interaction
    cursor: 'inherit',
  };
}

// ---------------------------------------------------------------------------
// Circular stepper button style (−/+ buttons)
// ---------------------------------------------------------------------------

/**
 * Builds the style for a circular stepper button (increment or decrement).
 *
 * @param buttonConfig - Button dimension tokens for the active size variant.
 * @param disabled - Whether the button is disabled (or at a clamped boundary).
 * @param hovered - Whether the button is currently hovered.
 * @param themeColors - Resolved theme color palette.
 * @returns CSS properties for the `button` element.
 */
export function buildButtonStyle(
  buttonConfig: NumberInputButtonSizeConfig,
  disabled: boolean,
  hovered: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  // Circle uses accent.primary (white in dark, black in light)
  // Slightly dimmed on hover via primaryHover, pressed via primaryActive
  const bgColor = disabled
    ? themeColors.accent.highlight
    : hovered
      ? themeColors.accent.primaryHover
      : themeColors.accent.primary;

  return {
    // Reset
    margin: 0,
    padding: 0,
    border: 'none',
    outline: 'none',

    // Circular shape
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: buttonConfig.buttonSize,
    height: buttonConfig.buttonSize,
    borderRadius: radii.full,
    flexShrink: 0,

    // Colors
    background: bgColor,
    color: themeColors.text.inverse,

    // Interaction
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: `background ${durations.fast}ms ${easings.easeOut.css}, opacity ${durations.fast}ms ${easings.easeOut.css}`,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Label style
// ---------------------------------------------------------------------------

/**
 * Builds the style for the label element rendered above the input.
 *
 * @param sizeConfig - Dimension tokens derived from the active size variant.
 * @param disabled - Whether the component is disabled (dims the label).
 * @param themeColors - Resolved theme color palette.
 * @returns CSS properties for the `label` element.
 */
export function buildLabelStyle(
  sizeConfig: InputSizeConfig,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.labelFontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.semibold,
    color: disabled ? themeColors.text.muted : themeColors.text.primary,
    cursor: 'default',
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Hint / error style
// ---------------------------------------------------------------------------

/**
 * Builds the style for the hint or error text rendered below the input.
 *
 * @param sizeConfig - Dimension tokens derived from the active size variant.
 * @param error - When `true`, the text is styled with the danger color.
 * @param themeColors - Resolved theme color palette.
 * @returns CSS properties for the hint `span` element.
 */
export function buildHintStyle(
  sizeConfig: InputSizeConfig,
  error: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.hintFontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.regular,
    color: error ? themeColors.status.danger : themeColors.text.muted,
    margin: 0,
  };
}
