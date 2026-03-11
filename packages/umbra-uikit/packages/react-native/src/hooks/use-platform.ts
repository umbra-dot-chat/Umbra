import { useMemo } from 'react';
import { Platform } from 'react-native';

export type PlatformType = 'web' | 'ios' | 'android';

export interface UsePlatformReturn {
  platform: PlatformType;
  isWeb: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isNative: boolean;
}

/**
 * Returns the current platform and convenience boolean flags.
 * Uses React Native's Platform module directly.
 */
export function usePlatform(): UsePlatformReturn {
  return useMemo(() => {
    const os = Platform.OS;
    const platform: PlatformType =
      os === 'ios' ? 'ios' : os === 'android' ? 'android' : 'web';

    return {
      platform,
      isWeb: platform === 'web',
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isNative: platform === 'ios' || platform === 'android',
    };
  }, []);
}
