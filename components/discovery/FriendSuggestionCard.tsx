/**
 * FriendSuggestionCard - Show discovered friends from other platforms
 *
 * Displays a friend suggestion with platform info and action buttons.
 */

import React from 'react';
import { View, Pressable } from 'react-native';
import type { ViewStyle } from 'react-native';
import { HStack, VStack, Text, Button, Card, Avatar, Badge, useTheme } from '@coexist/wisp-react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { DiscoveryPlatform as Platform, FriendSuggestion } from '@umbra/service';

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

function UsersIcon({ size = 12, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

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

/**
 * Get the icon component for a platform.
 */
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

/**
 * Get the display name for a platform.
 */
function getPlatformName(platform: SearchablePlatform): string {
  switch (platform) {
    case 'discord':
      return 'Discord';
    case 'github':
      return 'GitHub';
    case 'steam':
      return 'Steam';
    case 'bluesky':
      return 'Bluesky';
    case 'xbox':
      return 'Xbox';
    case 'umbra':
      return 'Umbra';
    default:
      return platform;
  }
}

/**
 * Platform colors for branding.
 */
const PLATFORM_COLORS: Record<SearchablePlatform, string> = {
  discord: '#5865F2',
  github: '#24292F',
  steam: '#1b2838',
  bluesky: '#0085FF',
  xbox: '#107C10',
  umbra: '#6366f1',
};

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
  const { theme } = useTheme();

  // Safe fallback colors
  const textPrimary = theme?.colors?.text?.primary ?? '#1f2937';
  const textMuted = theme?.colors?.text?.muted ?? '#94a3b8';

  const platformBadgeStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: `${PLATFORM_COLORS[platform]}20`,
  };

  return (
    <Card variant="outlined" padding="md" style={style}>
      <HStack gap="md" style={{ alignItems: 'flex-start' }}>
        {/* Avatar */}
        <Avatar
          name={umbraUsername ?? platformUsername}
          size="lg"
        />

        {/* Content */}
        <VStack gap="sm" style={{ flex: 1 }}>
          {/* Name and platform badge */}
          <HStack gap="sm" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Text size="md" weight="semibold">
              {umbraUsername ?? platformUsername}
            </Text>

            <View style={platformBadgeStyle}>
              <PlatformIcon
                platform={platform}
                size={12}
                color={PLATFORM_COLORS[platform]}
              />
              <Text
                size="xs"
                weight="medium"
                style={{ color: PLATFORM_COLORS[platform] }}
              >
                {platformUsername}
              </Text>
            </View>
          </HStack>

          {/* Mutual servers/groups */}
          {mutualServers && mutualServers.length > 0 && (
            <HStack gap="xs" style={{ alignItems: 'center' }}>
              <UsersIcon size={12} color={textMuted} />
              <Text size="xs" color="muted">
                {mutualServers.length} mutual server
                {mutualServers.length > 1 ? 's' : ''}
              </Text>
            </HStack>
          )}

          {/* Discovery source */}
          <Text size="xs" color="muted">
            Found via {getPlatformName(platform)}
          </Text>
        </VStack>

        {/* Dismiss button */}
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            padding: 4,
          })}
          accessibilityLabel="Dismiss suggestion"
          accessibilityRole="button"
        >
          <XCloseIcon size={18} color={textMuted} />
        </Pressable>
      </HStack>

      {/* Action button */}
      <Button
        variant="secondary"
        size="sm"
        onPress={onAddFriend}
        disabled={adding}
        style={{ marginTop: 12 }}
        iconLeft={<UserPlusIcon size={16} color={textPrimary} />}
      >
        {adding ? 'Sending...' : 'Add Friend'}
      </Button>
    </Card>
  );
}

FriendSuggestionCard.displayName = 'FriendSuggestionCard';
