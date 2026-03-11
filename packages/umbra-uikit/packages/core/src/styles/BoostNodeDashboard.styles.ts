/**
 * @module components/boost-node-dashboard
 *
 * Style-building utilities for the {@link BoostNodeDashboard} component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import type { BoostNodeStatus } from '../types/BoostNodeDashboard.types';

// ---------------------------------------------------------------------------
// Status color resolution
// ---------------------------------------------------------------------------

/**
 * Resolves a {@link BoostNodeStatus} to a dot indicator color.
 */
export function resolveStatusColor(status: BoostNodeStatus, theme: WispTheme): string {
  switch (status) {
    case 'online':
      return theme.colors.status.success;
    case 'offline':
      return theme.colors.text.muted;
    case 'syncing':
      return theme.colors.status.warning;
    default:
      return theme.colors.text.muted;
  }
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildContainerStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg,
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function buildHeaderStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  };
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

export function buildGridStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: theme.spacing.md,
  };
}

// ---------------------------------------------------------------------------
// Node card
// ---------------------------------------------------------------------------

export function buildNodeCardStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.surface,
    border: `1px solid ${theme.colors.border.subtle}`,
    cursor: 'pointer',
    transition: 'border-color 150ms ease',
  };
}

// ---------------------------------------------------------------------------
// Node card header row
// ---------------------------------------------------------------------------

export function buildNodeCardHeaderStyle(): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  };
}

// ---------------------------------------------------------------------------
// Status dot
// ---------------------------------------------------------------------------

export function buildStatusDotStyle(status: BoostNodeStatus, theme: WispTheme): CSSStyleObject {
  return {
    width: 8,
    height: 8,
    borderRadius: theme.radii.full,
    backgroundColor: resolveStatusColor(status, theme),
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Storage bar
// ---------------------------------------------------------------------------

export function buildStorageBarTrackStyle(theme: WispTheme): CSSStyleObject {
  return {
    width: '100%',
    height: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.border.subtle,
    overflow: 'hidden',
  };
}

export function buildStorageBarFillStyle(percentage: number, theme: WispTheme): CSSStyleObject {
  return {
    height: '100%',
    borderRadius: theme.radii.full,
    backgroundColor: percentage > 90 ? theme.colors.status.warning : theme.colors.accent.primary,
    width: `${Math.min(100, Math.max(0, percentage))}%`,
    transition: 'width 300ms ease',
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function buildSkeletonStyle(theme: WispTheme): CSSStyleObject {
  return {
    height: 160,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
