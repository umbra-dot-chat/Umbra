/**
 * VoiceCallPanel — Full panel shown in the main content area when the user
 * is connected to a voice channel.
 *
 * Wraps the Wisp GroupCallPanel component, mapping the VoiceChannelContext
 * state into the unified call panel API. This gives us a polished UI with
 * adaptive voice/video layouts, speaking indicators, avatar cards, and
 * proper SVG call controls — all from the design system.
 */

import React, { useMemo } from 'react';
import { GroupCallPanel } from '@coexist/wisp-react-native';
import { useVoiceChannel } from '@/contexts/VoiceChannelContext';
import type { CommunityMember } from '@umbra/service';
import type { GroupCallParticipant } from '@coexist/wisp-core/types/GroupCallPanel.types';

export interface VoiceCallPanelProps {
  /** Channel name to display in the header. */
  channelName: string;
  /** All community members (for resolving DID → name/avatar). */
  members: CommunityMember[];
  /** Current user's DID. */
  myDid: string;
  /** Current user's display name (from identity). */
  myDisplayName?: string;
}

export function VoiceCallPanel({
  channelName,
  members,
  myDid,
  myDisplayName,
}: VoiceCallPanelProps) {
  const {
    activeChannelId,
    isMuted,
    isDeafened,
    isConnecting,
    toggleMute,
    toggleDeafen,
    leaveVoiceChannel,
    voiceParticipants,
    speakingDids,
  } = useVoiceChannel();

  // Build member map for quick lookup
  const memberMap = useMemo(() => {
    const map = new Map<string, { name: string; avatarUrl?: string }>();
    for (const m of members) {
      map.set(m.memberDid, {
        name: m.nickname || m.memberDid.slice(0, 16) + '...',
        avatarUrl: (m as any).avatarUrl,
      });
    }
    return map;
  }, [members]);

  // Get all participant DIDs in this voice channel
  const channelParticipantDids = useMemo(() => {
    if (!activeChannelId) return [];
    const dids = voiceParticipants.get(activeChannelId);
    if (!dids) return [myDid];
    return Array.from(dids).sort((a, b) => {
      if (a === myDid) return -1;
      if (b === myDid) return 1;
      const nameA = memberMap.get(a)?.name ?? a;
      const nameB = memberMap.get(b)?.name ?? b;
      return nameA.localeCompare(nameB);
    });
  }, [activeChannelId, voiceParticipants, myDid, memberMap]);

  // Map voice channel participants to GroupCallParticipant[]
  const groupCallParticipants = useMemo<GroupCallParticipant[]>(() => {
    return channelParticipantDids.map((did) => {
      const isMe = did === myDid;
      const member = memberMap.get(did);
      const displayName = isMe
        ? myDisplayName ?? member?.name ?? 'You'
        : member?.name ?? did.slice(0, 16) + '...';

      return {
        did,
        displayName,
        stream: null, // Voice-only — no video stream
        isMuted: isMe ? isMuted : false,
        isCameraOff: true, // Voice-only — camera always off
        isSpeaking: speakingDids.has(did),
        isDeafened: isMe ? isDeafened : false,
        isScreenSharing: false,
        avatar: member?.avatarUrl ?? undefined,
      };
    });
  }, [channelParticipantDids, myDid, myDisplayName, memberMap, isMuted, isDeafened, speakingDids]);

  return (
    <GroupCallPanel
      participants={groupCallParticipants}
      localDid={myDid}
      localStream={null}
      groupName={channelName}
      callType="audio"
      connectedAt={null}
      isConnecting={isConnecting}
      isMuted={isMuted}
      isCameraOff={true}
      isScreenSharing={false}
      isDeafened={isDeafened}
      layout="voice"
      onToggleMute={toggleMute}
      onToggleCamera={() => {}}
      onEndCall={leaveVoiceChannel}
      onToggleDeafen={toggleDeafen}
    />
  );
}
