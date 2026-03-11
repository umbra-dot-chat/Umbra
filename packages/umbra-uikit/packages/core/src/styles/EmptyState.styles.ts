/**
 * Style builders for the {@link EmptyState} component.
 *
 * @module primitives/empty-state
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { EmptyStateSizeConfig } from '../types/EmptyState.types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Container style (centered flex column)
// ---------------------------------------------------------------------------

/**
 * Build the outer container style for an {@link EmptyState}.
 *
 * @param sizeConfig - Resolved size configuration from {@link emptyStateSizeMap}.
 * @returns A `CSSStyleObject` object with centered flex-column layout.
 */
export function buildContainerStyle(
  sizeConfig: EmptyStateSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    minHeight: sizeConfig.minHeight,
    gap: sizeConfig.gap,
    padding: spacing.xl,
  };
}

// ---------------------------------------------------------------------------
// Icon wrapper style
// ---------------------------------------------------------------------------

/**
 * Build the icon wrapper style for an {@link EmptyState}.
 *
 * @param sizeConfig - Resolved size configuration from {@link emptyStateSizeMap}.
 * @param themeColors - Active theme color tokens (uses `text.muted` for the icon).
 * @returns A `CSSStyleObject` object for the icon container `div`.
 */
export function buildIconStyle(
  sizeConfig: EmptyStateSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: themeColors.text.muted,
    marginBottom: spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// Title style
// ---------------------------------------------------------------------------

/**
 * Build the title (`<h3>`) style for an {@link EmptyState}.
 *
 * @param sizeConfig - Resolved size configuration from {@link emptyStateSizeMap}.
 * @param themeColors - Active theme color tokens (uses `text.primary`).
 * @returns A `CSSStyleObject` object for the title element.
 */
export function buildTitleStyle(
  sizeConfig: EmptyStateSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.titleFontSize,
    fontWeight: typography.weights.semibold,
    lineHeight: 1.3,
    color: themeColors.text.primary,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Description style
// ---------------------------------------------------------------------------

/**
 * Build the description (`<p>`) style for an {@link EmptyState}.
 *
 * @param sizeConfig - Resolved size configuration from {@link emptyStateSizeMap}.
 * @param themeColors - Active theme color tokens (uses `text.secondary`).
 * @returns A `CSSStyleObject` object for the description element,
 *          constrained to a max-width of 320px.
 */
export function buildDescriptionStyle(
  sizeConfig: EmptyStateSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.descriptionFontSize,
    fontWeight: typography.weights.regular,
    lineHeight: 1.5,
    color: themeColors.text.secondary,
    margin: 0,
    maxWidth: 320,
  };
}

// ---------------------------------------------------------------------------
// Action wrapper style
// ---------------------------------------------------------------------------

/**
 * Build the action wrapper style for an {@link EmptyState}.
 *
 * @returns A `CSSStyleObject` object with top margin spacing for the action slot.
 */
export function buildActionStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    marginTop: spacing.sm,
  };
}
