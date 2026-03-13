/**
 * InlineCallCardMessage — Interactive call card rendered inline in the
 * message stream for active calls. Takes props instead of using useCall()
 * so it can be driven by the parent ChatArea.
 */

import React from 'react';
import { Box, Button, CallTimer, useTheme } from '@coexist/wisp-react-native';
import { InlineEventCard } from '@/components/ui/InlineEventCard';
import { PhoneIcon, VideoIcon } from '@/components/ui';
import type { ActiveCall } from '@/types/call';
import { dbg } from '@/utils/debug';

export interface InlineCallCardMessageProps {
  /** The active call to display. */
  activeCall: ActiveCall;
  /** Show "Join" instead of Accept/Decline for group calls. */
  isGroup?: boolean;
  /** Accept/join the incoming call. */
  onAccept?: () => void;
  /** End/decline the call. */
  onEnd?: (reason?: string) => void;
}

export function InlineCallCardMessage({
  activeCall, isGroup, onAccept, onEnd,
}: InlineCallCardMessageProps) {
  if (__DEV__) dbg.trackRender('InlineCallCardMessage');
  const { theme } = useTheme();
  const tc = theme.colors;

  const { status, callType, remoteDisplayName, connectedAt } = activeCall;
  const isIncoming = status === 'incoming';
  const isConnected = status === 'connected';
  const isVideo = callType === 'video';

  const icon = isVideo
    ? <VideoIcon size={18} color={tc.status.success} />
    : <PhoneIcon size={18} color={tc.status.success} />;

  const statusLabel: Record<string, string> = {
    incoming: 'Incoming call',
    outgoing: 'Calling\u2026',
    connecting: 'Connecting\u2026',
    reconnecting: 'Reconnecting\u2026',
  };

  const title = isGroup ? 'Group Call' : remoteDisplayName;
  const subtitle = statusLabel[status];

  const actions = (
    <Box style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {isConnected && connectedAt != null && (
        <CallTimer startedAt={connectedAt} size="sm" style={{ color: tc.text.muted }} />
      )}
      {isIncoming && isGroup && (
        <Button variant="primary" size="xs" onPress={onAccept} testID="call.stream-card.join">
          Join
        </Button>
      )}
      {isIncoming && !isGroup && (
        <>
          <Button variant="primary" size="xs" onPress={onAccept} testID="call.stream-card.accept">
            Accept
          </Button>
          <Button variant="secondary" size="xs" onPress={() => onEnd?.('declined')} testID="call.stream-card.decline">
            Decline
          </Button>
        </>
      )}
      {isConnected && (
        <Button variant="secondary" size="xs" onPress={() => onEnd?.()} testID="call.stream-card.leave">
          Leave
        </Button>
      )}
    </Box>
  );

  return (
    <InlineEventCard
      visible
      accentColor={tc.status.success}
      icon={icon}
      title={title}
      subtitle={subtitle}
      actions={actions}
      testID="call.stream-card"
    />
  );
}
