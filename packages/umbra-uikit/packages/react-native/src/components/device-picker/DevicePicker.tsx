/**
 * DevicePicker — Dropdown selectors for audio and video devices.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Text } from '../../primitives';
import type { DeviceOption } from '@coexist/wisp-core/types/DevicePicker.types';
import {
  resolveDevicePickerLabel,
  resolvePickerBackground,
} from '@coexist/wisp-core/styles/DevicePicker.styles';
import { useTheme } from '../../providers';

export interface DevicePickerProps {
  audioInputs: DeviceOption[];
  videoInputs: DeviceOption[];
  audioOutputs: DeviceOption[];
  selectedAudioInput?: string;
  selectedVideoInput?: string;
  selectedAudioOutput?: string;
  onSelectAudioInput: (deviceId: string) => void;
  onSelectVideoInput: (deviceId: string) => void;
  onSelectAudioOutput: (deviceId: string) => void;
  style?: ViewStyle;
}

export const DevicePicker = forwardRef<View, DevicePickerProps>(function DevicePicker(
  {
    audioInputs,
    videoInputs,
    audioOutputs,
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
    onSelectAudioInput,
    onSelectVideoInput,
    onSelectAudioOutput,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const pickerBg = resolvePickerBackground(theme);

  const containerStyle = useMemo<ViewStyle>(() => ({
    gap: 16,
    padding: 12,
  }), []);

  const sectionStyle = useMemo<ViewStyle>(() => ({
    gap: 6,
  }), []);

  const labelStyle = useMemo<TextStyle>(() => ({
    fontSize: 11,
    fontWeight: '600',
    color: tc.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }), [tc]);

  const optionStyle = useCallback((isSelected: boolean): ViewStyle => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: isSelected ? pickerBg : 'transparent',
    gap: 8,
  }), [pickerBg]);

  const dotStyle = useCallback((isSelected: boolean): ViewStyle => ({
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: isSelected ? tc.text.primary : 'transparent',
    borderWidth: 1,
    borderColor: tc.text.secondary,
  }), [tc]);

  const optionTextStyle = useMemo<TextStyle>(() => ({
    fontSize: 13,
    color: tc.text.primary,
    flex: 1,
  }), [tc]);

  const renderSection = useCallback((
    label: string,
    devices: DeviceOption[],
    selectedId: string | undefined,
    onSelect: (deviceId: string) => void,
  ) => {
    if (devices.length === 0) return null;

    return (
      <View style={sectionStyle}>
        <Text style={labelStyle}>{label}</Text>
        {devices.map((device) => {
          const isSelected = device.deviceId === selectedId;
          return (
            <Pressable
              key={device.deviceId}
              style={optionStyle(isSelected)}
              onPress={() => onSelect(device.deviceId)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={device.label}
            >
              <View style={dotStyle(isSelected)} />
              <Text style={optionTextStyle} numberOfLines={1}>{device.label}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }, [sectionStyle, labelStyle, optionStyle, dotStyle, optionTextStyle]);

  return (
    <ScrollView ref={ref as any} style={userStyle}>
      <View style={containerStyle}>
        {renderSection(
          resolveDevicePickerLabel('audioinput'),
          audioInputs,
          selectedAudioInput,
          onSelectAudioInput,
        )}
        {renderSection(
          resolveDevicePickerLabel('videoinput'),
          videoInputs,
          selectedVideoInput,
          onSelectVideoInput,
        )}
        {renderSection(
          resolveDevicePickerLabel('audiooutput'),
          audioOutputs,
          selectedAudioOutput,
          onSelectAudioOutput,
        )}
      </View>
    </ScrollView>
  );
});

DevicePicker.displayName = 'DevicePicker';
