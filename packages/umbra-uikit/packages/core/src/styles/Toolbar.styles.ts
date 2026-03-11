import type { CSSStyleObject } from '../types';
import type { ThemeColors, ThemeSpacing, WispTheme } from '../theme/types';
import type { ToolbarVariant, ToolbarSizeConfig } from '../types/Toolbar.types';

// ---------------------------------------------------------------------------
// Toolbar (root) style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the root Toolbar container.
 *
 * @param sizeConfig - Pixel measurements from the active size preset.
 * @param variant - Visual variant (`elevated`, `transparent`, or `pill`).
 * @param themeColors - Resolved theme color palette.
 * @returns A `CSSStyleObject` object for the toolbar wrapper.
 */
export function buildToolbarStyle(
  sizeConfig: ToolbarSizeConfig,
  variant: ToolbarVariant,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  const base: CSSStyleObject = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: sizeConfig.height,
    paddingLeft: sizeConfig.paddingX,
    paddingRight: sizeConfig.paddingX,
    gap: sizeConfig.gap,
    boxSizing: 'border-box',
  };

  if (variant === 'elevated') {
    return {
      ...base,
      backgroundColor: themeColors.background.sunken,
      borderBottom: `1px solid ${themeColors.border.subtle}`,
      color: themeColors.text.primary,
    };
  }

  if (variant === 'pill') {
    return {
      ...base,
      display: 'inline-flex',
      backgroundColor: themeColors.background.sunken,
      border: `1px solid ${themeColors.border.subtle}`,
      borderRadius: radii.full,
      color: themeColors.text.primary,
    };
  }

  // transparent
  return {
    ...base,
    backgroundColor: 'transparent',
    color: themeColors.text.primary,
  };
}

// ---------------------------------------------------------------------------
// ToolbarGroup style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for a {@link ToolbarGroup}.
 *
 * @param gap - Theme spacing key controlling the gap between grouped items.
 * @param spacing - The full theme spacing scale.
 * @returns A `CSSStyleObject` object for the group container.
 */
export function buildGroupStyle(
  gap: keyof ThemeSpacing,
  spacing: ThemeSpacing,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[gap],
  };
}

// ---------------------------------------------------------------------------
// ToolbarSeparator style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for a {@link ToolbarSeparator}.
 *
 * @param sizeConfig - Pixel measurements from the parent Toolbar's size preset.
 * @param themeColors - Resolved theme color palette.
 * @returns A `CSSStyleObject` object for the vertical divider.
 */
export function buildSeparatorStyle(
  sizeConfig: ToolbarSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    width: 1,
    height: sizeConfig.separatorHeight,
    backgroundColor: themeColors.border.subtle,
    flexShrink: 0,
    alignSelf: 'center',
  };
}
