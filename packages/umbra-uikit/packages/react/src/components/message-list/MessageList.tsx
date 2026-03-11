/**
 * @module MessageList
 * @description Scrollable message feed with infinite scroll, day separators,
 * new message dividers, and scroll-to-bottom behavior.
 */
import React, { forwardRef, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type {
  MessageListProps,
  MessageListEntry,
  MessageListItem,
} from '@coexist/wisp-core/types/MessageList.types';
import {
  buildContainerStyle,
  buildScrollAreaStyle,
  buildScrollInnerStyle,
  buildDaySeparatorStyle,
  buildDaySeparatorLineStyle,
  buildDaySeparatorLabelStyle,
  buildScrollToBottomStyle,
  buildLoadingMoreStyle,
  buildEmptyStyle,
} from '@coexist/wisp-core/styles/MessageList.styles';
import { useTheme } from '../../providers';
import { Text } from '../../primitives';
import { ChatBubble } from '../chat-bubble/ChatBubble';
import { MessageGroup } from '../message-group/MessageGroup';
import { NewMessageDivider } from '../new-message-divider/NewMessageDivider';
import { Spinner } from '../../primitives/spinner/Spinner';

// ---------------------------------------------------------------------------
// Inline SVG — ChevronDown icon for scroll-to-bottom button
// ---------------------------------------------------------------------------

function ChevronDownIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Groups consecutive message entries from the same sender into arrays.
 * Separators and markers break group runs.
 */
function groupEntries(entries: MessageListEntry[]): Array<MessageListEntry | MessageListEntry[]> {
  const result: Array<MessageListEntry | MessageListEntry[]> = [];
  let currentGroup: MessageListEntry[] = [];

  for (const entry of entries) {
    if (entry.type !== 'message') {
      // Flush any active group
      if (currentGroup.length > 0) {
        result.push(currentGroup);
        currentGroup = [];
      }
      result.push(entry);
      continue;
    }

    // Skip system messages from grouping
    if (entry.system) {
      if (currentGroup.length > 0) {
        result.push(currentGroup);
        currentGroup = [];
      }
      result.push(entry);
      continue;
    }

    // Check if this message can be appended to the current group
    if (currentGroup.length > 0) {
      const last = currentGroup[currentGroup.length - 1] as MessageListEntry & { type: 'message' };
      if (last.type === 'message' && last.sender === entry.sender && last.isOwn === entry.isOwn) {
        currentGroup.push(entry);
        continue;
      }
      // Different sender — flush group
      result.push(currentGroup);
      currentGroup = [];
    }

    currentGroup.push(entry);
  }

  // Flush remaining
  if (currentGroup.length > 0) {
    result.push(currentGroup);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function MessageListSkeleton({
  containerStyle,
  scrollAreaStyle,
  innerStyle,
  isInline = false,
}: {
  containerStyle: React.CSSProperties;
  scrollAreaStyle: React.CSSProperties;
  innerStyle: React.CSSProperties;
  isInline?: boolean;
}) {
  const barBase: React.CSSProperties = {
    borderRadius: 8,
    backgroundColor: 'currentColor',
    opacity: 0.08,
  };

  return (
    <div style={containerStyle}>
      <div style={scrollAreaStyle}>
        <div style={innerStyle}>
          {Array.from({ length: 6 }, (_, i) => {
            const isOwn = !isInline && i % 3 === 2;
            return (
              <div
                key={`skel-${i}`}
                style={{
                  display: 'flex',
                  flexDirection: isInline ? 'row' : 'column',
                  alignItems: isInline ? 'flex-start' : (isOwn ? 'flex-end' : 'flex-start'),
                  gap: isInline ? 8 : 4,
                }}
              >
                {isInline && (
                  <div style={{ ...barBase, width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {!isOwn && (
                    <div style={{ ...barBase, width: 60 + (i % 3) * 20, height: 12 }} />
                  )}
                  <div
                    style={{
                      ...barBase,
                      width: 140 + (i % 4) * 40,
                      height: isInline ? 16 : 36,
                      borderRadius: isInline ? 4 : 12,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MessageList
// ---------------------------------------------------------------------------

/**
 * MessageList — A scrollable container for rendering a list of messages.
 *
 * @remarks
 * Key features:
 * - IntersectionObserver-based infinite scroll when scrolled near top.
 * - Groups consecutive same-sender messages into MessageGroup.
 * - Renders DaySeparator with centered date labels.
 * - Renders NewMessageMarker with the NewMessageDivider component.
 * - Floating "scroll to bottom" button when scrolled up.
 * - Loading spinner at top when loadingMore.
 * - Empty state when no entries.
 *
 * @example
 * ```tsx
 * <MessageList
 *   entries={[
 *     { type: 'separator', label: 'Today' },
 *     { type: 'message', id: '1', sender: 'Alice', content: 'Hello!', timestamp: '2:30 PM' },
 *     { type: 'message', id: '2', sender: 'Alice', content: 'How are you?', timestamp: '2:31 PM' },
 *     { type: 'new-messages' },
 *     { type: 'message', id: '3', sender: 'You', content: 'Great!', timestamp: '2:32 PM', isOwn: true },
 *   ]}
 *   onLoadMore={() => fetchMore()}
 *   hasMore={true}
 * />
 * ```
 */
export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
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
      displayMode = 'bubble',
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const isInline = displayMode === 'inline';
    const { theme } = useTheme();
    const themeColors = theme.colors;

    // Styles
    const containerStyle = useMemo(
      () => buildContainerStyle(theme),
      [theme],
    );

    const scrollAreaStyle = useMemo(
      () => buildScrollAreaStyle(),
      [],
    );

    const innerStyle = useMemo(
      () => buildScrollInnerStyle(theme),
      [theme],
    );

    const daySepStyle = useMemo(
      () => buildDaySeparatorStyle(theme),
      [theme],
    );

    const daySepLineStyle = useMemo(
      () => buildDaySeparatorLineStyle(theme),
      [theme],
    );

    const daySepLabelStyle = useMemo(
      () => buildDaySeparatorLabelStyle(theme),
      [theme],
    );

    const scrollBtnStyle = useMemo(
      () => buildScrollToBottomStyle(theme),
      [theme],
    );

    const loadingStyle = useMemo(
      () => buildLoadingMoreStyle(theme),
      [theme],
    );

    const emptyStyle = useMemo(
      () => buildEmptyStyle(theme),
      [theme],
    );

    // Refs and state
    const scrollRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const prevEntryCountRef = useRef(entries.length);

    // Check if user is near bottom of scroll
    const isNearBottom = useCallback(() => {
      const el = scrollRef.current;
      if (!el) return true;
      return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    }, []);

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
      setShowScrollBtn(false);
      onScrollToBottom?.();
    }, [onScrollToBottom]);

    // Auto-scroll when new messages arrive
    useEffect(() => {
      if (autoScrollToBottom && entries.length > prevEntryCountRef.current) {
        if (isNearBottom()) {
          // Use requestAnimationFrame so DOM has time to render
          requestAnimationFrame(() => {
            const el = scrollRef.current;
            if (el) el.scrollTop = el.scrollHeight;
          });
        }
      }
      prevEntryCountRef.current = entries.length;
    }, [entries.length, autoScrollToBottom, isNearBottom]);

    // Scroll event handler for scroll-to-bottom button visibility
    const handleScroll = useCallback(() => {
      if (!showScrollToBottom) return;
      setShowScrollBtn(!isNearBottom());
    }, [showScrollToBottom, isNearBottom]);

    // IntersectionObserver for infinite scroll (load more when sentinel is visible)
    useEffect(() => {
      if (!hasMore || !onLoadMore) return;

      const sentinel = sentinelRef.current;
      if (!sentinel) return;

      const observer = new IntersectionObserver(
        (observerEntries) => {
          if (observerEntries[0]?.isIntersecting && !loadingMore) {
            onLoadMore();
          }
        },
        { root: scrollRef.current, threshold: 0.1 },
      );

      observer.observe(sentinel);
      return () => observer.disconnect();
    }, [hasMore, onLoadMore, loadingMore]);

    // Skeleton early return
    if (skeleton) {
      return (
        <MessageListSkeleton
          containerStyle={{ ...containerStyle, ...userStyle }}
          scrollAreaStyle={scrollAreaStyle}
          innerStyle={innerStyle}
          isInline={isInline}
        />
      );
    }

    // Empty state
    if (entries.length === 0) {
      return (
        <div
          ref={ref}
          className={className}
          style={{ ...containerStyle, ...userStyle }}
          {...rest}
        >
          <div style={emptyStyle} data-testid="message-list-empty">
            {emptyContent ?? (
              <Text style={{ color: themeColors.text.muted }}>No messages yet</Text>
            )}
          </div>
        </div>
      );
    }

    // Group entries
    const grouped = groupEntries(entries);

    // ── Inline mode styles ──────────────────────────────────────────────
    const inlineRowStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      paddingTop: 2,
      paddingBottom: 2,
    };

    const inlineAvatarStyle: React.CSSProperties = {
      width: 32,
      height: 32,
      borderRadius: '50%',
      flexShrink: 0,
      marginTop: 2,
    };

    const inlineHeaderStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: theme.spacing.xs,
    };

    const inlineSenderStyle: React.CSSProperties = {
      fontWeight: theme.typography.weights.semibold,
      fontSize: theme.typography.sizes.sm.fontSize,
      color: themeColors.text.primary,
    };

    const inlineTimestampStyle: React.CSSProperties = {
      fontSize: theme.typography.sizes.xs.fontSize,
      color: themeColors.text.muted,
    };

    const inlineContentStyle: React.CSSProperties = {
      fontSize: theme.typography.sizes.sm.fontSize,
      lineHeight: `${theme.typography.sizes.sm.lineHeight}px`,
      color: themeColors.text.primary,
    };

    const inlineFollowUpContentStyle: React.CSSProperties = {
      ...inlineContentStyle,
      paddingLeft: 32 + theme.spacing.sm,  // Align with content after avatar
    };

    // Render a single message via ChatBubble or custom renderer
    const renderSingleMessage = (msg: MessageListEntry & { type: 'message' }) => {
      if (renderMessage) {
        return renderMessage(msg);
      }

      // Inline mode: left-aligned, no bubble
      if (isInline) {
        return (
          <div key={msg.id} style={inlineRowStyle}>
            <div style={inlineAvatarStyle}>
              {msg.avatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={inlineHeaderStyle}>
                <span style={{ ...inlineSenderStyle, ...(msg.senderColor ? { color: msg.senderColor } : {}) }}>
                  {msg.sender}
                </span>
                <span style={inlineTimestampStyle}>{msg.timestamp}</span>
                {msg.edited && <span style={inlineTimestampStyle}>(edited)</span>}
              </div>
              <div style={inlineContentStyle}>{msg.content}</div>
            </div>
          </div>
        );
      }

      return (
        <ChatBubble
          key={msg.id}
          align={msg.isOwn ? 'outgoing' : 'incoming'}
          timestamp={msg.timestamp}
          reactions={msg.reactions}
          onReactionClick={
            onReactionClick
              ? (emoji: string) => onReactionClick(msg.id, emoji)
              : undefined
          }
          replyTo={msg.replyTo}
          edited={msg.edited}
        >
          {msg.content}
        </ChatBubble>
      );
    };

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        data-testid="message-list"
        {...rest}
      >
        <div
          ref={scrollRef}
          style={scrollAreaStyle}
          onScroll={handleScroll}
          data-testid="message-list-scroll"
        >
          <div style={innerStyle}>
            {/* Sentinel for infinite scroll */}
            {hasMore && (
              <div ref={sentinelRef} style={{ height: 1 }} data-testid="load-more-sentinel" />
            )}

            {/* Loading indicator */}
            {loadingMore && (
              <div style={loadingStyle} data-testid="loading-more">
                <Spinner size="sm" label="Loading..." />
              </div>
            )}

            {/* Render grouped entries */}
            {grouped.map((item, idx) => {
              // Day separator
              if (!Array.isArray(item) && item.type === 'separator') {
                return (
                  <div key={`sep-${idx}`} style={daySepStyle} data-testid="day-separator">
                    <div style={daySepLineStyle} />
                    <Text style={daySepLabelStyle}>{item.label}</Text>
                    <div style={daySepLineStyle} />
                  </div>
                );
              }

              // New message divider
              if (!Array.isArray(item) && item.type === 'new-messages') {
                return (
                  <NewMessageDivider
                    key={`new-msg-${idx}`}
                    label={item.label ?? 'New Messages'}
                    data-testid="new-message-divider"
                  />
                );
              }

              // Single message (system or ungrouped)
              if (!Array.isArray(item) && item.type === 'message') {
                return (
                  <div key={item.id}>
                    {renderSingleMessage(item)}
                  </div>
                );
              }

              // Grouped messages (same sender)
              if (Array.isArray(item) && item.length > 0) {
                const first = item[0] as MessageListEntry & { type: 'message' };
                const last = item[item.length - 1] as MessageListEntry & { type: 'message' };

                // Inline mode: first message shows avatar + name, rest just show content indented
                if (isInline) {
                  return (
                    <div key={`group-${first.id}`}>
                      {item.map((msg, msgIdx) => {
                        const m = msg as MessageListEntry & { type: 'message' };
                        if (renderMessage) {
                          return <React.Fragment key={m.id}>{renderMessage(m)}</React.Fragment>;
                        }
                        if (msgIdx === 0) {
                          // First message: avatar + sender name + timestamp + content
                          return (
                            <div key={m.id} style={inlineRowStyle}>
                              <div style={inlineAvatarStyle}>
                                {m.avatar}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={inlineHeaderStyle}>
                                  <span style={{ ...inlineSenderStyle, ...(m.senderColor ? { color: m.senderColor } : {}) }}>
                                    {m.sender}
                                  </span>
                                  <span style={inlineTimestampStyle}>{m.timestamp}</span>
                                  {m.edited && <span style={inlineTimestampStyle}>(edited)</span>}
                                </div>
                                <div style={inlineContentStyle}>{m.content}</div>
                              </div>
                            </div>
                          );
                        }
                        // Follow-up messages: just content, aligned with first message's content
                        return (
                          <div key={m.id} style={inlineFollowUpContentStyle}>
                            {m.content}
                            {m.edited && <span style={inlineTimestampStyle}> (edited)</span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <MessageGroup
                    key={`group-${first.id}`}
                    align={first.isOwn ? 'outgoing' : 'incoming'}
                    sender={first.isOwn ? undefined : first.sender}
                    avatar={first.avatar}
                    timestamp={last.timestamp}
                  >
                    {item.map((msg) => {
                      const m = msg as MessageListEntry & { type: 'message' };
                      if (renderMessage) {
                        return <React.Fragment key={m.id}>{renderMessage(m)}</React.Fragment>;
                      }
                      return (
                        <ChatBubble
                          key={m.id}
                          align={m.isOwn ? 'outgoing' : 'incoming'}
                          reactions={m.reactions}
                          onReactionClick={
                            onReactionClick
                              ? (emoji: string) => onReactionClick(m.id, emoji)
                              : undefined
                          }
                          replyTo={m.replyTo}
                          edited={m.edited}
                        >
                          {m.content}
                        </ChatBubble>
                      );
                    })}
                  </MessageGroup>
                );
              }

              return null;
            })}
          </div>
        </div>

        {/* Scroll to bottom button */}
        {showScrollToBottom && showScrollBtn && (
          <button
            type="button"
            style={scrollBtnStyle}
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
            data-testid="scroll-to-bottom"
          >
            <ChevronDownIcon size={18} color={themeColors.text.primary} />
          </button>
        )}
      </div>
    );
  },
);

MessageList.displayName = 'MessageList';
