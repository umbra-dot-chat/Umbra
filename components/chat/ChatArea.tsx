import React, { useCallback } from 'react';
import { Platform, ScrollView, View, Pressable, Text as RNText } from 'react-native';
import {
  Avatar, ChatBubble, Text, TypingIndicator, useTheme,
} from '@coexist/wisp-react-native';
import { SmileIcon, ReplyIcon, ThreadIcon, MoreIcon } from '@/components/icons';
import { HoverBubble } from './HoverBubble';
import { MsgGroup } from './MsgGroup';
import { InlineMsgGroup } from './InlineMsgGroup';
import { DmFileMessage } from '@/components/messaging/DmFileMessage';
import { SlotRenderer } from '@/components/plugins/SlotRenderer';
import { useMessaging } from '@/contexts/MessagingContext';
import type { Message } from '@umbra/service';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatAreaProps {
  /** Messages to display */
  messages: Message[];
  /** Current user's DID — used to determine incoming vs outgoing */
  myDid: string;
  /** Current user's display name (shown on outgoing messages) */
  myDisplayName?: string;
  /** Current user's avatar URL or base64 */
  myAvatar?: string;
  /** Map of DID → display name for rendering sender names */
  friendNames: Record<string, string>;
  /** Map of DID → avatar URL/base64 for rendering friend avatars */
  friendAvatars?: Record<string, string>;
  /** Whether messages are still loading */
  isLoading?: boolean;
  /** Whether this is a group conversation (enables per-member color differentiation) */
  isGroupChat?: boolean;
  /** Who is currently typing (display name), or null */
  typingUser?: string | null;
  hoveredMessage: string | null;
  onHoverIn: (id: string) => void;
  onHoverOut: () => void;
  onReplyTo: (reply: { sender: string; text: string }) => void;
  onOpenThread: (msg: { id: string; sender: string; content: string; timestamp: string }) => void;
  onShowProfile: (name: string, event: any, status?: 'online' | 'idle' | 'offline') => void;
  // Extended handlers
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onEditMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onPinMessage?: (messageId: string) => void;
  onForwardMessage?: (messageId: string) => void;
  onCopyMessage?: (text: string) => void;
  /** Content rendered at the very top of the scroll area, scrolls away with messages. */
  stickyHeader?: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Format a Unix timestamp (ms) to a time string like "10:32 AM". */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * Palette of distinct colors for differentiating group chat members.
 * Colours are chosen for legibility on both dark and light backgrounds.
 */
const MEMBER_COLORS = [
  '#58A6FF', // blue
  '#7EE787', // green
  '#D2A8FF', // purple
  '#FFA657', // orange
  '#FF7B72', // red
  '#79C0FF', // light blue
  '#F778BA', // pink
  '#FFC857', // gold
  '#56D4DD', // teal
  '#BFDBFE', // periwinkle
];

/**
 * Derive a deterministic color for a given DID string.
 * Uses a simple hash to pick from the palette so the same DID
 * always gets the same color within a session.
 */
function memberColor(did: string): string {
  let hash = 0;
  for (let i = 0; i < did.length; i++) {
    hash = (hash * 31 + did.charCodeAt(i)) | 0;
  }
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
}

/** Extract the text content from a message. */
function getMessageText(message: Message): string {
  if (message.deleted) return '[Message deleted]';
  // Handle content as a plain string (WASM events may send raw text)
  if (typeof message.content === 'string') {
    return (message.content as string) || '[empty message]';
  }
  // Handle missing content gracefully
  if (!message.content) return '[empty message]';
  if (message.content.type === 'text') {
    return message.content.text || '[decryption pending]';
  }
  if (message.content.type === 'file') {
    return `[file: ${message.content.filename}]`;
  }
  return '[unsupported content]';
}

/** Try to parse a JSON-encoded file message marker from text content. */
function tryParseFileMessage(message: Message): {
  fileId: string;
  filename: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
} | null {
  // Check native file content type first
  if (message.content && typeof message.content === 'object' && message.content.type === 'file') {
    return {
      fileId: message.content.fileId,
      filename: message.content.filename,
      size: message.content.size,
      mimeType: message.content.mimeType,
      thumbnail: message.content.thumbnail,
    };
  }
  // Check for JSON-encoded file marker in text content
  if (message.content && typeof message.content === 'object' && message.content.type === 'text') {
    const text = message.content.text;
    if (text.startsWith('{"__file":true')) {
      try {
        const parsed = JSON.parse(text);
        if (parsed.__file && parsed.fileId && parsed.filename) {
          return {
            fileId: parsed.fileId,
            filename: parsed.filename,
            size: parsed.size ?? 0,
            mimeType: parsed.mimeType ?? 'application/octet-stream',
            thumbnail: parsed.thumbnail,
          };
        }
      } catch {
        // Not valid JSON, treat as regular text
      }
    }
  }
  return null;
}

/** Check whether a message's text represents a call event (e.g. `[call:voice:completed:180]`). */
function isCallEventMessage(text: string): boolean {
  return text.startsWith('[call:');
}

/**
 * Parse a call event string into its components.
 * Expected format: `[call:<callType>:<status>:<duration>]`
 * Duration is in seconds and only meaningful for "completed" status.
 */
function parseCallEvent(text: string): { callType: string; status: string; duration: number } | null {
  const match = text.match(/^\[call:(\w+):(\w+):(\d+)\]$/);
  if (!match) return null;
  return {
    callType: match[1],
    status: match[2],
    duration: parseInt(match[3], 10),
  };
}

/**
 * Format a parsed call event into a user-friendly display string.
 *
 * Examples:
 *   "Voice call — 3:02"          (completed, < 1 hour)
 *   "Video call — 1:23:45"       (completed, >= 1 hour)
 *   "Missed voice call"          (missed)
 *   "Declined video call"        (declined)
 *   "Cancelled voice call"       (cancelled)
 */
function formatCallEventDisplay(callType: string, status: string, duration: number): string {
  const label = callType === 'video' ? 'video call' : 'voice call';

  if (status === 'completed' && duration > 0) {
    const hrs = Math.floor(duration / 3600);
    const mins = Math.floor((duration % 3600) / 60);
    const secs = duration % 60;
    const timePart =
      hrs > 0
        ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        : `${mins}:${String(secs).padStart(2, '0')}`;
    return `${label.charAt(0).toUpperCase() + label.slice(1)} \u2014 ${timePart}`;
  }

  switch (status) {
    case 'missed':
      return `Missed ${label}`;
    case 'declined':
      return `Declined ${label}`;
    case 'cancelled':
      return `Cancelled ${label}`;
    default:
      return `${label.charAt(0).toUpperCase() + label.slice(1)}`;
  }
}

/**
 * Group consecutive messages from the same sender into display groups.
 * Each group shows sender name + avatar once, with multiple bubbles underneath.
 */
function groupMessages(messages: Message[]): Message[][] {
  if (messages.length === 0) return [];

  const groups: Message[][] = [];
  let currentGroup: Message[] = [messages[0]];

  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const curr = messages[i];

    const prevIsCall = isCallEventMessage(getMessageText(prev));
    const currIsCall = isCallEventMessage(getMessageText(curr));

    // Call events always live in their own single-message group.
    // Regular messages group if same sender and within 5 minutes.
    const sameGroup =
      !prevIsCall &&
      !currIsCall &&
      curr.senderDid === prev.senderDid &&
      Math.abs(curr.timestamp - prev.timestamp) < 5 * 60 * 1000;

    if (sameGroup) {
      currentGroup.push(curr);
    } else {
      groups.push(currentGroup);
      currentGroup = [curr];
    }
  }
  groups.push(currentGroup);

  return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────

function EmptyMessages() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Text size="xl" weight="bold" style={{ color: theme.colors.text.primary, marginBottom: 8 }}>
        No messages yet
      </Text>
      <Text size="sm" style={{ color: theme.colors.text.muted, textAlign: 'center' }}>
        Send a message to start the conversation.
      </Text>
    </View>
  );
}

function LoadingSkeleton() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Text size="sm" style={{ color: theme.colors.text.muted }}>
        Loading messages...
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function ChatArea({
  messages, myDid, myDisplayName, myAvatar, friendNames, friendAvatars,
  isLoading, isGroupChat, typingUser,
  hoveredMessage, onHoverIn, onHoverOut,
  onReplyTo, onOpenThread, onShowProfile,
  onToggleReaction, onEditMessage, onDeleteMessage, onPinMessage, onForwardMessage, onCopyMessage,
  stickyHeader,
}: ChatAreaProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const { displayMode } = useMessaging();
  const isInline = displayMode === 'inline';

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (messages.length === 0) {
    return <EmptyMessages />;
  }

  const groups = groupMessages(messages);

  const getSenderName = (did: string): string => {
    if (did === myDid) return myDisplayName || did.slice(0, 16) + '...';
    return friendNames[did] || did.slice(0, 16) + '...';
  };

  const getSenderAvatar = (did: string): string | undefined => {
    if (did === myDid) return myAvatar;
    return friendAvatars?.[did];
  };

  const renderAvatar = (did: string, name: string) => {
    const avatarSrc = getSenderAvatar(did);
    return <Avatar name={name} src={avatarSrc} size="sm" />;
  };

  const handleCopy = (text: string) => {
    if (onCopyMessage) {
      onCopyMessage(text);
    } else if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      try { navigator.clipboard.writeText(text); } catch { /* ignore */ }
    }
  };

  const makeActions = (msgId: string, sender: string, content: string, timestamp: string) => [
    { key: 'react', label: 'React', icon: <SmileIcon size={14} color={themeColors.text.muted} />, onClick: () => onToggleReaction?.(msgId, '👍') },
    { key: 'reply', label: 'Reply', icon: <ReplyIcon size={14} color={themeColors.text.muted} />, onClick: () => onReplyTo({ sender, text: content }) },
    { key: 'thread', label: 'Thread', icon: <ThreadIcon size={14} color={themeColors.text.muted} />, onClick: () => onOpenThread({ id: msgId, sender, content, timestamp }) },
    { key: 'more', label: 'More', icon: <MoreIcon size={14} color={themeColors.text.muted} />, onClick: () => {} },
  ];

  const makeContextActions = (msgId: string, sender: string, content: string, timestamp: string, isOwn: boolean) => ({
    onReply: () => onReplyTo({ sender, text: content }),
    onThread: () => onOpenThread({ id: msgId, sender, content, timestamp }),
    onCopy: () => handleCopy(content),
    onForward: () => onForwardMessage?.(msgId),
    onPin: () => onPinMessage?.(msgId),
    onDelete: () => onDeleteMessage?.(msgId),
    onEdit: isOwn ? () => onEditMessage?.(msgId) : undefined,
  });

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 8 }}
    >
      {/* Scrollable header content (e.g. E2EE banner) */}
      {stickyHeader}

      {/* Date divider */}
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <Text size="xs" style={{ color: themeColors.text.muted }}>Today</Text>
      </View>

      {groups.map((group, groupIdx) => {
        const firstMsg = group[0];
        const senderDid = firstMsg.senderDid;
        const isOutgoing = senderDid === myDid;
        const senderName = getSenderName(senderDid);
        const timeStr = formatTime(firstMsg.timestamp);
        const firstText = getMessageText(firstMsg);

        // ── Call event: render as a centered system-style row ──
        if (isCallEventMessage(firstText)) {
          const parsed = parseCallEvent(firstText);
          const displayText = parsed
            ? formatCallEventDisplay(parsed.callType, parsed.status, parsed.duration)
            : firstText;
          const icon = parsed?.callType === 'video' ? '\uD83D\uDCF9' : '\uD83D\uDCDE';

          return (
            <View
              key={`group-${groupIdx}`}
              style={{
                alignItems: 'center',
                paddingVertical: 6,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: themeColors.background.surface ?? themeColors.background.sunken,
                }}
              >
                <RNText style={{ fontSize: 12 }}>{icon}</RNText>
                <RNText
                  style={{
                    fontSize: 12,
                    color: themeColors.text.muted,
                    fontWeight: '500',
                  }}
                >
                  {displayText}
                </RNText>
                <RNText
                  style={{
                    fontSize: 11,
                    color: themeColors.text.muted,
                    opacity: 0.7,
                    marginLeft: 4,
                  }}
                >
                  {timeStr}
                </RNText>
              </View>
            </View>
          );
        }

        // ── Regular message group ──

        // Shared per-message renderer (used by both layouts)
        const renderMessages = (inlineMode: boolean) =>
          group.map((msg) => {
            const text = getMessageText(msg);
            const name = getSenderName(msg.senderDid);
            const time = formatTime(msg.timestamp);
            const isOwn = msg.senderDid === myDid;
            const fileInfo = tryParseFileMessage(msg);

            const displayContent = fileInfo ? null : text;

            // Build reaction chips for Wisp ChatBubble
            const reactionChips = msg.reactions?.map((r) => ({
              emoji: r.emoji,
              count: r.count ?? r.users?.length ?? 0,
              active: r.reacted ?? r.users?.includes(myDid) ?? false,
            }));

            // Build replyTo display
            const replyTo = msg.replyTo ? {
              sender: msg.replyTo.senderName || getSenderName(msg.replyTo.senderDid),
              text: msg.replyTo.text,
            } : undefined;

            const threadCount = msg.threadReplyCount ?? 0;

            return (
              <View key={msg.id}>
                <HoverBubble
                  id={msg.id}
                  align={inlineMode ? 'incoming' : (isOwn ? 'outgoing' : 'incoming')}
                  hoveredMessage={hoveredMessage}
                  onHoverIn={onHoverIn}
                  onHoverOut={onHoverOut}
                  actions={makeActions(msg.id, name, text, time)}
                  contextActions={makeContextActions(msg.id, name, text, time, isOwn)}
                  themeColors={themeColors}
                  message={{ id: msg.id, text, conversationId: msg.conversationId, senderDid: msg.senderDid }}
                >
                  {inlineMode ? (
                    <View style={{ paddingVertical: 2 }}>
                      {replyTo && (
                        <View
                          style={{
                            borderLeftWidth: 2,
                            borderLeftColor: themeColors.accent.primary,
                            paddingLeft: 8,
                            marginBottom: 4,
                            opacity: 0.7,
                          }}
                        >
                          <RNText style={{ fontSize: 11, color: themeColors.text.muted }}>
                            {replyTo.sender}: {replyTo.text}
                          </RNText>
                        </View>
                      )}
                      {fileInfo ? (
                        <DmFileMessage
                          fileId={fileInfo.fileId}
                          filename={fileInfo.filename}
                          size={fileInfo.size}
                          mimeType={fileInfo.mimeType}
                          thumbnail={fileInfo.thumbnail}
                          isOutgoing={isOwn}
                        />
                      ) : typeof displayContent === 'string' ? (
                        <RNText style={{ fontSize: 14, color: themeColors.text.primary, lineHeight: 20 }}>
                          {displayContent}
                        </RNText>
                      ) : (
                        <View style={{ minHeight: 20 }}>{displayContent}</View>
                      )}
                      {msg.edited && (
                        <RNText style={{ fontSize: 10, color: themeColors.text.muted }}>(edited)</RNText>
                      )}
                    </View>
                  ) : (
                    <ChatBubble
                      align={isOwn ? 'outgoing' : 'incoming'}
                      reactions={reactionChips}
                      onReactionClick={(emoji: string) => onToggleReaction?.(msg.id, emoji)}
                      replyTo={replyTo}
                      edited={msg.edited}
                      forwarded={msg.forwarded}
                    >
                      {fileInfo ? (
                        <DmFileMessage
                          fileId={fileInfo.fileId}
                          filename={fileInfo.filename}
                          size={fileInfo.size}
                          mimeType={fileInfo.mimeType}
                          thumbnail={fileInfo.thumbnail}
                          isOutgoing={isOwn}
                        />
                      ) : (
                        displayContent
                      )}
                    </ChatBubble>
                  )}
                </HoverBubble>
                <SlotRenderer
                  slot="message-decorator"
                  props={{ message: msg, conversationId: msg.conversationId }}
                />
                {threadCount > 0 && (
                  <Pressable
                    onPress={() => onOpenThread({ id: msg.id, sender: name, content: text, timestamp: time })}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      alignSelf: 'flex-start',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      marginTop: 2,
                      gap: 4,
                    }}
                  >
                    <ThreadIcon size={12} color={themeColors.accent.primary} />
                    <RNText style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: themeColors.accent.primary,
                    }}>
                      {threadCount} {threadCount === 1 ? 'reply' : 'replies'}
                    </RNText>
                  </Pressable>
                )}
              </View>
            );
          });

        if (isInline) {
          // ── Inline layout (Slack/Discord style) ──
          return (
            <InlineMsgGroup
              key={`group-${groupIdx}`}
              sender={senderName}
              avatar={renderAvatar(senderDid, senderName)}
              timestamp={timeStr}
              status={isOutgoing ? (firstMsg.status as string) : undefined}
              senderColor={isGroupChat ? memberColor(senderDid) : undefined}
              themeColors={themeColors}
              onAvatarPress={(e: any) => onShowProfile(senderName, e)}
            >
              {renderMessages(true)}
            </InlineMsgGroup>
          );
        }

        // ── Bubble layout (default) ──
        return (
          <MsgGroup
            key={`group-${groupIdx}`}
            align={isOutgoing ? 'outgoing' : 'incoming'}
            sender={senderName}
            avatar={renderAvatar(senderDid, senderName)}
            timestamp={timeStr}
            status={isOutgoing ? (firstMsg.status as string) : undefined}
            senderColor={isGroupChat && !isOutgoing ? memberColor(senderDid) : undefined}
            themeColors={themeColors}
            onAvatarPress={(e: any) => onShowProfile(senderName, e)}
          >
            {renderMessages(false)}
          </MsgGroup>
        );
      })}

      {/* Typing indicator */}
      {typingUser && (
        <TypingIndicator
          animation="pulse"
          bubble
          avatar={<Avatar name={typingUser} size="sm" />}
          sender={typingUser}
        />
      )}
    </ScrollView>
  );
}
