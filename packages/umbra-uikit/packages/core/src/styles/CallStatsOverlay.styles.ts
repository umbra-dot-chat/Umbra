/**
 * CallStatsOverlay style helpers.
 */

import type { WispTheme } from '../theme/types';

export function resolveStatsBackground(theme: WispTheme): string {
  return 'rgba(0, 0, 0, 0.75)';
}

export function resolveStatsTextColor(theme: WispTheme): string {
  return theme.colors.text.primary;
}

export function resolveStatsLabelColor(theme: WispTheme): string {
  return theme.colors.text.secondary;
}
