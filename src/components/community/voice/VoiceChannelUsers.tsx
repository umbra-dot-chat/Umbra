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

import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Avatar, Text, useTheme, Box } from '@coexist/wisp-react-native';
import { AudioWaveIcon } from '@/components/ui';
import type { CommunityMember } from '@umbra/service';
import { dbg } from '@/utils/debug';

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
  /** Maximum visible participants before showing "+N more" (default 5). */
  maxVisible?: number;
}

/** Animated sound bars — replaces static AudioWaveIcon when speaking. */
function SoundBars({ color, size = 12 }: { color: string; size?: number }) {
  const bars = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.6)).current,
    useRef(new Animated.Value(0.4)).current,
    useRef(new Animated.Value(0.7)).current,
  ];

  useEffect(() => {
    const animations = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: 0.3 + Math.random() * 0.7,
            duration: 200 + i * 80,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: 0.2 + Math.random() * 0.3,
            duration: 250 + i * 60,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  const barWidth = Math.max(2, size / 5);
  const gap = 1;

  return (
    <Box style={{ flexDirection: 'row', alignItems: 'flex-end', height: size, gap }}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={{
            width: barWidth,
            borderRadius: barWidth / 2,
            backgroundColor: color,
            height: bar.interpolate({
              inputRange: [0, 1],
              outputRange: [2, size],
            }),
          }}
        />
      ))}
    </Box>
  );
}

export function VoiceChannelUsers({
  participantDids,
  members,
  myDid,
  myDisplayName,
  speakingDids,
  maxVisible = 5,
}: VoiceChannelUsersProps) {
  if (__DEV__) dbg.trackRender('VoiceChannelUsers');
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

  // Limit visible participants and compute overflow count
  const overflow = sorted.length > maxVisible ? sorted.length - maxVisible : 0;
  const visibleParticipants = overflow > 0 ? sorted.slice(0, maxVisible) : sorted;

  return (
    <Box style={{ paddingLeft: 36, paddingRight: 8, paddingBottom: 2 }}>
      {visibleParticipants.map((did) => {
        const isMe = did === myDid;
        const member = memberMap.get(did);
        const name = isMe
          ? myDisplayName ?? member?.name ?? 'You'
          : member?.name ?? did.slice(0, 16) + '...';
        const isSpeaking = speakingDids?.has(did) ?? false;

        return (
          <Box
            key={did}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 3,
            }}
          >
            {/* Avatar with green ring when speaking */}
            <Box
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
            </Box>
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
            {/* Speaking indicator — animated sound bars */}
            {isSpeaking && (
              <SoundBars size={12} color={speakingColor} />
            )}
          </Box>
        );
      })}
      {overflow > 0 && (
        <Box
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 3,
            paddingLeft: 4,
          }}
        >
          <Text
            size="xs"
            style={{ color: themeColors.text.muted }}
          >
            +{overflow} more
          </Text>
        </Box>
      )}
    </Box>
  );
}
