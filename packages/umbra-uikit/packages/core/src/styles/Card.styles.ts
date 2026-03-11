import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { CardVariant, CardPadding, CardRadius } from '../types/Card.types';
import { cardPaddingMap, cardRadiusMap } from '../types/Card.types';
import { fontFamilyStacks, glassStyle } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

/**
 * Resolved CSS values for a single {@link CardVariant}.
 */
export interface CardVariantStyles {
  /** Background colour string. */
  backgroundColor: string;
  /** CSS border shorthand. */
  border: string;
  /** CSS box-shadow value. */
  boxShadow: string;
  /** CSS backdrop-filter (used by the glass variant). */
  backdropFilter?: string;
  /** Webkit-prefixed backdrop-filter (used by the glass variant). */
  WebkitBackdropFilter?: string;
}

/**
 * Returns the base background, border, and shadow styles for the given variant.
 *
 * @param variant - The card visual variant.
 * @param themeColors - Active theme colour tokens.
 * @returns A {@link CardVariantStyles} object.
 */
export function resolveVariantStyles(
  variant: CardVariant,
  theme: WispTheme,
): CardVariantStyles {
  const { colors: themeColors, shadows } = theme;
  switch (variant) {
    case 'elevated':
      return {
        backgroundColor: themeColors.background.surface,
        border: `1px solid ${themeColors.border.subtle}`,
        boxShadow: shadows.sm,
      };
    case 'outlined':
      return {
        backgroundColor: 'transparent',
        border: `1px solid ${themeColors.border.strong}`,
        boxShadow: 'none',
      };
    case 'filled':
      return {
        backgroundColor: themeColors.background.surface,
        border: '1px solid transparent',
        boxShadow: 'none',
      };
    case 'glass':
      return {
        backgroundColor: glassStyle.backgroundColor,
        border: glassStyle.border,
        boxShadow: 'none',
        backdropFilter: glassStyle.backdropFilter,
        WebkitBackdropFilter: glassStyle.WebkitBackdropFilter,
      };
    default:
      return resolveVariantStyles('elevated', theme);
  }
}

/**
 * Builds the complete inline style object for the Card component.
 *
 * @param opts - An object containing variant, padding, radius, interaction
 * state flags, and the active theme colours.
 * @returns A `CSSStyleObject` object for the Card root element.
 */
export function buildCardStyle(opts: {
  variant: CardVariant;
  padding: CardPadding;
  radius: CardRadius;
  interactive: boolean;
  selected: boolean;
  disabled: boolean;
  hovered: boolean;
  pressed: boolean;
  theme: WispTheme;
}): CSSStyleObject {
  const { colors: themeColors, radii } = opts.theme;
  const variantStyles = resolveVariantStyles(opts.variant, opts.theme);
  const paddingValue = cardPaddingMap[opts.padding];
  const radiusValue = radii[cardRadiusMap[opts.radius]];
  const border = opts.selected
    ? `1px solid ${themeColors.accent.primary}`
    : variantStyles.border;
  let backgroundColor = variantStyles.backgroundColor;
  if (opts.interactive && !opts.disabled) {
    if (opts.pressed || opts.hovered) {
      backgroundColor = themeColors.background.raised;
    }
  }
  // Cards with opaque dark backgrounds need light text; outlined is transparent
  // so it inherits the page text colour.
  const color = opts.variant === 'outlined'
    ? themeColors.text.primary
    : themeColors.text.onRaised;

  return {
    boxSizing: 'border-box',
    position: 'relative',
    padding: paddingValue,
    borderRadius: radiusValue,
    backgroundColor,
    border,
    boxShadow: variantStyles.boxShadow,
    backdropFilter: variantStyles.backdropFilter,
    WebkitBackdropFilter: variantStyles.WebkitBackdropFilter,
    fontFamily: fontFamilyStacks.sans,
    color,
    cursor: opts.interactive && !opts.disabled ? 'pointer' : 'default',
    opacity: opts.disabled ? 0.5 : 1,
    userSelect: opts.interactive ? 'none' : undefined,
    transform: opts.interactive && opts.pressed && !opts.disabled ? 'scale(0.99)' : undefined,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, border-color ${durations.fast}ms ${easings.easeOut.css}, transform ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

/**
 * Builds the inline style object for the Card skeleton loading placeholder.
 *
 * @param padding - Padding preset to maintain consistent sizing.
 * @param radius - Border-radius preset.
 * @param themeColors - Active theme colour tokens.
 * @returns A `CSSStyleObject` object with a pulsing animation.
 */
export function getCardSkeletonStyle(
  padding: CardPadding,
  radius: CardRadius,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    boxSizing: 'border-box',
    padding: cardPaddingMap[padding],
    borderRadius: radii[cardRadiusMap[radius]],
    backgroundColor: themeColors.border.subtle,
    minHeight: 120,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
