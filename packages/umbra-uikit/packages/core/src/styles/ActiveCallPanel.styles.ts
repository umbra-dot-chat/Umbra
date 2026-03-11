/**
 * ActiveCallPanel style helpers.
 */

import type { WispTheme } from '../theme/types';

export function resolveCallPanelBackground(theme: WispTheme): string {
  return theme.colors.background.surface;
}

export function resolveCallPanelBorder(theme: WispTheme): string {
  return theme.colors.border.subtle;
}
