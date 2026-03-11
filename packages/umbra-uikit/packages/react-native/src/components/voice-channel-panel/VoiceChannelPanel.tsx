/**
 * @module components/voice-channel-panel
 * @description React Native VoiceChannelPanel for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { CallParticipant } from '@coexist/wisp-core/types/CallControls.types';
import {
  resolveVoiceChannelPanelColors,
} from '@coexist/wisp-core/styles/VoiceChannelPanel.styles';
import type { VoiceChannelPanelColors } from '@coexist/wisp-core/styles/VoiceChannelPanel.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Line, Path, Circle } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface VoiceChannelPanelProps extends ViewProps {
  /** Name of the voice channel. */
  channelName: string;
  /** Name of the community the channel belongs to. */
  communityName?: string;
  /** List of participants currently in the voice channel. */
  participants: CallParticipant[];
  /** The local participant, if connected. */
  localParticipant?: CallParticipant;
  /** Whether the local user is connected to this voice channel. */
  isConnected: boolean;
  /** Called when the join button is pressed. */
  onJoin: () => void;
  /** Called when the leave/disconnect button is pressed. */
  onLeave: () => void;
  /** Called when the mute toggle is pressed. */
  onToggleMute: () => void;
  /** Called when the deafen toggle is pressed. */
  onToggleDeafen: () => void;
  /** Whether the local microphone is muted. */
  isMuted: boolean;
  /** Whether the local audio is deafened. */
  isDeafened: boolean;
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function MicIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <Line x1={12} y1={19} x2={12} y2={23} />
      <Line x1={8} y1={23} x2={16} y2={23} />
    </Svg>
  );
}

function MicOffIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={1} y1={1} x2={23} y2={23} />
      <Path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <Path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .67-.08 1.32-.22 1.94" />
      <Line x1={12} y1={19} x2={12} y2={23} />
      <Line x1={8} y1={23} x2={16} y2={23} />
    </Svg>
  );
}

function HeadphonesIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </Svg>
  );
}

function HeadphonesOffIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      <Path d="M21 18v-6a9 9 0 0 0-9-9 8.98 8.98 0 0 0-6.36 2.64" />
      <Line x1={1} y1={1} x2={23} y2={23} />
    </Svg>
  );
}

function PhoneOffIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272" />
      <Path d="M22 2 2 22" />
      <Path d="M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473" />
    </Svg>
  );
}

function SignalIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 20h.01" />
      <Path d="M7 20v-4" />
      <Path d="M12 20v-8" />
      <Path d="M17 20V8" />
      <Path d="M22 20V4" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Default Avatar
// ---------------------------------------------------------------------------

function DefaultAvatar({ name, size = 28 }: { name: string; size?: number }) {
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
// VoiceChannelPanel
// ---------------------------------------------------------------------------

/**
 * VoiceChannelPanel -- Bottom bar panel showing voice channel connection status.
 *
 * @remarks
 * Displays a compact bottom bar with channel info, participant avatars,
 * and voice controls (mute, deafen, disconnect). When not connected,
 * shows a single "Join Voice" button. When connected, shows a green
 * status dot, channel name, participant avatars, and control buttons.
 *
 * @example
 * ```tsx
 * <VoiceChannelPanel
 *   channelName="General"
 *   communityName="My Server"
 *   participants={voiceParticipants}
 *   localParticipant={localUser}
 *   isConnected={true}
 *   isMuted={false}
 *   isDeafened={false}
 *   onJoin={() => joinVoice()}
 *   onLeave={() => leaveVoice()}
 *   onToggleMute={() => toggleMute()}
 *   onToggleDeafen={() => toggleDeafen()}
 * />
 * ```
 */
export const VoiceChannelPanel = forwardRef<View, VoiceChannelPanelProps>(
  function VoiceChannelPanel(
    {
      channelName,
      communityName,
      participants,
      localParticipant,
      isConnected,
      onJoin,
      onLeave,
      onToggleMute,
      onToggleDeafen,
      isMuted,
      isDeafened,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveVoiceChannelPanelColors(theme),
      [theme],
    );

    const handleJoin = useCallback(() => {
      onJoin();
    }, [onJoin]);

    const handleLeave = useCallback(() => {
      onLeave();
    }, [onLeave]);

    const handleToggleMute = useCallback(() => {
      onToggleMute();
    }, [onToggleMute]);

    const handleToggleDeafen = useCallback(() => {
      onToggleDeafen();
    }, [onToggleDeafen]);

    // -- Styles -------------------------------------------------------------

    const containerStyle: ViewStyle = {
      backgroundColor: colors.bg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      minHeight: 80,
    };

    // -- Disconnected state -------------------------------------------------

    if (!isConnected) {
      const disconnectedStyle: ViewStyle = {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: defaultSpacing.md,
        paddingHorizontal: defaultSpacing.md,
      };

      const joinButtonStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: defaultSpacing.sm,
        backgroundColor: colors.joinButtonBg,
        borderRadius: defaultRadii.md,
        paddingVertical: defaultSpacing.sm,
        paddingHorizontal: defaultSpacing.lg,
        minWidth: 140,
      };

      const joinButtonTextStyle: TextStyle = {
        fontSize: defaultTypography.sizes.sm.fontSize,
        lineHeight: defaultTypography.sizes.sm.lineHeight,
        fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
        color: colors.joinButtonText,
      };

      return (
        <View
          ref={ref}
          accessibilityRole="toolbar"
          accessibilityLabel="Voice channel panel"
          style={[containerStyle, disconnectedStyle, userStyle as ViewStyle]}
          {...rest}
        >
          <Pressable
            onPress={handleJoin}
            accessibilityRole="button"
            accessibilityLabel={`Join voice channel ${channelName}`}
            style={joinButtonStyle}
          >
            <SignalIcon size={16} color={colors.joinButtonText} />
            <Text style={joinButtonTextStyle}>Join Voice</Text>
          </Pressable>
        </View>
      );
    }

    // -- Connected state ----------------------------------------------------

    const connectedContentStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
      gap: defaultSpacing.md,
      minHeight: 80,
    };

    const channelInfoStyle: ViewStyle = {
      flex: 1,
      minWidth: 0,
      gap: 2,
    };

    const channelHeaderRowStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.xs,
    };

    const statusDotStyle: ViewStyle = {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.statusDot,
    };

    const connectedTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: colors.connectedText,
    };

    const channelNameStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.channelName,
    };

    const communityNameStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      fontWeight: String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
      color: colors.communityName,
    };

    const avatarsRowStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
    };

    const avatarWrapperStyle: ViewStyle = {
      marginLeft: -6,
    };

    const avatarFirstStyle: ViewStyle = {
      marginLeft: 0,
    };

    const controlsRowStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.xs,
      flexShrink: 0,
    };

    const controlButtonStyle: ViewStyle = {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.controlButtonBg,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const controlButtonActiveStyle: ViewStyle = {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.controlButtonActiveBg,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const disconnectButtonStyle: ViewStyle = {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.disconnectButtonBg,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const overflowCountStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: colors.overflowCount,
      marginLeft: defaultSpacing.xs,
    };

    const maxVisibleAvatars = 5;
    const visibleParticipants = participants.slice(0, maxVisibleAvatars);
    const overflowCount = participants.length - maxVisibleAvatars;

    return (
      <View
        ref={ref}
        accessibilityRole="toolbar"
        accessibilityLabel={`Voice connected to ${channelName}`}
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        <View style={connectedContentStyle}>
          {/* Left: Channel info */}
          <View style={channelInfoStyle}>
            <View style={channelHeaderRowStyle}>
              <SignalIcon size={14} color={colors.signalIcon} />
              <Text style={channelNameStyle} numberOfLines={1}>
                {channelName}
              </Text>
            </View>
            <View style={channelHeaderRowStyle}>
              <View style={statusDotStyle} />
              <Text style={connectedTextStyle}>Voice Connected</Text>
            </View>
            {communityName && (
              <Text style={communityNameStyle} numberOfLines={1}>
                {communityName}
              </Text>
            )}
          </View>

          {/* Center: Participant avatars */}
          <View style={avatarsRowStyle}>
            {visibleParticipants.map((participant, index) => (
              <View
                key={participant.id}
                style={index === 0 ? avatarFirstStyle : avatarWrapperStyle}
                accessibilityLabel={participant.name}
              >
                {participant.avatar || (
                  <DefaultAvatar name={participant.name} size={28} />
                )}
              </View>
            ))}
            {overflowCount > 0 && (
              <Text style={overflowCountStyle}>
                +{overflowCount}
              </Text>
            )}
          </View>

          {/* Right: Controls */}
          <View style={controlsRowStyle}>
            {/* Mute button */}
            <Pressable
              onPress={handleToggleMute}
              accessibilityRole="button"
              accessibilityLabel={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              accessibilityState={{ selected: isMuted }}
              style={isMuted ? controlButtonActiveStyle : controlButtonStyle}
            >
              {isMuted ? (
                <MicOffIcon size={16} color={colors.controlButtonActiveIcon} />
              ) : (
                <MicIcon size={16} color={colors.controlButtonIcon} />
              )}
            </Pressable>

            {/* Deafen button */}
            <Pressable
              onPress={handleToggleDeafen}
              accessibilityRole="button"
              accessibilityLabel={isDeafened ? 'Undeafen audio' : 'Deafen audio'}
              accessibilityState={{ selected: isDeafened }}
              style={isDeafened ? controlButtonActiveStyle : controlButtonStyle}
            >
              {isDeafened ? (
                <HeadphonesOffIcon size={16} color={colors.controlButtonActiveIcon} />
              ) : (
                <HeadphonesIcon size={16} color={colors.controlButtonIcon} />
              )}
            </Pressable>

            {/* Disconnect button */}
            <Pressable
              onPress={handleLeave}
              accessibilityRole="button"
              accessibilityLabel="Disconnect from voice channel"
              style={disconnectButtonStyle}
            >
              <PhoneOffIcon size={16} color={colors.disconnectButtonIcon} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  },
);

VoiceChannelPanel.displayName = 'VoiceChannelPanel';
