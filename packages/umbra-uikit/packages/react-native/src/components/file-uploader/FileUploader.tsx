import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Pressable, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Path, Polyline, Line } from 'react-native-svg';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

export interface FileUploaderProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  onPickFile?: () => void;
  onChange?: (files: any[]) => void;
  disabled?: boolean;
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  style?: ViewStyle;
}

export const FileUploader = forwardRef<View, FileUploaderProps>(function FileUploader(
  { accept, multiple = false, maxSize, maxFiles, onPickFile, onChange, disabled = false,
    title, description, icon: Icon, style: userStyle }, ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const handlePress = useCallback(() => {
    if (disabled) return;
    onPickFile?.();
  }, [disabled, onPickFile]);

  const dropzoneStyle = useMemo<ViewStyle>(() => ({
    borderWidth: 2, borderStyle: 'dashed', borderColor: tc.border.subtle,
    borderRadius: defaultRadii.lg, padding: defaultSpacing.xl, alignItems: 'center', justifyContent: 'center',
    backgroundColor: tc.background.surface, opacity: disabled ? 0.4 : 1, gap: defaultSpacing.sm,
  }), [tc, disabled]);

  const DefaultIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={tc.text.secondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <Polyline points="17 8 12 3 7 8" />
      <Line x1={12} y1={3} x2={12} y2={15} />
    </Svg>
  );

  const DisplayIcon = Icon || DefaultIcon;

  const descText = description || [
    accept && accept,
    maxSize && 'up to ' + (maxSize / 1024 / 1024).toFixed(0) + 'MB',
  ].filter(Boolean).join(' · ') || undefined;

  return (
    <Pressable ref={ref} onPress={handlePress} disabled={disabled}
      accessibilityRole="button" accessibilityLabel="Pick file"
      style={[dropzoneStyle, userStyle]}>
      <DisplayIcon size={22} color={tc.text.secondary} strokeWidth={2} />
      <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.primary, textAlign: 'center' } as TextStyle}>
        {title || 'Tap to select a file'}
      </RNText>
      {descText ? (
        <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted, textAlign: 'center' } as TextStyle}>
          {descText}
        </RNText>
      ) : null}
    </Pressable>
  );
});

FileUploader.displayName = 'FileUploader';
