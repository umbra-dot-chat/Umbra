/**
 * DiscoveryToggle - Opt-in/out toggle for discoverability
 *
 * Toggle component with explanation text for the discovery feature.
 */

import React from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { HStack, VStack, Text, Card, Toggle, Separator, useTheme } from '@coexist/wisp-react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// Icon components
function EyeIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <Circle cx={12} cy={12} r={3} />
    </Svg>
  );
}

function EyeOffIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <Path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <Path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <Path d="m2 2 20 20" />
    </Svg>
  );
}

function ShieldIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </Svg>
  );
}

export interface DiscoveryToggleProps {
  /** Whether discovery is enabled. */
  enabled: boolean;
  /** Called when the toggle is changed. */
  onToggle: (enabled: boolean) => void;
  /** Optional custom description. */
  description?: string;
  /** Whether the toggle is disabled (e.g., during loading). */
  disabled?: boolean;
  /** Custom style for the container. */
  style?: ViewStyle;
}

export function DiscoveryToggle({
  enabled,
  onToggle,
  description,
  disabled = false,
  style,
}: DiscoveryToggleProps) {
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';

  const successColor = theme?.colors?.status?.success ?? '#22c55e';
  const mutedColor = theme?.colors?.text?.muted ?? (isDark ? '#71717a' : '#94a3b8');

  const iconBgStyle: ViewStyle = {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: enabled
      ? `${successColor}20`
      : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(148, 163, 184, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const defaultDescription = enabled
    ? 'Friends from other platforms can find you on Umbra using your linked accounts.'
    : 'Your linked accounts are private. Enable discovery to let friends find you.';

  return (
    <Card variant="outlined" padding="md" style={style}>
      <HStack gap="md" style={{ alignItems: 'flex-start' }}>
        {/* Icon */}
        <View style={iconBgStyle}>
          {enabled ? (
            <EyeIcon size={24} color={successColor} />
          ) : (
            <EyeOffIcon size={24} color={mutedColor} />
          )}
        </View>

        {/* Content */}
        <VStack gap="sm" style={{ flex: 1 }}>
          <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text size="md" weight="semibold">
              Friend Discovery
            </Text>

            <Toggle
              checked={enabled}
              onChange={() => onToggle(!enabled)}
              disabled={disabled}
            />
          </HStack>

          <Text size="xs" color="tertiary">
            {description ?? defaultDescription}
          </Text>
        </VStack>
      </HStack>

      {/* Privacy note */}
      <Separator spacing="sm" style={{ marginTop: 12 }} />
      <HStack gap="sm" style={{ alignItems: 'center', marginTop: 12 }}>
        <ShieldIcon size={14} color={mutedColor} />
        <Text size="xs" color="tertiary">
          Your platform IDs are hashed for privacy
        </Text>
      </HStack>
    </Card>
  );
}

DiscoveryToggle.displayName = 'DiscoveryToggle';
