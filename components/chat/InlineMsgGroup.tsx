import React from 'react';
import { Pressable, View } from 'react-native';
import { Text, StatusIcon } from '@coexist/wisp-react-native';

export interface InlineMsgGroupProps {
  sender: string;
  avatar?: React.ReactNode;
  timestamp: string;
  status?: string;
  /** Custom color for the sender name (used for group chat differentiation) */
  senderColor?: string;
  themeColors: any;
  readReceipts?: React.ReactNode;
  onAvatarPress?: (event: any) => void;
  children: React.ReactNode;
}

/**
 * Inline-style message group (Slack/Discord layout).
 *
 * All messages are left-aligned. Avatar on the left, sender name + timestamp
 * on the first line, message content below. Subsequent messages in the group
 * are indented to align with the first message (no repeated avatar/name).
 */
export function InlineMsgGroup({
  sender,
  avatar,
  timestamp,
  status,
  senderColor,
  themeColors,
  readReceipts,
  onAvatarPress,
  children,
}: InlineMsgGroupProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      {/* Avatar column */}
      <View style={{ width: 32, flexShrink: 0, paddingTop: 2 }}>
        {avatar && onAvatarPress ? (
          <Pressable onPress={onAvatarPress}>{avatar}</Pressable>
        ) : (
          avatar
        )}
      </View>

      {/* Content column */}
      <View style={{ flex: 1, gap: 2 }}>
        {/* Sender name + timestamp row */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text
            size="sm"
            weight="semibold"
            style={{ color: senderColor || themeColors.text.primary }}
          >
            {sender}
          </Text>
          <Text size="xs" style={{ color: themeColors.text.muted }}>
            {timestamp}
          </Text>
          {status && (
            <StatusIcon
              status={status as any}
              color={themeColors.text.muted}
              readColor={themeColors.accent.primary}
            />
          )}
        </View>

        {/* Message content */}
        <View style={{ gap: 2 }}>
          {children}
        </View>

        {/* Read receipts */}
        {readReceipts}
      </View>
    </View>
  );
}
