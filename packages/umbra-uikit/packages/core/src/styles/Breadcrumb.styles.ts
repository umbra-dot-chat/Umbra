import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { BreadcrumbSizeConfig } from '../types/Breadcrumb.types';

// ---------------------------------------------------------------------------
// Nav wrapper style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the breadcrumb `nav` wrapper.
 *
 * @returns A `CSSStyleObject` object for the `nav` element.
 */
export function buildNavStyle(): CSSStyleObject {
  return {
    display: 'block',
  };
}

// ---------------------------------------------------------------------------
// Ordered list style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the breadcrumb ordered list (`ol`).
 *
 * @param sizeConfig - Size configuration containing font-size values.
 * @returns A `CSSStyleObject` object for the `ol` element.
 */
export function buildListStyle(
  sizeConfig: BreadcrumbSizeConfig,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    fontSize: sizeConfig.fontSize,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Item wrapper (li) style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for a breadcrumb item `li` wrapper.
 *
 * @returns A `CSSStyleObject` object for the `li` element.
 */
export function buildItemStyle(): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
  };
}

// ---------------------------------------------------------------------------
// Link style (non-active items)
// ---------------------------------------------------------------------------

/**
 * Builds the default (non-hovered) style for a clickable breadcrumb item.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the inner `a` or `button`.
 */
export function buildLinkStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    color: themeColors.text.secondary,
    textDecoration: 'none',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    margin: 0,
    font: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// Link hover style
// ---------------------------------------------------------------------------

/**
 * Builds the hover-state style overrides for a clickable breadcrumb item.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object merged on top of the base link style on hover.
 */
export function buildLinkHoverStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    color: themeColors.text.primary,
  };
}

// ---------------------------------------------------------------------------
// Active item style (current page)
// ---------------------------------------------------------------------------

/**
 * Builds the style for the active breadcrumb item representing the current page.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the active `span`.
 */
export function buildActiveStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    color: themeColors.text.primary,
    fontWeight: typography.weights.medium,
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    cursor: 'default',
  };
}

// ---------------------------------------------------------------------------
// Separator style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for a breadcrumb separator element.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the separator `li`.
 */
export function buildSeparatorStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    color: themeColors.text.muted,
    padding: `0 ${spacing.sm}px`,
    display: 'inline-flex',
    alignItems: 'center',
    userSelect: 'none',
  };
}
