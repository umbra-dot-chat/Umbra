/**
 * @module styles/CallHistoryItem
 * @description Pure style-builder functions for the CallHistoryItem component.
 */

import type { WispTheme } from '../theme/types';

// ---------------------------------------------------------------------------
// Color resolution helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the background color for a call history row.
 */
export function resolveCallHistoryBackground(isDark: boolean): string {
  return isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)';
}

/**
 * Resolve the border color for a call history row.
 */
export function resolveCallHistoryBorder(isDark: boolean): string {
  return isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
}

/**
 * Resolve the status text color based on call outcome.
 *
 * - completed  -> green
 * - missed     -> red
 * - declined   -> red
 * - cancelled  -> yellow / amber
 */
export function resolveCallStatusColor(status: string, isDark: boolean): string {
  switch (status) {
    case 'completed':
      return isDark ? '#4ade80' : '#16a34a';
    case 'missed':
    case 'declined':
      return isDark ? '#f87171' : '#dc2626';
    case 'cancelled':
      return isDark ? '#facc15' : '#ca8a04';
    default:
      return isDark ? '#a1a1aa' : '#71717a';
  }
}

// ---------------------------------------------------------------------------
// Full color set (for convenience in platform components)
// ---------------------------------------------------------------------------

export interface CallHistoryItemColors {
  bg: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  statusColor: string;
  callbackIcon: string;
}

export function resolveCallHistoryItemColors(
  status: string,
  theme: WispTheme,
): CallHistoryItemColors {
  const isDark = theme.mode === 'dark';
  return {
    bg: resolveCallHistoryBackground(isDark),
    border: resolveCallHistoryBorder(isDark),
    text: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    textMuted: theme.colors.text.muted,
    statusColor: resolveCallStatusColor(status, isDark),
    callbackIcon: theme.colors.text.secondary,
  };
}
