/**
 * IncomingCallOverlay — Full-screen overlay for incoming call notifications.
 *
 * Shows caller name, call type, and accept/decline buttons using the
 * Wisp CallNotification component.
 */

import React from 'react';
import { Box, CallNotification, useTheme } from '@coexist/wisp-react-native';
import { useCall } from '@/hooks/useCall';
import { dbg } from '@/utils/debug';

export function IncomingCallOverlay() {
  if (__DEV__) dbg.trackRender('IncomingCallOverlay');
  const { activeCall, acceptCall, endCall } = useCall();
  const { theme } = useTheme();

  if (!activeCall || activeCall.status !== 'incoming') return null;

  return (
    <Box
      px={32}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.colors.background.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <CallNotification
        variant="incoming"
        callerName={activeCall.isGroupCall ? `Group call from ${activeCall.remoteDisplayName}` : activeCall.remoteDisplayName}
        callType={activeCall.callType}
        onAccept={() => acceptCall()}
        onDecline={() => endCall('declined')}
        size="lg"
        style={{ minWidth: 300, maxWidth: 400, width: '100%' }}
      />
    </Box>
  );
}
