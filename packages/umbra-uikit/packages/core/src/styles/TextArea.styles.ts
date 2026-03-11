import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { TextAreaSizeConfig } from '../types/TextArea.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Resolved textarea colors
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens consumed by the TextArea style builders.
 *
 * @remarks
 * Produced by {@link resolveTextAreaColors} and threaded through every
 * `build*Style` helper so that color decisions are made in one place.
 */
export interface TextAreaColors {
  /** Border color of the textarea container. */
  border: string;
  /** Background color of the textarea container. */
  bg: string;
  /** Text color inside the textarea. */
  text: string;
  /** Placeholder text color. */
  placeholder: string;
  /** Label text color. */
  label: string;
  /** Hint / error / warning text color. */
  hint: string;
  /** Focus ring (box-shadow) color. `'transparent'` when no ring is shown. */
  focusRing: string;
}

// ---------------------------------------------------------------------------
// Resolve textarea colors based on state
// ---------------------------------------------------------------------------

/**
 * Derive the full {@link TextAreaColors} palette for the current component state.
 *
 * @param focused  - Whether the textarea currently has focus.
 * @param error    - Whether the textarea is in an error state.
 * @param warning  - Whether the textarea is in a warning state.
 * @param disabled - Whether the textarea is disabled.
 * @param themeColors - Active theme color tokens.
 * @returns A {@link TextAreaColors} object reflecting the highest-priority state.
 */
export function resolveTextAreaColors(
  focused: boolean,
  error: boolean,
  warning: boolean,
  disabled: boolean,
  theme: WispTheme,
): TextAreaColors {
  const { colors: themeColors } = theme;
  // Disabled state
  if (disabled) {
    return {
      border: themeColors.border.subtle,
      bg: themeColors.border.subtle,
      text: themeColors.text.muted,
      placeholder: themeColors.text.muted,
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
    label: themeColors.text.primary,
    hint: themeColors.text.muted,
    focusRing: 'transparent',
  };
}

// ---------------------------------------------------------------------------
// Wrapper style (vertical flex for label + textarea + hint)
// ---------------------------------------------------------------------------

/**
 * Build the outer wrapper `CSSProperties` (vertical flex column for label, textarea, and hint).
 *
 * @param sizeConfig - Active size configuration.
 * @param fullWidth  - When `true`, wrapper stretches to 100 % width.
 * @returns Inline style object for the wrapper `<div>`.
 */
export function buildWrapperStyle(
  sizeConfig: TextAreaSizeConfig,
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
// Textarea container style (the bordered wrapper around the textarea)
// ---------------------------------------------------------------------------

/**
 * Build the bordered container `CSSProperties` that wraps the native `<textarea>`.
 *
 * @param sizeConfig - Active size configuration.
 * @param colors     - Resolved color tokens.
 * @param disabled   - Whether the textarea is disabled (affects cursor).
 * @returns Inline style object for the container `<div>`.
 */
export function buildTextAreaContainerStyle(
  sizeConfig: TextAreaSizeConfig,
  colors: TextAreaColors,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    minHeight: sizeConfig.minHeight,
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
// Textarea element style (the actual <textarea>)
// ---------------------------------------------------------------------------

/**
 * Build the inline style for the native `<textarea>` element.
 *
 * @param sizeConfig - Active size configuration.
 * @param colors     - Resolved color tokens.
 * @param resize     - CSS `resize` direction (`'none'` | `'vertical'` | `'horizontal'` | `'both'`).
 * @returns Inline style object for the `<textarea>`.
 */
export function buildTextAreaStyle(
  sizeConfig: TextAreaSizeConfig,
  colors: TextAreaColors,
  resize: 'none' | 'vertical' | 'horizontal' | 'both',
  theme: WispTheme,
): CSSStyleObject {
  return {
    // Reset
    margin: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    appearance: 'none',

    // Padding (on the textarea so the resize handle sits at the container edge)
    paddingLeft: sizeConfig.paddingX,
    paddingRight: sizeConfig.paddingX,
    paddingTop: sizeConfig.paddingY,
    paddingBottom: sizeConfig.paddingY,

    // Sizing
    flex: 1,
    minWidth: 0,
    width: '100%',
    minHeight: 0,
    boxSizing: 'border-box',

    // Typography
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    lineHeight: sizeConfig.lineHeight,

    // Colors
    color: colors.text,

    // Use the theme mode color scheme so the native resize handle is visible
    colorScheme: theme.mode,

    // Resize
    resize,

    // Interaction
    cursor: 'inherit',
  };
}

// ---------------------------------------------------------------------------
// Label style
// ---------------------------------------------------------------------------

/**
 * Build the inline style for the `<label>` rendered above the textarea.
 *
 * @param sizeConfig - Active size configuration.
 * @param colors     - Resolved color tokens.
 * @returns Inline style object for the `<label>` element.
 */
export function buildLabelStyle(
  sizeConfig: TextAreaSizeConfig,
  colors: TextAreaColors,
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
 * Build the inline style for the hint, error, or warning text below the textarea.
 *
 * @param sizeConfig - Active size configuration.
 * @param colors     - Resolved color tokens.
 * @param isError    - When `true`, applies the status (error/warning) color rather than the default hint color.
 * @returns Inline style object for the hint `<span>`.
 */
export function buildHintStyle(
  sizeConfig: TextAreaSizeConfig,
  colors: TextAreaColors,
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
 * Build the skeleton placeholder style shown while the textarea is loading.
 *
 * @param sizeConfig  - Active size configuration (used for height and border radius).
 * @param themeColors - Active theme color tokens (used for the shimmer background).
 * @returns Inline style object for the skeleton `<div>`.
 */
export function getTextAreaSkeletonStyle(
  sizeConfig: TextAreaSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-block',
    width: '100%',
    height: sizeConfig.minHeight,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
