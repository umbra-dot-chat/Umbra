/**
 * VideoEffectsPreview — React Native wrapper for the native video effects preview view.
 *
 * Renders processed camera output (with blur or virtual background applied)
 * using the native Metal-backed view on iOS. Returns null on web (web uses
 * the existing canvas-based preview in useVideoEffects).
 */

import React from 'react';
import { Platform, View, type ViewStyle } from 'react-native';
import type { VideoEffect } from './index';

interface VideoEffectsPreviewProps {
  /** The video effect to apply. */
  effect: VideoEffect;

  /** Blur intensity (1-30). Only used when effect is "blur". */
  blurIntensity?: number;

  /** Background image URL. Only used when effect is "virtual-background". */
  backgroundImage?: string | null;

  /** Camera position: "front" or "back". */
  cameraPosition?: 'front' | 'back';

  /** Whether the preview pipeline is enabled. */
  enabled?: boolean;

  /** View style (width, height, borderRadius, etc.). */
  style?: ViewStyle;
}

export function VideoEffectsPreview({
  effect,
  blurIntensity = 10,
  backgroundImage = null,
  cameraPosition = 'front',
  enabled = true,
  style,
}: VideoEffectsPreviewProps) {
  // Web uses the canvas-based pipeline — no native view needed
  if (Platform.OS === 'web') {
    return null;
  }

  // Lazy-require to avoid importing native module on web
  const { NativeVideoPreview } = require('./index');

  if (!NativeVideoPreview) {
    // Module not available — show empty placeholder
    return <View style={[{ backgroundColor: '#1a1a2e' }, style]} />;
  }

  return (
    <NativeVideoPreview
      effect={effect}
      blurIntensity={blurIntensity}
      backgroundImage={backgroundImage}
      cameraPosition={cameraPosition}
      enabled={enabled}
      style={style}
    />
  );
}

export default VideoEffectsPreview;
