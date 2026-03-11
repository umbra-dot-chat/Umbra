/**
 * VideoTile style helpers.
 */

import type { WispTheme } from '../theme/types';

export function resolveVideoTileBackground(theme: WispTheme): string {
  return theme.colors.background.surface;
}

export function resolveSpeakingBorderColor(theme: WispTheme): string {
  return theme.colors.status.success;
}

export function resolveMuteBadgeBackground(theme: WispTheme): string {
  return theme.colors.status.danger;
}
