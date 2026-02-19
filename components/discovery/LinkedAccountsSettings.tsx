/**
 * LinkedAccountsSettings - Settings panel for linked accounts and discovery
 *
 * Displays linked accounts, link buttons, and discovery toggle.
 */

import React, { useCallback, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { VStack, HStack, Text, Card, Alert, Spinner, useTheme } from '@coexist/wisp-react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useLinkedAccounts, useDiscovery } from '@umbra/service';
import type { DiscoveryPlatform as Platform } from '@umbra/service';

import { LinkedAccountCard } from './LinkedAccountCard';
import { LinkAccountButton } from './LinkAccountButton';
import { DiscoveryToggle } from './DiscoveryToggle';
import { DiscoveryOptInDialog } from './DiscoveryOptInDialog';

// Icon components
function LinkIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Svg>
  );
}

function UsersIcon({ size = 18, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

export interface LinkedAccountsSettingsProps {
  /** The user's Umbra DID. */
  did: string | null;
  /** Custom style for the container. */
  style?: ViewStyle;
}

export function LinkedAccountsSettings({ did, style }: LinkedAccountsSettingsProps) {
  const { theme } = useTheme();

  const textPrimary = theme?.colors?.text?.primary ?? '#fafafa';
  const textMuted = theme?.colors?.text?.muted ?? '#71717a';

  const {
    accounts,
    isLoading: isLinking,
    error: linkError,
    linkDiscord,
    linkGitHub,
    linkSteam,
    linkBluesky,
    // linkXbox, // Xbox disabled until credentials configured
    unlinkAccount,
    refresh,
  } = useLinkedAccounts(did);

  const {
    discoverable,
    isLoading: isUpdatingDiscovery,
    setDiscoverability,
  } = useDiscovery(did);

  // Discovery opt-in dialog state
  const [optInPlatform, setOptInPlatform] = useState<Platform | null>(null);

  // Check which platforms are linked
  const hasDiscord = accounts.some((a) => a.platform === 'discord');
  const hasGitHub = accounts.some((a) => a.platform === 'github');
  const hasSteam = accounts.some((a) => a.platform === 'steam');
  const hasBluesky = accounts.some((a) => a.platform === 'bluesky');

  // Wrap a link function to show the discovery opt-in dialog on success
  const withOptIn = useCallback(
    (platform: Platform, linkFn: () => Promise<boolean>) => async () => {
      const success = await linkFn();
      if (success && !discoverable) {
        setOptInPlatform(platform);
      }
    },
    [discoverable]
  );

  // Handle unlink with confirmation
  const handleUnlink = useCallback(
    async (platform: Platform) => {
      await unlinkAccount(platform);
    },
    [unlinkAccount]
  );

  if (!did) {
    return (
      <Card variant="outlined" padding="lg" style={style}>
        <Text size="sm" color="tertiary" style={{ textAlign: 'center' }}>
          Sign in to manage linked accounts
        </Text>
      </Card>
    );
  }

  return (
    <VStack gap="lg" style={style}>
      {/* Section header */}
      <VStack gap="xs">
        <HStack gap="sm" style={{ alignItems: 'center' }}>
          <UsersIcon size={18} color={textPrimary} />
          <Text size="md" weight="semibold">
            Friend Discovery
          </Text>
        </HStack>
        <Text size="xs" color="tertiary">
          Link your accounts from other platforms so friends can find you on Umbra.
        </Text>
      </VStack>

      {/* Discovery toggle */}
      <DiscoveryToggle
        enabled={discoverable}
        onToggle={setDiscoverability}
        disabled={isUpdatingDiscovery || accounts.length === 0}
      />

      {/* Linked accounts */}
      {accounts.length > 0 && (
        <VStack gap="md">
          <HStack gap="sm" style={{ alignItems: 'center' }}>
            <LinkIcon size={14} color={textMuted} />
            <Text
              size="xs"
              weight="medium"
              color="tertiary"
              style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              Linked Accounts
            </Text>
          </HStack>

          {accounts.map((account) => (
            <LinkedAccountCard
              key={account.platform}
              platform={account.platform}
              username={account.username}
              linkedAt={account.linkedAt}
              onUnlink={() => handleUnlink(account.platform)}
              unlinking={isLinking}
            />
          ))}
        </VStack>
      )}

      {/* Link account buttons */}
      <VStack gap="md">
        {!hasDiscord && (
          <LinkAccountButton
            platform="discord"
            onPress={withOptIn('discord', linkDiscord)}
            loading={isLinking}
          />
        )}
        {!hasGitHub && (
          <LinkAccountButton
            platform="github"
            onPress={withOptIn('github', linkGitHub)}
            loading={isLinking}
          />
        )}
        {!hasSteam && (
          <LinkAccountButton
            platform="steam"
            onPress={withOptIn('steam', linkSteam)}
            loading={isLinking}
          />
        )}
        {!hasBluesky && (
          <LinkAccountButton
            platform="bluesky"
            onPress={withOptIn('bluesky', linkBluesky)}
            loading={isLinking}
          />
        )}
      </VStack>

      {/* Error display */}
      {linkError && (
        <Alert variant="danger">
          {linkError.message}
        </Alert>
      )}

      {/* Loading indicator */}
      {isLinking && (
        <HStack gap="sm" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Spinner size="sm" />
          <Text size="xs" color="tertiary">
            Loading...
          </Text>
        </HStack>
      )}

      {/* Discovery opt-in dialog (shown after successful link) */}
      <DiscoveryOptInDialog
        open={optInPlatform !== null}
        onClose={() => setOptInPlatform(null)}
        platform={optInPlatform ?? 'discord'}
        onEnableDiscovery={() => setDiscoverability(true)}
      />
    </VStack>
  );
}

LinkedAccountsSettings.displayName = 'LinkedAccountsSettings';
