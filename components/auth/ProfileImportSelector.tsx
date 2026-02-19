/**
 * ProfileImportSelector - Import profile via OAuth
 *
 * Allows users to import their profile (username, avatar) from
 * external platforms via OAuth login.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Pressable, Platform, Linking } from 'react-native';
import {
  VStack,
  HStack,
  Text,
  Card,
  Button,
  Spinner,
  Alert,
  Avatar,
  useTheme,
} from '@coexist/wisp-react-native';
import Svg, { Path } from 'react-native-svg';

// Types
export type ImportPlatform = 'discord' | 'github' | 'steam' | 'bluesky';

export interface ImportedProfile {
  platform: ImportPlatform;
  platform_id: string;
  display_name: string;
  username: string;
  avatar_url?: string;
  avatar_base64?: string;
  avatar_mime?: string;
  bio?: string;
  email?: string;
}

// Normalized profile for app use
export interface NormalizedProfile {
  platform: ImportPlatform;
  platformId: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  avatarBase64?: string;
  avatarMime?: string;
  bio?: string;
  email?: string;
}

export interface ProfileImportSelectorProps {
  /** Called when profile is successfully imported */
  onProfileImported: (profile: NormalizedProfile) => void;
  /** Called when user skips import */
  onSkip?: () => void;
  /** Relay URL for OAuth */
  relayUrl?: string;
  /** Show compact view */
  compact?: boolean;
}

// Normalize snake_case API response to camelCase
function normalizeProfile(profile: ImportedProfile): NormalizedProfile {
  return {
    platform: profile.platform,
    platformId: profile.platform_id,
    displayName: profile.display_name,
    username: profile.username,
    avatarUrl: profile.avatar_url,
    avatarBase64: profile.avatar_base64,
    avatarMime: profile.avatar_mime,
    bio: profile.bio,
    email: profile.email,
  };
}

// Platform configurations
const PLATFORMS: {
  id: ImportPlatform;
  name: string;
  color: string;
  darkColor: string;
  description: string;
}[] = [
  {
    id: 'discord',
    name: 'Discord',
    color: '#5865F2',
    darkColor: '#5865F2',
    description: 'Import your Discord username and avatar',
  },
  {
    id: 'github',
    name: 'GitHub',
    color: '#24292e',
    darkColor: '#f0f6fc',
    description: 'Import your GitHub profile and avatar',
  },
  {
    id: 'steam',
    name: 'Steam',
    color: '#1b2838',
    darkColor: '#66c0f4',
    description: 'Import your Steam username and avatar',
  },
  {
    id: 'bluesky',
    name: 'Bluesky',
    color: '#0085FF',
    darkColor: '#0085FF',
    description: 'Import your Bluesky profile and avatar',
  },
];

// Platform icons
function DiscordIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </Svg>
  );
}

function GitHubIcon({ size = 24, color }: { size?: number; color: string }) {
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

function PlatformIcon({ platform, size = 24, color }: { platform: ImportPlatform; size?: number; color: string }) {
  switch (platform) {
    case 'discord':
      return <DiscordIcon size={size} color={color} />;
    case 'github':
      return <GitHubIcon size={size} color={color} />;
    case 'steam':
      return <SteamIcon size={size} color={color} />;
    case 'bluesky':
      return <BlueskyIcon size={size} color={color} />;
    default:
      return null;
  }
}

function LoginIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <Path d="M10 17l5-5-5-5" />
      <Path d="M15 12H3" />
    </Svg>
  );
}

const DEFAULT_RELAY_URL = process.env.EXPO_PUBLIC_RELAY_URL || 'https://relay.umbra.chat';

export function ProfileImportSelector({
  onProfileImported,
  onSkip,
  relayUrl = DEFAULT_RELAY_URL,
  compact = false,
}: ProfileImportSelectorProps) {
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const [status, setStatus] = useState<'idle' | 'connecting' | 'fetching' | 'success' | 'error'>('idle');
  const [selectedPlatform, setSelectedPlatform] = useState<ImportPlatform | null>(null);
  const [importedProfile, setImportedProfile] = useState<NormalizedProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);

  // Listen for postMessage from OAuth popup
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleMessage = (event: MessageEvent) => {
      // Validate message structure
      if (!event.data || event.data.type !== 'UMBRA_PROFILE_IMPORT') {
        return;
      }

      console.log('[ProfileImport] Received message:', event.data);

      if (event.data.success && event.data.profile) {
        const normalized = normalizeProfile(event.data.profile);
        setImportedProfile(normalized);
        setStatus('success');
        // Auto-call onProfileImported
        onProfileImported(normalized);
      } else if (event.data.error) {
        setError(event.data.error);
        setStatus('error');
      }

      // Close popup if still open
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      popupRef.current = null;
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onProfileImported]);

  const handlePlatformPress = useCallback(async (platform: ImportPlatform) => {
    setSelectedPlatform(platform);
    setError(null);
    setStatus('connecting');

    try {
      // Start OAuth flow via relay
      const response = await fetch(`${relayUrl}/profile/import/${platform}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to start ${platform} login`);
      }

      const data = await response.json();

      if (data.redirect_url) {
        setStatus('fetching');

        if (Platform.OS === 'web') {
          // Open OAuth URL in popup
          const width = 500;
          const height = 700;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;

          popupRef.current = window.open(
            data.redirect_url,
            'umbra_oauth_popup',
            `width=${width},height=${height},left=${left},top=${top},popup=yes`
          );

          // Check if popup was blocked
          if (!popupRef.current) {
            throw new Error('Popup was blocked. Please allow popups for this site.');
          }

          // Poll to detect if popup was closed without completing
          const pollInterval = setInterval(() => {
            if (popupRef.current && popupRef.current.closed) {
              clearInterval(pollInterval);
              // Only reset if we haven't received a successful message
              if (status === 'fetching') {
                setStatus('idle');
                setSelectedPlatform(null);
              }
            }
          }, 500);
        } else {
          // For native, use Linking
          await Linking.openURL(data.redirect_url);
          // Native flow would use deep links to return
          setStatus('idle');
        }
      }
    } catch (err: any) {
      console.error('[ProfileImport] Error:', err);
      setError(err.message || 'Failed to connect');
      setStatus('error');
    }
  }, [relayUrl, status]);

  const handleRetry = useCallback(() => {
    setStatus('idle');
    setSelectedPlatform(null);
    setError(null);
    setImportedProfile(null);
  }, []);

  const handleUseProfile = useCallback(() => {
    if (importedProfile) {
      onProfileImported(importedProfile);
    }
  }, [importedProfile, onProfileImported]);

  // Show loading state
  if (status === 'connecting' || status === 'fetching') {
    return (
      <Card variant="outlined" padding="lg">
        <VStack gap="md" style={{ alignItems: 'center' }}>
          <Spinner size="md" />
          <Text size="sm" color="muted">
            {status === 'connecting' ? 'Connecting...' : 'Complete login in popup...'}
          </Text>
          {status === 'fetching' && (
            <Button variant="ghost" size="sm" onPress={handleRetry}>
              Cancel
            </Button>
          )}
        </VStack>
      </Card>
    );
  }

  // Show imported profile
  if (status === 'success' && importedProfile) {
    return (
      <VStack gap="md">
        <Card variant="outlined" padding="md">
          <HStack gap="md" style={{ alignItems: 'center' }}>
            {importedProfile.avatarBase64 ? (
              <Avatar
                source={{ uri: `data:${importedProfile.avatarMime || 'image/png'};base64,${importedProfile.avatarBase64}` }}
                size="lg"
              />
            ) : importedProfile.avatarUrl ? (
              <Avatar source={{ uri: importedProfile.avatarUrl }} size="lg" />
            ) : (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: theme.colors.bg.tertiary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text size="lg" weight="bold">
                  {importedProfile.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <VStack gap="xs" style={{ flex: 1 }}>
              <Text weight="semibold">{importedProfile.displayName}</Text>
              {importedProfile.bio && (
                <Text size="xs" color="muted" numberOfLines={2}>
                  {importedProfile.bio}
                </Text>
              )}
              <HStack gap="xs" style={{ alignItems: 'center' }}>
                <PlatformIcon platform={importedProfile.platform} size={12} color={theme.colors.text.muted} />
                <Text size="xs" color="muted">
                  {importedProfile.username}
                </Text>
              </HStack>
            </VStack>
          </HStack>
        </Card>

        <HStack gap="sm">
          <Button variant="ghost" size="sm" onPress={handleRetry}>
            Change
          </Button>
          <Button size="sm" onPress={handleUseProfile} style={{ flex: 1 }}>
            Use this profile
          </Button>
        </HStack>
      </VStack>
    );
  }

  // Show error state
  if (status === 'error') {
    return (
      <VStack gap="md">
        <Alert variant="danger">
          {error || 'Failed to import profile'}
        </Alert>
        <Button variant="ghost" size="sm" onPress={handleRetry}>
          Try again
        </Button>
      </VStack>
    );
  }

  // Show platform selection
  return (
    <VStack gap="md">
      <VStack gap="xs">
        <Text size="sm" weight="semibold" color="secondary">
          Import your profile
        </Text>
        <Text size="xs" color="muted">
          Bring your profile from another platform. Select a platform to login and import your details.
        </Text>
      </VStack>

      <VStack gap="sm">
        {PLATFORMS.map((platform) => {
          const platformColor = isDark ? platform.darkColor : platform.color;
          return (
            <Pressable
              key={platform.id}
              onPress={() => handlePlatformPress(platform.id)}
            >
              {({ pressed }) => (
                <Card
                  variant="outlined"
                  padding="md"
                  style={{
                    opacity: pressed ? 0.8 : 1,
                    borderColor: theme.colors.border.subtle,
                  }}
                >
                  <HStack gap="md" style={{ alignItems: 'center' }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: `${platformColor}15`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PlatformIcon platform={platform.id} size={24} color={platformColor} />
                    </View>

                    <VStack gap="xs" style={{ flex: 1 }}>
                      <Text size="md" weight="semibold">
                        Continue with {platform.name}
                      </Text>
                      <Text size="xs" color="muted">
                        {platform.description}
                      </Text>
                    </VStack>

                    <LoginIcon size={18} color={theme.colors.text.muted} />
                  </HStack>
                </Card>
              )}
            </Pressable>
          );
        })}
      </VStack>

      {onSkip && (
        <Button variant="ghost" size="sm" onPress={onSkip}>
          Skip and enter manually
        </Button>
      )}
    </VStack>
  );
}

ProfileImportSelector.displayName = 'ProfileImportSelector';
