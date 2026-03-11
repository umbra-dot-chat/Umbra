/**
 * VideoEffectsPanel style helpers.
 */

import type { WispTheme } from '../theme/types';
import type { VideoEffect, VideoFilter } from '../types/VideoEffectsPanel.types';

export function resolveEffectsPanelBackground(theme: WispTheme): string {
  return theme.colors.background.surface;
}

export function resolveEffectCardBackground(selected: boolean, theme: WispTheme): string {
  if (selected) return theme.colors.accent.primary;
  return theme.colors.background.sunken;
}

export function resolveEffectCardBorder(selected: boolean, theme: WispTheme): string {
  if (selected) return theme.colors.accent.primary;
  return theme.colors.border.subtle;
}

export function resolveEffectLabel(effect: VideoEffect): string {
  switch (effect) {
    case 'none': return 'None';
    case 'blur': return 'Blur';
    case 'virtual-background': return 'Background';
  }
}

export function resolveFilterLabel(filter: VideoFilter): string {
  switch (filter) {
    case 'none': return 'None';
    case 'grayscale': return 'Grayscale';
    case 'sepia': return 'Sepia';
    case 'warm': return 'Warm';
    case 'cool': return 'Cool';
    case 'high-contrast': return 'High Contrast';
  }
}
