/**
 * @module components/link-preview-card
 * @description React Native LinkPreviewCard for the Wisp design system.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, Image, Pressable, Linking } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { resolveLinkPreviewCardColors } from '@coexist/wisp-core/styles/LinkPreviewCard.styles';
import type { LinkPreviewCardSize, LinkPreviewCardLayout, LinkPreviewFetcher } from '@coexist/wisp-core/types/LinkPreviewCard.types';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { fontFamilyStacks } from '@coexist/wisp-core/tokens/shared';
import { useTheme } from '../../providers';
import { useLinkPreview } from '../../hooks/use-link-preview';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LinkPreviewCardProps extends ViewProps {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  size?: LinkPreviewCardSize;
  layout?: LinkPreviewCardLayout;
  onPress?: () => void;
  loading?: boolean;
  skeleton?: boolean;
  /** Automatically fetch Open Graph metadata from the URL. @default false */
  autoFetch?: boolean;
  /** Custom fetcher function. Falls back to Microlink API. */
  fetcher?: LinkPreviewFetcher;
}

// ---------------------------------------------------------------------------
// Size configs
// ---------------------------------------------------------------------------

interface SizeConfig {
  titleFontSize: number;
  descFontSize: number;
  domainFontSize: number;
  padding: number;
  imageHeight: number;
  imageWidthHorizontal: number;
  gap: number;
  maxDescLines: number;
}

const sizeConfigs: Record<LinkPreviewCardSize, SizeConfig> = {
  sm: { titleFontSize: 13, descFontSize: 12, domainFontSize: 11, padding: 10, imageHeight: 120, imageWidthHorizontal: 80, gap: 8, maxDescLines: 2 },
  md: { titleFontSize: 14, descFontSize: 13, domainFontSize: 12, padding: 12, imageHeight: 160, imageWidthHorizontal: 100, gap: 10, maxDescLines: 3 },
  lg: { titleFontSize: 16, descFontSize: 14, domainFontSize: 12, padding: 14, imageHeight: 200, imageWidthHorizontal: 120, gap: 12, maxDescLines: 4 },
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// LinkPreviewCard
// ---------------------------------------------------------------------------

export const LinkPreviewCard = forwardRef<View, LinkPreviewCardProps>(
  function LinkPreviewCard(
    {
      url,
      title: titleProp,
      description: descProp,
      image: imageProp,
      siteName: siteNameProp,
      favicon: faviconProp,
      size = 'md',
      layout = 'vertical',
      onPress,
      loading: loadingProp = false,
      skeleton = false,
      autoFetch = false,
      fetcher,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // Auto-fetch OG metadata when enabled
    const { data: fetchedData, loading: fetchLoading } = useLinkPreview({
      url,
      enabled: autoFetch,
      fetcher,
    });

    // Merge: explicit props override fetched data
    const title = titleProp ?? fetchedData?.title;
    const description = descProp ?? fetchedData?.description;
    const image = imageProp ?? fetchedData?.image;
    const siteName = siteNameProp ?? fetchedData?.siteName;
    const favicon = faviconProp ?? fetchedData?.favicon;
    const loading = loadingProp || (autoFetch && fetchLoading);

    const colors = useMemo(() => resolveLinkPreviewCardColors(theme), [theme]);
    const cfg = sizeConfigs[size];

    const handlePress = useCallback(() => {
      if (onPress) {
        onPress();
      } else {
        Linking.openURL(url);
      }
    }, [onPress, url]);

    // ------ Skeleton / Loading ------
    if (skeleton || loading) {
      const skelContainer: ViewStyle = {
        flexDirection: layout === 'horizontal' ? 'row' : 'column',
        overflow: 'hidden',
        borderRadius: defaultRadii.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        backgroundColor: theme.colors.background.raised,
        maxWidth: 320,
      };

      const skelImage: ViewStyle = layout === 'horizontal'
        ? { width: cfg.imageWidthHorizontal, minHeight: 80, backgroundColor: theme.colors.border.subtle }
        : { width: '100%', height: cfg.imageHeight, backgroundColor: theme.colors.border.subtle };

      const skelLine = (width: number | string, height: number): ViewStyle => ({
        width: width as any,
        height,
        borderRadius: defaultRadii.sm,
        backgroundColor: theme.colors.border.subtle,
      });

      return (
        <View ref={ref} style={[skelContainer, userStyle as ViewStyle]} {...rest}>
          <View style={skelImage} />
          <View style={{ padding: cfg.padding, gap: cfg.gap / 2, flex: 1 }}>
            <View style={skelLine('70%', 14)} />
            <View style={skelLine('90%', 12)} />
            <View style={skelLine('40%', 11)} />
          </View>
        </View>
      );
    }

    // ------ Styles ------
    const containerStyle: ViewStyle = {
      flexDirection: layout === 'horizontal' ? 'row' : 'column',
      overflow: 'hidden',
      borderRadius: defaultRadii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      maxWidth: 320,
    };

    const imageStyle: ImageStyle = layout === 'horizontal'
      ? { width: cfg.imageWidthHorizontal, minHeight: '100%' as any, resizeMode: 'cover' }
      : { width: '100%', height: cfg.imageHeight, resizeMode: 'cover' };

    const titleStyle: TextStyle = {
      fontSize: cfg.titleFontSize,
      lineHeight: cfg.titleFontSize * 1.3,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.title,
    };

    const descStyle: TextStyle = {
      fontSize: cfg.descFontSize,
      lineHeight: cfg.descFontSize * 1.4,
      fontWeight: String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
      color: colors.description,
    };

    const domainStyle: TextStyle = {
      fontSize: cfg.domainFontSize,
      lineHeight: cfg.domainFontSize * 1.3,
      color: colors.domain,
    };

    const displayDomain = siteName || extractDomain(url);

    return (
      <Pressable
        ref={ref as any}
        onPress={handlePress}
        accessibilityRole="link"
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {image && <Image source={{ uri: image }} style={imageStyle} />}

        <View style={{ padding: cfg.padding, gap: cfg.gap / 2, flex: 1, minWidth: 0 }}>
          {title && <Text numberOfLines={1} style={titleStyle}>{title}</Text>}
          {description && <Text numberOfLines={cfg.maxDescLines} style={descStyle}>{description}</Text>}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            {favicon && <Image source={{ uri: favicon }} style={{ width: 14, height: 14, borderRadius: 2 }} />}
            <Text numberOfLines={1} style={domainStyle}>{displayDomain}</Text>
          </View>
        </View>
      </Pressable>
    );
  },
);

LinkPreviewCard.displayName = 'LinkPreviewCard';
