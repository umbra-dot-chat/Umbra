/**
 * useNativeVideoEffects — Platform-aware video effects hook.
 *
 * On web: delegates to the existing useVideoEffects (canvas + MediaPipe pipeline).
 * On mobile: controls the expo-video-effects native module (Vision + Metal pipeline).
 *
 * This hook provides a unified API so consumers don't need to know which
 * platform they're running on.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  useVideoEffects,
  type VideoEffect,
  type BackgroundPreset,
  BACKGROUND_PRESETS,
} from './useVideoEffects';
import { getExpoVideoEffects, type VideoEffectsConfig } from 'expo-video-effects';

// ── Types ───────────────────────────────────────────────────────────────

export interface UseNativeVideoEffectsConfig {
  /** The current effect. */
  effect: VideoEffect;

  /** Blur intensity (1-30) for blur mode. */
  blurIntensity?: number;

  /** Background image URL for virtual-background mode. */
  backgroundImage?: string | null;

  /** Whether effects processing is enabled. */
  enabled?: boolean;

  /**
   * Source video stream (web only).
   * On mobile, the native module captures directly from the camera.
   */
  sourceStream?: MediaStream | null;
}

export interface UseNativeVideoEffectsReturn {
  /** The processed output stream (web only — mobile renders natively). */
  outputStream: MediaStream | null;

  /** Whether effects are currently processing. */
  isProcessing: boolean;

  /** Error message if setup failed. */
  error: string | null;

  /** Available background presets. */
  backgroundPresets: BackgroundPreset[];

  /** Whether the native module is available (always true on web). */
  isNativeAvailable: boolean;

  /** Switch camera (mobile only). */
  switchCamera: () => void;
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useNativeVideoEffects(
  config: UseNativeVideoEffectsConfig
): UseNativeVideoEffectsReturn {
  const {
    effect,
    blurIntensity = 10,
    backgroundImage = null,
    enabled = true,
    sourceStream = null,
  } = config;

  // ── Web: delegate to existing canvas pipeline ──────────────────────
  if (Platform.OS === 'web') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const webResult = useVideoEffects({
      sourceStream,
      effect,
      blurIntensity,
      backgroundImage,
      enabled,
    });

    return {
      ...webResult,
      isNativeAvailable: true,
      switchCamera: () => {}, // No-op on web
    };
  }

  // ── Mobile: control native module ──────────────────────────────────

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nativeRef = useRef(getExpoVideoEffects());
  const isStartedRef = useRef(false);

  // Start/stop the native pipeline based on `enabled`
  useEffect(() => {
    const native = nativeRef.current;
    if (!native) return;

    if (enabled && !isStartedRef.current) {
      const startConfig: VideoEffectsConfig = {
        effect,
        blurIntensity,
        backgroundImage,
        cameraPosition: 'front',
      };

      setIsProcessing(true);
      setError(null);

      native.startProcessing(JSON.stringify(startConfig))
        .then((resultJson) => {
          try {
            const result = JSON.parse(resultJson);
            if (result.error) {
              setError(result.message || 'Failed to start processing');
              setIsProcessing(false);
            } else {
              isStartedRef.current = true;
            }
          } catch {
            setError('Failed to parse native result');
            setIsProcessing(false);
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to start processing');
          setIsProcessing(false);
        });
    } else if (!enabled && isStartedRef.current) {
      native.stopProcessing();
      isStartedRef.current = false;
      setIsProcessing(false);
    }

    return () => {
      if (isStartedRef.current) {
        native.stopProcessing();
        isStartedRef.current = false;
      }
    };
  }, [enabled]);

  // Update effect when it changes (while pipeline is running)
  useEffect(() => {
    if (!isStartedRef.current) return;
    nativeRef.current?.setEffect(effect);
  }, [effect]);

  // Update blur intensity when it changes
  useEffect(() => {
    if (!isStartedRef.current) return;
    nativeRef.current?.setBlurIntensity(blurIntensity);
  }, [blurIntensity]);

  // Update background image when it changes
  useEffect(() => {
    if (!isStartedRef.current) return;
    nativeRef.current?.setBackgroundImage(backgroundImage);
  }, [backgroundImage]);

  const switchCamera = useCallback(() => {
    nativeRef.current?.switchCamera();
  }, []);

  return {
    outputStream: null, // Mobile renders natively — no MediaStream
    isProcessing,
    error,
    backgroundPresets: BACKGROUND_PRESETS,
    isNativeAvailable: nativeRef.current !== null,
    switchCamera,
  };
}

export { type VideoEffect, type BackgroundPreset, BACKGROUND_PRESETS };
