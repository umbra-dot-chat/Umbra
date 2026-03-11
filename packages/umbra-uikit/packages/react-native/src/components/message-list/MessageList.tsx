/**
 * @module components/message-list
 * @description React Native MessageList for the Wisp design system.
 *
 * Scrollable message feed using FlatList with infinite scroll, day separators,
 * new message dividers, and scroll-to-bottom behavior.
 */

import React, { forwardRef, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle, FlatList as FlatListType, ListRenderItemInfo } from 'react-native';
import type {
  MessageListItem,
  MessageListEntry,
} from '@coexist/wisp-core/types/MessageList.types';
import { defaultSpacing, defaultTypography, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import { ChatBubble } from '../chat-bubble/ChatBubble';
import { MessageGroup } from '../message-group/MessageGroup';
import { NewMessageDivider } from '../new-message-divider/NewMessageDivider';
import Svg, { Path } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props (RN-specific — extends ViewProps instead of HTMLAttributes)
// ---------------------------------------------------------------------------

/** Message display mode — bubble (chat bubbles, own-right alignment) or inline (left-aligned, no bubbles). */
export type MessageDisplayMode = 'bubble' | 'inline';

export interface MessageListProps extends ViewProps {
  /** Ordered list of entries (messages, separators, markers). */
  entries: MessageListEntry[];
  /** Called when the user scrolls to the top (load older messages). */
  onLoadMore?: () => void;
  /** Whether older messages are being loaded. @default false */
  loadingMore?: boolean;
  /** Whether there are more messages to load. @default false */
  hasMore?: boolean;
  /** Called when a message's reaction is pressed. */
  onReactionClick?: (messageId: string, emoji: string) => void;
  /** Custom renderer for message items. */
  renderMessage?: (message: MessageListItem) => React.ReactNode;
  /** Whether to auto-scroll to the bottom when new messages arrive. @default true */
  autoScrollToBottom?: boolean;
  /** Show a "scroll to bottom" button when scrolled up. @default true */
  showScrollToBottom?: boolean;
  /** Called when the scroll-to-bottom button is pressed. */
  onScrollToBottom?: () => void;
  /** Show loading skeleton for the entire list. @default false */
  skeleton?: boolean;
  /** Empty state content shown when entries is empty. */
  emptyContent?: React.ReactNode;
  /** Content rendered at the very top of the scrollable area, above all messages. Scrolls with the list. */
  stickyHeader?: React.ReactNode;
  /** Message display mode. @default 'bubble' */
  displayMode?: MessageDisplayMode;
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function ChevronDownIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers — group consecutive same-sender messages
// ---------------------------------------------------------------------------

interface GroupedItem {
  key: string;
  kind: 'separator' | 'new-messages' | 'single' | 'group';
  entries: MessageListEntry[];
}

function groupEntries(entries: MessageListEntry[]): GroupedItem[] {
  const result: GroupedItem[] = [];
  let currentGroup: MessageListEntry[] = [];

  const flushGroup = () => {
    if (currentGroup.length > 0) {
      const first = currentGroup[0] as MessageListEntry & { type: 'message' };
      result.push({
        key: `group-${first.id}`,
        kind: currentGroup.length === 1 ? 'single' : 'group',
        entries: currentGroup,
      });
      currentGroup = [];
    }
  };

  for (const entry of entries) {
    if (entry.type === 'separator') {
      flushGroup();
      result.push({ key: `sep-${entry.label}`, kind: 'separator', entries: [entry] });
      continue;
    }

    if (entry.type === 'new-messages') {
      flushGroup();
      result.push({ key: 'new-messages', kind: 'new-messages', entries: [entry] });
      continue;
    }

    // System messages don't group
    if (entry.system) {
      flushGroup();
      result.push({ key: `sys-${entry.id}`, kind: 'single', entries: [entry] });
      continue;
    }

    if (currentGroup.length > 0) {
      const last = currentGroup[currentGroup.length - 1] as MessageListEntry & { type: 'message' };
      if (last.sender === entry.sender && last.isOwn === entry.isOwn) {
        currentGroup.push(entry);
        continue;
      }
      flushGroup();
    }

    currentGroup.push(entry);
  }

  flushGroup();
  return result;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function MessageListSkeleton({
  containerStyle,
  bgColor,
  borderColor,
  isInline = false,
}: {
  containerStyle?: ViewStyle;
  bgColor: string;
  borderColor: string;
  isInline?: boolean;
}) {
  const barBase: ViewStyle = {
    borderRadius: 8,
    backgroundColor: borderColor,
    opacity: 0.3,
  };

  return (
    <View style={[{ flex: 1, backgroundColor: bgColor, padding: defaultSpacing.md }, containerStyle]}>
      {Array.from({ length: 6 }, (_, i) => {
        const isOwn = !isInline && i % 3 === 2;
        return (
          <View
            key={`skel-${i}`}
            style={{
              flexDirection: isInline ? 'row' : 'column',
              alignItems: isInline ? 'flex-start' : (isOwn ? 'flex-end' : 'flex-start'),
              gap: isInline ? 8 : 4,
              marginBottom: defaultSpacing.sm,
            }}
          >
            {isInline && (
              <View style={[barBase, { width: 32, height: 32, borderRadius: 16 }]} />
            )}
            <View style={{ gap: 4 }}>
              {!isOwn && (
                <View style={[barBase, { width: 60 + (i % 3) * 20, height: 12 }]} />
              )}
              <View
                style={[barBase, { width: 140 + (i % 4) * 40, height: isInline ? 16 : 36, borderRadius: isInline ? 4 : 12 }]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// MessageList
// ---------------------------------------------------------------------------

/**
 * MessageList -- Scrollable message feed using FlatList.
 *
 * @remarks
 * React Native version that uses FlatList for efficient list rendering.
 * Groups consecutive same-sender messages, renders day separators,
 * new message dividers, and a floating scroll-to-bottom button.
 *
 * @example
 * ```tsx
 * <MessageList
 *   entries={[
 *     { type: 'separator', label: 'Today' },
 *     { type: 'message', id: '1', sender: 'Alice', content: 'Hello!', timestamp: '2:30 PM' },
 *   ]}
 *   onLoadMore={() => fetchMore()}
 *   hasMore={true}
 * />
 * ```
 */
export const MessageList = forwardRef<FlatListType, MessageListProps>(
  function MessageList(
    {
      entries,
      onLoadMore,
      loadingMore = false,
      hasMore = false,
      onReactionClick,
      renderMessage,
      autoScrollToBottom = true,
      showScrollToBottom = true,
      onScrollToBottom,
      skeleton = false,
      emptyContent,
      stickyHeader,
      displayMode = 'bubble',
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const isInline = displayMode === 'inline';
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const flatListRef = useRef<FlatListType>(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    // Combine refs
    const setRef = useCallback(
      (instance: FlatListType | null) => {
        (flatListRef as React.MutableRefObject<FlatListType | null>).current = instance;
        if (typeof ref === 'function') ref(instance);
        else if (ref) (ref as React.MutableRefObject<FlatListType | null>).current = instance;
      },
      [ref],
    );

    // Styles
    const containerStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
      backgroundColor: themeColors.background.canvas,
      position: 'relative',
    }), [themeColors]);

    const daySepContainerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.md,
      paddingVertical: defaultSpacing.sm,
    }), []);

    const daySepLineStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
      height: 1,
      backgroundColor: themeColors.border.subtle,
      opacity: 0.5,
    }), [themeColors]);

    const daySepLabelStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: themeColors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    }), [themeColors]);

    const scrollBtnStyle = useMemo<ViewStyle>(() => ({
      position: 'absolute',
      bottom: defaultSpacing.md,
      right: defaultSpacing.md,
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.background.surface,
      borderWidth: 1,
      borderColor: themeColors.border.subtle,
      zIndex: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    }), [themeColors]);

    const emptyContainerStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: defaultSpacing.xl,
    }), []);

    const emptyTextStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      color: themeColors.text.muted,
    }), [themeColors]);

    const loadingFooterStyle = useMemo<ViewStyle>(() => ({
      alignItems: 'center',
      justifyContent: 'center',
      padding: defaultSpacing.md,
    }), []);

    // ── Inline mode styles ──────────────────────────────────────────────

    const inlineRowStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: defaultSpacing.sm,
      paddingVertical: 2,
    }), []);

    const inlineAvatarStyle = useMemo<ViewStyle>(() => ({
      width: 32,
      height: 32,
      borderRadius: 16,
      overflow: 'hidden',
      marginTop: 2,
    }), []);

    const inlineHeaderStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: defaultSpacing.xs,
    }), []);

    const inlineSenderStyle = useMemo<TextStyle>(() => ({
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      fontSize: defaultTypography.sizes.sm.fontSize,
      color: themeColors.text.primary,
    }), [themeColors]);

    const inlineTimestampStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      color: themeColors.text.muted,
    }), [themeColors]);

    const inlineContentStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      color: themeColors.text.primary,
    }), [themeColors]);

    const inlineFollowUpStyle = useMemo<ViewStyle>(() => ({
      paddingLeft: 32 + defaultSpacing.sm, // Align with content after avatar
    }), []);

    // Grouped data
    const grouped = useMemo(() => groupEntries(entries), [entries]);

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
      setShowScrollBtn(false);
      onScrollToBottom?.();
    }, [onScrollToBottom]);

    // Handle scroll for showing/hiding scroll-to-bottom button
    const handleScroll = useCallback(
      (event: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
        if (!showScrollToBottom) return;
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
        setShowScrollBtn(distanceFromBottom > 100);
      },
      [showScrollToBottom],
    );

    // Handle reaching end for load more (FlatList onEndReached)
    const handleEndReached = useCallback(() => {
      // FlatList inverted: onEndReached fires at the "start" of original data
      // We use onStartReached instead for loading older messages
    }, []);

    // Skeleton early return
    if (skeleton) {
      return (
        <MessageListSkeleton
          containerStyle={userStyle as ViewStyle}
          bgColor={themeColors.background.canvas}
          borderColor={themeColors.border.subtle}
          isInline={isInline}
        />
      );
    }

    // Render a grouped item
    const renderItem = ({ item }: ListRenderItemInfo<GroupedItem>) => {
      // Day separator
      if (item.kind === 'separator') {
        const sep = item.entries[0] as MessageListEntry & { type: 'separator' };
        return (
          <View style={daySepContainerStyle} accessibilityRole="none" accessibilityLabel={sep.label}>
            <View style={daySepLineStyle} />
            <Text style={daySepLabelStyle}>{sep.label}</Text>
            <View style={daySepLineStyle} />
          </View>
        );
      }

      // New message divider
      if (item.kind === 'new-messages') {
        const marker = item.entries[0] as MessageListEntry & { type: 'new-messages' };
        return (
          <NewMessageDivider label={marker.label ?? 'New Messages'} />
        );
      }

      // Single message
      if (item.kind === 'single') {
        const msg = item.entries[0] as MessageListEntry & { type: 'message' };
        if (renderMessage) {
          return <>{renderMessage(msg)}</>;
        }

        // Inline mode: left-aligned, no bubble
        if (isInline) {
          return (
            <View style={inlineRowStyle}>
              <View style={inlineAvatarStyle}>
                {msg.avatar}
              </View>
              <View style={{ flex: 1 }}>
                <View style={inlineHeaderStyle}>
                  <Text style={[inlineSenderStyle, msg.senderColor ? { color: msg.senderColor } : undefined]}>
                    {msg.sender}
                  </Text>
                  <Text style={inlineTimestampStyle}>{msg.timestamp}</Text>
                  {msg.edited && <Text style={inlineTimestampStyle}>(edited)</Text>}
                </View>
                <Text style={inlineContentStyle}>{msg.content}</Text>
              </View>
            </View>
          );
        }

        return (
          <ChatBubble
            align={msg.isOwn ? 'outgoing' : 'incoming'}
            timestamp={msg.timestamp}
          >
            {msg.content}
          </ChatBubble>
        );
      }

      // Message group
      if (item.kind === 'group') {
        const first = item.entries[0] as MessageListEntry & { type: 'message' };
        const last = item.entries[item.entries.length - 1] as MessageListEntry & { type: 'message' };

        // Inline mode: first message shows avatar + name, rest just show content indented
        if (isInline) {
          return (
            <View>
              {item.entries.map((entry, entryIdx) => {
                const m = entry as MessageListEntry & { type: 'message' };
                if (renderMessage) {
                  return <React.Fragment key={m.id}>{renderMessage(m)}</React.Fragment>;
                }
                if (entryIdx === 0) {
                  // First message: avatar + sender name + timestamp + content
                  return (
                    <View key={m.id} style={inlineRowStyle}>
                      <View style={inlineAvatarStyle}>
                        {m.avatar}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={inlineHeaderStyle}>
                          <Text style={[inlineSenderStyle, m.senderColor ? { color: m.senderColor } : undefined]}>
                            {m.sender}
                          </Text>
                          <Text style={inlineTimestampStyle}>{m.timestamp}</Text>
                          {m.edited && <Text style={inlineTimestampStyle}>(edited)</Text>}
                        </View>
                        <Text style={inlineContentStyle}>{m.content}</Text>
                      </View>
                    </View>
                  );
                }
                // Follow-up messages: just content, aligned with first message's content
                return (
                  <View key={m.id} style={inlineFollowUpStyle}>
                    <Text style={inlineContentStyle}>
                      {m.content}
                      {m.edited && <Text style={inlineTimestampStyle}> (edited)</Text>}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        }

        return (
          <MessageGroup
            align={first.isOwn ? 'outgoing' : 'incoming'}
            sender={first.isOwn ? undefined : first.sender}
            avatar={first.avatar}
            timestamp={last.timestamp}
          >
            {item.entries.map((entry) => {
              const m = entry as MessageListEntry & { type: 'message' };
              if (renderMessage) {
                return <React.Fragment key={m.id}>{renderMessage(m)}</React.Fragment>;
              }
              return (
                <ChatBubble
                  key={m.id}
                  align={m.isOwn ? 'outgoing' : 'incoming'}
                >
                  {m.content}
                </ChatBubble>
              );
            })}
          </MessageGroup>
        );
      }

      return null;
    };

    // Key extractor
    const keyExtractor = (item: GroupedItem) => item.key;

    // Empty component
    const ListEmptyComponent = (
      <View style={emptyContainerStyle}>
        {emptyContent ?? (
          <Text style={emptyTextStyle}>No messages yet</Text>
        )}
      </View>
    );

    // Header component (sticky header + loading indicator at top of scroll)
    const ListHeaderComponent = (stickyHeader || loadingMore) ? (
      <View>
        {stickyHeader}
        {loadingMore && (
          <View style={loadingFooterStyle}>
            <ActivityIndicator size="small" color={themeColors.text.muted} />
          </View>
        )}
      </View>
    ) : null;

    return (
      <View style={[containerStyle, userStyle as ViewStyle]} {...rest}>
        <FlatList
          ref={setRef}
          data={grouped}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            padding: defaultSpacing.md,
            gap: defaultSpacing.sm,
            flexGrow: 1,
          }}
          ListEmptyComponent={ListEmptyComponent}
          ListHeaderComponent={ListHeaderComponent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReached={hasMore ? onLoadMore : undefined}
          onEndReachedThreshold={0.1}
          showsVerticalScrollIndicator={false}
          // Auto-scroll to bottom for new messages
          onContentSizeChange={() => {
            if (autoScrollToBottom && !showScrollBtn) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />

        {/* Scroll to bottom button */}
        {showScrollToBottom && showScrollBtn && (
          <Pressable
            style={scrollBtnStyle}
            onPress={scrollToBottom}
            accessibilityRole="button"
            accessibilityLabel="Scroll to bottom"
          >
            <ChevronDownIcon size={18} color={themeColors.text.primary} />
          </Pressable>
        )}
      </View>
    );
  },
);

MessageList.displayName = 'MessageList';
