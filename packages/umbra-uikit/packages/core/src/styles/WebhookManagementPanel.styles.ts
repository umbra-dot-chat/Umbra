/**
 * Style builders for the {@link WebhookManagementPanel} component.
 *
 * @module components/webhook-management-panel
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

/**
 * Build the outer container style for a WebhookManagementPanel.
 */
export function buildWebhookPanelContainerStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    fontFamily: fontFamilyStacks.sans,
    backgroundColor: themeColors.background.surface,
    borderRadius: radii.lg,
    border: `1px solid ${themeColors.border.subtle}`,
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

/**
 * Build the header bar style (title + create button row).
 */
export function buildWebhookPanelHeaderStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderBottom: `1px solid ${themeColors.border.subtle}`,
  };
}

/**
 * Build the header title style.
 */
export function buildWebhookPanelTitleStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: 16,
    fontWeight: typography.weights.semibold,
    color: themeColors.text.primary,
    margin: 0,
  };
}

/**
 * Build the count badge style.
 */
export function buildWebhookPanelCountStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: 12,
    fontWeight: typography.weights.regular,
    color: themeColors.text.muted,
    marginLeft: 8,
  };
}

// ---------------------------------------------------------------------------
// Webhook card
// ---------------------------------------------------------------------------

/**
 * Build the style for a single webhook entry row.
 */
export function buildWebhookCardStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    borderBottom: `1px solid ${themeColors.border.subtle}`,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  };
}

/**
 * Build the webhook avatar style.
 */
export function buildWebhookAvatarStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    width: 40,
    height: 40,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.background.sunken,
  };
}

/**
 * Build the webhook card info column style.
 */
export function buildWebhookCardInfoStyle(): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    gap: 2,
  };
}

/**
 * Build the webhook card name style.
 */
export function buildWebhookCardNameStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: 14,
    fontWeight: typography.weights.medium,
    color: themeColors.text.primary,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

/**
 * Build the webhook card meta text style.
 */
export function buildWebhookCardMetaStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: 12,
    fontWeight: typography.weights.regular,
    color: themeColors.text.muted,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Create button
// ---------------------------------------------------------------------------

/**
 * Build the create button style.
 */
export function buildWebhookCreateButtonStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography, radii, spacing } = theme;
  return {
    padding: `${spacing['2xs']}px ${spacing.md}px`,
    fontSize: 13,
    fontFamily: fontFamilyStacks.sans,
    fontWeight: typography.weights.medium,
    color: themeColors.text.primary,
    backgroundColor: themeColors.background.raised,
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: radii.md,
    cursor: 'pointer',
  };
}

// ---------------------------------------------------------------------------
// Delete button
// ---------------------------------------------------------------------------

/**
 * Build the delete button style.
 */
export function buildWebhookDeleteButtonStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography, radii, spacing } = theme;
  return {
    flexShrink: 0,
    padding: `${spacing['2xs']}px ${spacing.sm}px`,
    fontSize: 12,
    fontFamily: fontFamilyStacks.sans,
    fontWeight: typography.weights.medium,
    color: themeColors.status.danger,
    backgroundColor: themeColors.status.dangerSurface,
    border: `1px solid ${themeColors.status.dangerBorder}`,
    borderRadius: radii.md,
    cursor: 'pointer',
  };
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

/**
 * Build the empty state wrapper style.
 */
export function buildWebhookPanelEmptyStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing['2xl']}px ${spacing.lg}px`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: 14,
    color: themeColors.text.muted,
    fontWeight: typography.weights.regular,
  };
}
