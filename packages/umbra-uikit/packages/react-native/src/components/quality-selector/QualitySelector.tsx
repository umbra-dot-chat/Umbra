/**
 * QualitySelector — Video and audio quality picker with bandwidth estimates.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Text } from '../../primitives';
import {
  qualitySelectorSizeMap,
} from '@coexist/wisp-core/types/QualitySelector.types';
import type {
  QualitySelectorSize,
  VideoQualityOption,
  AudioQualityOption,
} from '@coexist/wisp-core/types/QualitySelector.types';
import {
  resolveQualityLabel,
  resolveQualityBandwidth,
  resolveSelectedBackground,
} from '@coexist/wisp-core/styles/QualitySelector.styles';
import { useTheme } from '../../providers';

export interface QualitySelectorProps {
  videoQuality: VideoQualityOption;
  audioQuality: AudioQualityOption;
  onVideoQualityChange: (quality: VideoQualityOption) => void;
  onAudioQualityChange: (quality: AudioQualityOption) => void;
  showAudioToggle?: boolean;
  size?: QualitySelectorSize;
  style?: ViewStyle;
}

const VIDEO_OPTIONS: VideoQualityOption[] = ['auto', '720p', '1080p', '1440p', '4k'];
const AUDIO_OPTIONS: AudioQualityOption[] = ['opus', 'pcm'];

export const QualitySelector = forwardRef<View, QualitySelectorProps>(function QualitySelector(
  {
    videoQuality,
    audioQuality,
    onVideoQualityChange,
    onAudioQualityChange,
    showAudioToggle = true,
    size = 'md',
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const sc = qualitySelectorSizeMap[size];
  const selectedBg = resolveSelectedBackground(theme);

  const containerStyle = useMemo<ViewStyle>(() => ({
    padding: sc.padding,
    gap: sc.gap * 2,
  }), [sc]);

  const sectionLabelStyle = useMemo<TextStyle>(() => ({
    fontSize: sc.labelFontSize,
    fontWeight: '600',
    color: tc.text.secondary,
    marginBottom: sc.gap,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }), [sc, tc]);

  const optionStyle = useCallback((isSelected: boolean): ViewStyle => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: sc.optionHeight,
    paddingHorizontal: sc.padding,
    borderRadius: 6,
    backgroundColor: isSelected ? selectedBg : 'transparent',
  }), [sc, selectedBg]);

  const optionTextStyle = useCallback((isSelected: boolean): TextStyle => ({
    fontSize: sc.fontSize,
    fontWeight: isSelected ? '600' : '400',
    color: isSelected ? '#fff' : tc.text.primary,
  }), [sc, tc]);

  const bandwidthStyle = useCallback((isSelected: boolean): TextStyle => ({
    fontSize: sc.labelFontSize,
    color: isSelected ? 'rgba(255,255,255,0.7)' : tc.text.secondary,
  }), [sc, tc]);

  const warningStyle = useMemo<TextStyle>(() => ({
    fontSize: sc.labelFontSize,
    color: tc.text.secondary,
    fontStyle: 'italic',
    marginTop: sc.gap,
    paddingHorizontal: sc.padding,
  }), [sc, tc]);

  return (
    <View ref={ref} style={[containerStyle, userStyle]}>
      <View>
        <Text style={sectionLabelStyle}>Video Quality</Text>
        {VIDEO_OPTIONS.map((option) => {
          const isSelected = videoQuality === option;
          return (
            <Pressable
              key={option}
              style={optionStyle(isSelected)}
              onPress={() => onVideoQualityChange(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={resolveQualityLabel(option)}
            >
              <Text style={optionTextStyle(isSelected)}>
                {resolveQualityLabel(option)}
              </Text>
              <Text style={bandwidthStyle(isSelected)}>
                {resolveQualityBandwidth(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {showAudioToggle && (
        <View>
          <Text style={sectionLabelStyle}>Audio Quality</Text>
          {AUDIO_OPTIONS.map((option) => {
            const isSelected = audioQuality === option;
            return (
              <Pressable
                key={option}
                style={optionStyle(isSelected)}
                onPress={() => onAudioQualityChange(option)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={option === 'opus' ? 'Opus (Adaptive)' : 'PCM Lossless'}
              >
                <Text style={optionTextStyle(isSelected)}>
                  {option === 'opus' ? 'Opus (Adaptive)' : 'PCM Lossless'}
                </Text>
                <Text style={bandwidthStyle(isSelected)}>
                  {option === 'opus' ? '32-128 kbps' : '~1.4 Mbps'}
                </Text>
              </Pressable>
            );
          })}
          {audioQuality === 'pcm' && (
            <Text style={warningStyle}>
              Lossless audio uses ~1.4 Mbps. Ensure stable connection.
            </Text>
          )}
        </View>
      )}
    </View>
  );
});

QualitySelector.displayName = 'QualitySelector';
