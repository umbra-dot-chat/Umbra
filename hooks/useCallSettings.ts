import { useState, useEffect, useCallback } from 'react';
import { VideoQuality, AudioQuality } from '@/types/call';
import type { OpusConfig, OpusApplication, AudioBitrate } from '@/types/call';
import { DEFAULT_OPUS_CONFIG } from '@/types/call';
import type { VideoEffect } from '@/hooks/useVideoEffects';

export type IncomingCallDisplay = 'fullscreen' | 'toast';

interface CallSettings {
  incomingCallDisplay: IncomingCallDisplay;
  ringVolume: number; // 0-100
  defaultVideoQuality: VideoQuality; // from @/types/call
  defaultAudioQuality: AudioQuality; // from @/types/call
  opusConfig: OpusConfig;
  inputVolume: number; // 0-100
  outputVolume: number; // 0-100
  mediaE2EE: boolean; // opt-in frame-level E2EE via RTCRtpScriptTransform
  videoEffect: VideoEffect; // none | blur | virtual-background
  blurIntensity: number; // 1-30
  backgroundPresetId: string | null; // selected preset id or null for custom
  customBackgroundUrl: string | null; // user-provided image URL
}

const STORAGE_KEYS = {
  incomingCallDisplay: 'umbra_call_incoming_display',
  ringVolume: 'umbra_call_ring_volume',
  defaultVideoQuality: 'umbra_call_default_video_quality',
  defaultAudioQuality: 'umbra_call_default_audio_quality',
  opusConfig: 'umbra_call_opus_config',
  inputVolume: 'umbra_call_input_volume',
  outputVolume: 'umbra_call_output_volume',
  mediaE2EE: 'umbra_call_media_e2ee',
  videoEffect: 'umbra_call_video_effect',
  blurIntensity: 'umbra_call_blur_intensity',
  backgroundPresetId: 'umbra_call_bg_preset_id',
  customBackgroundUrl: 'umbra_call_custom_bg_url',
} as const;

const DEFAULTS: CallSettings = {
  incomingCallDisplay: 'fullscreen',
  ringVolume: 80,
  defaultVideoQuality: 'auto',
  defaultAudioQuality: 'opus-voice',
  opusConfig: { ...DEFAULT_OPUS_CONFIG },
  inputVolume: 100,
  outputVolume: 100,
  mediaE2EE: false,
  videoEffect: 'none',
  blurIntensity: 10,
  backgroundPresetId: null,
  customBackgroundUrl: null,
};

function readFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function writeToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function useCallSettings() {
  const [incomingCallDisplay, setIncomingCallDisplayState] =
    useState<IncomingCallDisplay>(DEFAULTS.incomingCallDisplay);
  const [ringVolume, setRingVolumeState] = useState<number>(DEFAULTS.ringVolume);
  const [defaultVideoQuality, setDefaultVideoQualityState] =
    useState<VideoQuality>(DEFAULTS.defaultVideoQuality);
  const [defaultAudioQuality, setDefaultAudioQualityState] =
    useState<AudioQuality>(DEFAULTS.defaultAudioQuality);
  const [opusConfig, setOpusConfigState] =
    useState<OpusConfig>(DEFAULTS.opusConfig);
  const [inputVolume, setInputVolumeState] =
    useState<number>(DEFAULTS.inputVolume);
  const [outputVolume, setOutputVolumeState] =
    useState<number>(DEFAULTS.outputVolume);
  const [mediaE2EE, setMediaE2EEState] =
    useState<boolean>(DEFAULTS.mediaE2EE);
  const [videoEffect, setVideoEffectState] =
    useState<VideoEffect>(DEFAULTS.videoEffect);
  const [blurIntensity, setBlurIntensityState] =
    useState<number>(DEFAULTS.blurIntensity);
  const [backgroundPresetId, setBackgroundPresetIdState] =
    useState<string | null>(DEFAULTS.backgroundPresetId);
  const [customBackgroundUrl, setCustomBackgroundUrlState] =
    useState<string | null>(DEFAULTS.customBackgroundUrl);

  // Hydrate state from localStorage on mount
  useEffect(() => {
    setIncomingCallDisplayState(
      readFromStorage<IncomingCallDisplay>(
        STORAGE_KEYS.incomingCallDisplay,
        DEFAULTS.incomingCallDisplay,
      ),
    );
    setRingVolumeState(
      readFromStorage<number>(STORAGE_KEYS.ringVolume, DEFAULTS.ringVolume),
    );
    setDefaultVideoQualityState(
      readFromStorage<VideoQuality>(
        STORAGE_KEYS.defaultVideoQuality,
        DEFAULTS.defaultVideoQuality,
      ),
    );
    setDefaultAudioQualityState(
      readFromStorage<AudioQuality>(
        STORAGE_KEYS.defaultAudioQuality,
        DEFAULTS.defaultAudioQuality,
      ),
    );
    setOpusConfigState(
      readFromStorage<OpusConfig>(
        STORAGE_KEYS.opusConfig,
        DEFAULTS.opusConfig,
      ),
    );
    setInputVolumeState(
      readFromStorage<number>(
        STORAGE_KEYS.inputVolume,
        DEFAULTS.inputVolume,
      ),
    );
    setOutputVolumeState(
      readFromStorage<number>(
        STORAGE_KEYS.outputVolume,
        DEFAULTS.outputVolume,
      ),
    );
    setMediaE2EEState(
      readFromStorage<boolean>(
        STORAGE_KEYS.mediaE2EE,
        DEFAULTS.mediaE2EE,
      ),
    );
    setVideoEffectState(
      readFromStorage<VideoEffect>(
        STORAGE_KEYS.videoEffect,
        DEFAULTS.videoEffect,
      ),
    );
    setBlurIntensityState(
      readFromStorage<number>(
        STORAGE_KEYS.blurIntensity,
        DEFAULTS.blurIntensity,
      ),
    );
    setBackgroundPresetIdState(
      readFromStorage<string | null>(
        STORAGE_KEYS.backgroundPresetId,
        DEFAULTS.backgroundPresetId,
      ),
    );
    setCustomBackgroundUrlState(
      readFromStorage<string | null>(
        STORAGE_KEYS.customBackgroundUrl,
        DEFAULTS.customBackgroundUrl,
      ),
    );
  }, []);

  const setIncomingCallDisplay = useCallback((value: IncomingCallDisplay) => {
    setIncomingCallDisplayState(value);
    writeToStorage(STORAGE_KEYS.incomingCallDisplay, value);
  }, []);

  const setRingVolume = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setRingVolumeState(clamped);
    writeToStorage(STORAGE_KEYS.ringVolume, clamped);
  }, []);

  const setDefaultVideoQuality = useCallback((value: VideoQuality) => {
    setDefaultVideoQualityState(value);
    writeToStorage(STORAGE_KEYS.defaultVideoQuality, value);
  }, []);

  const setDefaultAudioQuality = useCallback((value: AudioQuality) => {
    setDefaultAudioQualityState(value);
    writeToStorage(STORAGE_KEYS.defaultAudioQuality, value);
  }, []);

  const setOpusConfig = useCallback((value: OpusConfig) => {
    setOpusConfigState(value);
    writeToStorage(STORAGE_KEYS.opusConfig, value);
  }, []);

  const setInputVolume = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setInputVolumeState(clamped);
    writeToStorage(STORAGE_KEYS.inputVolume, clamped);
  }, []);

  const setOutputVolume = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setOutputVolumeState(clamped);
    writeToStorage(STORAGE_KEYS.outputVolume, clamped);
  }, []);

  const setMediaE2EE = useCallback((value: boolean) => {
    setMediaE2EEState(value);
    writeToStorage(STORAGE_KEYS.mediaE2EE, value);
  }, []);

  const setVideoEffect = useCallback((value: VideoEffect) => {
    setVideoEffectState(value);
    writeToStorage(STORAGE_KEYS.videoEffect, value);
  }, []);

  const setBlurIntensity = useCallback((value: number) => {
    const clamped = Math.max(1, Math.min(30, value));
    setBlurIntensityState(clamped);
    writeToStorage(STORAGE_KEYS.blurIntensity, clamped);
  }, []);

  const setBackgroundPresetId = useCallback((value: string | null) => {
    setBackgroundPresetIdState(value);
    writeToStorage(STORAGE_KEYS.backgroundPresetId, value);
  }, []);

  const setCustomBackgroundUrl = useCallback((value: string | null) => {
    setCustomBackgroundUrlState(value);
    writeToStorage(STORAGE_KEYS.customBackgroundUrl, value);
  }, []);

  return {
    incomingCallDisplay,
    setIncomingCallDisplay,
    ringVolume,
    setRingVolume,
    defaultVideoQuality,
    setDefaultVideoQuality,
    defaultAudioQuality,
    setDefaultAudioQuality,
    opusConfig,
    setOpusConfig,
    inputVolume,
    setInputVolume,
    outputVolume,
    setOutputVolume,
    mediaE2EE,
    setMediaE2EE,
    videoEffect,
    setVideoEffect,
    blurIntensity,
    setBlurIntensity,
    backgroundPresetId,
    setBackgroundPresetId,
    customBackgroundUrl,
    setCustomBackgroundUrl,
  };
}
