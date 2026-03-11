/**
 * @module components/node-detail-panel
 *
 * Style-building utilities for the {@link NodeDetailPanel} component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildPanelContainerStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.surface,
    border: `1px solid ${theme.colors.border.subtle}`,
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function buildPanelHeaderStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  };
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export function buildSectionStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    borderTop: `1px solid ${theme.colors.border.subtle}`,
  };
}

// ---------------------------------------------------------------------------
// Info row
// ---------------------------------------------------------------------------

export function buildInfoRowStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  };
}

// ---------------------------------------------------------------------------
// Public key display
// ---------------------------------------------------------------------------

export function buildPublicKeyStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background.sunken,
    fontFamily: 'monospace',
    fontSize: 12,
    color: theme.colors.text.secondary,
    wordBreak: 'break-all',
  };
}

// ---------------------------------------------------------------------------
// Config input row
// ---------------------------------------------------------------------------

export function buildConfigRowStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.md,
  };
}

// ---------------------------------------------------------------------------
// Danger zone
// ---------------------------------------------------------------------------

export function buildDangerZoneStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.md,
    border: `1px solid ${theme.colors.status.dangerBorder}`,
    backgroundColor: theme.colors.status.dangerSurface,
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function buildPanelSkeletonStyle(theme: WispTheme): CSSStyleObject {
  return {
    height: 400,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
