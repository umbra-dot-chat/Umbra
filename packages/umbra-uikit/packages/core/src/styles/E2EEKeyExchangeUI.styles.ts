/**
 * @module E2EEKeyExchangeUI
 * @description Style builders for the E2EE key exchange status component.
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import type { KeyExchangeStatus } from '../types/E2EEKeyExchangeUI.types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Status color resolution
// ---------------------------------------------------------------------------

export interface E2EEColors {
  bg: string;
  text: string;
  border: string;
  icon: string;
  badge: string;
}

export function resolveE2EEColors(
  status: KeyExchangeStatus,
  theme: WispTheme,
): E2EEColors {
  const { colors: tc } = theme;
  switch (status) {
    case 'pending':
      return {
        bg: tc.status.warningSurface,
        text: tc.text.primary,
        border: tc.status.warningBorder,
        icon: tc.status.warning,
        badge: tc.status.warning,
      };
    case 'active':
      return {
        bg: tc.status.successSurface,
        text: tc.text.primary,
        border: tc.status.successBorder,
        icon: tc.status.success,
        badge: tc.status.success,
      };
    case 'rotating':
      return {
        bg: tc.status.infoSurface,
        text: tc.text.primary,
        border: tc.status.infoBorder,
        icon: tc.status.info,
        badge: tc.status.info,
      };
    case 'error':
      return {
        bg: tc.status.dangerSurface,
        text: tc.text.primary,
        border: tc.status.dangerBorder,
        icon: tc.status.danger,
        badge: tc.status.danger,
      };
  }
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildE2EEContainerStyle(
  colors: E2EEColors,
  compact: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    alignItems: compact ? 'center' : 'flex-start',
    flexDirection: compact ? 'row' : 'column',
    gap: compact ? spacing.sm : spacing.md,
    padding: compact
      ? `${spacing.sm}px ${spacing.md}px`
      : `${spacing.lg}px`,
    borderRadius: radii.lg,
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    fontFamily: fontFamilyStacks.sans,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Header row (icon + title + badge)
// ---------------------------------------------------------------------------

export function buildE2EEHeaderStyle(
  compact: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    ...(compact ? { flex: 1 } : {}),
  };
}

// ---------------------------------------------------------------------------
// Title text
// ---------------------------------------------------------------------------

export function buildE2EETitleStyle(
  colors: E2EEColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Description / error text
// ---------------------------------------------------------------------------

export function buildE2EEDescriptionStyle(
  colors: E2EEColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.regular,
    color: colors.text,
    margin: 0,
    lineHeight: 1.4,
  };
}

// ---------------------------------------------------------------------------
// Badge style
// ---------------------------------------------------------------------------

export function buildE2EEBadgeStyle(
  colors: E2EEColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, radii, spacing } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: typography.sizes['2xs'].fontSize,
    fontWeight: typography.weights.medium,
    color: colors.badge,
    backgroundColor: 'transparent',
    border: `1px solid ${colors.badge}`,
    borderRadius: radii.full,
    padding: `${spacing['2xs']}px ${spacing.sm}px`,
    lineHeight: 1,
  };
}

// ---------------------------------------------------------------------------
// Actions row
// ---------------------------------------------------------------------------

export function buildE2EEActionsStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Skeleton pulse
// ---------------------------------------------------------------------------

export function buildE2EESkeletonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: tc, radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: tc.background.sunken,
    border: `1px solid ${tc.border.subtle}`,
  };
}

export function buildE2EESkeletonBarStyle(
  width: string,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: tc, radii } = theme;
  return {
    height: 12,
    width,
    borderRadius: radii.sm,
    backgroundColor: tc.border.subtle,
  };
}
