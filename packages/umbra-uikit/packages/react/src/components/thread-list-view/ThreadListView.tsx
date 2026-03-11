/**
 * @module ThreadListView
 * @description A view showing all active threads in a channel.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { ThreadListViewProps, ThreadListItem } from '@coexist/wisp-core/types/ThreadListView.types';
import {
  buildThreadListContainerStyle,
  buildHeaderStyle,
  buildHeaderTitleStyle,
  buildCloseButtonStyle,
  buildThreadCardStyle,
  buildSenderRowStyle,
  buildSenderNameStyle,
  buildPreviewTextStyle,
  buildMetadataRowStyle,
  buildReplyCountBadgeStyle,
  buildActivityTimestampStyle,
  buildEmptyStateStyle,
  buildSkeletonCardStyle,
  buildSkeletonLineStyle,
} from '@coexist/wisp-core/styles/ThreadListView.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function XIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function MessageSquareIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BellIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function BellOffIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" />
      <path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ThreadCard (internal)
// ---------------------------------------------------------------------------

function ThreadCard({
  thread,
  onThreadClick,
  onFollowToggle,
}: {
  thread: ThreadListItem;
  onThreadClick?: (threadId: string) => void;
  onFollowToggle?: (threadId: string) => void;
}) {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState(false);

  const cardStyle = useMemo(
    () => buildThreadCardStyle(theme, hovered, thread.hasUnread ?? false),
    [theme, hovered, thread.hasUnread],
  );

  const senderRowStyle = useMemo(() => buildSenderRowStyle(theme), [theme]);
  const senderNameStyle = useMemo(() => buildSenderNameStyle(theme), [theme]);
  const previewTextStyle = useMemo(() => buildPreviewTextStyle(theme), [theme]);
  const metadataRowStyle = useMemo(() => buildMetadataRowStyle(theme), [theme]);
  const replyCountBadgeStyle = useMemo(() => buildReplyCountBadgeStyle(theme), [theme]);
  const activityTimestampStyle = useMemo(() => buildActivityTimestampStyle(theme), [theme]);

  const handleClick = useCallback(() => {
    onThreadClick?.(thread.id);
  }, [onThreadClick, thread.id]);

  const handleFollowClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onFollowToggle?.(thread.id);
    },
    [onFollowToggle, thread.id],
  );

  const replyText = thread.replyCount === 1 ? '1 reply' : `${thread.replyCount} replies`;

  return (
    <div
      style={cardStyle}
      role="button"
      tabIndex={0}
      aria-label={`Thread by ${thread.parentSender}: ${thread.parentPreview}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Sender row */}
      <div style={senderRowStyle}>
        {thread.parentAvatar && (
          <span style={{ display: 'inline-flex', flexShrink: 0 }}>
            {thread.parentAvatar}
          </span>
        )}
        <span style={senderNameStyle}>{thread.parentSender}</span>
      </div>

      {/* Preview */}
      <div style={previewTextStyle} data-testid={`thread-preview-${thread.id}`}>
        {thread.name || thread.parentPreview}
      </div>

      {/* Metadata row */}
      <div style={metadataRowStyle}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <MessageSquareIcon size={12} color={theme.colors.text.link} />
          <span style={replyCountBadgeStyle}>{replyText}</span>
        </span>
        <span style={activityTimestampStyle}>{thread.lastActivityAt}</span>
        <span style={{ flex: 1 }} />
        {onFollowToggle && (
          <button
            type="button"
            onClick={handleFollowClick}
            aria-label={thread.isFollowing ? 'Unfollow thread' : 'Follow thread'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              border: `1px solid ${theme.colors.border.subtle}`,
              borderRadius: theme.radii.sm,
              background: 'none',
              cursor: 'pointer',
              fontSize: theme.typography.sizes.xs.fontSize,
              fontFamily: 'inherit',
              color: thread.isFollowing ? theme.colors.text.secondary : theme.colors.text.link,
            }}
          >
            {thread.isFollowing
              ? <BellOffIcon size={12} color="currentColor" />
              : <BellIcon size={12} color="currentColor" />
            }
            {thread.isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonCard (internal)
// ---------------------------------------------------------------------------

function SkeletonCard() {
  const { theme } = useTheme();
  const cardStyle = useMemo(() => buildSkeletonCardStyle(theme), [theme]);
  return (
    <div style={cardStyle} aria-hidden>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        <div style={buildSkeletonLineStyle(theme, 24, 24)} />
        <div style={buildSkeletonLineStyle(theme, 100, 14)} />
      </div>
      <div style={buildSkeletonLineStyle(theme, '80%', 14)} />
      <div style={{ display: 'flex', gap: theme.spacing.sm }}>
        <div style={buildSkeletonLineStyle(theme, 60, 12)} />
        <div style={buildSkeletonLineStyle(theme, 80, 12)} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ThreadListView
// ---------------------------------------------------------------------------

/**
 * ThreadListView — A view showing all active threads in a channel.
 *
 * @remarks
 * Renders a list of thread cards with sender info, message preview,
 * reply count, and follow/unfollow toggle. Supports empty, loading,
 * and skeleton states.
 *
 * @example
 * ```tsx
 * <ThreadListView
 *   threads={threads}
 *   onThreadClick={(id) => openThread(id)}
 *   onFollowToggle={(id) => toggleFollow(id)}
 *   onClose={() => closePanel()}
 * />
 * ```
 */
export const ThreadListView = forwardRef<HTMLDivElement, ThreadListViewProps>(
  function ThreadListView(
    {
      threads,
      onThreadClick,
      onFollowToggle,
      title = 'Threads',
      onClose,
      emptyText = 'No threads yet',
      loading = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const containerStyle = useMemo(
      () => buildThreadListContainerStyle(theme),
      [theme],
    );

    const headerStyle = useMemo(() => buildHeaderStyle(theme), [theme]);
    const headerTitleStyle = useMemo(() => buildHeaderTitleStyle(theme), [theme]);
    const closeButtonStyle = useMemo(() => buildCloseButtonStyle(theme), [theme]);
    const emptyStateStyle = useMemo(() => buildEmptyStateStyle(theme), [theme]);

    // Skeleton
    if (skeleton) {
      return (
        <div ref={ref} className={className} style={{ ...containerStyle, ...userStyle }} {...rest}>
          <div style={headerStyle}>
            <span style={headerTitleStyle}>{title}</span>
          </div>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    return (
      <div ref={ref} className={className} style={{ ...containerStyle, ...userStyle }} {...rest}>
        {/* Header */}
        <div style={headerStyle}>
          <span style={headerTitleStyle}>{title}</span>
          {onClose && (
            <button
              type="button"
              style={closeButtonStyle}
              onClick={onClose}
              aria-label="Close threads panel"
            >
              <XIcon size={16} color="currentColor" />
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && threads.length === 0 && (
          <div style={emptyStateStyle}>Loading...</div>
        )}

        {/* Empty state */}
        {!loading && threads.length === 0 && (
          <div style={emptyStateStyle} data-testid="thread-list-empty">
            {emptyText}
          </div>
        )}

        {/* Thread cards */}
        <div style={{ overflow: 'auto', flex: 1 }}>
          {threads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              onThreadClick={onThreadClick}
              onFollowToggle={onFollowToggle}
            />
          ))}
        </div>
      </div>
    );
  },
);

ThreadListView.displayName = 'ThreadListView';
