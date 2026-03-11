/**
 * VideoEffectsPanel — UI for selecting video effects, filters, and virtual backgrounds.
 */

export const VIDEO_EFFECTS = ['none', 'blur', 'virtual-background'] as const;
export type VideoEffect = (typeof VIDEO_EFFECTS)[number];

export const VIDEO_FILTERS = ['none', 'grayscale', 'sepia', 'warm', 'cool', 'high-contrast'] as const;
export type VideoFilter = (typeof VIDEO_FILTERS)[number];

export interface BackgroundPreset {
  id: string;
  name: string;
  thumbnail: string;
}

export interface VideoEffectsPanelProps {
  /** Currently active video effect */
  currentEffect: VideoEffect;
  /** Currently active video filter */
  currentFilter: VideoFilter;
  /** Called when the video effect changes */
  onEffectChange: (effect: VideoEffect) => void;
  /** Called when the video filter changes */
  onFilterChange: (filter: VideoFilter) => void;
  /** Called when a virtual background image is selected */
  onBackgroundImageSelect?: (imageUrl: string) => void;
  /** Preset background images to display */
  backgroundPresets?: BackgroundPreset[];
  /** Current blur intensity (0-100) */
  blurIntensity?: number;
  /** Called when blur intensity changes */
  onBlurIntensityChange?: (intensity: number) => void;
}
