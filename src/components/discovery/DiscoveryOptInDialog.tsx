/**
 * DiscoveryOptInDialog - Prompt to enable friend discovery after linking an account
 *
 * Shown after a successful account link when the user hasn't enabled discovery yet.
 * Explains the feature and lets them opt in immediately.
 */

import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Dialog, Button, Text, HStack, VStack, Separator, useTheme } from '@coexist/wisp-react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function UsersIcon({ size = 40, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <Path d="m9 12 2 2 4-4" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscoveryOptInDialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the dialog should close. */
  onClose: () => void;
  /** The platform that was just linked (for the success message). */
  platform: string;
  /** Called when the user opts in to discovery. */
  onEnableDiscovery: () => Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPlatformName(platform: string): string {
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DiscoveryOptInDialog({
  open,
  onClose,
  platform,
  onEnableDiscovery,
}: DiscoveryOptInDialogProps) {
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const [enabling, setEnabling] = useState(false);

  const successColor = theme?.colors?.status?.success ?? '#22c55e';
  const mutedColor = theme?.colors?.text?.muted ?? (isDark ? '#71717a' : '#94a3b8');

  const handleEnable = useCallback(async () => {
    setEnabling(true);
    try {
      await onEnableDiscovery();
      onClose();
    } catch {
      // If it fails the discovery hook will surface the error in settings
      onClose();
    } finally {
      setEnabling(false);
    }
  }, [onEnableDiscovery, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Enable Friend Discovery?"
      size="sm"
      footer={
        <>
          <Button variant="tertiary" onPress={onClose} disabled={enabling}>
            Not Now
          </Button>
          <Button variant="primary" onPress={handleEnable} disabled={enabling}>
            {enabling ? 'Enabling...' : 'Enable Discovery'}
          </Button>
        </>
      }
    >
      <VStack gap="md">
        {/* Hero icon */}
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: `${successColor}15`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UsersIcon size={32} color={successColor} />
          </View>
        </View>

        {/* Description */}
        <Text size="sm" style={{ color: theme.colors.text.secondary, textAlign: 'center' }}>
          Your {getPlatformName(platform)} account is linked! Enable friend discovery so your{' '}
          {getPlatformName(platform)} friends can find you on Umbra.
        </Text>

        {/* Privacy note */}
        <Separator spacing="sm" />
        <HStack gap="sm" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheckIcon size={14} color={mutedColor} />
          <Text size="xs" color="tertiary">
            Your platform IDs are hashed for privacy
          </Text>
        </HStack>
      </VStack>
    </Dialog>
  );
}

DiscoveryOptInDialog.displayName = 'DiscoveryOptInDialog';
