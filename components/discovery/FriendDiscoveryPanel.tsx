/**
 * FriendDiscoveryPanel - Panel for friend discovery privacy settings
 *
 * Shows the discovery toggle and explanation.
 * This goes in the Privacy section.
 */

import React from 'react';
import type { ViewStyle } from 'react-native';
import { VStack, Text, Card } from '@coexist/wisp-react-native';

import { useLinkedAccounts, useDiscovery } from '@umbra/service';

import { DiscoveryToggle } from './DiscoveryToggle';

export interface FriendDiscoveryPanelProps {
  /** The user's Umbra DID. */
  did: string | null;
  /** Custom style for the container. */
  style?: ViewStyle;
}

export function FriendDiscoveryPanel({ did, style }: FriendDiscoveryPanelProps) {
  const { accounts } = useLinkedAccounts(did);

  const {
    discoverable,
    isLoading: isUpdatingDiscovery,
    setDiscoverability,
  } = useDiscovery(did);

  if (!did) {
    return (
      <Card variant="outlined" padding="lg" style={style}>
        <Text size="sm" color="tertiary" style={{ textAlign: 'center' }}>
          Sign in to manage discovery settings
        </Text>
      </Card>
    );
  }

  return (
    <VStack gap="md" style={style}>
      {/* Discovery toggle */}
      <DiscoveryToggle
        enabled={discoverable}
        onToggle={setDiscoverability}
        disabled={isUpdatingDiscovery || accounts.length === 0}
      />

      {/* Hint if no accounts linked */}
      {accounts.length === 0 && (
        <Text size="xs" color="tertiary" style={{ textAlign: 'center' }}>
          Link accounts in your Profile to enable friend discovery.
        </Text>
      )}
    </VStack>
  );
}

FriendDiscoveryPanel.displayName = 'FriendDiscoveryPanel';
