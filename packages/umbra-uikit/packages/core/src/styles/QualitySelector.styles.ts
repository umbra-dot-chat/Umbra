/**
 * QualitySelector style helpers.
 */

import type { WispTheme } from '../theme/types';
import type { VideoQualityOption } from '../types/QualitySelector.types';

export function resolveQualityLabel(quality: VideoQualityOption): string {
  switch (quality) {
    case 'auto': return 'Auto';
    case '720p': return '720p HD';
    case '1080p': return '1080p Full HD';
    case '1440p': return '1440p QHD';
    case '4k': return '4K Ultra HD';
  }
}

export function resolveQualityBandwidth(quality: VideoQualityOption): string {
  switch (quality) {
    case 'auto': return 'Adaptive';
    case '720p': return '~2.5 Mbps';
    case '1080p': return '~5 Mbps';
    case '1440p': return '~8 Mbps';
    case '4k': return '~16 Mbps';
  }
}

export function resolveSelectedBackground(theme: WispTheme): string {
  return theme.colors.accent.primary;
}
