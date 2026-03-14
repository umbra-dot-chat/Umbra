import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, FlatList, View, Animated as RNAnimated } from 'react-native';
import { TEST_IDS } from '@/constants/test-ids';
import {
  Avatar, Box, Button, ChatBubble, Text, TypingIndicator, NewMessageDivider, useTheme,
} from '@coexist/wisp-react-native';
import { SmileIcon, ReplyIcon, ThreadIcon, MoreIcon, PhoneIcon, VideoIcon } from '@/components/ui';
import { InlineEventCard } from '@/components/ui/InlineEventCard';
import { HoverBubble } from './HoverBubble';
import { MsgGroup } from './MsgGroup';
import { InlineMsgGroup } from './InlineMsgGroup';
import { DmFileMessage } from '@/components/chat/DmFileMessage';
import { SlotRenderer } from '@/components/plugins/SlotRenderer';
import { useApplyTextTransforms } from '@/contexts/PluginContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { parseMessageContent, buildEmojiMap, isEmojiOnlyMessage, resetParseStats, getParseStats, type EmojiMap } from '@/utils/parseMessageContent';
import { dbg } from '@/utils/debug';
import type { Message, CommunityEmoji } from '@umbra/service';
import type { ActiveCall } from '@/types/call';
import { InlineCallCardMessage } from '@/components/call/InlineCallCardMessage';

const SRC = 'ChatArea';

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
  /** @deprecated — hover state is now managed inside HoverBubble. Ignored. */
  hoveredMessage?: string | null;
  /** @deprecated — hover state is now managed inside HoverBubble. Ignored. */
  onHoverIn?: (id: string) => void;
  /** @deprecated — hover state is now managed inside HoverBubble. Ignored. */
  onHoverOut?: () => void;
  onReplyTo: (reply: { sender: string; text: string }) => void;
  onOpenThread: (msg: { id: string; sender: string; content: string; timestamp: string }) => void;
  onShowProfile: (name: string, event: any, status?: 'online' | 'idle' | 'offline', avatar?: string) => void;
  // Extended handlers
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onEditMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onPinMessage?: (messageId: string) => void;
  onForwardMessage?: (messageId: string) => void;
  onCopyMessage?: (text: string) => void;
  /** Content rendered at the very top of the scroll area, scrolls away with messages. */
  stickyHeader?: React.ReactNode;
  /** Custom emoji (built-in + community) for inline rendering in messages. */
  customEmoji?: CommunityEmoji[];
  /** ID of the first unread message — divider is shown before it. */
  firstUnreadMessageId?: string | null;
  /** Called when the user taps the download button on a file attachment card. */
  onFileDownload?: (fileId: string, filename: string, mimeType: string) => Promise<void> | void;
  /** Active P2P uploads keyed by fileId — shows upload progress on sent file cards. */
  activeUploads?: Map<string, { progress: number }>;
  /** When set, scroll to this message ID and briefly highlight it. */
  scrollToMessageId?: string | null;
  /** Called after the scroll-to animation completes (to reset the ID). */
  onScrollToComplete?: () => void;
  // ── Call event props ──
  /** Active call to render as interactive card at the bottom of the stream. */
  activeCall?: ActiveCall | null;
  /** Whether the active call is a group call. */
  isGroupCall?: boolean;
  /** Accept/join an incoming call. */
  onAcceptCall?: () => void;
  /** End/decline the current call. */
  onEndCall?: (reason?: string) => void;
  /** Initiate a call-back from a historical call event. */
  onCallBack?: (callType: 'voice' | 'video') => void;
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
 *   "Voice call started"         (started)
 *   "Voice call ended — 3:02"    (completed, < 1 hour)
 *   "Video call ended — 1:23:45" (completed, >= 1 hour)
 *   "Missed voice call"          (missed)
 *   "Declined video call"        (declined)
 *   "Cancelled voice call"       (cancelled)
 */
function formatCallEventDisplay(callType: string, status: string, duration: number): string {
  const label = callType === 'video' ? 'Video call' : 'Voice call';

  if (status === 'started') {
    return `${label} started`;
  }

  if (status === 'completed' && duration > 0) {
    const hrs = Math.floor(duration / 3600);
    const mins = Math.floor((duration % 3600) / 60);
    const secs = duration % 60;
    const timePart =
      hrs > 0
        ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        : `${mins}:${String(secs).padStart(2, '0')}`;
    return `${label} ended \u2014 ${timePart}`;
  }

  switch (status) {
    case 'completed':
      return `${label} ended`;
    case 'missed':
      return `Missed ${label.toLowerCase()}`;
    case 'declined':
      return `Declined ${label.toLowerCase()}`;
    case 'cancelled':
      return `Cancelled ${label.toLowerCase()}`;
    default:
      return label;
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
    <Box testID={TEST_IDS.CHAT_AREA.EMPTY_STATE} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Text size="xl" weight="bold" style={{ color: theme.colors.text.primary, marginBottom: 8 }}>
        No messages yet
      </Text>
      <Text size="sm" style={{ color: theme.colors.text.muted, textAlign: 'center' }}>
        Send a message to start the conversation.
      </Text>
    </Box>
  );
}

function LoadingSkeleton() {
  const { theme } = useTheme();
  return (
    <Box style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Text size="sm" style={{ color: theme.colors.text.muted }}>
        Loading messages...
      </Text>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const ChatArea = React.memo(function ChatArea({
  messages, myDid, myDisplayName, myAvatar, friendNames, friendAvatars,
  isLoading, isGroupChat, typingUser,
  onReplyTo, onOpenThread, onShowProfile,
  onToggleReaction, onEditMessage, onDeleteMessage, onPinMessage, onForwardMessage, onCopyMessage,
  stickyHeader,
  customEmoji,
  firstUnreadMessageId,
  onFileDownload,
  activeUploads,
  scrollToMessageId,
  onScrollToComplete,
  activeCall,
  isGroupCall,
  onAcceptCall,
  onEndCall,
  onCallBack,
}: ChatAreaProps) {
  if (__DEV__) { dbg.trackRender('ChatArea'); resetParseStats(); }

  const { theme } = useTheme();
  const themeColors = theme.colors;
  const { displayMode } = useMessaging();
  const applyTextTransforms = useApplyTextTransforms();

  useEffect(() => {
    if (__DEV__) {
      const stats = getParseStats();
      if (stats.calls > 0) {
        dbg.debug('messages', `ChatArea render: ${stats.calls} parses in ${stats.totalMs.toFixed(1)}ms`, stats, 'ChatArea');
        if (stats.totalMs > 50) {
          dbg.warn('messages', `ChatArea SLOW: ${stats.calls} parses took ${stats.totalMs.toFixed(1)}ms`, stats, 'ChatArea');
        }
      }
    }
  });

  // ── Download state ──
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  const handleFileDownload = useCallback(async (fileId: string, filename: string, mimeType: string) => {
    if (!onFileDownload) return;
    setDownloadingFileId(fileId);
    try {
      await onFileDownload(fileId, filename, mimeType);
    } finally {
      setDownloadingFileId(null);
    }
  }, [onFileDownload]);

  // Build emoji map for inline custom emoji rendering in messages
  const emojiMap = useMemo<EmojiMap>(
    () => buildEmojiMap(customEmoji ?? []),
    [customEmoji],
  );
  const isInline = displayMode === 'inline';

  // ── Scroll logic ──
  const listRef = useRef<FlatList<Message[]>>(null);
  const isNearBottomRef = useRef(true);
  const prevMessageCountRef = useRef(messages.length);

  const handleScroll = useCallback((e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    isNearBottomRef.current = distanceFromBottom < 150;
  }, []);

  // Auto-scroll to bottom when new messages arrive.
  // Debounced: rapid arrivals (5 bots responding) coalesce into a single scroll.
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && isNearBottomRef.current) {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        scrollTimerRef.current = null;
        listRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Scroll to end when content first renders
  const handleContentSizeChange = useCallback((_w: number, _h: number) => {
    if (isNearBottomRef.current) {
      listRef.current?.scrollToEnd({ animated: false });
    }
  }, []);

  // ── Scroll-to-message + highlight ──
  const messageRefs = useRef<Record<string, View | null>>({});

  // Clean up stale message refs only when messages are removed (rare).
  // During rapid message arrivals the messages array only grows, so this
  // check is skipped entirely — avoiding an O(N) Set allocation + iteration
  // on every render during bot floods.
  const prevMsgLenRef = useRef(messages.length);
  useEffect(() => {
    // Only clean up when messages shrink (pagination reset, conversation switch)
    if (messages.length < prevMsgLenRef.current) {
      const currentIds = new Set(messages.map((m) => m.id));
      const refs = messageRefs.current;
      for (const id in refs) {
        if (!currentIds.has(id)) {
          delete refs[id];
        }
      }
    }
    prevMsgLenRef.current = messages.length;
  }, [messages]);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!scrollToMessageId) return;
    const targetRef = messageRefs.current[scrollToMessageId];

    const triggerHighlight = () => {
      setHighlightedId(scrollToMessageId);
      highlightAnim.setValue(1);
      RNAnimated.timing(highlightAnim, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: false,
      }).start(() => {
        setHighlightedId(null);
      });
      onScrollToComplete?.();
    };

    if (Platform.OS === 'web') {
      const node = targetRef as unknown as HTMLElement | null;
      if (node && typeof node.scrollIntoView === 'function') {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        triggerHighlight();
      } else {
        onScrollToComplete?.();
      }
    } else if (targetRef && listRef.current) {
      // FlatList doesn't have getInnerViewNode, use scrollToItem or manual offset
      onScrollToComplete?.();
    } else {
      onScrollToComplete?.();
    }
  }, [scrollToMessageId]);

  const highlightBg = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', themeColors.accent.primary + '22'],
  });

  // Memoize message grouping
  const groups = useMemo(() => groupMessages(messages), [messages]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (messages.length === 0) {
    return <EmptyMessages />;
  }

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

  // ── Render a single message within a group ──
  const renderSingleMessage = (msg: Message, inlineMode: boolean) => {
    const rawText = getMessageText(msg);
    const text = applyTextTransforms(rawText, { senderDid: msg.senderDid, conversationId: msg.conversationId });
    const name = getSenderName(msg.senderDid);
    const time = formatTime(msg.timestamp);
    const isOwn = msg.senderDid === myDid;
    const fileInfo = tryParseFileMessage(msg);

    const displayContent = fileInfo ? null : (
      emojiMap.size > 0
        ? parseMessageContent(text, emojiMap, undefined, {
            textColor: themeColors.text.primary,
            linkColor: themeColors.text.link ?? '#5865F2',
            codeBgColor: themeColors.background.sunken,
            codeTextColor: themeColors.text.primary,
            spoilerBgColor: themeColors.text.muted,
            quoteBorderColor: themeColors.border.subtle,
          })
        : text
    );

    const emojiOnly = !fileInfo && isEmojiOnlyMessage(text);

    const reactionChips = msg.reactions?.map((r) => ({
      emoji: r.emoji,
      count: r.count ?? r.users?.length ?? 0,
      active: r.reacted ?? r.users?.includes(myDid) ?? false,
    }));

    const replyTo = msg.replyTo ? {
      sender: msg.replyTo.senderName || getSenderName(msg.replyTo.senderDid),
      text: msg.replyTo.text,
    } : undefined;

    const threadCount = msg.threadReplyCount ?? 0;

    return (
      <RNAnimated.View
        key={msg.id}
        ref={(el: any) => { messageRefs.current[msg.id] = el; }}
        style={highlightedId === msg.id ? {
          backgroundColor: highlightBg,
          borderRadius: 8,
          marginHorizontal: -4,
          paddingHorizontal: 4,
        } : undefined}
      >
        <HoverBubble
          id={msg.id}
          align={inlineMode ? 'incoming' : (isOwn ? 'outgoing' : 'incoming')}
          actions={makeActions(msg.id, name, text, time)}
          contextActions={makeContextActions(msg.id, name, text, time, isOwn)}
          themeColors={themeColors}
          message={{ id: msg.id, text, conversationId: msg.conversationId, senderDid: msg.senderDid, edited: msg.edited, reactionsCount: msg.reactions?.length, status: typeof msg.status === 'string' ? msg.status : msg.status ? 'failed' : undefined }}
        >
          {inlineMode ? (
            <Box style={{ paddingVertical: 2 }}>
              {replyTo && (
                <Box
                  style={{
                    borderLeftWidth: 2,
                    borderLeftColor: themeColors.accent.primary,
                    paddingLeft: 8,
                    marginBottom: 4,
                    opacity: 0.7,
                  }}
                >
                  <Text size="xs" style={{ color: themeColors.text.muted }}>
                    {replyTo.sender}: {replyTo.text}
                  </Text>
                </Box>
              )}
              {fileInfo ? (() => {
                const upload = isOwn ? activeUploads?.get(fileInfo.fileId) : undefined;
                return (
                  <DmFileMessage
                    fileId={fileInfo.fileId}
                    filename={fileInfo.filename}
                    size={fileInfo.size}
                    mimeType={fileInfo.mimeType}
                    thumbnail={fileInfo.thumbnail}
                    isOutgoing={isOwn}
                    variant="inline"
                    onDownload={onFileDownload
                      ? () => handleFileDownload(fileInfo.fileId, fileInfo.filename, fileInfo.mimeType)
                      : undefined}
                    isDownloading={downloadingFileId === fileInfo.fileId}
                    isUploading={!!upload}
                    uploadProgress={upload?.progress ?? 0}
                  />
                );
              })() : typeof displayContent === 'string' ? (
                <Text size="sm" style={{ color: themeColors.text.primary, lineHeight: 20 }}>
                  {displayContent}
                </Text>
              ) : (
                <Box style={{ minHeight: 20 }}>{displayContent}</Box>
              )}
              {msg.edited && (
                <Text size="xs" style={{ color: themeColors.text.muted }}>(edited)</Text>
              )}
            </Box>
          ) : (
            <ChatBubble
              align={isOwn ? 'outgoing' : 'incoming'}
              reactions={reactionChips}
              onReactionClick={(emoji: string) => onToggleReaction?.(msg.id, emoji)}
              replyTo={replyTo}
              edited={msg.edited}
              forwarded={msg.forwarded}
            >
              {fileInfo ? (() => {
                const upload = isOwn ? activeUploads?.get(fileInfo.fileId) : undefined;
                return (
                  <DmFileMessage
                    fileId={fileInfo.fileId}
                    filename={fileInfo.filename}
                    size={fileInfo.size}
                    mimeType={fileInfo.mimeType}
                    thumbnail={fileInfo.thumbnail}
                    isOutgoing={isOwn}
                    variant="bubble"
                    onDownload={onFileDownload
                      ? () => handleFileDownload(fileInfo.fileId, fileInfo.filename, fileInfo.mimeType)
                      : undefined}
                    isDownloading={downloadingFileId === fileInfo.fileId}
                    isUploading={!!upload}
                    uploadProgress={upload?.progress ?? 0}
                  />
                );
              })() : (
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
          <Button
            variant="tertiary"
            size="xs"
            onPress={() => onOpenThread({ id: msg.id, sender: name, content: text, timestamp: time })}
            iconLeft={<ThreadIcon size={12} color={themeColors.accent.primary} />}
            style={{
              alignSelf: 'flex-start',
              marginTop: 2,
            }}
          >
            <Text size="xs" weight="semibold" style={{ color: themeColors.accent.primary }}>
              {threadCount} {threadCount === 1 ? 'reply' : 'replies'}
            </Text>
          </Button>
        )}
      </RNAnimated.View>
    );
  };

  // ── Render a message group (FlatList item) ──
  const renderGroupItem = ({ item: group, index: groupIdx }: { item: Message[]; index: number }) => {
    const firstMsg = group[0];
    const senderDid = firstMsg.senderDid;
    const isOutgoing = senderDid === myDid;
    const senderName = getSenderName(senderDid);
    const timeStr = formatTime(firstMsg.timestamp);
    const firstText = getMessageText(firstMsg);

    const showUnreadDivider = firstUnreadMessageId != null &&
      group.some((m) => m.id === firstUnreadMessageId);

    // ── Call event: render as an InlineEventCard ──
    if (isCallEventMessage(firstText)) {
      const parsed = parseCallEvent(firstText);
      const displayText = parsed
        ? formatCallEventDisplay(parsed.callType, parsed.status, parsed.duration)
        : firstText;
      const isVideo = parsed?.callType === 'video';
      const isStarted = parsed?.status === 'started';
      const isMissed = parsed?.status === 'missed' || parsed?.status === 'declined';
      const accentColor = isMissed
        ? themeColors.status.danger
        : isStarted
          ? themeColors.status.success
          : themeColors.border.subtle;
      const iconColor = isMissed
        ? themeColors.status.danger
        : isStarted
          ? themeColors.status.success
          : themeColors.text.muted;
      const callIcon = isVideo
        ? <VideoIcon size={16} color={iconColor} />
        : <PhoneIcon size={16} color={iconColor} />;
      const showCallBack = onCallBack && !isStarted;

      return (
        <Box style={{ paddingVertical: 4, alignItems: 'center' }}>
          {showUnreadDivider && (
            <NewMessageDivider style={{ marginBottom: 8, alignSelf: 'stretch' }} />
          )}
          <Box style={{ maxWidth: 380, width: '100%' }}>
            <InlineEventCard
              visible
              accentColor={accentColor}
              icon={callIcon}
              title={displayText}
              subtitle={timeStr}
              actions={showCallBack ? (
                <Button
                  variant="tertiary"
                  size="xs"
                  onPress={() => onCallBack(isVideo ? 'video' : 'voice')}
                  testID="call.history-card.callback"
                >
                  Call back
                </Button>
              ) : undefined}
              testID="call.history-card"
            />
          </Box>
        </Box>
      );
    }

    // ── Regular message group ──
    const renderedMessages = group.map((msg) => renderSingleMessage(msg, isInline));

    if (isInline) {
      return (
        <React.Fragment>
          {showUnreadDivider && (
            <NewMessageDivider style={{ marginVertical: 4 }} />
          )}
          <InlineMsgGroup
            sender={senderName}
            avatar={renderAvatar(senderDid, senderName)}
            timestamp={timeStr}
            status={isOutgoing ? (firstMsg.status as string) : undefined}
            senderColor={isGroupChat ? memberColor(senderDid) : undefined}
            themeColors={themeColors}
            onAvatarPress={(e: any) => onShowProfile(senderName, e, undefined, getSenderAvatar(senderDid))}
          >
            {renderedMessages}
          </InlineMsgGroup>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        {showUnreadDivider && (
          <NewMessageDivider style={{ marginVertical: 4 }} />
        )}
        <MsgGroup
          align={isOutgoing ? 'outgoing' : 'incoming'}
          sender={senderName}
          avatar={renderAvatar(senderDid, senderName)}
          timestamp={timeStr}
          status={isOutgoing ? (firstMsg.status as string) : undefined}
          senderColor={isGroupChat && !isOutgoing ? memberColor(senderDid) : undefined}
          themeColors={themeColors}
          onAvatarPress={(e: any) => onShowProfile(senderName, e, undefined, getSenderAvatar(senderDid))}
        >
          {renderedMessages}
        </MsgGroup>
      </React.Fragment>
    );
  };

  // Stable key: first message ID in the group. This prevents FlatList from
  // unmounting/remounting items when a new group is appended (index-based keys
  // would shift all groups after the new one, causing needless DOM churn).
  const keyExtractor = (item: Message[]) => item[0]?.id ?? 'empty';

  const listHeader = (
    <>
      {stickyHeader}
      <Box style={{ alignItems: 'center', paddingVertical: 8 }}>
        <Text size="xs" style={{ color: themeColors.text.muted }}>Today</Text>
      </Box>
    </>
  );

  const listFooter = (
    <>
      {activeCall && (
        <Box style={{ alignItems: 'center' }}>
          <Box style={{ maxWidth: 380, width: '100%' }}>
            <InlineCallCardMessage
              activeCall={activeCall}
              isGroup={isGroupCall}
              onAccept={onAcceptCall}
              onEnd={onEndCall}
            />
          </Box>
        </Box>
      )}
      {typingUser && (
        <TypingIndicator
          testID={TEST_IDS.CHAT_AREA.TYPING_INDICATOR}
          animation="pulse"
          bubble
          avatar={<Avatar name={typingUser} size="sm" />}
          sender={typingUser}
        />
      )}
    </>
  );

  return (
    <FlatList
      ref={listRef}
      testID={TEST_IDS.CHAT_AREA.MESSAGE_LIST}
      data={groups}
      keyExtractor={keyExtractor}
      renderItem={renderGroupItem}
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 8 }}
      onScroll={handleScroll}
      scrollEventThrottle={100}
      onContentSizeChange={handleContentSizeChange}
      // Virtualization: only render visible groups + small buffer.
      // This prevents all 50 messages from rendering in a single frame,
      // which was causing V8 "Ineffective mark-compacts" tab crashes.
      initialNumToRender={8}
      maxToRenderPerBatch={4}
      windowSize={5}
      removeClippedSubviews={Platform.OS !== 'web'}
    />
  );
});
