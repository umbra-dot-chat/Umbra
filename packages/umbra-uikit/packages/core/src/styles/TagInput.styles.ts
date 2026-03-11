import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { TagInputSizeConfig } from '../types/TagInput.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Resolved tag-input colors
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens consumed by the TagInput style builders.
 *
 * @remarks
 * Produced by {@link resolveTagInputColors} and then passed into every
 * `build*Style` helper so that colors stay consistent across the entire
 * TagInput anatomy (container, tags, label, hint, focus ring).
 */
export interface TagInputColors {
  /** Border color for the container. */
  border: string;
  /** Background color for the container. */
  bg: string;
  /** Text color for the input element. */
  text: string;
  /** Placeholder text color. */
  placeholder: string;
  /** Leading icon color. */
  icon: string;
  /** Label text color. */
  label: string;
  /** Hint / error text color. */
  hint: string;
  /** Focus ring color. */
  focusRing: string;
  /** Tag background color. */
  tagBg: string;
  /** Tag text color. */
  tagText: string;
  /** Tag border color. */
  tagBorder: string;
}

// ---------------------------------------------------------------------------
// Resolve colors based on state
// ---------------------------------------------------------------------------

/**
 * Derives a complete {@link TagInputColors} palette based on the current
 * interaction state and theme.
 *
 * @remarks
 * State priority (highest to lowest): disabled > error > warning > focused > default.
 */
export function resolveTagInputColors(
  focused: boolean,
  error: boolean,
  warning: boolean,
  disabled: boolean,
  theme: WispTheme,
): TagInputColors {
  const { colors: themeColors } = theme;
  const tagBase = {
    tagBg: themeColors.accent.highlight,
    tagText: themeColors.text.primary,
    tagBorder: themeColors.border.subtle,
  };

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
      tagBg: themeColors.border.subtle,
      tagText: themeColors.text.muted,
      tagBorder: 'transparent',
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
      ...tagBase,
    };
  }

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
      ...tagBase,
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
      ...tagBase,
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
    ...tagBase,
  };
}

// ---------------------------------------------------------------------------
// Wrapper style (vertical flex for label + container + hint)
// ---------------------------------------------------------------------------

export function buildWrapperStyle(
  sizeConfig: TagInputSizeConfig,
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
// Container style (the bordered wrapper around tags + input)
// ---------------------------------------------------------------------------

export function buildContainerStyle(
  sizeConfig: TagInputSizeConfig,
  colors: TagInputColors,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: sizeConfig.gap,
    minHeight: sizeConfig.minHeight,
    padding: `${sizeConfig.paddingY}px ${sizeConfig.paddingX}px`,
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
// Tag chip style
// ---------------------------------------------------------------------------

export function buildTagStyle(
  sizeConfig: TagInputSizeConfig,
  colors: TagInputColors,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sizeConfig.gap - 2,
    height: sizeConfig.tagHeight,
    padding: `0 ${sizeConfig.tagPaddingX}px`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.tagFontSize,
    lineHeight: 1,
    fontWeight: typography.weights.medium,
    whiteSpace: 'nowrap',
    borderRadius: sizeConfig.tagBorderRadius,
    backgroundColor: colors.tagBg,
    color: colors.tagText,
    border: `1px solid ${colors.tagBorder}`,
    opacity: disabled ? 0.5 : 1,
    userSelect: 'none',
    boxSizing: 'border-box',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, opacity ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Tag remove button style
// ---------------------------------------------------------------------------

export function buildTagRemoveStyle(
  sizeConfig: TagInputSizeConfig,
  colors: TagInputColors,
): CSSStyleObject {
  return {
    border: 'none',
    background: 'none',
    outline: 'none',
    margin: 0,
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: sizeConfig.tagRemoveSize + 2,
    height: sizeConfig.tagRemoveSize + 2,
    borderRadius: sizeConfig.tagBorderRadius > 4 ? sizeConfig.tagBorderRadius - 2 : 2,
    color: colors.tagText,
    cursor: 'pointer',
    opacity: 0.6,
    transition: `opacity ${durations.fast}ms ${easings.easeOut.css}, background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

/**
 * Returns the background color applied to the tag remove button on hover.
 */
export function getTagRemoveHoverBg(theme: WispTheme): string {
  const { colors: themeColors } = theme;
  return themeColors.accent.highlight;
}

// ---------------------------------------------------------------------------
// Inner input style
// ---------------------------------------------------------------------------

export function buildInputStyle(
  sizeConfig: TagInputSizeConfig,
  colors: TagInputColors,
): CSSStyleObject {
  return {
    margin: 0,
    padding: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    appearance: 'none',
    flex: 1,
    minWidth: 60,
    height: sizeConfig.tagHeight,
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

export function buildLabelStyle(
  sizeConfig: TagInputSizeConfig,
  colors: TagInputColors,
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

export function buildHintStyle(
  sizeConfig: TagInputSizeConfig,
  colors: TagInputColors,
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

export function buildSkeletonStyle(
  sizeConfig: TagInputSizeConfig,
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
