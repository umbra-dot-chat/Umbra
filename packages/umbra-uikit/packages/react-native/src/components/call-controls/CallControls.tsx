/**
 * @module components/call-controls
 * @description React Native CallControls for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import {
  resolveCallControlsColors,
} from '@coexist/wisp-core/styles/CallControls.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Line, Path, Circle, Rect } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props (RN-specific -- extends ViewProps instead of HTMLAttributes)
// ---------------------------------------------------------------------------

export interface CallControlsProps extends ViewProps {
  /** Whether the local microphone is muted. */
  isMuted: boolean;
  /** Whether the local camera is off. */
  isVideoOff: boolean;
  /** Whether screen sharing is active. */
  isScreenSharing: boolean;
  /** Whether the speaker is on. */
  isSpeakerOn: boolean;
  /** Called when the mute toggle is pressed. */
  onToggleMute: () => void;
  /** Called when the video toggle is pressed. */
  onToggleVideo: () => void;
  /** Called when the screen share toggle is pressed. */
  onToggleScreenShare: () => void;
  /** Called when the speaker toggle is pressed. */
  onToggleSpeaker: () => void;
  /** Called when the end call button is pressed. */
  onEndCall: () => void;
  /** The type of call. */
  callType: 'audio' | 'video';
  /** Layout mode. @default 'horizontal' */
  layout?: 'horizontal' | 'compact';
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function MicIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <Line x1={12} y1={19} x2={12} y2={23} />
      <Line x1={8} y1={23} x2={16} y2={23} />
    </Svg>
  );
}

function MicOffIcon({ size = 20, color }: { size?: number; color?: string }) {
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

function CameraIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 7l-7 5 7 5V7z" />
      <Rect x={1} y={5} width={15} height={14} rx={2} ry={2} />
    </Svg>
  );
}

function CameraOffIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={1} y1={1} x2={23} y2={23} />
      <Path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
    </Svg>
  );
}

function MonitorIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={2} y={3} width={20} height={14} rx={2} ry={2} />
      <Line x1={8} y1={21} x2={16} y2={21} />
      <Line x1={12} y1={17} x2={12} y2={21} />
    </Svg>
  );
}

function SpeakerIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 5L6 9H2v6h4l5 4V5z" />
      <Path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </Svg>
  );
}

function SpeakerOffIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 5L6 9H2v6h4l5 4V5z" />
      <Line x1={23} y1={9} x2={17} y2={15} />
      <Line x1={17} y1={9} x2={23} y2={15} />
    </Svg>
  );
}

function PhoneOffIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272" />
      <Path d="M22 2 2 22" />
      <Path d="M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// CallControls
// ---------------------------------------------------------------------------

/**
 * CallControls -- A row of circular control buttons for audio/video calls.
 *
 * @remarks
 * Displays mute, video, screen share, speaker, and end call buttons in a
 * horizontal row. Supports horizontal and compact layouts. Active toggles
 * show filled backgrounds. The end call button is always red.
 *
 * @example
 * ```tsx
 * <CallControls
 *   isMuted={false}
 *   isVideoOff={false}
 *   isScreenSharing={false}
 *   isSpeakerOn={true}
 *   onToggleMute={() => toggleMute()}
 *   onToggleVideo={() => toggleVideo()}
 *   onToggleScreenShare={() => toggleScreen()}
 *   onToggleSpeaker={() => toggleSpeaker()}
 *   onEndCall={() => endCall()}
 *   callType="video"
 * />
 * ```
 */
export const CallControls = forwardRef<View, CallControlsProps>(
  function CallControls(
    {
      isMuted,
      isVideoOff,
      isScreenSharing,
      isSpeakerOn,
      onToggleMute,
      onToggleVideo,
      onToggleScreenShare,
      onToggleSpeaker,
      onEndCall,
      callType,
      layout = 'horizontal',
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveCallControlsColors(theme),
      [theme],
    );

    const isCompact = layout === 'compact';
    const buttonSize = isCompact ? 40 : 48;
    const iconSize = isCompact ? 18 : 20;

    // -- Handlers -----------------------------------------------------------

    const handleToggleMute = useCallback(() => {
      onToggleMute();
    }, [onToggleMute]);

    const handleToggleVideo = useCallback(() => {
      onToggleVideo();
    }, [onToggleVideo]);

    const handleToggleScreenShare = useCallback(() => {
      onToggleScreenShare();
    }, [onToggleScreenShare]);

    const handleToggleSpeaker = useCallback(() => {
      onToggleSpeaker();
    }, [onToggleSpeaker]);

    const handleEndCall = useCallback(() => {
      onEndCall();
    }, [onEndCall]);

    // -- Styles -------------------------------------------------------------

    const containerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isCompact ? defaultSpacing.sm : defaultSpacing.md,
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
    };

    const baseButtonStyle: ViewStyle = {
      width: buttonSize,
      height: buttonSize,
      borderRadius: buttonSize / 2,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const defaultButtonStyle: ViewStyle = {
      ...baseButtonStyle,
      backgroundColor: colors.buttonBg,
    };

    const activeButtonStyle: ViewStyle = {
      ...baseButtonStyle,
      backgroundColor: colors.buttonBgActive,
    };

    const endCallButtonStyle: ViewStyle = {
      ...baseButtonStyle,
      backgroundColor: colors.buttonBgDanger,
    };

    const labelStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      color: colors.labelText,
      textAlign: 'center',
      marginTop: 4,
    };

    const buttonWrapperStyle: ViewStyle = {
      alignItems: 'center',
    };

    return (
      <View
        ref={ref}
        accessibilityRole="toolbar"
        accessibilityLabel="Call controls"
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* Mute button */}
        <View style={buttonWrapperStyle}>
          <Pressable
            onPress={handleToggleMute}
            accessibilityRole="button"
            accessibilityLabel={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            accessibilityState={{ selected: isMuted }}
            style={isMuted ? activeButtonStyle : defaultButtonStyle}
          >
            {isMuted ? (
              <MicOffIcon size={iconSize} color={colors.buttonIconActive} />
            ) : (
              <MicIcon size={iconSize} color={colors.buttonIcon} />
            )}
          </Pressable>
          {!isCompact && (
            <Text style={labelStyle}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          )}
        </View>

        {/* Video button (only for video calls) */}
        {callType === 'video' && (
          <View style={buttonWrapperStyle}>
            <Pressable
              onPress={handleToggleVideo}
              accessibilityRole="button"
              accessibilityLabel={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              accessibilityState={{ selected: isVideoOff }}
              style={isVideoOff ? activeButtonStyle : defaultButtonStyle}
            >
              {isVideoOff ? (
                <CameraOffIcon size={iconSize} color={colors.buttonIconActive} />
              ) : (
                <CameraIcon size={iconSize} color={colors.buttonIcon} />
              )}
            </Pressable>
            {!isCompact && (
              <Text style={labelStyle}>{isVideoOff ? 'Start Video' : 'Stop Video'}</Text>
            )}
          </View>
        )}

        {/* Screen share button */}
        <View style={buttonWrapperStyle}>
          <Pressable
            onPress={handleToggleScreenShare}
            accessibilityRole="button"
            accessibilityLabel={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
            accessibilityState={{ selected: isScreenSharing }}
            style={isScreenSharing ? activeButtonStyle : defaultButtonStyle}
          >
            <MonitorIcon size={iconSize} color={isScreenSharing ? colors.buttonIconActive : colors.buttonIcon} />
          </Pressable>
          {!isCompact && (
            <Text style={labelStyle}>{isScreenSharing ? 'Stop Share' : 'Share'}</Text>
          )}
        </View>

        {/* Speaker button */}
        <View style={buttonWrapperStyle}>
          <Pressable
            onPress={handleToggleSpeaker}
            accessibilityRole="button"
            accessibilityLabel={isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
            accessibilityState={{ selected: !isSpeakerOn }}
            style={!isSpeakerOn ? activeButtonStyle : defaultButtonStyle}
          >
            {isSpeakerOn ? (
              <SpeakerIcon size={iconSize} color={colors.buttonIcon} />
            ) : (
              <SpeakerOffIcon size={iconSize} color={colors.buttonIconActive} />
            )}
          </Pressable>
          {!isCompact && (
            <Text style={labelStyle}>{isSpeakerOn ? 'Speaker' : 'Speaker Off'}</Text>
          )}
        </View>

        {/* End call button */}
        <View style={buttonWrapperStyle}>
          <Pressable
            onPress={handleEndCall}
            accessibilityRole="button"
            accessibilityLabel="End call"
            style={endCallButtonStyle}
          >
            <PhoneOffIcon size={iconSize} color={colors.endCallIcon} />
          </Pressable>
          {!isCompact && (
            <Text style={[labelStyle, { color: colors.endCallText }]}>End</Text>
          )}
        </View>
      </View>
    );
  },
);

CallControls.displayName = 'CallControls';
