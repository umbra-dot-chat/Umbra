/**
 * @module components/call-mini-window
 * @description React Native CallMiniWindow for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 */

import React, { forwardRef, useMemo, useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { CallParticipant } from '@coexist/wisp-core/types/CallControls.types';
import {
  resolveCallMiniWindowColors,
} from '@coexist/wisp-core/styles/CallMiniWindow.styles';
import type { CallMiniWindowColors } from '@coexist/wisp-core/styles/CallMiniWindow.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Line, Path, Rect } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type SnapPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface CallMiniWindowProps extends ViewProps {
  /** The remote participant to display. */
  participant: CallParticipant;
  /** The local participant data. */
  localParticipant: CallParticipant;
  /** The type of call. */
  callType: 'audio' | 'video';
  /** Call duration in seconds. */
  duration?: number;
  /** Called when the expand button is pressed. */
  onExpand: () => void;
  /** Called when the end call button is pressed. */
  onEndCall: () => void;
  /** Snap position for the mini window. @default 'bottom-right' */
  snapPosition?: SnapPosition;
  /** Whether the window is draggable. @default false */
  draggable?: boolean;
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function MaximizeIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </Svg>
  );
}

function PhoneOffIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272" />
      <Path d="M22 2 2 22" />
      <Path d="M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473" />
    </Svg>
  );
}

function MicOffBadgeIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={1} y1={1} x2={23} y2={23} />
      <Path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <Path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .67-.08 1.32-.22 1.94" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Default Avatar
// ---------------------------------------------------------------------------

function DefaultAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.35, fontWeight: '600' }}>
        {initials}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function resolveSnapPositionStyle(position: SnapPosition): ViewStyle {
  switch (position) {
    case 'top-left':
      return { top: 16, left: 16 };
    case 'top-right':
      return { top: 16, right: 16 };
    case 'bottom-left':
      return { bottom: 16, left: 16 };
    case 'bottom-right':
    default:
      return { bottom: 16, right: 16 };
  }
}

// ---------------------------------------------------------------------------
// CallMiniWindow
// ---------------------------------------------------------------------------

/**
 * CallMiniWindow -- A small floating PiP window for active calls.
 *
 * @remarks
 * Displays a compact floating window showing the remote participant's
 * avatar, call duration, and a press overlay with expand and end call
 * buttons. Supports snap positions for absolute placement within a parent.
 * Sized at 200x150 for video calls and 200x64 for audio-only calls.
 *
 * @example
 * ```tsx
 * <CallMiniWindow
 *   participant={remoteUser}
 *   localParticipant={localUser}
 *   callType="video"
 *   duration={90}
 *   onExpand={() => expandCall()}
 *   onEndCall={() => endCall()}
 *   snapPosition="bottom-right"
 * />
 * ```
 */
export const CallMiniWindow = forwardRef<View, CallMiniWindowProps>(
  function CallMiniWindow(
    {
      participant,
      localParticipant,
      callType,
      duration,
      onExpand,
      onEndCall,
      snapPosition = 'bottom-right',
      draggable = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveCallMiniWindowColors(theme),
      [theme],
    );

    const [showOverlay, setShowOverlay] = useState(false);

    const handleExpand = useCallback(() => {
      onExpand();
    }, [onExpand]);

    const handleEndCall = useCallback(() => {
      onEndCall();
    }, [onEndCall]);

    const handlePress = useCallback(() => {
      setShowOverlay((prev) => !prev);
    }, []);

    const isAudioOnly = callType === 'audio';
    const windowWidth = 200;
    const windowHeight = isAudioOnly ? 64 : 150;
    const isParticipantMuted = participant.isMuted ?? false;

    // -- Styles -------------------------------------------------------------

    const positionStyle = resolveSnapPositionStyle(snapPosition);

    const containerStyle: ViewStyle = {
      position: 'absolute',
      ...positionStyle,
      width: windowWidth,
      height: windowHeight,
      borderRadius: defaultRadii.xl,
      backgroundColor: colors.bg,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 9998,
    };

    const contentStyle: ViewStyle = {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const audioContentStyle: ViewStyle = {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: defaultSpacing.sm,
      gap: defaultSpacing.sm,
    };

    const durationBadgeStyle: ViewStyle = {
      position: 'absolute',
      top: 6,
      left: 8,
      backgroundColor: colors.durationBadgeBg,
      borderRadius: defaultRadii.sm,
      paddingHorizontal: 6,
      paddingVertical: 2,
    };

    const durationTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: colors.durationText,
      fontVariant: ['tabular-nums'],
    };

    const muteBadgeStyle: ViewStyle = {
      position: 'absolute',
      top: 6,
      right: 8,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.muteBadgeBg,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const overlayStyle: ViewStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.overlayBg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: defaultSpacing.md,
    };

    const overlayButtonStyle: ViewStyle = {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const expandButtonStyle: ViewStyle = {
      ...overlayButtonStyle,
      backgroundColor: colors.expandButtonBg,
    };

    const endCallButtonStyle: ViewStyle = {
      ...overlayButtonStyle,
      backgroundColor: colors.endCallButtonBg,
    };

    const participantNameStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: colors.participantName,
    };

    const audioDurationStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      color: colors.audioDurationText,
      fontVariant: ['tabular-nums'],
    };

    return (
      <View
        ref={ref}
        accessibilityRole="none"
        accessibilityLabel={`Mini call window with ${participant.name}`}
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel="Toggle call controls"
          style={{ flex: 1 }}
        >
          {/* Video mode content */}
          {!isAudioOnly && (
            <View style={contentStyle}>
              {participant.avatar || (
                <DefaultAvatar name={participant.name} size={48} />
              )}
              <Text style={[participantNameStyle, { marginTop: 4 }]} numberOfLines={1}>
                {participant.name}
              </Text>
            </View>
          )}

          {/* Audio mode content */}
          {isAudioOnly && (
            <View style={audioContentStyle}>
              {participant.avatar || (
                <DefaultAvatar name={participant.name} size={40} />
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={participantNameStyle} numberOfLines={1}>
                  {participant.name}
                </Text>
                {duration !== undefined && (
                  <Text style={audioDurationStyle}>
                    {formatDuration(duration)}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Duration badge (video mode) */}
          {!isAudioOnly && duration !== undefined && (
            <View style={durationBadgeStyle}>
              <Text style={durationTextStyle}>
                {formatDuration(duration)}
              </Text>
            </View>
          )}

          {/* Mute indicator */}
          {isParticipantMuted && (
            <View style={muteBadgeStyle}>
              <MicOffBadgeIcon size={10} color={colors.muteBadgeIcon} />
            </View>
          )}

          {/* Press overlay with controls */}
          {showOverlay && (
            <View style={overlayStyle}>
              <Pressable
                onPress={handleExpand}
                accessibilityRole="button"
                accessibilityLabel="Expand call"
                style={expandButtonStyle}
              >
                <MaximizeIcon size={16} color={colors.expandButtonIcon} />
              </Pressable>
              <Pressable
                onPress={handleEndCall}
                accessibilityRole="button"
                accessibilityLabel="End call"
                style={endCallButtonStyle}
              >
                <PhoneOffIcon size={16} color={colors.endCallButtonIcon} />
              </Pressable>
            </View>
          )}
        </Pressable>
      </View>
    );
  },
);

CallMiniWindow.displayName = 'CallMiniWindow';
