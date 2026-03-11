/**
 * @module SocialButton
 */
import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { SocialProviderConfig, SocialButtonSizeConfig, SocialButtonVariant } from '../types/SocialButton.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Button style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the social button.
 */
export function buildSocialButtonStyle(
  sizeConfig: SocialButtonSizeConfig,
  providerConfig: SocialProviderConfig,
  variant: SocialButtonVariant,
  theme: WispTheme,
  fullWidth: boolean,
  iconOnly: boolean,
  disabled: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii, typography } = theme;
  const isFilled = variant === 'filled';

  return {
    // Reset
    margin: 0,
    border: 'none',
    outline: 'none',
    textDecoration: 'none',

    // Layout
    display: fullWidth ? 'flex' : 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeConfig.gap,
    width: fullWidth ? '100%' : undefined,
    boxSizing: 'border-box',

    // Sizing
    height: sizeConfig.height,
    padding: iconOnly ? `0 ${(sizeConfig.height - sizeConfig.iconSize) / 2}px` : `0 ${sizeConfig.paddingX}px`,

    // Typography
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1,

    // Shape
    borderRadius: radii.md,

    // Colors
    backgroundColor: isFilled ? providerConfig.bgColor : 'transparent',
    color: isFilled ? providerConfig.textColor : themeColors.text.primary,
    boxShadow: isFilled
      ? (providerConfig.bgColor === '#FFFFFF' ? `inset 0 0 0 1px ${themeColors.border.strong}` : 'none')
      : `inset 0 0 0 1px ${themeColors.border.strong}`,

    // Interaction
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    userSelect: 'none',

    // Transition
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}, opacity ${durations.fast}ms ${easings.easeOut.css}`,
  };
}
