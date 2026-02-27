/**
 * LinkedAccountCard - Display a linked platform account
 *
 * Shows the linked account with platform icon, username, and unlink button.
 */

import React, { useMemo } from 'react';
import { View, Pressable } from 'react-native';
import type { ViewStyle } from 'react-native';
import { HStack, VStack, Text, Card, useTheme } from '@coexist/wisp-react-native';
import Svg, { Path } from 'react-native-svg';

import type { DiscoveryPlatform as Platform } from '@umbra/service';

// Platform icons (filled brand logos — same as LinkAccountButton)
function DiscordIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </Svg>
  );
}

function GithubIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </Svg>
  );
}

function SteamIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z" />
    </Svg>
  );
}

function BlueskyIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 568 501" fill={color}>
      <Path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 49.341c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 473.333 453.32c-119.86 122.992-172.272-30.859-185.702-70.281-2.462-7.227-3.614-10.608-3.631-7.733-.017-2.875-1.169.506-3.631 7.733-13.43 39.422-65.842 193.273-185.702 70.281-63.111-64.76-33.89-129.52 80.986-157.676-65.72 11.185-139.6-7.295-159.875-79.748C10.045 195.054 0 66.687 0 49.341 0-28.906 76.134-1.611 123.121 33.664z" />
    </Svg>
  );
}

function XboxIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M4.102 21.033A11.947 11.947 0 0 0 12 24a11.947 11.947 0 0 0 7.898-2.967c1.857-1.627.374-5.312-2.268-8.627-2.039-2.555-4.26-4.442-5.63-5.29-1.37.848-3.591 2.735-5.63 5.29-2.642 3.315-4.125 7-2.268 8.627zM12 2.508c1.464.828 5.527 3.906 8.674 8.295 1.16 1.618 3.397 5.453 1.934 8.2A11.96 11.96 0 0 0 24 12c0-6.627-5.373-12-12-12S0 5.373 0 12a11.96 11.96 0 0 0 1.392 5.603c-1.463-2.747.774-6.582 1.934-8.2C6.473 6.014 10.536 3.336 12 2.508z" />
    </Svg>
  );
}

function XCloseIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18" />
      <Path d="M6 6l12 12" />
    </Svg>
  );
}

export interface LinkedAccountCardProps {
  /** The platform (discord or github). */
  platform: Platform;
  /** The username on that platform. */
  username: string;
  /** When the account was linked (Date, timestamp, or ISO string). */
  linkedAt: Date | number | string;
  /** Called when user wants to unlink this account. */
  onUnlink?: () => void;
  /** Whether an unlink operation is in progress. */
  unlinking?: boolean;
  /** Custom style for the container. */
  style?: ViewStyle;
}

/**
 * Get the icon component for a platform.
 */
function PlatformIcon({
  platform,
  size = 24,
  color,
}: {
  platform: Platform;
  size?: number;
  color: string;
}) {
  switch (platform) {
    case 'discord':
      return <DiscordIcon size={size} color={color} />;
    case 'github':
      return <GithubIcon size={size} color={color} />;
    case 'steam':
      return <SteamIcon size={size} color={color} />;
    case 'bluesky':
      return <BlueskyIcon size={size} color={color} />;
    case 'xbox':
      return <XboxIcon size={size} color={color} />;
    default:
      return null;
  }
}

/**
 * Get the display name for a platform.
 */
function getPlatformName(platform: Platform): string {
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
    default:
      return platform;
  }
}

/**
 * Format a date for display.
 */
function formatDate(date: Date | number | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Platform colors - light and dark mode variants
const PLATFORM_COLORS: Record<Platform, { light: string; dark: string }> = {
  discord: { light: '#5865F2', dark: '#5865F2' },
  github: { light: '#24292e', dark: '#f0f6fc' },
  steam: { light: '#1b2838', dark: '#66c0f4' },
  bluesky: { light: '#0085FF', dark: '#0085FF' },
  xbox: { light: '#107C10', dark: '#107C10' },
};

export function LinkedAccountCard({
  platform,
  username,
  linkedAt,
  onUnlink,
  unlinking = false,
  style,
}: LinkedAccountCardProps) {
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';

  const textMuted = theme?.colors?.text?.muted ?? (isDark ? '#71717a' : '#94a3b8');

  const platformColor = isDark
    ? (PLATFORM_COLORS[platform]?.dark ?? textMuted)
    : (PLATFORM_COLORS[platform]?.light ?? textMuted);

  const iconBgStyle = useMemo<ViewStyle>(
    () => ({
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: `${platformColor}20`,
      alignItems: 'center',
      justifyContent: 'center',
    }),
    [platformColor]
  );

  return (
    <Card variant="outlined" padding="md" style={style}>
      <HStack gap="md" style={{ alignItems: 'center' }}>
        {/* Platform icon */}
        <View style={iconBgStyle}>
          <PlatformIcon platform={platform} size={24} color={platformColor} />
        </View>

        {/* Account info */}
        <VStack gap="xs" style={{ flex: 1 }}>
          <Text size="md" weight="semibold">
            {username}
          </Text>
          <Text size="xs" color="tertiary">
            {getPlatformName(platform)} · Linked {formatDate(linkedAt)}
          </Text>
        </VStack>

        {/* Unlink button */}
        {onUnlink && (
          <Pressable
            onPress={onUnlink}
            disabled={unlinking}
            style={({ pressed }) => ({
              opacity: pressed || unlinking ? 0.5 : 1,
              padding: 8,
            })}
            accessibilityLabel={`Unlink ${getPlatformName(platform)} account`}
            accessibilityRole="button"
          >
            <XCloseIcon size={20} color={textMuted} />
          </Pressable>
        )}
      </HStack>
    </Card>
  );
}

LinkedAccountCard.displayName = 'LinkedAccountCard';
