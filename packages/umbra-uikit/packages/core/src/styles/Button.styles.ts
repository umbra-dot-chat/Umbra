/**
 * @module Button
 */
import type { CSSStyleObject } from '../types';
import type { ComponentSize } from '../tokens/shared';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ButtonVariant, ButtonShape } from '../types/Button.types';
import { buttonSizeMap, shapeRadiusMap } from '../types/Button.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Variant -> colors (theme-aware)
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens for a single button variant state.
 *
 * @remarks
 * Produced by {@link resolveVariantColors} or {@link getDisabledColors} and
 * consumed by {@link buildButtonStyle} and the Button component itself to
 * apply background, text, and border colors across rest, hover, and active states.
 */
export interface VariantColors {
  /** Background color at rest. */
  bg: string;
  /** Background color on hover. */
  bgHover: string;
  /** Background color on active (mouse-down). */
  bgActive: string;
  /** Foreground / text color. */
  text: string;
  /** Border color at rest (use `'transparent'` for no border). */
  border: string;
  /** Border color on hover. */
  borderHover: string;
}

/**
 * Resolves the complete set of {@link VariantColors} for a given
 * {@link ButtonVariant} using the active theme palette.
 *
 * @param variant - The button appearance variant to resolve.
 * @param themeColors - The current theme color tokens.
 * @returns A {@link VariantColors} object with all six color values populated.
 */
export function resolveVariantColors(
  variant: ButtonVariant,
  theme: WispTheme,
  onSurface = false,
): VariantColors {
  const { colors: themeColors } = theme;
  switch (variant) {
    // -- Primary: monochrome filled
    case 'primary':
      return onSurface
        ? {
            bg: themeColors.text.inverse,
            bgHover: themeColors.accent.primaryHover,
            bgActive: themeColors.accent.primaryActive,
            text: themeColors.text.primary,
            border: 'transparent',
            borderHover: 'transparent',
          }
        : {
            bg: themeColors.accent.primary,
            bgHover: themeColors.accent.primaryHover,
            bgActive: themeColors.accent.primaryActive,
            text: themeColors.text.inverse,
            border: 'transparent',
            borderHover: 'transparent',
          };

    // -- Secondary: bordered, subtle bg
    case 'secondary':
      return onSurface
        ? {
            bg: 'transparent',
            bgHover: themeColors.accent.highlightRaised,
            bgActive: themeColors.accent.highlightRaised,
            text: themeColors.text.onRaised,
            border: themeColors.accent.dividerRaised,
            borderHover: themeColors.accent.highlightRaised,
          }
        : {
            bg: 'transparent',
            bgHover: themeColors.accent.highlight,
            bgActive: themeColors.accent.highlight,
            text: themeColors.text.primary,
            border: themeColors.border.strong,
            borderHover: themeColors.text.primary,
          };

    // -- Tertiary: ghost / text-only
    case 'tertiary':
      return onSurface
        ? {
            bg: 'transparent',
            bgHover: themeColors.accent.highlightRaised,
            bgActive: themeColors.accent.highlightRaised,
            text: themeColors.text.onRaisedSecondary,
            border: 'transparent',
            borderHover: 'transparent',
          }
        : {
            bg: 'transparent',
            bgHover: themeColors.accent.highlight,
            bgActive: themeColors.accent.highlight,
            text: themeColors.text.secondary,
            border: 'transparent',
            borderHover: 'transparent',
          };

    // -- Destructive solid
    case 'destructive':
      return {
        bg: themeColors.status.danger,
        bgHover: themeColors.status.danger,
        bgActive: themeColors.status.danger,
        text: themeColors.text.inverse,
        border: 'transparent',
        borderHover: 'transparent',
      };

    // -- Destructive outline
    case 'destructive-outline':
      return {
        bg: 'transparent',
        bgHover: themeColors.status.dangerSurface,
        bgActive: themeColors.status.dangerSurface,
        text: themeColors.status.danger,
        border: themeColors.status.danger,
        borderHover: themeColors.status.danger,
      };

    // -- Success solid
    case 'success':
      return {
        bg: themeColors.status.success,
        bgHover: themeColors.status.success,
        bgActive: themeColors.status.success,
        text: themeColors.text.inverse,
        border: 'transparent',
        borderHover: 'transparent',
      };

    // -- Success outline
    case 'success-outline':
      return {
        bg: 'transparent',
        bgHover: themeColors.status.successSurface,
        bgActive: themeColors.status.successSurface,
        text: themeColors.status.success,
        border: themeColors.status.success,
        borderHover: themeColors.status.success,
      };

    // -- Warning solid
    case 'warning':
      return {
        bg: themeColors.status.warning,
        bgHover: themeColors.status.warning,
        bgActive: themeColors.status.warning,
        text: themeColors.text.inverse, // inverse text for contrast — amber is bright
        border: 'transparent',
        borderHover: 'transparent',
      };

    // -- Warning outline
    case 'warning-outline':
      return {
        bg: 'transparent',
        bgHover: themeColors.status.warningSurface,
        bgActive: themeColors.status.warningSurface,
        text: themeColors.status.warning,
        border: themeColors.status.warning,
        borderHover: themeColors.status.warning,
      };

    // -- Destructive ghost: bright text, dark tinted bg
    case 'destructive-ghost':
      return {
        bg: themeColors.status.dangerSurface,
        bgHover: themeColors.status.dangerSurface,
        bgActive: themeColors.status.dangerSurface,
        text: themeColors.status.danger,
        border: 'transparent',
        borderHover: 'transparent',
      };

    // -- Success ghost: bright text, dark tinted bg
    case 'success-ghost':
      return {
        bg: themeColors.status.successSurface,
        bgHover: themeColors.status.successSurface,
        bgActive: themeColors.status.successSurface,
        text: themeColors.status.success,
        border: 'transparent',
        borderHover: 'transparent',
      };

    // -- Warning ghost: bright text, dark tinted bg
    case 'warning-ghost':
      return {
        bg: themeColors.status.warningSurface,
        bgHover: themeColors.status.warningSurface,
        bgActive: themeColors.status.warningSurface,
        text: themeColors.status.warning,
        border: 'transparent',
        borderHover: 'transparent',
      };

    // -- Info ghost: bright text, dark tinted bg
    case 'info-ghost':
      return {
        bg: themeColors.status.infoSurface,
        bgHover: themeColors.status.infoSurface,
        bgActive: themeColors.status.infoSurface,
        text: themeColors.status.info,
        border: 'transparent',
        borderHover: 'transparent',
      };

    // -- Brand solid
    case 'brand':
      return {
        bg: themeColors.brand.primary,
        bgHover: themeColors.brand.hover,
        bgActive: themeColors.brand.active,
        text: themeColors.brand.text,
        border: 'transparent',
        borderHover: 'transparent',
      };

    // -- Brand outline
    case 'brand-outline':
      return {
        bg: 'transparent',
        bgHover: themeColors.brand.surface,
        bgActive: themeColors.brand.surface,
        text: themeColors.brand.primary,
        border: themeColors.brand.primary,
        borderHover: themeColors.brand.primary,
      };

    // -- Brand ghost
    case 'brand-ghost':
      return {
        bg: themeColors.brand.surface,
        bgHover: themeColors.brand.surface,
        bgActive: themeColors.brand.surface,
        text: themeColors.brand.primary,
        border: 'transparent',
        borderHover: 'transparent',
      };

    default:
      return resolveVariantColors('primary', theme);
  }
}

// ---------------------------------------------------------------------------
// Disabled colors
// ---------------------------------------------------------------------------

/**
 * Returns the muted {@link VariantColors} used when the button is disabled.
 *
 * @param themeColors - The current theme color tokens.
 * @returns A {@link VariantColors} object with subdued background and text values.
 */
export function getDisabledColors(theme: WispTheme): VariantColors {
  const { colors: themeColors } = theme;
  return {
    bg: themeColors.border.subtle,
    bgHover: themeColors.border.subtle,
    bgActive: themeColors.border.subtle,
    text: themeColors.text.muted,
    border: 'transparent',
    borderHover: 'transparent',
  };
}

// ---------------------------------------------------------------------------
// Build the complete button style object
// ---------------------------------------------------------------------------

/**
 * Builds the complete `CSSStyleObject` object for the `<button>` element.
 *
 * @remarks
 * Combines size tokens, shape radius, variant colors, and state flags into a
 * single inline-style object. The returned styles cover reset rules, layout,
 * sizing, typography, shape, color, cursor, opacity, and transitions.
 *
 * @param opts - Configuration bag:
 *   - `size` -- {@link ComponentSize} step.
 *   - `shape` -- {@link ButtonShape} variant.
 *   - `variantColors` -- Pre-resolved {@link VariantColors}.
 *   - `isIconOnly` -- `true` when the button has no `children`.
 *   - `fullWidth` -- `true` to stretch to 100 % width.
 *   - `disabled` -- Whether the button is non-interactive.
 *   - `isLoading` -- Whether the loading spinner is shown.
 * @returns A `CSSStyleObject` object ready to be spread onto the element.
 */
export function buildButtonStyle(opts: {
  size: ComponentSize;
  shape: ButtonShape;
  variantColors: VariantColors;
  isIconOnly: boolean;
  fullWidth: boolean;
  disabled: boolean;
  isLoading: boolean;
},
  theme: WispTheme,
): CSSStyleObject {
  const { typography, radii } = theme;
  const sizeConfig = buttonSizeMap[opts.size];
  const radius = radii[shapeRadiusMap[opts.shape]];

  const style: CSSStyleObject = {
    // Reset
    margin: 0,
    border: 'none',
    outline: 'none',
    textDecoration: 'none',

    // Layout
    display: opts.fullWidth ? 'flex' : 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeConfig.gap,
    width: opts.fullWidth ? '100%' : undefined,
    boxSizing: 'border-box',
    position: 'relative',

    // Sizing
    height: sizeConfig.height,
    padding: opts.isIconOnly
      ? sizeConfig.iconOnlyPadding
      : `0 ${sizeConfig.paddingX}px`,

    // Typography
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    lineHeight: `${sizeConfig.lineHeight}px`,
    fontWeight: typography.weights.medium,

    // Shape
    borderRadius: radius,

    // Colors
    backgroundColor: opts.variantColors.bg,
    color: opts.variantColors.text,
    boxShadow: opts.variantColors.border !== 'transparent'
      ? `inset 0 0 0 1px ${opts.variantColors.border}`
      : 'none',

    // Interaction
    cursor: opts.disabled || opts.isLoading ? 'not-allowed' : 'pointer',
    opacity: opts.disabled && !opts.isLoading ? 0.5 : 1,
    userSelect: 'none',

    // Transition
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}, opacity ${durations.fast}ms ${easings.easeOut.css}`,
  };

  return style;
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Generates the inline style for a button skeleton shimmer placeholder.
 *
 * @param size - The {@link ComponentSize} step (determines height).
 * @param shape - The {@link ButtonShape} variant (determines border-radius).
 * @param fullWidth - When `true` the skeleton stretches to 100 % width; otherwise defaults to 100 px.
 * @param themeColors - The current theme color tokens.
 * @returns A `CSSStyleObject` object with dimensions, radius, background, and pulse animation.
 */
export function getButtonSkeletonStyle(
  size: ComponentSize,
  shape: ButtonShape,
  fullWidth: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  const sizeConfig = buttonSizeMap[size];
  const radius = radii[shapeRadiusMap[shape]];

  return {
    display: fullWidth ? 'block' : 'inline-block',
    height: sizeConfig.height,
    width: fullWidth ? '100%' : 100,
    borderRadius: radius,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}

// ---------------------------------------------------------------------------
// Spinner style
// ---------------------------------------------------------------------------

/**
 * Generates the inline style for the button's loading spinner element.
 *
 * @param size - The {@link ComponentSize} step (determines spinner width/height via icon size tokens).
 * @param color - The foreground color used for the spinner's top-border arc.
 * @returns A `CSSStyleObject` object describing a circular, animated spinner.
 */
export function getSpinnerStyle(size: ComponentSize, color: string, theme: WispTheme): CSSStyleObject {
  const { radii } = theme;
  const sizeConfig = buttonSizeMap[size];
  return {
    width: sizeConfig.iconSize,
    height: sizeConfig.iconSize,
    border: `2px solid ${color}44`,
    borderTopColor: color,
    borderRadius: radii.full,
    animation: 'wisp-button-spin 0.6s linear infinite',
    flexShrink: 0,
  };
}
