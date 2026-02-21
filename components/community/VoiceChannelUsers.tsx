/**
 * VoiceChannelUsers — Shows connected voice users under a voice channel
 * in the sidebar channel list.
 *
 * Each user is displayed as a small row with an avatar and display name,
 * similar to how Discord shows users under voice channels.
 *
 * When a user is speaking (audio above threshold), their avatar gets a
 * green ring outline and a small audio-wave icon is shown next to their name.
 */

import React from 'react';
import { View } from 'react-native';
import { Avatar, Text, useTheme } from '@coexist/wisp-react-native';
import { AudioWaveIcon } from '@/components/icons';
import type { CommunityMember } from '@umbra/service';

export interface VoiceChannelUsersProps {
  /** Set of participant DIDs in this voice channel. */
  participantDids: Set<string>;
  /** All community members (for resolving DID → name). */
  members: CommunityMember[];
  /** The current user's DID (to show "You" or own display name). */
  myDid: string;
  /** The current user's display name (from identity). */
  myDisplayName?: string;
  /** Set of DIDs currently speaking (audio above threshold). */
  speakingDids?: Set<string>;
}

export function VoiceChannelUsers({
  participantDids,
  members,
  myDid,
  myDisplayName,
  speakingDids,
}: VoiceChannelUsersProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  if (participantDids.size === 0) return null;

  // Build a DID → display name map from members
  const memberMap = new Map<string, { name: string; avatarUrl?: string }>();
  for (const m of members) {
    memberMap.set(m.memberDid, {
      name: m.nickname || m.memberDid.slice(0, 16) + '...',
      avatarUrl: m.avatarUrl,
    });
  }

  // Sort participants: self first, then alphabetically
  const sorted = Array.from(participantDids).sort((a, b) => {
    if (a === myDid) return -1;
    if (b === myDid) return 1;
    const nameA = memberMap.get(a)?.name ?? a;
    const nameB = memberMap.get(b)?.name ?? b;
    return nameA.localeCompare(nameB);
  });

  const speakingColor = themeColors.status.success;

  return (
    <View style={{ paddingLeft: 36, paddingRight: 8, paddingBottom: 2 }}>
      {sorted.map((did) => {
        const isMe = did === myDid;
        const member = memberMap.get(did);
        const name = isMe
          ? myDisplayName ?? member?.name ?? 'You'
          : member?.name ?? did.slice(0, 16) + '...';
        const isSpeaking = speakingDids?.has(did) ?? false;

        return (
          <View
            key={did}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 3,
            }}
          >
            {/* Avatar with green ring when speaking */}
            <View
              style={
                isSpeaking
                  ? {
                      borderRadius: 999,
                      borderWidth: 2,
                      borderColor: speakingColor,
                      padding: 1,
                    }
                  : {
                      borderRadius: 999,
                      borderWidth: 2,
                      borderColor: 'transparent',
                      padding: 1,
                    }
              }
            >
              <Avatar
                name={name}
                src={member?.avatarUrl}
                size="xs"
                status="online"
              />
            </View>
            <Text
              size="xs"
              style={{
                color: isSpeaking ? speakingColor : themeColors.text.secondary,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {name}
            </Text>
            {/* Speaking indicator icon */}
            {isSpeaking && (
              <AudioWaveIcon size={12} color={speakingColor} />
            )}
          </View>
        );
      })}
    </View>
  );
}
