/**
 * VoiceAvatarCard -- Card component for voice-only calls.
 *
 * Displays a participant's avatar and display name with a speaking
 * indicator (SpeakerBorder glow) and an optional mute badge.
 *
 * Used inside JustifiedVideoGrid when `callType === 'voice'`.
 */

import React from 'react';
import { View } from 'react-native';
import { Avatar, Text, useTheme } from '@coexist/wisp-react-native';
import { MicOffIcon } from '@/components/ui';
import { SpeakerBorder } from '@/components/call/SpeakerBorder';
import type { CallParticipant } from '@/types/call';

// ── Props ────────────────────────────────────────────────────────────────────

interface VoiceAvatarCardProps {
  participant: CallParticipant;
  isSpeaking: boolean;
  /** Optional avatar URL (not yet on CallParticipant in all branches). */
  avatar?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function VoiceAvatarCard({ participant, isSpeaking, avatar }: VoiceAvatarCardProps) {
  const { theme } = useTheme();

  return (
    <SpeakerBorder active={isSpeaking} borderRadius={16}>
      <View
        accessibilityLabel={`${participant.displayName}${isSpeaking ? ', speaking' : ''}${participant.isMuted ? ', muted' : ''}`}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          borderRadius: 13, // inner radius = outer 16 - border 3
          backgroundColor: theme.colors.background.surface,
          minWidth: 160,
          position: 'relative',
        }}
      >
        {/* Avatar */}
        <Avatar
          name={participant.displayName}
          src={avatar}
          size="xl"
        />

        {/* Display name */}
        <Text
          size="sm"
          numberOfLines={1}
          style={{
            marginTop: 8,
            color: theme.colors.text.primary,
            textAlign: 'center',
          }}
        >
          {participant.displayName}
        </Text>

        {/* Mute indicator badge */}
        {participant.isMuted && (
          <View
            accessibilityLabel="Muted"
            style={{
              position: 'absolute',
              bottom: 32,
              right: 32,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: theme.colors.status.danger,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MicOffIcon size={12} color={theme.colors.text.inverse} />
          </View>
        )}
      </View>
    </SpeakerBorder>
  );
}
