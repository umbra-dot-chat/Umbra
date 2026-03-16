import React from 'react';
import { Pressable } from 'react-native';
import { Avatar, Box, Text, StatusIcon } from '@coexist/wisp-react-native';
import { dbg } from '@/utils/debug';

export interface InlineMsgGroupProps {
  sender: string;
  /** Display name for the avatar (initials fallback). */
  avatarName: string;
  /** Optional avatar image source (URL or base64). */
  avatarSrc?: string;
  /** Sender DID — passed through to onShowProfile so ChatArea doesn't need a closure. */
  senderDid: string;
  timestamp: string;
  status?: string;
  /** Custom color for the sender name (used for group chat differentiation) */
  senderColor?: string;
  themeColors: any;
  readReceipts?: React.ReactNode;
  /** Stable callback from ChatArea — signature: (name, event, status?, avatar?) */
  onShowProfile?: (name: string, event: any, status?: 'online' | 'idle' | 'offline', avatar?: string) => void;
  /**
   * Fingerprint string encoding the group's message state, e.g.
   * "id1|0||0,id2|1|read|2". Used by arePropsEqual instead of comparing
   * children (which is always a new JSX array from group.map()).
   */
  messageFingerprint: string;
  children: React.ReactNode;
}

/**
 * Custom comparison for React.memo.
 *
 * We compare only primitive/stable props and deliberately skip:
 * - `onShowProfile` (function reference changes every render but logic is identical)
 * - `children` (JSX recreated every render via group.map() — always a new ref)
 * - `themeColors` (object ref — only changes on theme switch, cheap to compare by ref)
 * - `readReceipts` (ReactNode — recreated each render)
 *
 * Instead of comparing `children` (always a new array), we compare
 * `messageFingerprint` — a string encoding each message's id, edit state,
 * delivery status, and reaction count. This lets the memo actually work.
 */
function arePropsEqual(prev: InlineMsgGroupProps, next: InlineMsgGroupProps): boolean {
  return (
    prev.sender === next.sender &&
    prev.timestamp === next.timestamp &&
    prev.status === next.status &&
    prev.senderColor === next.senderColor &&
    prev.avatarName === next.avatarName &&
    prev.avatarSrc === next.avatarSrc &&
    prev.senderDid === next.senderDid &&
    prev.messageFingerprint === next.messageFingerprint
  );
}

/**
 * Inline-style message group (Slack/Discord layout).
 *
 * All messages are left-aligned. Avatar on the left, sender name + timestamp
 * on the first line, message content below. Subsequent messages in the group
 * are indented to align with the first message (no repeated avatar/name).
 *
 * Renders its own Avatar internally from primitive props (avatarName, avatarSrc)
 * so the parent doesn't need to create unstable JSX on every render.
 */
export const InlineMsgGroup = React.memo(function InlineMsgGroup({
  sender,
  avatarName,
  avatarSrc,
  senderDid,
  timestamp,
  status,
  senderColor,
  themeColors,
  readReceipts,
  onShowProfile,
  children,
}: InlineMsgGroupProps) {
  if (__DEV__) dbg.trackRender('InlineMsgGroup');

  const avatarElement = <Avatar name={avatarName} src={avatarSrc} size="sm" />;

  return (
    <Box style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      {/* Avatar column */}
      <Box style={{ width: 32, flexShrink: 0, paddingTop: 2 }}>
        {onShowProfile ? (
          <Pressable onPress={(e: any) => onShowProfile(sender, e, undefined, avatarSrc)}>
            {avatarElement}
          </Pressable>
        ) : (
          avatarElement
        )}
      </Box>

      {/* Content column */}
      <Box style={{ flex: 1, gap: 2 }}>
        {/* Sender name + timestamp row */}
        <Box style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
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
          {readReceipts}
        </Box>

        {/* Message content */}
        <Box style={{ gap: 2 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}, arePropsEqual);
