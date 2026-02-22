/**
 * useMediaDevices — Enumerates audio/video devices and detects hot-swap changes.
 *
 * Provides lists of available audio inputs, video inputs, and audio outputs.
 * On web, listens for the `devicechange` event to auto-detect when devices are
 * plugged in or unplugged. On mobile (iOS/Android), provides sensible defaults
 * (front/back camera, default mic) since enumerateDevices is unavailable.
 */

import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'videoinput' | 'audiooutput';
}

export interface UseMediaDevicesResult {
  /** Available microphones */
  audioInputs: MediaDeviceInfo[];
  /** Available cameras */
  videoInputs: MediaDeviceInfo[];
  /** Available speakers/outputs */
  audioOutputs: MediaDeviceInfo[];
  /** Whether device enumeration is supported */
  isSupported: boolean;
  /** Whether a device change was just detected */
  deviceChanged: boolean;
  /** Re-enumerate devices manually */
  refresh: () => Promise<void>;
  /** Request media permissions (needed before labels are visible) */
  requestPermission: (video?: boolean) => Promise<boolean>;
}

/** Whether we're on a native mobile platform (iOS/Android). */
const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Default mobile devices — enumerateDevices() doesn't work on RN/iOS,
 * so we provide sensible defaults for front/back camera and default mic.
 */
const MOBILE_AUDIO_INPUTS: MediaDeviceInfo[] = [
  { deviceId: 'default', label: 'Default Microphone', kind: 'audioinput' },
];
const MOBILE_VIDEO_INPUTS: MediaDeviceInfo[] = [
  { deviceId: 'front', label: 'Front Camera', kind: 'videoinput' },
  { deviceId: 'back', label: 'Back Camera', kind: 'videoinput' },
];

export function useMediaDevices(): UseMediaDevicesResult {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>(
    isMobile ? MOBILE_AUDIO_INPUTS : [],
  );
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>(
    isMobile ? MOBILE_VIDEO_INPUTS : [],
  );
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [deviceChanged, setDeviceChanged] = useState(false);

  const isSupported = isMobile
    ? true
    : (typeof navigator !== 'undefined' && !!navigator.mediaDevices);

  const enumerate = useCallback(async () => {
    // On mobile, use hardcoded device list
    if (isMobile) {
      setAudioInputs(MOBILE_AUDIO_INPUTS);
      setVideoInputs(MOBILE_VIDEO_INPUTS);
      setAudioOutputs([]);
      return;
    }

    if (!isSupported) return;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const inputs: MediaDeviceInfo[] = [];
      const cameras: MediaDeviceInfo[] = [];
      const outputs: MediaDeviceInfo[] = [];

      for (const device of devices) {
        const info: MediaDeviceInfo = {
          deviceId: device.deviceId,
          label: device.label || `${device.kind} (${device.deviceId.slice(0, 8)}...)`,
          kind: device.kind as MediaDeviceInfo['kind'],
        };

        switch (device.kind) {
          case 'audioinput':
            inputs.push(info);
            break;
          case 'videoinput':
            cameras.push(info);
            break;
          case 'audiooutput':
            outputs.push(info);
            break;
        }
      }

      setAudioInputs(inputs);
      setVideoInputs(cameras);
      setAudioOutputs(outputs);
    } catch {
      // Device enumeration not available
    }
  }, [isSupported]);

  const requestPermission = useCallback(async (video = false): Promise<boolean> => {
    if (isMobile) {
      // On mobile, permissions are handled by the OS when getUserMedia is called.
      // Return true optimistically — the actual permission prompt happens at call time.
      return true;
    }

    if (!isSupported) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video,
      });
      // Stop tracks immediately — we just needed permission
      for (const track of stream.getTracks()) {
        track.stop();
      }
      // Re-enumerate now that we have permission (labels become available)
      await enumerate();
      return true;
    } catch {
      return false;
    }
  }, [isSupported, enumerate]);

  // Listen for device changes (web only)
  useEffect(() => {
    if (isMobile || !isSupported) return;

    enumerate();

    const handleChange = () => {
      setDeviceChanged(true);
      enumerate();
      // Reset the flag after a short delay so consumers can show a toast
      setTimeout(() => setDeviceChanged(false), 3000);
    };

    navigator.mediaDevices.addEventListener('devicechange', handleChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleChange);
    };
  }, [isSupported, enumerate]);

  return {
    audioInputs,
    videoInputs,
    audioOutputs,
    isSupported,
    deviceChanged,
    refresh: enumerate,
    requestPermission,
  };
}
