import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Image, Text as RNText } from 'react-native';
import type { AvatarSize, AvatarShape, AvatarStatus } from '@coexist/wisp-core/types/Avatar.types';
import { avatarSizeMap } from '@coexist/wisp-core/types/Avatar.types';
import {
  extractInitials,
  resolveStatusColor,
} from '@coexist/wisp-core/styles/Avatar.styles';
import { defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  status?: AvatarStatus;
  onSurface?: boolean;
  style?: object;
}

export const Avatar = forwardRef<View, AvatarProps>(function Avatar(
  {
    src,
    alt,
    name,
    size = 'md',
    shape = 'circle',
    status,
    onSurface = false,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = avatarSizeMap[size];
  const [imgError, setImgError] = useState(false);

  const handleImgError = useCallback(() => {
    setImgError(true);
  }, []);

  const borderRadius = shape === 'circle' ? sizeConfig.container / 2 : sizeConfig.squareRadius;

  const containerStyle = useMemo(
    () => ({
      position: 'relative' as const,
      width: sizeConfig.container,
      height: sizeConfig.container,
      flexShrink: 0,
    }),
    [sizeConfig],
  );

  const innerStyle = useMemo(
    () => ({
      width: sizeConfig.container,
      height: sizeConfig.container,
      borderRadius,
      backgroundColor: themeColors.accent.primary,
      overflow: 'hidden' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    }),
    [sizeConfig, borderRadius, themeColors],
  );

  const initials = name ? extractInitials(name) : '';
  const showImage = src && !imgError;

  const renderContent = () => {
    if (showImage) {
      return (
        <Image
          source={{ uri: src }}
          style={{
            width: sizeConfig.container,
            height: sizeConfig.container,
            borderRadius,
            overflow: 'hidden',
          }}
          onError={handleImgError}
          accessibilityLabel={alt || name || 'Avatar'}
        />
      );
    }

    if (initials) {
      return (
        <RNText
          style={{
            fontSize: sizeConfig.fontSize,
            fontWeight: defaultTypography.weights.semibold,
            color: themeColors.text.inverse,
          }}
        >
          {initials}
        </RNText>
      );
    }

    // Fallback: simple circle with icon placeholder
    return (
      <View
        style={{
          width: sizeConfig.iconSize,
          height: sizeConfig.iconSize,
          borderRadius: sizeConfig.iconSize / 2,
          backgroundColor: themeColors.text.inverse,
          opacity: 0.3,
        }}
      />
    );
  };

  return (
    <View
      ref={ref}
      style={[containerStyle, userStyle]}
      accessibilityRole="image"
      accessibilityLabel={alt || name || 'Avatar'}
    >
      <View style={innerStyle}>{renderContent()}</View>
      {status && (
        <View
          style={{
            position: 'absolute',
            bottom: shape === 'circle' ? 0 : -1,
            right: shape === 'circle' ? 0 : -1,
            width: sizeConfig.statusSize,
            height: sizeConfig.statusSize,
            borderRadius: sizeConfig.statusSize / 2,
            backgroundColor: resolveStatusColor(status, theme),
            borderWidth: sizeConfig.statusBorder,
            borderColor: themeColors.background.canvas,
          }}
        />
      )}
    </View>
  );
});

Avatar.displayName = 'Avatar';
