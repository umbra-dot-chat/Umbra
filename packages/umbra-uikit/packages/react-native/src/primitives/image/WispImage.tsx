/**
 * @module primitives/image
 * @description React Native Image primitive for the Wisp design system.
 *
 * Wraps RN's `<Image>` with skeleton loading, fit modes, radius presets,
 * and fallback content. Named `WispImage` to avoid conflict with RN's Image.
 */

import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { View, Image as RNImage, Text, Animated } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle, ImageStyle, ImageResizeMode } from 'react-native';
import type { ImageFit, ImageRadius } from '@coexist/wisp-core/types/Image.types';
import { imageRadiusMap } from '@coexist/wisp-core/types/Image.types';
import { defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Fit → RN ResizeMode mapping
// ---------------------------------------------------------------------------

const FIT_MAP: Record<ImageFit, ImageResizeMode> = {
  cover: 'cover',
  contain: 'contain',
  fill: 'stretch',
  none: 'center',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WispImageProps extends ViewProps {
  /** Image source URI. */
  src?: string;
  /** Alt text for accessibility. */
  alt?: string;
  /** Custom React node rendered when the image fails to load. */
  fallback?: React.ReactNode;
  /** How the image should fit within its container. @default 'cover' */
  objectFit?: ImageFit;
  /** Aspect ratio as a number (e.g. 16/9). */
  aspectRatio?: number;
  /** Border-radius preset for the image wrapper. @default 'none' */
  radius?: ImageRadius;
  /** When true, shows a pulsing skeleton placeholder. @default false */
  skeleton?: boolean;
  /** Image width. */
  width?: number;
  /** Image height. */
  height?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WispImage = forwardRef<View, WispImageProps>(
  function WispImage(
    {
      src,
      alt,
      fallback,
      objectFit = 'cover',
      aspectRatio,
      radius = 'none',
      skeleton = false,
      width,
      height,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const [loaded, setLoaded] = useState(false);
    const [errored, setErrored] = useState(false);

    const borderRadius = imageRadiusMap[radius];

    const wrapperStyle = useMemo<ViewStyle>(() => ({
      overflow: 'hidden',
      borderRadius,
      backgroundColor: themeColors.border.subtle,
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
      ...(aspectRatio ? { aspectRatio } : {}),
    }), [borderRadius, themeColors, width, height, aspectRatio]);

    const imageStyle = useMemo<ImageStyle>(() => ({
      width: '100%',
      height: '100%',
      resizeMode: FIT_MAP[objectFit],
      opacity: loaded ? 1 : 0,
    }), [objectFit, loaded]);

    const fallbackStyle = useMemo<ViewStyle>(() => ({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.border.subtle,
    }), [themeColors]);

    const fallbackTextStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      color: themeColors.text.muted,
    }), [themeColors]);

    const skeletonStyle = useMemo<ViewStyle>(() => ({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: themeColors.border.subtle,
    }), [themeColors]);

    const handleLoad = useCallback(() => setLoaded(true), []);
    const handleError = useCallback(() => setErrored(true), []);

    const showSkeleton = skeleton || (!loaded && !errored && !!src);

    return (
      <View ref={ref} style={[wrapperStyle, userStyle]} accessibilityLabel={alt} {...rest}>
        {src && !errored && (
          <RNImage
            source={{ uri: src }}
            style={imageStyle}
            onLoad={handleLoad}
            onError={handleError}
            accessibilityLabel={alt}
          />
        )}

        {errored && (
          <View style={fallbackStyle}>
            {fallback ?? <Text style={fallbackTextStyle}>Failed to load</Text>}
          </View>
        )}

        {showSkeleton && <View style={skeletonStyle} />}
      </View>
    );
  },
);

WispImage.displayName = 'WispImage';
