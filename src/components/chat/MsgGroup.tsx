import React from 'react';
import { Pressable } from 'react-native';
import { Avatar, Box, Text, StatusIcon } from '@coexist/wisp-react-native';
import { dbg } from '@/utils/debug';

export interface MsgGroupProps {
  sender: string;
  /** Display name for the avatar (initials fallback). */
  avatarName: string;
  /** Optional avatar image source (URL or base64). */
  avatarSrc?: string;
  /** Sender DID — passed through to onShowProfile so ChatArea doesn't need a closure. */
  senderDid: string;
  timestamp: string;
  align: 'incoming' | 'outgoing';
  status?: string;
  /** Custom color for the sender name (used for group chat differentiation) */
  senderColor?: string;
  themeColors: any;
  readReceipts?: React.ReactNode;
  /** Stable callback from ChatArea — signature: (name, event, status?, avatar?) */
  onShowProfile?: (name: string, event: any, status?: 'online' | 'idle' | 'offline', avatar?: string) => void;
  children: React.ReactNode;
}

/**
 * Custom comparison for React.memo.
 *
 * Compares only primitive/stable props and skips unstable references:
 * - `onShowProfile` (function ref changes each render but logic is identical)
 * - `children` (JSX recreated every render but visually identical for same messages)
 * - `themeColors` (object ref — only changes on theme switch)
 * - `readReceipts` (ReactNode — recreated each render)
 */
function arePropsEqual(prev: MsgGroupProps, next: MsgGroupProps): boolean {
  return (
    prev.sender === next.sender &&
    prev.timestamp === next.timestamp &&
    prev.align === next.align &&
    prev.status === next.status &&
    prev.senderColor === next.senderColor &&
    prev.avatarName === next.avatarName &&
    prev.avatarSrc === next.avatarSrc &&
    prev.senderDid === next.senderDid &&
    prev.children === next.children
  );
}

/**
 * Bubble-style message group (WhatsApp/iMessage layout).
 *
 * Outgoing messages are right-aligned, incoming are left-aligned.
 * Avatar is shown next to the message bubbles.
 *
 * Renders its own Avatar internally from primitive props (avatarName, avatarSrc)
 * so the parent doesn't need to create unstable JSX on every render.
 */
export const MsgGroup = React.memo(function MsgGroup({
  sender, avatarName, avatarSrc, senderDid,
  timestamp, align, status, senderColor,
  themeColors, readReceipts, onShowProfile, children,
}: MsgGroupProps) {
  if (__DEV__) dbg.trackRender('MsgGroup');
  const isOut = align === 'outgoing';

  const avatarElement = <Avatar name={avatarName} src={avatarSrc} size="sm" />;

  return (
    <Box style={{ alignItems: isOut ? 'flex-end' : 'flex-start' }}>
      <Text size="xs" weight="semibold" style={{ color: senderColor || themeColors.text.secondary, marginBottom: 2 }}>{sender}</Text>
      <Box style={{ flexDirection: isOut ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
        {onShowProfile ? (
          <Pressable onPress={(e: any) => onShowProfile(sender, e, undefined, avatarSrc)}>
            {avatarElement}
          </Pressable>
        ) : (
          avatarElement
        )}
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
}, arePropsEqual);
