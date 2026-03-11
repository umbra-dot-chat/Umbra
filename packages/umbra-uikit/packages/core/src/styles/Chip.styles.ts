import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ChipColor, ChipVariant, ChipSizeConfig } from '../types/Chip.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution helpers
// ---------------------------------------------------------------------------

/** Resolved color palette for a specific chip variant and color combination. */
export interface ChipColors {
  /** Background color. */
  bg: string;
  /** Text (and icon) color. */
  text: string;
  /** Border color. */
  border: string;
}

/**
 * Resolve the base status/accent colors for a given chip color.
 * Returns the raw foreground, surface, and border tokens before
 * the variant (filled/outlined/subtle) modifies them.
 */
function resolveBaseStatusColors(
  color: ChipColor,
  themeColors: ThemeColors,
): { fg: string; surface: string; border: string } {
  switch (color) {
    case 'success':
      return {
        fg: themeColors.status.success,
        surface: themeColors.status.successSurface,
        border: themeColors.status.successBorder,
      };
    case 'warning':
      return {
        fg: themeColors.status.warning,
        surface: themeColors.status.warningSurface,
        border: themeColors.status.warningBorder,
      };
    case 'danger':
      return {
        fg: themeColors.status.danger,
        surface: themeColors.status.dangerSurface,
        border: themeColors.status.dangerBorder,
      };
    case 'info':
      return {
        fg: themeColors.status.info,
        surface: themeColors.status.infoSurface,
        border: themeColors.status.infoBorder,
      };
    case 'default':
    default:
      return {
        fg: themeColors.text.secondary,
        surface: themeColors.accent.highlight,
        border: themeColors.border.strong,
      };
  }
}

// ---------------------------------------------------------------------------
// Variant + Color -> final ChipColors
// ---------------------------------------------------------------------------

/**
 * Resolves the final chip color palette from a color + variant combination.
 *
 * @param color - Semantic color variant (e.g. `'success'`, `'danger'`).
 * @param variant - Style variant (`'filled'`, `'outlined'`, or `'subtle'`).
 * @param themeColors - Resolved theme color palette.
 * @returns A {@link ChipColors} object with `bg`, `text`, and `border` values.
 */
export function resolveChipColors(
  color: ChipColor,
  variant: ChipVariant,
  theme: WispTheme,
): ChipColors {
  const { colors: themeColors } = theme;
  const base = resolveBaseStatusColors(color, themeColors);

  switch (variant) {
    // Filled: status surface bg + status border
    case 'filled':
      return {
        bg: base.surface,
        text: base.fg,
        border: base.border,
      };

    // Outlined: transparent bg + status border
    case 'outlined':
      return {
        bg: 'transparent',
        text: base.fg,
        border: base.border,
      };

    // Subtle: surface bg only, no border
    case 'subtle':
      return {
        bg: base.surface,
        text: base.fg,
        border: 'transparent',
      };

    default:
      return resolveChipColors(color, 'filled', theme);
  }
}

// ---------------------------------------------------------------------------
// Build the complete chip container style
// ---------------------------------------------------------------------------

/**
 * Builds the complete inline-flex container style for the Chip.
 *
 * @param opts - Configuration object with size tokens, resolved colors, and state flags.
 * @param opts.sizeConfig - Dimension tokens for the active size variant.
 * @param opts.colors - Resolved color palette from {@link resolveChipColors}.
 * @param opts.clickable - Whether the chip has interactive cursor/hover effects.
 * @param opts.disabled - Whether the chip is visually dimmed.
 * @returns CSS properties for the chip container `div`.
 */
export function buildChipStyle(opts: {
  sizeConfig: ChipSizeConfig;
  colors: ChipColors;
  clickable: boolean;
  disabled: boolean;
},
  theme: WispTheme,
): CSSStyleObject {
  const { typography, radii } = theme;
  return {
    // Layout
    display: 'inline-flex',
    alignItems: 'center',
    gap: opts.sizeConfig.gap,
    boxSizing: 'border-box',

    // Sizing
    padding: `${opts.sizeConfig.paddingY}px ${opts.sizeConfig.paddingX}px`,

    // Typography
    fontFamily: fontFamilyStacks.sans,
    fontSize: opts.sizeConfig.fontSize,
    lineHeight: opts.sizeConfig.lineHeight,
    fontWeight: typography.weights.medium,
    whiteSpace: 'nowrap',

    // Shape
    borderRadius: radii[opts.sizeConfig.borderRadius],

    // Colors
    backgroundColor: opts.colors.bg,
    color: opts.colors.text,
    border: `1px solid ${opts.colors.border}`,

    // Interaction
    cursor: opts.disabled ? 'not-allowed' : opts.clickable ? 'pointer' : 'default',
    opacity: opts.disabled ? 0.5 : 1,
    userSelect: 'none',

    // Transition
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, border-color ${durations.fast}ms ${easings.easeOut.css}, opacity ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Icon wrapper style
// ---------------------------------------------------------------------------

/**
 * Builds the style for the leading icon wrapper span.
 *
 * @param sizeConfig - Dimension tokens for the active size variant.
 * @returns CSS properties for the icon wrapper `span`.
 */
export function buildIconWrapperStyle(sizeConfig: ChipSizeConfig): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: sizeConfig.iconSize,
    height: sizeConfig.iconSize,
  };
}

// ---------------------------------------------------------------------------
// Remove button style
// ---------------------------------------------------------------------------

/**
 * Builds the style for the remove (X) button inside a removable chip.
 *
 * @param sizeConfig - Dimension tokens for the active size variant.
 * @param colors - Resolved chip color palette (used for icon color).
 * @param themeColors - Resolved theme color palette.
 * @returns CSS properties for the remove `button` element.
 */
export function buildRemoveButtonStyle(
  sizeConfig: ChipSizeConfig,
  colors: ChipColors,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    // Reset
    border: 'none',
    background: 'none',
    outline: 'none',
    margin: 0,
    padding: 0,

    // Layout
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,

    // Sizing
    width: sizeConfig.removeButtonSize,
    height: sizeConfig.removeButtonSize,
    borderRadius: radii[sizeConfig.borderRadius] > 4 ? radii[sizeConfig.borderRadius] - 2 : 2,

    // Colors
    color: colors.text,
    cursor: 'pointer',

    // Transition
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Remove button hover background
// ---------------------------------------------------------------------------

/**
 * Returns the background color applied to the remove button on hover.
 *
 * @param themeColors - Resolved theme color palette.
 * @returns A CSS color string for the hover background.
 */
export function getRemoveButtonHoverBg(theme: WispTheme): string {
  const { colors: themeColors } = theme;
  return themeColors.accent.highlight;
}
