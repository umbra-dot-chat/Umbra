import { Platform } from 'react-native';

export interface PlatformMediaAPI {
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  getDisplayMedia: (constraints?: DisplayMediaStreamOptions) => Promise<MediaStream>;
  enumerateDevices: () => Promise<MediaDeviceInfo[]>;
  isSupported: boolean;
}

export function usePlatformMedia(): PlatformMediaAPI {
  // For web platform
  if (Platform.OS === 'web') {
    return {
      getUserMedia: (constraints) => navigator.mediaDevices.getUserMedia(constraints),
      getDisplayMedia: (constraints) => navigator.mediaDevices.getDisplayMedia(constraints ?? { video: true }),
      enumerateDevices: () => navigator.mediaDevices.enumerateDevices(),
      isSupported: typeof navigator !== 'undefined' && !!navigator.mediaDevices,
    };
  }

  // For mobile platforms (iOS/Android) - uses react-native-webrtc
  // These would import from react-native-webrtc when available
  return {
    getUserMedia: async (constraints) => {
      try {
        const { mediaDevices } = await import('react-native-webrtc');
        return mediaDevices.getUserMedia(constraints);
      } catch {
        throw new Error('react-native-webrtc is not available');
      }
    },
    getDisplayMedia: async () => {
      throw new Error('Screen sharing is not yet supported on mobile');
    },
    enumerateDevices: async () => {
      try {
        const { mediaDevices } = await import('react-native-webrtc');
        return mediaDevices.enumerateDevices();
      } catch {
        return [];
      }
    },
    isSupported: Platform.OS === 'ios' || Platform.OS === 'android',
  };
}
