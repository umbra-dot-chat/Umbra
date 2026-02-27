/**
 * @module ChannelCreateDialog
 * @description Themed dialog for creating a new channel within a space.
 *
 * Includes a name field and a channel type picker with icons and
 * descriptions for each type.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Pressable } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Dialog, Input, Button, Text, useTheme } from '@coexist/wisp-react-native';
import { defaultSpacing, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Channel type definitions
// ---------------------------------------------------------------------------

export type CreateChannelType = 'text' | 'voice' | 'announcement' | 'forum' | 'files';

interface ChannelTypeOption {
  type: CreateChannelType;
  label: string;
  description: string;
  icon: (props: { size: number; color: string }) => React.ReactNode;
}

// ---------------------------------------------------------------------------
// Channel type icons (inline SVG)
// ---------------------------------------------------------------------------

function TextChannelIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 12h16M4 18h16M7 6l-3 6M17 6l3 6M9.5 6h5M7 12l2.5-6M17 12l-2.5-6" />
    </Svg>
  );
}

function VoiceChannelIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <Line x1="12" y1="19" x2="12" y2="23" />
      <Line x1="8" y1="23" x2="16" y2="23" />
    </Svg>
  );
}

function AnnouncementChannelIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

function ForumChannelIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <Line x1="9" y1="9" x2="15" y2="9" />
      <Line x1="9" y1="13" x2="13" y2="13" />
    </Svg>
  );
}

function FilesChannelIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Channel type options
// ---------------------------------------------------------------------------

const CHANNEL_TYPES: ChannelTypeOption[] = [
  {
    type: 'text',
    label: 'Text',
    description: 'Send messages, images, and files',
    icon: TextChannelIcon,
  },
  {
    type: 'voice',
    label: 'Voice',
    description: 'Talk with voice and video',
    icon: VoiceChannelIcon,
  },
  {
    type: 'announcement',
    label: 'Announcement',
    description: 'Important updates (only admins can post)',
    icon: AnnouncementChannelIcon,
  },
  {
    type: 'forum',
    label: 'Forum',
    description: 'Organized discussions with threads',
    icon: ForumChannelIcon,
  },
  {
    type: 'files',
    label: 'Files',
    description: 'Shared file storage with folders',
    icon: FilesChannelIcon,
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChannelCreateDialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the dialog should close. */
  onClose: () => void;
  /** Called when the user submits. */
  onSubmit: (name: string, type: CreateChannelType) => void | Promise<void>;
  /** Whether a submission is in progress. */
  submitting?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChannelCreateDialog({
  open,
  onClose,
  onSubmit,
  submitting = false,
}: ChannelCreateDialogProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [name, setName] = useState('');
  const [channelType, setChannelType] = useState<CreateChannelType>('text');
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setChannelType('text');
      setError(null);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Channel name is required.');
      return;
    }
    if (trimmed.length > 100) {
      setError('Channel name must be 100 characters or less.');
      return;
    }
    setError(null);
    try {
      await onSubmit(trimmed, channelType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create channel.');
    }
  }, [name, channelType, onSubmit]);

  const handleClose = useCallback(() => {
    setName('');
    setChannelType('text');
    setError(null);
    onClose();
  }, [onClose]);

  const canSubmit = name.trim().length > 0 && !submitting;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Create Channel"
      size="sm"
      footer={
        <>
          <Button variant="tertiary" onPress={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onPress={handleSubmit} disabled={!canSubmit}>
            {submitting ? 'Creating...' : 'Create Channel'}
          </Button>
        </>
      }
    >
      <View style={{ gap: 16 }}>
        {/* Channel type picker */}
        <View style={{ gap: 6 }}>
          <Text
            size="xs"
            weight="semibold"
            style={{
              color: tc.text.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            Channel Type
          </Text>
          <View style={{ gap: 4 }}>
            {CHANNEL_TYPES.map((option) => {
              const isSelected = channelType === option.type;
              const Icon = option.icon;
              return (
                <Pressable
                  key={option.type}
                  onPress={() => setChannelType(option.type)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: defaultSpacing.md,
                    paddingVertical: defaultSpacing.sm + 2,
                    paddingHorizontal: defaultSpacing.md,
                    borderRadius: defaultRadii.md,
                    borderWidth: 1.5,
                    borderColor: isSelected ? tc.accent.primary : tc.border.subtle,
                    backgroundColor: isSelected
                      ? tc.accent.highlight
                      : pressed
                        ? tc.background.sunken
                        : 'transparent',
                  })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: defaultRadii.md,
                      backgroundColor: isSelected ? tc.accent.primary + '18' : tc.background.sunken,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      size={18}
                      color={isSelected ? tc.accent.primary : tc.text.muted}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      size="sm"
                      weight="medium"
                      style={{ color: tc.text.primary }}
                    >
                      {option.label}
                    </Text>
                    <Text
                      size="xs"
                      style={{ color: tc.text.muted }}
                      numberOfLines={1}
                    >
                      {option.description}
                    </Text>
                  </View>
                  {/* Radio indicator */}
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 2,
                      borderColor: isSelected ? tc.accent.primary : tc.border.subtle,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: tc.accent.primary,
                        }}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Channel name */}
        <View style={{ gap: 6 }}>
          <Text
            size="xs"
            weight="semibold"
            style={{
              color: tc.text.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            Channel Name
          </Text>
          <Input
            value={name}
            onChangeText={(text: string) => {
              setName(text);
              if (error) setError(null);
            }}
            placeholder={
              channelType === 'text' ? 'new-channel' :
              channelType === 'voice' ? 'General Voice' :
              channelType === 'announcement' ? 'announcements' :
              'general-forum'
            }
            autoFocus
            onSubmitEditing={canSubmit ? handleSubmit : undefined}
            maxLength={100}
          />
        </View>

        {error && (
          <Text size="xs" style={{ color: tc.status.danger }}>
            {error}
          </Text>
        )}
      </View>
    </Dialog>
  );
}
