/**
 * @module components/call-history-item
 * @description React Native CallHistoryItem for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { resolveCallHistoryItemColors } from '@coexist/wisp-core/styles/CallHistoryItem.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import type {
  CallHistoryItemProps,
  CallHistoryStatus,
  CallHistoryDirection,
  CallHistoryType,
} from '@coexist/wisp-core/types/CallHistoryItem.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a duration in seconds to MM:SS or HH:MM:SS. */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  if (h > 0) {
    const hh = String(h).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/** Return an icon character for the call type. */
function callTypeIcon(callType: CallHistoryType): string {
  return callType === 'video' ? '\u{1F4F9}' : '\u{1F4DE}';
}

/** Return a direction arrow character. */
function directionArrow(direction: CallHistoryDirection): string {
  return direction === 'outgoing' ? '\u2197' : '\u2199';
}

/** Return a display label for the call status. */
function statusLabel(status: CallHistoryStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ---------------------------------------------------------------------------
// CallHistoryItem
// ---------------------------------------------------------------------------

export const CallHistoryItem = forwardRef<View, CallHistoryItemProps>(
  function CallHistoryItem(
    {
      callerName,
      callerAvatar,
      callType,
      direction,
      status,
      duration,
      timestamp,
      onPress,
      onCallBack,
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveCallHistoryItemColors(status, theme),
      [status, theme],
    );

    // ------ Styles ------
    const containerStyle: ViewStyle = useMemo(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.md,
        paddingVertical: defaultSpacing.sm,
        paddingHorizontal: defaultSpacing.md,
        borderRadius: defaultRadii.md,
        backgroundColor: colors.bg,
        minHeight: 56,
        width: '100%',
      }),
      [colors.bg],
    );

    const avatarWrapperStyle: ViewStyle = useMemo(
      () => ({
        position: 'relative',
        flexShrink: 0,
      }),
      [],
    );

    const nameTextStyle: TextStyle = useMemo(
      () => ({
        fontSize: defaultTypography.sizes.sm.fontSize,
        lineHeight: defaultTypography.sizes.sm.lineHeight,
        fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
        color: colors.text,
        flexShrink: 1,
      }),
      [colors.text],
    );

    const metaTextStyle: TextStyle = useMemo(
      () => ({
        fontSize: defaultTypography.sizes.xs.fontSize,
        lineHeight: defaultTypography.sizes.xs.lineHeight,
        color: colors.textMuted,
      }),
      [colors.textMuted],
    );

    const statusTextStyle: TextStyle = useMemo(
      () => ({
        fontSize: defaultTypography.sizes.xs.fontSize,
        lineHeight: defaultTypography.sizes.xs.lineHeight,
        fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
        color: colors.statusColor,
      }),
      [colors.statusColor],
    );

    const timestampTextStyle: TextStyle = useMemo(
      () => ({
        fontSize: defaultTypography.sizes['2xs'].fontSize,
        lineHeight: defaultTypography.sizes['2xs'].lineHeight,
        color: colors.textMuted,
        flexShrink: 0,
      }),
      [colors.textMuted],
    );

    const callbackButtonStyle: ViewStyle = useMemo(
      () => ({
        padding: defaultSpacing.sm,
        borderRadius: defaultRadii.full,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }),
      [],
    );

    const callbackTextStyle: TextStyle = useMemo(
      () => ({
        fontSize: 18,
        color: colors.callbackIcon,
      }),
      [colors.callbackIcon],
    );

    const handlePress = useCallback(() => {
      onPress?.();
    }, [onPress]);

    const handleCallBack = useCallback(() => {
      onCallBack?.();
    }, [onCallBack]);

    return (
      <Pressable
        ref={ref as any}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Call from ${callerName}, ${status}`}
        style={containerStyle}
      >
        {/* Avatar */}
        <View style={avatarWrapperStyle}>
          {callerAvatar}
        </View>

        {/* Content */}
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          {/* Name row: name + type icon + direction arrow */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text numberOfLines={1} style={nameTextStyle}>
              {callerName}
            </Text>
            <Text style={metaTextStyle}>
              {callTypeIcon(callType)}
            </Text>
            <Text style={metaTextStyle}>
              {directionArrow(direction)}
            </Text>
          </View>

          {/* Status row: status + duration */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={statusTextStyle}>
              {statusLabel(status)}
            </Text>
            {status === 'completed' && duration != null && (
              <Text style={metaTextStyle}>
                {formatDuration(duration)}
              </Text>
            )}
          </View>
        </View>

        {/* Timestamp */}
        <Text style={timestampTextStyle}>
          {timestamp}
        </Text>

        {/* Callback button */}
        {onCallBack && (
          <Pressable
            onPress={handleCallBack}
            accessibilityRole="button"
            accessibilityLabel={`Call back ${callerName}`}
            style={callbackButtonStyle}
          >
            <Text style={callbackTextStyle}>{'\u{1F4DE}'}</Text>
          </Pressable>
        )}
      </Pressable>
    );
  },
);

CallHistoryItem.displayName = 'CallHistoryItem';
