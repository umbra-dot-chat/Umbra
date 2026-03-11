/**
 * @module components/recording-indicator
 * @description React Native RecordingIndicator for the Wisp design system.
 *
 * Visual indicator that recording is active with optional start/stop controls.
 * Reuses types and size maps from `@coexist/wisp-core`.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { RecordingIndicatorVariant, RecordingIndicatorSize } from '@coexist/wisp-core/types/RecordingIndicator.types';
import { recordingIndicatorSizeMap } from '@coexist/wisp-core/types/RecordingIndicator.types';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RecordingIndicatorProps extends ViewProps {
  isRecording: boolean;
  duration?: number;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  canRecord?: boolean;
  variant?: RecordingIndicatorVariant;
  size?: RecordingIndicatorSize;
}

// ---------------------------------------------------------------------------
// Duration formatter
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RecordingIndicator = forwardRef<View, RecordingIndicatorProps>(
  function RecordingIndicator(
    {
      isRecording,
      duration,
      onStartRecording,
      onStopRecording,
      canRecord = false,
      variant = 'badge',
      size = 'md',
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const sizeConfig = recordingIndicatorSizeMap[size];

    const containerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: sizeConfig.gap,
      paddingHorizontal: sizeConfig.paddingX,
      paddingVertical: sizeConfig.paddingY,
      borderRadius: 9999,
      backgroundColor: theme.colors.background.raised,
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
    }), [sizeConfig, theme]);

    const dotStyle = useMemo<ViewStyle>(() => ({
      width: sizeConfig.dotSize,
      height: sizeConfig.dotSize,
      borderRadius: sizeConfig.dotSize / 2,
      backgroundColor: isRecording ? '#ef4444' : '#6b7280',
    }), [sizeConfig, isRecording]);

    const textStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.fontSize,
      fontWeight: '500',
      color: isRecording ? theme.colors.text.primary : theme.colors.text.muted,
    }), [sizeConfig, isRecording, theme]);

    const durationStyleObj = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.fontSize,
      fontWeight: '400',
      color: theme.colors.text.muted,
    }), [sizeConfig, theme]);

    const stopBtnStyle = useMemo<ViewStyle>(() => ({
      width: sizeConfig.buttonSize,
      height: sizeConfig.buttonSize,
      borderRadius: sizeConfig.buttonSize / 2,
      backgroundColor: '#ef4444',
      alignItems: 'center',
      justifyContent: 'center',
    }), [sizeConfig]);

    const startBtnStyle = useMemo<ViewStyle>(() => ({
      width: sizeConfig.buttonSize,
      height: sizeConfig.buttonSize,
      borderRadius: sizeConfig.buttonSize / 2,
      backgroundColor: theme.colors.background.sunken,
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
      alignItems: 'center',
      justifyContent: 'center',
    }), [sizeConfig, theme]);

    return (
      <View
        ref={ref}
        style={[containerStyle, userStyle]}
        accessibilityLabel={isRecording ? 'Recording in progress' : 'Not recording'}
        accessibilityRole="text"
        {...rest}
      >
        {/* Pulsing dot */}
        <View style={dotStyle} />

        {/* Text */}
        <Text style={textStyle}>
          {isRecording ? 'Recording' : 'Not Recording'}
        </Text>

        {/* Duration */}
        {isRecording && duration !== undefined && (
          <Text style={durationStyleObj}>{formatDuration(duration)}</Text>
        )}

        {/* Controls */}
        {variant === 'controls' && (
          <>
            {isRecording && onStopRecording && (
              <Pressable
                onPress={onStopRecording}
                style={stopBtnStyle}
                accessibilityLabel="Stop recording"
              >
                <View style={{ width: sizeConfig.buttonSize * 0.35, height: sizeConfig.buttonSize * 0.35, borderRadius: 1, backgroundColor: '#ffffff' }} />
              </Pressable>
            )}
            {!isRecording && canRecord && onStartRecording && (
              <Pressable
                onPress={onStartRecording}
                style={startBtnStyle}
                accessibilityLabel="Start recording"
              >
                <View style={{ width: sizeConfig.buttonSize * 0.4, height: sizeConfig.buttonSize * 0.4, borderRadius: sizeConfig.buttonSize * 0.2, backgroundColor: theme.colors.text.secondary }} />
              </Pressable>
            )}
          </>
        )}
      </View>
    );
  },
);

RecordingIndicator.displayName = 'RecordingIndicator';
