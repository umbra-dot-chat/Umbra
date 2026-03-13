/**
 * FriendSuggestionCard - Compact single-row search result for adding friends.
 */

import React from 'react';
import { Pressable } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Box, Text, Button, Avatar, useTheme } from '@coexist/wisp-react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { DiscoveryPlatform as Platform, FriendSuggestion } from '@umbra/service';
import { dbg } from '@/utils/debug';

/** Extended platform type that includes Umbra itself for username search. */
type SearchablePlatform = Platform | 'umbra';

// Icon components
function GithubIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <Path d="M9 18c-4.51 2-5-2-7-2" />
    </Svg>
  );
}

function DiscordIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

function UserPlusIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <Circle cx={8.5} cy={7} r={4} />
      <Path d="M20 8v6" />
      <Path d="M23 11h-6" />
    </Svg>
  );
}

function XCloseIcon({ size = 18, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18" />
      <Path d="M6 6l12 12" />
    </Svg>
  );
}

function UmbraIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <Path d="M12 16v-4" />
      <Path d="M12 8h.01" />
    </Svg>
  );
}

function PlatformIcon({
  platform,
  size = 16,
  color,
}: {
  platform: SearchablePlatform;
  size?: number;
  color: string;
}) {
  switch (platform) {
    case 'discord':
      return <DiscordIcon size={size} color={color} />;
    case 'github':
      return <GithubIcon size={size} color={color} />;
    case 'umbra':
      return <UmbraIcon size={size} color={color} />;
    default:
      return null;
  }
}

/** Platform colors for branding. */
const PLATFORM_COLORS: Record<SearchablePlatform, string> = {
  discord: '#5865F2',
  github: '#24292F',
  steam: '#1b2838',
  bluesky: '#0085FF',
  xbox: '#107C10',
  umbra: '#6366f1',
};

export interface FriendSuggestionCardProps {
  /** The suggested friend's Umbra DID. */
  umbraDid: string;
  /** The suggested friend's Umbra username (if known). */
  umbraUsername?: string;
  /** The platform where they were found (includes 'umbra' for username search). */
  platform: SearchablePlatform;
  /** Their username on that platform. */
  platformUsername: string;
  /** Optional mutual servers/groups. */
  mutualServers?: string[];
  /** Called when user wants to add this friend. */
  onAddFriend: () => void;
  /** Called when user wants to dismiss this suggestion. */
  onDismiss: () => void;
  /** Whether the add friend action is in progress. */
  adding?: boolean;
  /** Custom style for the container. */
  style?: ViewStyle;
}

export function FriendSuggestionCard({
  umbraDid,
  umbraUsername,
  platform,
  platformUsername,
  mutualServers,
  onAddFriend,
  onDismiss,
  adding = false,
  style,
}: FriendSuggestionCardProps) {
  if (__DEV__) dbg.trackRender('FriendSuggestionCard');
  const { theme } = useTheme();
  const textMuted = theme?.colors?.text?.muted ?? '#94a3b8';
  const displayName = umbraUsername ?? platformUsername;

  return (
    <Box
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 6,
        paddingHorizontal: 10,
        ...style,
      }}
    >
      {/* Avatar */}
      <Avatar name={displayName} size="sm" />

      {/* Name + platform badge */}
      <Box style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <Text size="sm" weight="medium" numberOfLines={1} style={{ flexShrink: 1 }}>
          {displayName}
        </Text>

        <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: `${PLATFORM_COLORS[platform]}18`, flexShrink: 0 }}>
          <PlatformIcon platform={platform} size={10} color={PLATFORM_COLORS[platform]} />
          <Text size="xs" weight="medium" style={{ color: PLATFORM_COLORS[platform] }}>
            {platform !== 'umbra' ? platformUsername : 'Umbra'}
          </Text>
        </Box>
      </Box>

      {/* Add button */}
      <Button
        variant="secondary"
        size="xs"
        onPress={onAddFriend}
        disabled={adding}
        iconLeft={<UserPlusIcon size={12} color={theme?.colors?.text?.primary ?? '#1f2937'} />}
      >
        {adding ? 'Sending...' : 'Add'}
      </Button>

      {/* Dismiss */}
      <Pressable
        onPress={onDismiss}
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 2 })}
        accessibilityLabel="Dismiss"
        accessibilityRole="button"
      >
        <XCloseIcon size={14} color={textMuted} />
      </Pressable>
    </Box>
  );
}

FriendSuggestionCard.displayName = 'FriendSuggestionCard';
