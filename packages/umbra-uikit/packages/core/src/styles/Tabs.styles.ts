import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { TabsOrientation } from '../types/Tabs.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// TabList styles
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the {@link TabList} container.
 *
 * @param orientation - Horizontal or vertical layout direction.
 * @param themeColors - Resolved theme colour tokens.
 * @param userStyle   - Optional consumer-supplied style overrides.
 * @returns A `CSSStyleObject` object for the tab-list wrapper.
 */
export function buildTabListStyle(
  orientation: TabsOrientation,
  theme: WispTheme,
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  const base: CSSStyleObject = {
    display: 'flex',
    margin: 0,
    padding: 0,
    listStyle: 'none',
    position: 'relative',
  };

  if (orientation === 'horizontal') {
    return {
      ...base,
      flexDirection: 'row',
      borderBottom: '1px solid ' + themeColors.border.subtle,
      gap: 0,
      ...userStyle,
    };
  }

  return {
    ...base,
    flexDirection: 'column',
    borderRight: '1px solid ' + themeColors.border.subtle,
    gap: 0,
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// Sliding active indicator
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the sliding active-tab indicator bar.
 *
 * @param opts - Configuration object.
 * @param opts.orientation - Horizontal or vertical layout direction.
 * @param opts.offset      - Pixel offset from the start edge of the tab list.
 * @param opts.extent      - Width (horizontal) or height (vertical) of the active tab.
 * @param opts.animate     - Whether to apply a CSS transition (disabled on first render).
 * @param opts.themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the indicator element.
 */
export function buildTabIndicatorStyle(opts: {
  orientation: TabsOrientation;
  offset: number;
  extent: number;
  animate: boolean;
  theme: WispTheme;
}): CSSStyleObject {
  const { colors: themeColors, radii } = opts.theme;
  if (opts.orientation === 'horizontal') {
    return {
      position: 'absolute',
      bottom: 0,
      left: 0,
      height: 2,
      width: opts.extent,
      backgroundColor: themeColors.accent.primary,
      transform: `translateX(${opts.offset}px)`,
      transition: opts.animate
        ? 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)'
        : 'none',
      pointerEvents: 'none',
      borderRadius: radii.sm,
      zIndex: 1,
    };
  }

  // vertical
  return {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 2,
    height: opts.extent,
    backgroundColor: themeColors.accent.primary,
    transform: `translateY(${opts.offset}px)`,
    transition: opts.animate
      ? 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)'
      : 'none',
    pointerEvents: 'none',
    borderRadius: radii.sm,
    zIndex: 1,
  };
}

// ---------------------------------------------------------------------------
// Tab button styles
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for an individual {@link Tab} button.
 *
 * @param active      - Whether this tab is currently selected.
 * @param disabled    - Whether the tab is disabled.
 * @param hovered     - Whether the pointer is currently over the tab.
 * @param orientation - Horizontal or vertical layout direction.
 * @param themeColors - Resolved theme colour tokens.
 * @param userStyle   - Optional consumer-supplied style overrides.
 * @returns A `CSSStyleObject` object for the tab button.
 */
export function buildTabStyle(
  active: boolean,
  disabled: boolean,
  hovered: boolean,
  orientation: TabsOrientation,
  theme: WispTheme,
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  const color = disabled
    ? themeColors.text.muted
    : active
      ? themeColors.text.primary
      : hovered
        ? themeColors.text.secondary
        : themeColors.text.muted;

  const base: CSSStyleObject = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    border: 'none',
    background: 'none',
    color,
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: 1.43,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    outline: 'none',
    position: 'relative',
    transition: `color ${durations.fast}ms ${easings.easeOut.css}`,
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };

  return { ...base, ...userStyle };
}

// ---------------------------------------------------------------------------
// Tab focus style
// ---------------------------------------------------------------------------

/**
 * Builds the focus-visible ring style applied to a {@link Tab} button
 * when focused via keyboard navigation.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object containing the `boxShadow` ring.
 */
export function buildTabFocusStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    boxShadow: '0 0 0 2px ' + themeColors.background.canvas + ', 0 0 0 4px ' + themeColors.accent.primary,
  };
}

// ---------------------------------------------------------------------------
// TabPanel styles
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for a {@link TabPanel} content area.
 *
 * @param userStyle - Optional consumer-supplied style overrides.
 * @returns A `CSSStyleObject` object for the panel wrapper.
 */
export function buildTabPanelStyle(
  theme: WispTheme,
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    paddingTop: spacing.lg,
    outline: 'none',
    ...userStyle,
  };
}
