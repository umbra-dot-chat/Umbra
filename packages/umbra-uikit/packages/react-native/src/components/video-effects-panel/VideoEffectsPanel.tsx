/**
 * VideoEffectsPanel — Video effects, filters, and virtual background picker.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Pressable, Image } from 'react-native';
import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Text } from '../../primitives';
import { Slider } from '../../primitives';
import {
  VIDEO_EFFECTS,
  VIDEO_FILTERS,
} from '@coexist/wisp-core/types/VideoEffectsPanel.types';
import type {
  VideoEffect,
  VideoFilter,
  VideoEffectsPanelProps,
} from '@coexist/wisp-core/types/VideoEffectsPanel.types';
import {
  resolveEffectsPanelBackground,
  resolveEffectCardBackground,
  resolveEffectCardBorder,
  resolveEffectLabel,
  resolveFilterLabel,
} from '@coexist/wisp-core/styles/VideoEffectsPanel.styles';
import { useTheme } from '../../providers';

export type { VideoEffectsPanelProps };

export const VideoEffectsPanel = forwardRef<View, VideoEffectsPanelProps>(function VideoEffectsPanel(
  {
    currentEffect,
    currentFilter,
    onEffectChange,
    onFilterChange,
    onBackgroundImageSelect,
    backgroundPresets = [],
    blurIntensity = 50,
    onBlurIntensityChange,
  },
  ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const panelBg = resolveEffectsPanelBackground(theme);

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const containerStyle = useMemo<ViewStyle>(() => ({
    padding: 12,
    gap: 16,
    backgroundColor: panelBg,
  }), [panelBg]);

  const sectionLabelStyle = useMemo<TextStyle>(() => ({
    fontSize: 12,
    fontWeight: '600',
    color: tc.text.secondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }), [tc]);

  const gridStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  }), []);

  const effectCardStyle = useCallback((selected: boolean): ViewStyle => ({
    width: 88,
    height: 72,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: resolveEffectCardBackground(selected, theme),
    borderColor: resolveEffectCardBorder(selected, theme),
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  }), [theme]);

  const effectCardTextStyle = useCallback((selected: boolean): TextStyle => ({
    fontSize: 11,
    fontWeight: selected ? '600' : '400',
    color: selected ? '#fff' : tc.text.primary,
    textAlign: 'center',
  }), [tc]);

  const filterCardStyle = useCallback((selected: boolean): ViewStyle => ({
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: resolveEffectCardBackground(selected, theme),
    borderColor: resolveEffectCardBorder(selected, theme),
    alignItems: 'center',
    justifyContent: 'center',
  }), [theme]);

  const filterCardTextStyle = useCallback((selected: boolean): TextStyle => ({
    fontSize: 12,
    fontWeight: selected ? '600' : '400',
    color: selected ? '#fff' : tc.text.primary,
  }), [tc]);

  const presetGridStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  }), []);

  const presetCardStyle = useMemo<ViewStyle>(() => ({
    width: 72,
    height: 54,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tc.border.subtle,
  }), [tc]);

  const presetImageStyle = useMemo<ImageStyle>(() => ({
    width: '100%',
    height: '100%',
  }), []);

  const presetLabelStyle = useMemo<TextStyle>(() => ({
    fontSize: 10,
    color: tc.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  }), [tc]);

  const sliderWrapperStyle = useMemo<ViewStyle>(() => ({
    marginTop: 8,
    paddingHorizontal: 4,
  }), []);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleEffectPress = useCallback((effect: VideoEffect) => {
    onEffectChange(effect);
  }, [onEffectChange]);

  const handleFilterPress = useCallback((filter: VideoFilter) => {
    onFilterChange(filter);
  }, [onFilterChange]);

  const handlePresetPress = useCallback((imageUrl: string) => {
    onBackgroundImageSelect?.(imageUrl);
  }, [onBackgroundImageSelect]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View ref={ref} style={containerStyle}>
      {/* Effects Section */}
      <View>
        <Text style={sectionLabelStyle}>Effects</Text>
        <View style={gridStyle}>
          {VIDEO_EFFECTS.map((effect) => {
            const selected = currentEffect === effect;
            return (
              <Pressable
                key={effect}
                style={effectCardStyle(selected)}
                onPress={() => handleEffectPress(effect)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={resolveEffectLabel(effect)}
              >
                <Text style={effectCardTextStyle(selected)}>
                  {resolveEffectLabel(effect)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Blur Intensity Slider */}
      {currentEffect === 'blur' && onBlurIntensityChange && (
        <View style={sliderWrapperStyle}>
          <Slider
            label="Blur Intensity"
            value={blurIntensity}
            onChange={onBlurIntensityChange}
            min={0}
            max={100}
            step={1}
            showValue
            size="sm"
          />
        </View>
      )}

      {/* Background Presets */}
      {currentEffect === 'virtual-background' && backgroundPresets.length > 0 && (
        <View>
          <Text style={sectionLabelStyle}>Backgrounds</Text>
          <View style={presetGridStyle}>
            {backgroundPresets.map((preset) => (
              <Pressable
                key={preset.id}
                onPress={() => handlePresetPress(preset.thumbnail)}
                accessibilityRole="button"
                accessibilityLabel={preset.name}
              >
                <View style={presetCardStyle}>
                  <Image
                    source={{ uri: preset.thumbnail }}
                    style={presetImageStyle}
                    resizeMode="cover"
                  />
                </View>
                <Text style={presetLabelStyle}>{preset.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Filters Section */}
      <View>
        <Text style={sectionLabelStyle}>Filters</Text>
        <View style={gridStyle}>
          {VIDEO_FILTERS.map((filter) => {
            const selected = currentFilter === filter;
            return (
              <Pressable
                key={filter}
                style={filterCardStyle(selected)}
                onPress={() => handleFilterPress(filter)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={resolveFilterLabel(filter)}
              >
                <Text style={filterCardTextStyle(selected)}>
                  {resolveFilterLabel(filter)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
});

VideoEffectsPanel.displayName = 'VideoEffectsPanel';
