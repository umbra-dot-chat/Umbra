import React from 'react';
import { Pressable } from 'react-native';
import { Box, Text, StatusIcon } from '@coexist/wisp-react-native';
import { dbg } from '@/utils/debug';

export interface MsgGroupProps {
  sender: string;
  avatar?: React.ReactNode;
  timestamp: string;
  align: 'incoming' | 'outgoing';
  status?: string;
  /** Custom color for the sender name (used for group chat differentiation) */
  senderColor?: string;
  themeColors: any;
  readReceipts?: React.ReactNode;
  onAvatarPress?: (event: any) => void;
  children: React.ReactNode;
}

export function MsgGroup({
  sender, avatar, timestamp, align, status, senderColor,
  themeColors, readReceipts, onAvatarPress, children,
}: MsgGroupProps) {
  if (__DEV__) dbg.trackRender('MsgGroup');
  const isOut = align === 'outgoing';
  return (
    <Box style={{ alignItems: isOut ? 'flex-end' : 'flex-start' }}>
      <Text size="xs" weight="semibold" style={{ color: senderColor || themeColors.text.secondary, marginBottom: 2 }}>{sender}</Text>
      <Box style={{ flexDirection: isOut ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
        {avatar && onAvatarPress ? (
          <Pressable onPress={onAvatarPress}>{avatar}</Pressable>
        ) : avatar}
        <Box style={{ flexDirection: 'column', gap: 2, alignItems: isOut ? 'flex-end' : 'flex-start', flex: 1, flexShrink: 1 }}>
          {children}
        </Box>
      </Box>
      <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, alignSelf: isOut ? 'flex-end' : 'flex-start' }}>
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
        {readReceipts}
      </Box>
    </Box>
  );
}
