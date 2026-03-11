/**
 * @module ButtonGroup
 */
import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ButtonGroupVariant, ButtonGroupSizeConfig } from '../types/ButtonGroup.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Container style
// ---------------------------------------------------------------------------

/**
 * Builds the wrapper style for the button group.
 */
export function buildGroupContainerStyle(
  theme: WispTheme,
  variant: ButtonGroupVariant,
  fullWidth: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: fullWidth ? 'flex' : 'inline-flex',
    width: fullWidth ? '100%' : undefined,
    borderRadius: variant === 'ghost' ? radii.lg : radii.md,
    overflow: 'hidden',
    border: variant === 'outline' ? `1px solid ${themeColors.border.strong}` : 'none',
    backgroundColor: variant === 'ghost' ? themeColors.accent.highlight : 'transparent',
    padding: variant === 'ghost' ? 3 : 0,
    gap: variant === 'ghost' ? 2 : 0,
  };
}

// ---------------------------------------------------------------------------
// Item style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for a single button group item.
 */
export function buildGroupItemStyle(
  sizeConfig: ButtonGroupSizeConfig,
  theme: WispTheme,
  variant: ButtonGroupVariant,
  isActive: boolean,
  isDisabled: boolean,
  isFirst: boolean,
  isLast: boolean,
  fullWidth: boolean,
): CSSStyleObject {
  const { colors: themeColors, typography, radii } = theme;
  let bg: string;
  let textColor: string;
  let borderRight: string | undefined;

  if (isDisabled) {
    bg = 'transparent';
    textColor = themeColors.text.muted;
  } else if (isActive) {
    if (variant === 'outline') {
      bg = themeColors.accent.highlight;
      textColor = themeColors.text.primary;
    } else {
      bg = themeColors.background.canvas;
      textColor = themeColors.text.primary;
    }
  } else {
    bg = 'transparent';
    textColor = themeColors.text.secondary;
  }

  if (variant === 'outline' && !isLast) {
    borderRight = `1px solid ${themeColors.border.strong}`;
  } else {
    borderRight = 'none';
  }

  return {
    // Reset
    margin: 0,
    borderTop: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
    outline: 'none',
    textDecoration: 'none',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,

    // Layout
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeConfig.gap,
    flex: fullWidth ? 1 : undefined,
    boxSizing: 'border-box',

    // Sizing
    height: sizeConfig.height - (variant === 'outline' ? 2 : 6),
    padding: `0 ${sizeConfig.paddingX}px`,

    // Typography
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    lineHeight: `${sizeConfig.lineHeight}px`,
    fontWeight: typography.weights.medium,

    // Colors
    backgroundColor: bg,
    color: textColor,
    borderRight,

    // Shape
    borderRadius: variant === 'ghost' ? radii.md : undefined,
    boxShadow: variant === 'ghost' && isActive
      ? '0 1px 3px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.06)'
      : 'none',

    // Interaction
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.5 : 1,
    userSelect: 'none',
    whiteSpace: 'nowrap',

    // Transition
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}
