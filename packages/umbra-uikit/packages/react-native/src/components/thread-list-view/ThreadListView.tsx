/**
 * @module components/thread-list-view
 * @description React Native ThreadListView for the Wisp design system.
 *
 * A view showing all active threads in a channel.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text as RNText, Pressable, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThreadListItem {
  id: string;
  name?: string;
  parentPreview: string;
  parentSender: string;
  parentAvatar?: React.ReactNode;
  replyCount: number;
  lastActivityAt: string;
  isFollowing?: boolean;
  hasUnread?: boolean;
}

export interface ThreadListViewProps extends ViewProps {
  threads: ThreadListItem[];
  onThreadPress?: (threadId: string) => void;
  onFollowToggle?: (threadId: string) => void;
  title?: string;
  onClose?: () => void;
  emptyText?: string;
  loading?: boolean;
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function XIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6 6 18" />
      <Path d="m6 6 12 12" />
    </Svg>
  );
}

function MessageSquareIcon({ size = 12, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

function BellIcon({ size = 12, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// ThreadCard (internal)
// ---------------------------------------------------------------------------

function ThreadCard({
  thread,
  onThreadPress,
  onFollowToggle,
}: {
  thread: ThreadListItem;
  onThreadPress?: (threadId: string) => void;
  onFollowToggle?: (threadId: string) => void;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const cardStyle = useMemo<ViewStyle>(() => ({
    paddingVertical: defaultSpacing.md,
    paddingHorizontal: defaultSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: tc.border.subtle,
    borderLeftWidth: 3,
    borderLeftColor: thread.hasUnread ? tc.accent.primary : 'transparent',
    gap: defaultSpacing.xs,
  }), [tc, thread.hasUnread]);

  const replyText = thread.replyCount === 1 ? '1 reply' : `${thread.replyCount} replies`;

  return (
    <Pressable
      onPress={() => onThreadPress?.(thread.id)}
      accessibilityRole="button"
      accessibilityLabel={`Thread by ${thread.parentSender}: ${thread.parentPreview}`}
      style={cardStyle}
    >
      {/* Sender row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
        {thread.parentAvatar && (
          <View style={{ flexShrink: 0 }}>{thread.parentAvatar}</View>
        )}
        <RNText style={{
          fontSize: defaultTypography.sizes.sm.fontSize,
          fontWeight: '600',
          color: tc.text.primary,
        } as TextStyle}>
          {thread.parentSender}
        </RNText>
      </View>

      {/* Preview */}
      <RNText
        numberOfLines={1}
        style={{
          fontSize: defaultTypography.sizes.sm.fontSize,
          color: tc.text.secondary,
        } as TextStyle}
      >
        {thread.name || thread.parentPreview}
      </RNText>

      {/* Metadata */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm, marginTop: defaultSpacing['2xs'] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MessageSquareIcon size={12} color={tc.text.link} />
          <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.link, fontWeight: '500' } as TextStyle}>
            {replyText}
          </RNText>
        </View>
        <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
          {thread.lastActivityAt}
        </RNText>
        <View style={{ flex: 1 }} />
        {onFollowToggle && (
          <Pressable
            onPress={() => onFollowToggle(thread.id)}
            accessibilityRole="button"
            accessibilityLabel={thread.isFollowing ? 'Unfollow thread' : 'Follow thread'}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingVertical: 2, paddingHorizontal: 8,
              borderWidth: 1, borderColor: tc.border.subtle, borderRadius: defaultRadii.sm,
            }}
          >
            <BellIcon size={12} color={thread.isFollowing ? tc.text.secondary : tc.text.link} />
            <RNText style={{
              fontSize: defaultTypography.sizes.xs.fontSize,
              color: thread.isFollowing ? tc.text.secondary : tc.text.link,
            } as TextStyle}>
              {thread.isFollowing ? 'Following' : 'Follow'}
            </RNText>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// ThreadListView
// ---------------------------------------------------------------------------

export const ThreadListView = forwardRef<View, ThreadListViewProps>(
  function ThreadListView(
    {
      threads,
      onThreadPress,
      onFollowToggle,
      title = 'Threads',
      onClose,
      emptyText = 'No threads yet',
      loading = false,
      skeleton = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;

    const containerStyle = useMemo<ViewStyle>(() => ({
      backgroundColor: tc.background.surface,
      borderWidth: 1,
      borderColor: tc.border.subtle,
      borderRadius: defaultRadii.lg,
      overflow: 'hidden',
    }), [tc]);

    const headerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: defaultSpacing.md,
      paddingHorizontal: defaultSpacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: tc.border.subtle,
    }), [tc]);

    return (
      <View ref={ref} style={[containerStyle, userStyle as ViewStyle]} {...rest}>
        {/* Header */}
        <View style={headerStyle}>
          <RNText style={{
            fontSize: defaultTypography.sizes.base.fontSize,
            fontWeight: '600',
            color: tc.text.primary,
          } as TextStyle}>
            {title}
          </RNText>
          {onClose && (
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close threads panel">
              <XIcon size={16} color={tc.text.secondary} />
            </Pressable>
          )}
        </View>

        {/* Loading */}
        {loading && threads.length === 0 && (
          <View style={{ padding: defaultSpacing['2xl'], alignItems: 'center' }}>
            <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.muted } as TextStyle}>
              Loading...
            </RNText>
          </View>
        )}

        {/* Empty */}
        {!loading && threads.length === 0 && !skeleton && (
          <View style={{ padding: defaultSpacing['2xl'], alignItems: 'center' }}>
            <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.muted } as TextStyle}>
              {emptyText}
            </RNText>
          </View>
        )}

        {/* Thread cards */}
        <ScrollView>
          {threads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              onThreadPress={onThreadPress}
              onFollowToggle={onFollowToggle}
            />
          ))}
        </ScrollView>
      </View>
    );
  },
);

ThreadListView.displayName = 'ThreadListView';
