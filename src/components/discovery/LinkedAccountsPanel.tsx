/**
 * LinkedAccountsPanel - Panel for managing linked platform accounts
 *
 * Displays linked accounts and buttons to link new ones.
 * This goes in the Profile/Identity section.
 */

import React, { useCallback, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { VStack, HStack, Text, Card, Alert, Spinner, useTheme } from '@coexist/wisp-react-native';
import Svg, { Path } from 'react-native-svg';

import { useLinkedAccounts, useDiscovery } from '@umbra/service';
import type { DiscoveryPlatform as Platform } from '@umbra/service';

import { LinkedAccountCard } from './LinkedAccountCard';
import { LinkAccountButton } from './LinkAccountButton';
import { DiscoveryOptInDialog } from './DiscoveryOptInDialog';

// Icon component
function LinkIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Svg>
  );
}

export interface LinkedAccountsPanelProps {
  /** The user's Umbra DID. */
  did: string | null;
  /** Custom style for the container. */
  style?: ViewStyle;
}

export function LinkedAccountsPanel({ did, style }: LinkedAccountsPanelProps) {
  const { theme } = useTheme();
  const textMuted = theme?.colors?.text?.muted ?? '#94a3b8';

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
  } = useLinkedAccounts(did);

  const {
    discoverable,
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

LinkedAccountsPanel.displayName = 'LinkedAccountsPanel';
