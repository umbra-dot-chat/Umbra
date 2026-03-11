/**
 * @module components/voice-recorder
 * @description React Native VoiceRecorder for the Wisp design system.
 *
 * State-driven UI for recording voice messages. Does not handle actual
 * audio recording — just the visual interface with buttons and timer.
 */

import React, { forwardRef, useMemo, useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { VoiceRecorderState, VoiceRecorderSize } from '@coexist/wisp-core/types/VoiceRecorder.types';
import { voiceRecorderSizeMap } from '@coexist/wisp-core/types/VoiceRecorder.types';
import { resolveVoiceRecorderColors } from '@coexist/wisp-core/styles/VoiceRecorder.styles';
import { defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface VoiceRecorderProps extends ViewProps {
  /** Current recording state. @default 'idle' */
  state?: VoiceRecorderState;
  /** Size preset. @default 'md' */
  size?: VoiceRecorderSize;
  /** Duration in seconds. */
  duration?: number;
  /** Maximum recording duration in seconds. @default 120 */
  maxDuration?: number;
  /** Called when the record button is pressed. */
  onRecord?: () => void;
  /** Called when stop is pressed. */
  onStop?: () => void;
  /** Called when pause is pressed. */
  onPause?: () => void;
  /** Called when resume is pressed. */
  onResume?: () => void;
  /** Called when send/confirm is pressed. */
  onSend?: () => void;
  /** Called when cancel/delete is pressed. */
  onCancel?: () => void;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const VoiceRecorder = forwardRef<View, VoiceRecorderProps>(
  function VoiceRecorder(
    {
      state = 'idle',
      size = 'md',
      duration = 0,
      maxDuration = 120,
      onRecord,
      onStop,
      onPause,
      onResume,
      onSend,
      onCancel,
      skeleton = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const sizeConfig = voiceRecorderSizeMap[size];
    const colors = useMemo(
      () => resolveVoiceRecorderColors(state, theme),
      [state, themeColors],
    );

    // Pulse animation for recording
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (state === 'recording') {
        const animation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.15,
              duration: 750,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 750,
              useNativeDriver: true,
            }),
          ]),
        );
        animation.start();
        return () => animation.stop();
      } else {
        pulseAnim.setValue(1);
      }
    }, [state, pulseAnim]);

    if (skeleton) {
      const skeletonStyle: ViewStyle = {
        width: '100%',
        height: sizeConfig.height,
        borderRadius: sizeConfig.borderRadius,
        backgroundColor: themeColors.border.subtle,
      };
      return <View style={[skeletonStyle, userStyle as ViewStyle]} />;
    }

    const containerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizeConfig.gap,
      paddingHorizontal: sizeConfig.padding,
      height: sizeConfig.height,
      borderRadius: sizeConfig.borderRadius,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      width: '100%',
    }), [sizeConfig, colors]);

    const recordBtnStyle = useMemo<ViewStyle>(() => ({
      alignItems: 'center',
      justifyContent: 'center',
      width: sizeConfig.buttonSize,
      height: sizeConfig.buttonSize,
      borderRadius: sizeConfig.buttonSize / 2,
      backgroundColor: colors.recordButton,
    }), [sizeConfig, colors]);

    const recordIconStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.iconSize,
      color: colors.iconOnRecord,
    }), [sizeConfig, colors]);

    const timerStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.fontSize,
      fontWeight: defaultTypography.weights.semibold,
      color: colors.timer,
      fontVariant: ['tabular-nums'],
      minWidth: 40,
    }), [sizeConfig, colors]);

    const actionBtnSize = sizeConfig.buttonSize - 4;

    const cancelBtnStyle = useMemo<ViewStyle>(() => ({
      alignItems: 'center',
      justifyContent: 'center',
      width: actionBtnSize,
      height: actionBtnSize,
      borderRadius: actionBtnSize / 2,
      backgroundColor: 'transparent',
    }), [actionBtnSize]);

    const sendBtnStyle = useMemo<ViewStyle>(() => ({
      alignItems: 'center',
      justifyContent: 'center',
      width: actionBtnSize,
      height: actionBtnSize,
      borderRadius: actionBtnSize / 2,
      backgroundColor: colors.sendButton,
    }), [actionBtnSize, colors]);

    const cancelIconStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.iconSize - 2,
      color: colors.cancelButton,
    }), [sizeConfig, colors]);

    const sendIconStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.iconSize - 2,
      color: colors.sendIcon,
    }), [sizeConfig, colors]);

    const isRecording = state === 'recording';
    const isPaused = state === 'paused';
    const isPreview = state === 'preview';
    const isActive = isRecording || isPaused || isPreview;

    return (
      <View ref={ref} style={[containerStyle, userStyle as ViewStyle]} {...rest}>
        {/* Record / Stop button */}
        {state === 'idle' ? (
          <Pressable onPress={onRecord} accessibilityLabel="Record" style={recordBtnStyle}>
            <Text style={recordIconStyle}>{'\u{1F3A4}'}</Text>
          </Pressable>
        ) : isRecording ? (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable onPress={onPause ?? onStop} accessibilityLabel="Pause" style={recordBtnStyle}>
              <Text style={recordIconStyle}>{'\u{23F8}'}</Text>
            </Pressable>
          </Animated.View>
        ) : isPaused ? (
          <Pressable onPress={onResume} accessibilityLabel="Resume" style={recordBtnStyle}>
            <Text style={recordIconStyle}>{'\u{25B6}'}</Text>
          </Pressable>
        ) : null}

        {/* Timer */}
        {isActive && (
          <Text style={timerStyle}>{formatTime(duration)}</Text>
        )}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Cancel + Send (when active) */}
        {isActive && (
          <>
            <Pressable onPress={onCancel} accessibilityLabel="Cancel" style={cancelBtnStyle}>
              <Text style={cancelIconStyle}>{'\u{2715}'}</Text>
            </Pressable>
            <Pressable onPress={onSend ?? onStop} accessibilityLabel="Send" style={sendBtnStyle}>
              <Text style={sendIconStyle}>{'\u{27A4}'}</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  },
);

VoiceRecorder.displayName = 'VoiceRecorder';
