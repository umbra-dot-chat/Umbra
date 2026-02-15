/**
 * IncomingCallOverlay — Full-screen overlay for incoming call notifications.
 *
 * Shows caller name, call type, and accept/decline buttons using the
 * Wisp CallNotification component.
 */

import React from 'react';
import { View } from 'react-native';
import { CallNotification } from '@coexist/wisp-react-native';
import { useCall } from '@/hooks/useCall';

export function IncomingCallOverlay() {
  const { activeCall, acceptCall, endCall } = useCall();

  if (!activeCall || activeCall.status !== 'incoming') return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        paddingHorizontal: 32,
      }}
    >
      <CallNotification
        variant="incoming"
        callerName={activeCall.remoteDisplayName}
        callType={activeCall.callType}
        onAccept={() => acceptCall()}
        onDecline={() => endCall('declined')}
        size="lg"
        style={{ minWidth: 300, maxWidth: 400, width: '100%' }}
      />
    </View>
  );
}
