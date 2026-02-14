/**
 * useNativeCall — CallKit (iOS) / ConnectionService (Android) integration.
 *
 * On mobile platforms, this hook bridges native call UI with the app's
 * CallContext. On web, all methods are no-ops.
 */

import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

export interface NativeCallAPI {
  /** Report an incoming call to the native OS call UI */
  reportIncomingCall: (callId: string, callerName: string, hasVideo: boolean) => Promise<void>;
  /** Report that a call has started (connected) */
  reportCallStarted: (callId: string) => void;
  /** Report that a call has ended */
  reportCallEnded: (callId: string) => void;
  /** Whether native call UI is available */
  isAvailable: boolean;
}

export function useNativeCall(): NativeCallAPI {
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

  const reportIncomingCall = useCallback(async (callId: string, callerName: string, hasVideo: boolean) => {
    if (!isNative) return;

    try {
      if (Platform.OS === 'ios') {
        // CallKit integration - dynamic import to avoid bundling on web
        const RNCallKeep = await import('react-native-callkeep').then(m => m.default);
        RNCallKeep.displayIncomingCall(callId, callerName, callerName, 'generic', hasVideo);
      } else if (Platform.OS === 'android') {
        const RNCallKeep = await import('react-native-callkeep').then(m => m.default);
        RNCallKeep.displayIncomingCall(callId, callerName, callerName, 'generic', hasVideo);
      }
    } catch (err) {
      console.warn('[useNativeCall] Failed to report incoming call:', err);
    }
  }, [isNative]);

  const reportCallStarted = useCallback((callId: string) => {
    if (!isNative) return;
    import('react-native-callkeep').then(m => {
      m.default.setCurrentCallActive(callId);
    }).catch(() => {});
  }, [isNative]);

  const reportCallEnded = useCallback((callId: string) => {
    if (!isNative) return;
    import('react-native-callkeep').then(m => {
      m.default.endCall(callId);
    }).catch(() => {});
  }, [isNative]);

  // Setup CallKeep on native platforms
  useEffect(() => {
    if (!isNative) return;

    import('react-native-callkeep').then(m => {
      const RNCallKeep = m.default;
      RNCallKeep.setup({
        ios: {
          appName: 'Umbra',
          supportsVideo: true,
        },
        android: {
          alertTitle: 'Permissions Required',
          alertDescription: 'Umbra needs phone account permission to show incoming calls.',
          cancelButton: 'Cancel',
          okButton: 'OK',
          additionalPermissions: [],
          selfManaged: true,
        },
      }).catch((err: Error) => {
        console.warn('[useNativeCall] CallKeep setup failed:', err);
      });
    }).catch(() => {
      // react-native-callkeep not available
    });
  }, [isNative]);

  return {
    reportIncomingCall,
    reportCallStarted,
    reportCallEnded,
    isAvailable: isNative,
  };
}
