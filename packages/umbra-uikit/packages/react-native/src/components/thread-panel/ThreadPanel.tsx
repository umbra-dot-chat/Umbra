/**
 * @module components/thread-panel
 * @description React Native ThreadPanel for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import {
  resolveThreadPanelColors,
} from '@coexist/wisp-core/styles/ThreadPanel.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import { MessageInput } from '../message-input';
import Svg, { Line } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ThreadMessage {
  id: string;
  sender: string;
  avatar?: React.ReactNode;
  content: string;
  timestamp: string;
  isOwn?: boolean;
}

export interface ThreadPanelProps extends ViewProps {
  parentMessage: ThreadMessage;
  replies: ThreadMessage[];
  replyCount?: number;
  onClose?: () => void;
  onReply?: (text: string) => void;
  title?: string;
  sending?: boolean;
  placeholder?: string;
  loading?: boolean;
  renderMessage?: (message: ThreadMessage) => React.ReactNode;
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function CloseIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Default Avatar
// ---------------------------------------------------------------------------

function DefaultAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={{
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#333',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{initials}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ThreadPanel
// ---------------------------------------------------------------------------

export const ThreadPanel = forwardRef<View, ThreadPanelProps>(
  function ThreadPanel(
    {
      parentMessage,
      replies,
      replyCount,
      onClose,
      onReply,
      title = 'Thread',
      sending = false,
      placeholder = 'Reply...',
      loading = false,
      renderMessage,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveThreadPanelColors(theme),
      [theme],
    );

    const displayCount = replyCount ?? replies.length;

    // ------ Styles ------
    const containerStyle: ViewStyle = {
      flex: 1,
      backgroundColor: colors.bg,
    };

    const headerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      minHeight: 56,
    };

    const titleTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.headerText,
    };

    const closeButtonStyle: ViewStyle = {
      width: 28,
      height: 28,
      borderRadius: defaultRadii.md,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const messageRowStyle: ViewStyle = {
      flexDirection: 'row',
      gap: defaultSpacing.sm,
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
    };

    const senderRowStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    };

    const nameTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.messageText,
    };

    const tsTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      color: colors.messageTextMuted,
    };

    const msgTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      color: colors.messageTextSecondary,
    };

    const dividerRowStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
      paddingVertical: defaultSpacing.xs,
      paddingHorizontal: defaultSpacing.md,
    };

    const dividerLineStyle: ViewStyle = {
      flex: 1,
      height: 1,
      backgroundColor: colors.dividerLine,
    };

    const dividerTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      color: colors.dividerText,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
    };

    const inputAreaStyle: ViewStyle = {
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    };

    const loadingViewStyle: ViewStyle = {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: defaultSpacing.xl,
    };

    const renderThreadMessage = useCallback(
      (msg: ThreadMessage) => {
        if (renderMessage) return renderMessage(msg);
        return (
          <View style={messageRowStyle}>
            <View style={{ flexShrink: 0 }}>
              {msg.avatar || <DefaultAvatar name={msg.sender} />}
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <View style={senderRowStyle}>
                <Text style={nameTextStyle}>{msg.sender}</Text>
                <Text style={tsTextStyle}>{msg.timestamp}</Text>
              </View>
              <Text style={msgTextStyle}>{msg.content}</Text>
            </View>
          </View>
        );
      },
      [renderMessage, colors, theme],
    );

    return (
      <View ref={ref} style={[containerStyle, userStyle as ViewStyle]} {...rest}>
        {/* Header */}
        <View style={headerStyle}>
          <Text style={titleTextStyle}>{title}</Text>
          {onClose && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close thread"
              onPress={onClose}
              style={closeButtonStyle}
            >
              <CloseIcon size={16} color={colors.headerTextMuted} />
            </Pressable>
          )}
        </View>

        {/* Body */}
        <ScrollView style={{ flex: 1 }}>
          {/* Parent message */}
          {renderThreadMessage(parentMessage)}

          {/* Divider */}
          <View style={dividerRowStyle}>
            <View style={dividerLineStyle} />
            <Text style={dividerTextStyle}>
              {displayCount} {displayCount === 1 ? 'reply' : 'replies'}
            </Text>
            <View style={dividerLineStyle} />
          </View>

          {/* Loading */}
          {loading && (
            <View style={loadingViewStyle}>
              <Text style={{ color: colors.messageTextMuted, fontSize: defaultTypography.sizes.sm.fontSize }}>
                Loading replies…
              </Text>
            </View>
          )}

          {/* Replies */}
          {!loading && replies.map((reply) => (
            <View key={reply.id}>
              {renderThreadMessage(reply)}
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        {onReply && (
          <View style={inputAreaStyle}>
            <MessageInput
              size="sm"
              placeholder={placeholder}
              sending={sending}
              showAttachment={false}
              showEmoji={false}
              onSubmit={(value: string) => onReply(value)}
            />
          </View>
        )}
      </View>
    );
  },
);

ThreadPanel.displayName = 'ThreadPanel';
