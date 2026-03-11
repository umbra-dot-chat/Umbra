/**
 * @module components/pinned-messages
 * @description React Native PinnedMessages for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import {
  resolvePinnedMessagesColors,
} from '@coexist/wisp-core/styles/PinnedMessages.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { fontFamilyStacks } from '@coexist/wisp-core/tokens/shared';
import { useTheme } from '../../providers';
import Svg, { Line, Path } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PinnedMessage {
  id: string;
  sender: string;
  avatar?: React.ReactNode;
  content: string;
  timestamp: string;
  pinnedBy?: string;
}

export interface PinnedMessagesProps extends ViewProps {
  messages: PinnedMessage[];
  onClose?: () => void;
  onMessageClick?: (message: PinnedMessage) => void;
  onUnpin?: (message: PinnedMessage) => void;
  title?: string;
  loading?: boolean;
  emptyText?: string;
  emptyIcon?: React.ReactNode;
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

function PinIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 17v5" />
      <Path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
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
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#333',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{initials}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PinnedMessages
// ---------------------------------------------------------------------------

export const PinnedMessages = forwardRef<View, PinnedMessagesProps>(
  function PinnedMessages(
    {
      messages,
      onClose,
      onMessageClick,
      onUnpin,
      title = 'Pinned Messages',
      loading = false,
      emptyText = 'No pinned messages',
      emptyIcon,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolvePinnedMessagesColors(theme),
      [theme],
    );

    const handleMessageClick = useCallback(
      (msg: PinnedMessage) => {
        onMessageClick?.(msg);
      },
      [onMessageClick],
    );

    const handleUnpin = useCallback(
      (msg: PinnedMessage) => {
        onUnpin?.(msg);
      },
      [onUnpin],
    );

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

    const countTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      color: colors.headerTextMuted,
      marginLeft: 6,
    };

    const closeButtonStyle: ViewStyle = {
      width: 28,
      height: 28,
      borderRadius: defaultRadii.md,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const cardStyle: ViewStyle = {
      gap: defaultSpacing.xs,
      padding: defaultSpacing.sm,
      borderRadius: defaultRadii.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBg,
    };

    const cardHeaderRowStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
    };

    const senderRowStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
      minWidth: 0,
    };

    const senderTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.cardText,
    };

    const timestampTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      color: colors.cardTextMuted,
    };

    const contentTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      color: colors.cardTextSecondary,
    };

    const footerRowStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 4,
    };

    const pinnedByTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      color: colors.cardTextMuted,
    };

    const unpinTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      color: colors.unpinText,
      paddingVertical: 2,
      paddingHorizontal: 6,
    };

    const emptyViewStyle: ViewStyle = {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: defaultSpacing.sm,
      padding: defaultSpacing.xl,
    };

    const emptyTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      color: colors.emptyText,
      textAlign: 'center',
    };

    const loadingViewStyle: ViewStyle = {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: defaultSpacing.xl,
    };

    return (
      <View ref={ref} style={[containerStyle, userStyle as ViewStyle]} {...rest}>
        {/* Header */}
        <View style={headerStyle}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={titleTextStyle}>{title}</Text>
            {messages.length > 0 && (
              <Text style={countTextStyle}>({messages.length})</Text>
            )}
          </View>
          {onClose && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close pinned messages"
              onPress={onClose}
              style={closeButtonStyle}
            >
              <CloseIcon size={16} color={colors.headerTextMuted} />
            </Pressable>
          )}
        </View>

        {/* Body */}
        {loading ? (
          <View style={loadingViewStyle}>
            <Text style={{ color: colors.emptyText, fontSize: defaultTypography.sizes.sm.fontSize }}>
              Loading pinned messages…
            </Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={emptyViewStyle}>
            {emptyIcon || <PinIcon size={32} color={colors.emptyText} />}
            <Text style={emptyTextStyle}>{emptyText}</Text>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: defaultSpacing.xs, padding: defaultSpacing.sm }}>
            {messages.map((msg) => (
              <Pressable
                key={msg.id}
                accessibilityRole="button"
                onPress={() => handleMessageClick(msg)}
                style={cardStyle}
              >
                {/* Card header */}
                <View style={cardHeaderRowStyle}>
                  <View style={senderRowStyle}>
                    {msg.avatar || <DefaultAvatar name={msg.sender} />}
                    <Text numberOfLines={1} style={senderTextStyle}>{msg.sender}</Text>
                  </View>
                  <Text style={timestampTextStyle}>{msg.timestamp}</Text>
                </View>

                {/* Content */}
                <Text numberOfLines={2} style={contentTextStyle}>{msg.content}</Text>

                {/* Footer */}
                {(msg.pinnedBy || onUnpin) && (
                  <View style={footerRowStyle}>
                    {msg.pinnedBy ? (
                      <Text style={pinnedByTextStyle}>Pinned by {msg.pinnedBy}</Text>
                    ) : (
                      <View />
                    )}
                    {onUnpin && (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => handleUnpin(msg)}
                      >
                        <Text style={unpinTextStyle}>Unpin</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    );
  },
);

PinnedMessages.displayName = 'PinnedMessages';
