import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { SeparatorOrientation, SeparatorVariant, SeparatorSpacing } from '../types/Separator.types';
import { separatorSpacingMap } from '../types/Separator.types';

/**
 * Resolves the separator line color from a variant name and the active theme.
 *
 * @param variant - The color variant (`'subtle'` or `'strong'`).
 * @param themeColors - Resolved theme color tokens.
 * @returns A CSS color string from the theme's border palette.
 */
export function resolveSeparatorColor(
  variant: SeparatorVariant,
  theme: WispTheme,
): string {
  const { colors: themeColors } = theme;
  switch (variant) {
    case 'subtle':
      return themeColors.border.subtle;
    case 'strong':
      return themeColors.border.strong;
    default:
      return themeColors.border.subtle;
  }
}

/**
 * Builds the root `CSSProperties` for the Separator container.
 *
 * @remarks
 * Produces different layouts depending on orientation and whether a label
 * is present. Vertical separators are rendered as a thin colored column;
 * horizontal separators are either a solid bar or a flex row when a label
 * is shown.
 *
 * @param orientation - `'horizontal'` or `'vertical'`.
 * @param color - Resolved CSS color for the line.
 * @param spacing - Spacing preset key used to look up {@link separatorSpacingMap}.
 * @param hasLabel - Whether the separator includes a centered label.
 * @param thicknessPx - Line thickness in pixels.
 * @returns A `CSSStyleObject` object for the root element.
 */
export function buildSeparatorStyle(
  orientation: SeparatorOrientation,
  color: string,
  spacing: SeparatorSpacing,
  hasLabel: boolean,
  thicknessPx: number = 1,
): CSSStyleObject {
  const spacingPx = separatorSpacingMap[spacing];

  if (orientation === 'vertical') {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      alignSelf: 'stretch',
      flexDirection: 'column',
      width: thicknessPx,
      backgroundColor: color,
      marginLeft: spacingPx,
      marginRight: spacingPx,
      flexShrink: 0,
    };
  }

  // Horizontal with label
  if (hasLabel) {
    return {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      marginTop: spacingPx,
      marginBottom: spacingPx,
    };
  }

  // Horizontal without label
  return {
    width: '100%',
    height: thicknessPx,
    backgroundColor: color,
    marginTop: spacingPx,
    marginBottom: spacingPx,
    flexShrink: 0,
  };
}

/**
 * Builds the CSS for a line segment beside the label.
 *
 * @remarks
 * Only used when a horizontal separator contains a label. Two line
 * segments are rendered, one on each side of the label text.
 *
 * @param color - Resolved CSS color for the line.
 * @param thicknessPx - Line thickness in pixels.
 * @returns A `CSSStyleObject` object for a single line segment.
 */
export function buildLineStyle(color: string, thicknessPx: number = 1): CSSStyleObject {
  return {
    flex: 1,
    height: thicknessPx,
    backgroundColor: color,
  };
}

/**
 * Builds the CSS for the centered label text within a horizontal separator.
 *
 * @param themeColors - Resolved theme color tokens (used for muted text color).
 * @returns A `CSSStyleObject` object for the label `<span>`.
 */
export function buildLabelStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: 1.33,
    fontFamily: fontFamilyStacks.sans,
    fontWeight: typography.weights.medium,
    color: themeColors.text.muted,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    flexShrink: 0,
  };
}
