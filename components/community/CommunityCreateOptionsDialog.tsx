/**
 * @module CommunityCreateOptionsDialog
 * @description Dialog that lets users choose how to create a community:
 * - Create from scratch (name, description)
 * - Import from Discord (OAuth flow)
 */

import React, { useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Dialog, Button, Text, useTheme } from '@coexist/wisp-react-native';
import { defaultSpacing, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function PlusCircleIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="8" x2="12" y2="16" />
      <Line x1="8" y1="12" x2="16" y2="12" />
    </Svg>
  );
}

function DiscordIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </Svg>
  );
}

function ChevronRightIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="9,18 15,12 9,6" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreateOption = 'scratch' | 'discord';

export interface CommunityCreateOptionsDialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the dialog should close. */
  onClose: () => void;
  /** Called when user selects "Create from scratch". */
  onSelectScratch: () => void;
  /** Called when user selects "Import from Discord". */
  onSelectDiscord: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommunityCreateOptionsDialog({
  open,
  onClose,
  onSelectScratch,
  onSelectDiscord,
}: CommunityCreateOptionsDialogProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const options = [
    {
      id: 'scratch' as const,
      title: 'Create from Scratch',
      description: 'Start fresh with a new community. Add channels and roles later.',
      icon: PlusCircleIcon,
      iconBg: tc.accent.primary,
      onPress: onSelectScratch,
    },
    {
      id: 'discord' as const,
      title: 'Import from Discord',
      description: 'Copy your Discord server structure including channels and roles.',
      icon: DiscordIcon,
      iconBg: '#5865F2',
      onPress: onSelectDiscord,
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create Community"
      size="sm"
    >
      <View style={{ gap: defaultSpacing.md }}>
        <Text size="sm" style={{ color: tc.text.muted }}>
          How would you like to create your community?
        </Text>

        <View style={{ gap: defaultSpacing.sm }}>
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Pressable
                key={option.id}
                onPress={option.onPress}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: defaultSpacing.md,
                  padding: defaultSpacing.md,
                  borderRadius: defaultRadii.lg,
                  borderWidth: 1,
                  borderColor: tc.border.subtle,
                  backgroundColor: pressed ? tc.background.sunken : tc.background.raised,
                })}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: defaultRadii.md,
                    backgroundColor: option.iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={24} color="#fff" />
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text size="md" weight="semibold" style={{ color: tc.text.primary }}>
                    {option.title}
                  </Text>
                  <Text size="sm" style={{ color: tc.text.muted }} numberOfLines={2}>
                    {option.description}
                  </Text>
                </View>

                <ChevronRightIcon size={20} color={tc.text.muted} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </Dialog>
  );
}
