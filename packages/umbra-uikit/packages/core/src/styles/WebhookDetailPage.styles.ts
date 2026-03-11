/**
 * Style builders for the {@link WebhookDetailPage} component.
 *
 * @module components/webhook-detail-page
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

/**
 * Build the outer container style for the detail page.
 */
export function buildDetailContainerStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    fontFamily: fontFamilyStacks.sans,
    backgroundColor: themeColors.background.surface,
    borderRadius: radii.lg,
    border: `1px solid ${themeColors.border.subtle}`,
    padding: spacing.lg,
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

/**
 * Build a section container style.
 */
export function buildDetailSectionStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Avatar row
// ---------------------------------------------------------------------------

/**
 * Build the avatar row style.
 */
export function buildDetailAvatarRowStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  };
}

/**
 * Build the avatar image style.
 */
export function buildDetailAvatarStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    width: 64,
    height: 64,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.background.sunken,
    objectFit: 'cover',
  };
}

// ---------------------------------------------------------------------------
// Label / Heading
// ---------------------------------------------------------------------------

/**
 * Build a section label style.
 */
export function buildDetailLabelStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: 13,
    fontWeight: typography.weights.medium,
    color: themeColors.text.secondary,
    margin: 0,
  };
}

/**
 * Build a heading style.
 */
export function buildDetailHeadingStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: 18,
    fontWeight: typography.weights.semibold,
    color: themeColors.text.primary,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

/**
 * Build the detail input style.
 */
export function buildDetailInputStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    width: '100%',
    padding: `${spacing.xs}px ${spacing.sm}px`,
    fontSize: 14,
    fontFamily: fontFamilyStacks.sans,
    backgroundColor: themeColors.background.sunken,
    color: themeColors.text.primary,
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: radii.md,
    outline: 'none',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Token field
// ---------------------------------------------------------------------------

/**
 * Build the token display row style.
 */
export function buildDetailTokenRowStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };
}

/**
 * Build the token display field style.
 */
export function buildDetailTokenFieldStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, radii, spacing, typography } = theme;
  return {
    flex: 1,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    fontSize: 13,
    fontFamily: fontFamilyStacks.mono,
    fontWeight: typography.weights.regular,
    backgroundColor: themeColors.background.sunken,
    color: themeColors.text.secondary,
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: radii.md,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Meta text
// ---------------------------------------------------------------------------

/**
 * Build the detail meta text style.
 */
export function buildDetailMetaStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: 12,
    fontWeight: typography.weights.regular,
    color: themeColors.text.muted,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Action buttons
// ---------------------------------------------------------------------------

/**
 * Build the action button row style.
 */
export function buildDetailActionRowStyle(theme: WispTheme): CSSStyleObject {
  const { spacing, colors: themeColors } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTop: `1px solid ${themeColors.border.subtle}`,
  };
}

/**
 * Build a primary button style.
 */
export function buildDetailPrimaryButtonStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography, radii, spacing } = theme;
  return {
    padding: `${spacing.xs}px ${spacing.md}px`,
    fontSize: 13,
    fontFamily: fontFamilyStacks.sans,
    fontWeight: typography.weights.medium,
    color: themeColors.background.canvas,
    backgroundColor: themeColors.text.primary,
    border: 'none',
    borderRadius: radii.md,
    cursor: 'pointer',
  };
}

/**
 * Build a secondary button style.
 */
export function buildDetailSecondaryButtonStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography, radii, spacing } = theme;
  return {
    padding: `${spacing.xs}px ${spacing.md}px`,
    fontSize: 13,
    fontFamily: fontFamilyStacks.sans,
    fontWeight: typography.weights.medium,
    color: themeColors.text.secondary,
    backgroundColor: 'transparent',
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: radii.md,
    cursor: 'pointer',
  };
}

/**
 * Build a danger button style.
 */
export function buildDetailDangerButtonStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography, radii, spacing } = theme;
  return {
    padding: `${spacing.xs}px ${spacing.md}px`,
    fontSize: 13,
    fontFamily: fontFamilyStacks.sans,
    fontWeight: typography.weights.medium,
    color: themeColors.status.danger,
    backgroundColor: themeColors.status.dangerSurface,
    border: `1px solid ${themeColors.status.dangerBorder}`,
    borderRadius: radii.md,
    cursor: 'pointer',
    marginLeft: 'auto',
  };
}
