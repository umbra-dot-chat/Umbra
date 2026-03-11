/**
 * QualitySelector — UI for changing video and audio quality settings.
 */

export const qualitySelectorSizes = ['sm', 'md'] as const;
export type QualitySelectorSize = (typeof qualitySelectorSizes)[number];

export interface QualitySelectorSizeConfig {
  fontSize: number;
  labelFontSize: number;
  padding: number;
  gap: number;
  optionHeight: number;
}

export const qualitySelectorSizeMap: Record<QualitySelectorSize, QualitySelectorSizeConfig> = {
  sm: {
    fontSize: 12,
    labelFontSize: 11,
    padding: 8,
    gap: 4,
    optionHeight: 32,
  },
  md: {
    fontSize: 14,
    labelFontSize: 12,
    padding: 12,
    gap: 8,
    optionHeight: 40,
  },
};

export type VideoQualityOption = 'auto' | '720p' | '1080p' | '1440p' | '4k';
export type AudioQualityOption = 'opus' | 'pcm';

export interface QualitySelectorProps {
  /** Current video quality */
  videoQuality: VideoQualityOption;
  /** Current audio quality */
  audioQuality: AudioQualityOption;
  /** Called when video quality changes */
  onVideoQualityChange: (quality: VideoQualityOption) => void;
  /** Called when audio quality changes */
  onAudioQualityChange: (quality: AudioQualityOption) => void;
  /** Whether to show the audio quality toggle */
  showAudioToggle?: boolean;
  /** Size variant */
  size?: QualitySelectorSize;
  /** Custom style */
  style?: object;
}
