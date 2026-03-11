/**
 * @module styles/AdvancedSearchPanel
 * @description Pure style-builder functions for the AdvancedSearchPanel component.
 *
 * Extended search filters panel with dedicated inputs for advanced search syntax.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export interface AdvancedSearchPanelColors {
  bg: string;
  border: string;
  headerText: string;
  labelText: string;
  resultBadgeBg: string;
  resultBadgeText: string;
}

/**
 * Resolves semantic colors for the AdvancedSearchPanel from the current theme.
 */
export function resolveAdvancedSearchPanelColors(theme: WispTheme): AdvancedSearchPanelColors {
  const { colors } = theme;
  return {
    bg: colors.background.surface,
    border: colors.border.subtle,
    headerText: colors.text.primary,
    labelText: colors.text.secondary,
    resultBadgeBg: colors.accent.highlight,
    resultBadgeText: colors.text.primary,
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the panel container.
 */
export function buildContainerStyle(
  theme: WispTheme,
  panelColors: AdvancedSearchPanelColors,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: panelColors.bg,
    border: `1px solid ${panelColors.border}`,
    borderRadius: radii.lg,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the header row (title + result count badge).
 */
export function buildHeaderStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  };
}

/**
 * Builds inline styles for the header title text.
 */
export function buildTitleStyle(
  theme: WispTheme,
  panelColors: AdvancedSearchPanelColors,
): CSSStyleObject {
  return {
    fontSize: theme.typography.sizes.lg.fontSize,
    lineHeight: `${theme.typography.sizes.lg.lineHeight}px`,
    fontWeight: theme.typography.weights.semibold,
    color: panelColors.headerText,
    margin: 0,
    fontFamily: fontFamilyStacks.sans,
  };
}

/**
 * Builds inline styles for the result count badge.
 */
export function buildResultBadgeStyle(
  theme: WispTheme,
  panelColors: AdvancedSearchPanelColors,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
    borderRadius: theme.radii.full,
    fontSize: theme.typography.sizes.xs.fontSize,
    lineHeight: `${theme.typography.sizes.xs.lineHeight}px`,
    fontWeight: theme.typography.weights.medium,
    backgroundColor: panelColors.resultBadgeBg,
    color: panelColors.resultBadgeText,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Filter grid
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the filter grid layout.
 */
export function buildFilterGridStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing.md,
  };
}

/**
 * Builds inline styles for a single filter field group.
 */
export function buildFieldGroupStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
  };
}

/**
 * Builds inline styles for field labels.
 */
export function buildLabelStyle(
  theme: WispTheme,
  panelColors: AdvancedSearchPanelColors,
): CSSStyleObject {
  return {
    fontSize: theme.typography.sizes.xs.fontSize,
    lineHeight: `${theme.typography.sizes.xs.lineHeight}px`,
    fontWeight: theme.typography.weights.medium,
    color: panelColors.labelText,
    fontFamily: fontFamilyStacks.sans,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Toggle row
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the row containing boolean toggle filters.
 */
export function buildToggleRowStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    flexWrap: 'wrap',
  };
}

/**
 * Builds inline styles for a single toggle + label pair.
 */
export function buildToggleItemStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the footer button row.
 */
export function buildFooterStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTop: `1px solid ${theme.colors.border.subtle}`,
  };
}
