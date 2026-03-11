/**
 * @module components/audio-waveform
 * @description React Native AudioWaveform for the Wisp design system.
 *
 * Visual representation of audio data using react-native-svg bars.
 * Touch-based seek via PanResponder.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, PanResponder } from 'react-native';
import type { ViewProps, ViewStyle, GestureResponderEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import type { AudioWaveformSize, AudioWaveformColor } from '@coexist/wisp-core/types/AudioWaveform.types';
import { audioWaveformSizeMap } from '@coexist/wisp-core/types/AudioWaveform.types';
import { defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AudioWaveformProps extends ViewProps {
  /** Array of amplitude values (0–1 range). */
  data: number[];
  /** Preset dimensions. @default 'md' */
  size?: AudioWaveformSize;
  /** Accent color. @default 'default' */
  color?: AudioWaveformColor;
  /** Raw color override for bars (e.g. '#fff'). Takes precedence over `color`. */
  tint?: string;
  /** Progress fraction (0–1). @default 0 */
  progress?: number;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
  /** Called when user taps on the waveform (for seek). */
  onSeek?: (fraction: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AudioWaveform = forwardRef<View, AudioWaveformProps>(
  function AudioWaveform(
    {
      data,
      size = 'md',
      color = 'default',
      tint,
      progress = 0,
      skeleton = false,
      onSeek,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const sizeConfig = audioWaveformSizeMap[size];

    const accentColor = useMemo(() => {
      if (tint) return tint;
      switch (color) {
        case 'success': return themeColors.status.success;
        case 'warning': return themeColors.status.warning;
        case 'danger': return themeColors.status.danger;
        case 'info': return themeColors.status.info;
        default: return themeColors.accent.primary;
      }
    }, [tint, color, themeColors]);

    const handlePress = useCallback(
      (e: GestureResponderEvent) => {
        if (!onSeek) return;
        const x = e.nativeEvent.locationX;
        const fraction = Math.max(0, Math.min(1, x / sizeConfig.width));
        onSeek(fraction);
      },
      [onSeek, sizeConfig.width],
    );

    if (skeleton || !data || data.length === 0) {
      const skeletonStyle: ViewStyle = {
        width: sizeConfig.width,
        height: sizeConfig.height,
        borderRadius: defaultRadii.sm,
        backgroundColor: themeColors.border.subtle,
      };
      return <View ref={ref} style={[skeletonStyle, userStyle]} {...rest} />;
    }

    const { width, height, barWidth, barGap, barMinHeight, barRadius } = sizeConfig;
    const barCount = data.length;
    const progressIndex = Math.floor(progress * barCount);

    return (
      <View ref={ref} style={[{ width, height }, userStyle]} {...rest}>
        <Svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          onPress={handlePress}
        >
          {data.map((amplitude, i) => {
            const barH = Math.max(barMinHeight, amplitude * (height - 4));
            const x = i * (barWidth + barGap);
            const y = (height - barH) / 2;
            const isPlayed = i < progressIndex;

            return (
              <Rect
                key={i}
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={barRadius}
                fill={accentColor}
                opacity={isPlayed ? 1 : 0.35}
              />
            );
          })}
        </Svg>
      </View>
    );
  },
);

AudioWaveform.displayName = 'AudioWaveform';
