/**
 * @module styles/InviteManager
 * @description Pure style-builder functions for the InviteManager component.
 *
 * A panel for creating and managing invite links to a community.
 * Shows active invites, creation controls, and optional vanity URL settings.
 *
 * Sits on `background.surface` with subtle borders and hover states.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { withAlpha } from '../tokens/color-utils';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens for an InviteManager instance.
 */
export interface InviteManagerColors {
  /** Panel background. */
  bg: string;
  /** Panel border. */
  border: string;
  /** Header text. */
  headerText: string;
  /** Primary text (invite codes, labels). */
  textPrimary: string;
  /** Secondary text (created by, timestamps). */
  textSecondary: string;
  /** Muted text (placeholders, disabled). */
  textMuted: string;
  /** Invite row background. */
  rowBg: string;
  /** Invite row hover background. */
  rowHoverBg: string;
  /** Copy button background. */
  copyBg: string;
  /** Copy button hover background. */
  copyHoverBg: string;
  /** Copy button text/icon. */
  copyText: string;
  /** Delete button text/icon. */
  deleteText: string;
  /** Delete button hover background. */
  deleteHoverBg: string;
  /** Create section background. */
  createBg: string;
  /** Expiry badge background (active). */
  expiryActiveBg: string;
  /** Expiry badge text (active). */
  expiryActiveText: string;
  /** Expiry badge background (expired). */
  expiryExpiredBg: string;
  /** Expiry badge text (expired). */
  expiryExpiredText: string;
  /** Divider color. */
  divider: string;
  /** Accent for primary action buttons. */
  accentBg: string;
  /** Accent text for primary action buttons. */
  accentText: string;
  /** Vanity URL input border. */
  inputBorder: string;
  /** Vanity URL input background. */
  inputBg: string;
}

/**
 * Resolves theme-aware colors for the InviteManager.
 */
export function resolveInviteManagerColors(
  theme: WispTheme,
): InviteManagerColors {
  const { colors } = theme;
  return {
    bg: 'transparent',
    border: colors.accent.dividerRaised,
    headerText: colors.text.onRaised,
    textPrimary: colors.text.onRaised,
    textSecondary: colors.text.onRaisedSecondary,
    textMuted: colors.accent.mutedRaised,
    rowBg: 'transparent',
    rowHoverBg: colors.accent.highlightRaised,
    copyBg: withAlpha(colors.text.onRaised, 0.06),
    copyHoverBg: withAlpha(colors.text.onRaised, 0.1),
    copyText: colors.text.onRaisedSecondary,
    deleteText: colors.status.danger,
    deleteHoverBg: colors.status.dangerSurface,
    createBg: withAlpha(colors.text.onRaised, 0.06),
    expiryActiveBg: colors.status.successSurface,
    expiryActiveText: colors.status.success,
    expiryExpiredBg: colors.status.dangerSurface,
    expiryExpiredText: colors.status.danger,
    divider: colors.accent.dividerRaised,
    accentBg: colors.accent.primary,
    accentText: colors.text.inverse,
    inputBorder: colors.accent.dividerRaised,
    inputBg: withAlpha(colors.text.onRaised, 0.06),
  };
}

// ---------------------------------------------------------------------------
// 1. Container
// ---------------------------------------------------------------------------

/**
 * Builds the style for the InviteManager root container.
 */
export function buildContainerStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  const { radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.lg,
    boxSizing: 'border-box',
    overflow: 'hidden',
    fontFamily: fontFamilyStacks.sans,
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// 2. Header
// ---------------------------------------------------------------------------

/**
 * Builds the style for the header section.
 */
export function buildHeaderStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.divider}`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.base.fontSize,
    lineHeight: `${typography.sizes.base.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.headerText,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// 3. Invite row
// ---------------------------------------------------------------------------

/**
 * Builds the style for each invite row.
 */
export function buildInviteRowStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.sm}px ${spacing.lg}px`,
    backgroundColor: colors.rowBg,
    borderBottom: `1px solid ${colors.divider}`,
    boxSizing: 'border-box',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    gap: spacing.md,
  };
}

// ---------------------------------------------------------------------------
// 4. Invite info column (code + metadata)
// ---------------------------------------------------------------------------

/**
 * Builds the style for the invite info column.
 */
export function buildInviteInfoStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2xs'],
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  };
}

/**
 * Builds the style for the invite code text.
 */
export function buildInviteCodeStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.mono ?? fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

/**
 * Builds the style for invite metadata (created by, uses).
 */
export function buildInviteMetaStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// 5. Create section
// ---------------------------------------------------------------------------

/**
 * Builds the style for the invite creation section.
 */
export function buildCreateSectionStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.md}px ${spacing.lg}px`,
    backgroundColor: colors.createBg,
    borderBottom: `1px solid ${colors.divider}`,
    boxSizing: 'border-box',
    flexWrap: 'wrap',
  };
}

// ---------------------------------------------------------------------------
// 6. Copy button
// ---------------------------------------------------------------------------

/**
 * Builds the style for the copy button.
 */
export function buildCopyButtonStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  return {
    margin: 0,
    border: 'none',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    padding: `0 ${spacing.sm}px`,
    borderRadius: radii.md,
    backgroundColor: colors.copyBg,
    color: colors.copyText,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1,
    cursor: 'pointer',
    userSelect: 'none',
    flexShrink: 0,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// 7. Delete button
// ---------------------------------------------------------------------------

/**
 * Builds the style for the delete/revoke button.
 */
export function buildDeleteButtonStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  return {
    margin: 0,
    border: 'none',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    padding: `0 ${spacing.sm}px`,
    borderRadius: radii.md,
    backgroundColor: 'transparent',
    color: colors.deleteText,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1,
    cursor: 'pointer',
    userSelect: 'none',
    flexShrink: 0,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// 8. Expiry badge
// ---------------------------------------------------------------------------

/**
 * Builds the style for the expiry status badge.
 *
 * @param colors - Resolved color tokens.
 * @param theme - Current Wisp theme.
 * @param expired - Whether the invite has expired.
 */
export function buildExpiryBadgeStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
  expired: boolean,
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: 20,
    padding: `0 ${spacing.xs}px`,
    borderRadius: radii.full,
    backgroundColor: expired ? colors.expiryExpiredBg : colors.expiryActiveBg,
    color: expired ? colors.expiryExpiredText : colors.expiryActiveText,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// 9. Action row (copy + delete buttons container)
// ---------------------------------------------------------------------------

/**
 * Builds the style for the action button row within an invite row.
 */
export function buildActionRowStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['2xs'],
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// 10. Vanity URL section
// ---------------------------------------------------------------------------

/**
 * Builds the style for the vanity URL section.
 */
export function buildVanitySectionStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.divider}`,
    boxSizing: 'border-box',
  };
}

/**
 * Builds the style for the vanity URL input field.
 */
export function buildVanityInputStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  return {
    flex: 1,
    height: 32,
    padding: `0 ${spacing.sm}px`,
    borderRadius: radii.md,
    border: `1px solid ${colors.inputBorder}`,
    backgroundColor: colors.inputBg,
    color: colors.textPrimary,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    outline: 'none',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// 11. Close button
// ---------------------------------------------------------------------------

/**
 * Builds the style for the close / back button in the header.
 */
export function buildCloseButtonStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    margin: 0,
    padding: 0,
    border: 'none',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: radii.md,
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    cursor: 'pointer',
    flexShrink: 0,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// 12. Create button (accent)
// ---------------------------------------------------------------------------

/**
 * Builds the style for the primary "Create Invite" button.
 */
export function buildCreateButtonStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
  disabled: boolean,
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  return {
    margin: 0,
    border: 'none',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    padding: `0 ${spacing.md}px`,
    borderRadius: radii.md,
    backgroundColor: colors.accentBg,
    color: colors.accentText,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.semibold,
    lineHeight: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    userSelect: 'none',
    flexShrink: 0,
    transition: `opacity ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// 13. Select / dropdown style
// ---------------------------------------------------------------------------

/**
 * Builds the style for the inline select dropdowns (expiry, max uses).
 */
export function buildSelectStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  return {
    height: 32,
    padding: `0 ${spacing.sm}px`,
    borderRadius: radii.md,
    border: `1px solid ${colors.inputBorder}`,
    backgroundColor: colors.inputBg,
    color: colors.textPrimary,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: 1,
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// 14. Skeleton helpers
// ---------------------------------------------------------------------------

/**
 * Builds the style for a skeleton row placeholder.
 */
export function buildSkeletonRowStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, colors } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.sm}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.accent.dividerRaised}`,
    boxSizing: 'border-box',
  };
}

/**
 * Builds the style for a skeleton block inside a row.
 */
export function buildSkeletonBlockStyle(
  width: string | number,
  theme: WispTheme,
): CSSStyleObject {
  const { colors, radii } = theme;
  return {
    height: 14,
    width,
    borderRadius: radii.sm,
    backgroundColor: withAlpha(colors.text.onRaised, 0.12),
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}

// ---------------------------------------------------------------------------
// 15. Empty state
// ---------------------------------------------------------------------------

/**
 * Builds the style for the empty state text when no invites exist.
 */
export function buildEmptyStateStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.xl}px ${spacing.lg}px`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    color: colors.textMuted,
    textAlign: 'center',
  };
}

// ---------------------------------------------------------------------------
// 16. Label style for select dropdowns
// ---------------------------------------------------------------------------

/**
 * Builds the style for label text next to selects.
 */
export function buildLabelStyle(
  colors: InviteManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
}
