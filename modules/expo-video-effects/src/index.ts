/**
 * expo-video-effects — Native video effects using Apple Vision (iOS) / ML Kit (Android).
 *
 * Provides real-time person segmentation + GPU compositing for:
 *   - Background blur (sharp person, blurred background)
 *   - Virtual backgrounds (person composited over custom image)
 *
 * On web, returns null — the existing useVideoEffects canvas pipeline handles web.
 */

import { requireNativeModule, requireNativeViewManager } from 'expo-modules-core';
import { Platform } from 'react-native';

// ── Types ───────────────────────────────────────────────────────────────

export type VideoEffect = 'none' | 'blur' | 'virtual-background';

export interface VideoEffectsConfig {
  effect: VideoEffect;
  blurIntensity?: number;
  backgroundImage?: string | null;
  cameraPosition?: 'front' | 'back';
}

export interface NativeVideoEffects {
  /** Start the processing pipeline with the given config. */
  startProcessing(configJson: string): Promise<string>;

  /** Stop the processing pipeline. */
  stopProcessing(): string;

  /** Change the active effect without restarting the camera. */
  setEffect(effect: string): string;

  /** Update blur intensity (1-30). */
  setBlurIntensity(intensity: number): string;

  /** Set the background image URL for virtual-background mode. */
  setBackgroundImage(url: string | null): string;

  /** Switch between front and back camera. */
  switchCamera(): string;

  /** Check if the device supports video effects. */
  isSupported(): string;
}

// ── Module ──────────────────────────────────────────────────────────────

/**
 * Get the native video effects module.
 * Returns null on web (web uses the canvas-based pipeline).
 */
let _module: NativeVideoEffects | null = null;

export function getExpoVideoEffects(): NativeVideoEffects | null {
  if (Platform.OS === 'web') return null;
  if (_module) return _module;
  try {
    _module = requireNativeModule('ExpoVideoEffects') as NativeVideoEffects;
    return _module;
  } catch {
    console.warn(
      '[expo-video-effects] Native module not available. ' +
      'Ensure the module is linked and the app has been rebuilt.'
    );
    return null;
  }
}

// ── Native View ─────────────────────────────────────────────────────────

/**
 * Native view manager for the video effects preview.
 * Returns null on web.
 */
export const NativeVideoPreview = Platform.OS !== 'web'
  ? (() => {
      try {
        return requireNativeViewManager('ExpoVideoEffects');
      } catch {
        console.warn('[expo-video-effects] Native view manager not available.');
        return null;
      }
    })()
  : null;

export default getExpoVideoEffects;
