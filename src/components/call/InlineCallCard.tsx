/**
 * InlineCallCard — Inline notification card shown in the chat area
 * when a call is active for the current conversation.
 *
 * Shows call status, caller info, timer, and action buttons
 * (Accept/Decline for incoming, Join for groups, Leave for connected).
 */

import React from 'react';
import { Box, Text, Button, CallTimer, useTheme } from '@coexist/wisp-react-native';
import { useCall } from '@/hooks/useCall';
import { InlineEventCard } from '@/components/ui/InlineEventCard';
import { PhoneIcon, VideoIcon } from '@/components/ui';
import { dbg } from '@/utils/debug';

interface InlineCallCardProps {
  /** Only show when the call matches this conversation. */
  conversationId: string | null;
  /** Show "Join" instead of Accept/Decline for group calls. */
  isGroup?: boolean;
}

export function InlineCallCard({ conversationId, isGroup }: InlineCallCardProps) {
  if (__DEV__) dbg.trackRender('InlineCallCard');
  const { activeCall, acceptCall, endCall } = useCall();
  const { theme } = useTheme();
  const tc = theme.colors;

  const isRelevant = activeCall && conversationId && activeCall.conversationId === conversationId;
  if (!activeCall || !isRelevant) return null;

  const { status, callType, remoteDisplayName, connectedAt } = activeCall;
  const isIncoming = status === 'incoming';
  const isConnected = status === 'connected';
  const isVideo = callType === 'video';

  const icon = isVideo
    ? <VideoIcon size={18} color={tc.status.success} />
    : <PhoneIcon size={18} color={tc.status.success} />;

  const statusText: Record<string, string> = {
    incoming: 'Incoming call',
    outgoing: 'Calling...',
    connecting: 'Connecting...',
    reconnecting: 'Reconnecting...',
  };

  const title = isGroup ? 'Group Call' : remoteDisplayName;
  const subtitle = statusText[status];

  const actions = (
    <Box style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {isConnected && connectedAt != null && (
        <CallTimer startedAt={connectedAt} size="sm" style={{ color: tc.text.muted }} />
      )}
      {isIncoming && isGroup && (
        <Button
          variant="primary"
          size="xs"
          onPress={() => acceptCall()}
          testID="call.inline-card.join"
        >
          Join
        </Button>
      )}
      {isIncoming && !isGroup && (
        <>
          <Button
            variant="primary"
            size="xs"
            onPress={() => acceptCall()}
            testID="call.inline-card.accept"
          >
            Accept
          </Button>
          <Button
            variant="secondary"
            size="xs"
            onPress={() => endCall('declined')}
            testID="call.inline-card.decline"
          >
            Decline
          </Button>
        </>
      )}
      {isConnected && (
        <Button
          variant="secondary"
          size="xs"
          onPress={() => endCall()}
          testID="call.inline-card.leave"
        >
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
      testID="call.inline-card"
    />
  );
}
