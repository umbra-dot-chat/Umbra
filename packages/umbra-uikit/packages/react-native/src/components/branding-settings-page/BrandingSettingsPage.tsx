/**
 * @module components/branding-settings-page
 * @description React Native BrandingSettingsPage component for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`.
 * Renders via `<View>`, `<Text>`, `<ScrollView>`, `<TextInput>`, `<Image>`,
 * `<TouchableOpacity>` instead of DOM elements.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { ViewProps, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { resolveBrandingSettingsPageColors } from '@coexist/wisp-core/styles/BrandingSettingsPage.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Accent presets
// ---------------------------------------------------------------------------

const ACCENT_PRESETS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BrandingSettingsPageProps extends ViewProps {
  iconUrl?: string;
  bannerUrl?: string;
  splashUrl?: string;
  accentColor?: string;
  customCss?: string;
  onIconChange?: (file: never) => void;
  onBannerChange?: (file: never) => void;
  onSplashChange?: (file: never) => void;
  onAccentColorChange?: (color: string) => void;
  onCustomCssChange?: (css: string) => void;
  onSave?: () => void;
  saving?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const BrandingSettingsPage = forwardRef<View, BrandingSettingsPageProps>(
  function BrandingSettingsPage(
    {
      iconUrl,
      bannerUrl,
      splashUrl,
      accentColor = '#6366f1',
      customCss = '',
      onAccentColorChange,
      onCustomCssChange,
      onSave,
      saving = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveBrandingSettingsPageColors(theme),
      [theme],
    );

    const containerStyle = useMemo<ViewStyle>(() => ({
      padding: theme.spacing.lg,
      backgroundColor: colors.bg,
    }), [theme, colors]);

    const sectionStyle = useMemo<ViewStyle>(() => ({
      padding: theme.spacing.lg,
      backgroundColor: colors.cardBg,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: theme.spacing.lg,
    }), [theme, colors]);

    const sectionTitleStyle = useMemo<TextStyle>(() => ({
      fontSize: theme.typography.sizes.md.fontSize,
      fontWeight: theme.typography.weights.semibold,
      color: colors.text,
      marginBottom: theme.spacing.md,
    }), [theme, colors]);

    const labelStyle = useMemo<TextStyle>(() => ({
      fontSize: theme.typography.sizes.sm.fontSize,
      fontWeight: theme.typography.weights.medium,
      color: colors.textSecondary,
      marginBottom: theme.spacing.xs,
    }), [theme, colors]);

    const previewStyle = useMemo<ViewStyle>(() => ({
      width: '100%' as any,
      height: 120,
      borderRadius: theme.radii.md,
      backgroundColor: colors.previewBg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginBottom: theme.spacing.md,
    }), [theme, colors]);

    return (
      <ScrollView ref={ref} style={[containerStyle, userStyle]} {...rest}>
        <Text style={{ fontSize: theme.typography.sizes.xl.fontSize, fontWeight: theme.typography.weights.semibold, color: colors.text, marginBottom: theme.spacing.lg }}>
          Branding Settings
        </Text>

        {/* Images */}
        <View style={sectionStyle}>
          <Text style={sectionTitleStyle}>Images</Text>

          <Text style={labelStyle}>Community Icon</Text>
          <View style={[previewStyle, { width: 80, height: 80, borderRadius: 40 }]}>
            {iconUrl ? (
              <Image source={{ uri: iconUrl }} style={{ width: 80, height: 80, borderRadius: 40 }} />
            ) : (
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>No icon</Text>
            )}
          </View>

          <Text style={labelStyle}>Banner</Text>
          <View style={previewStyle}>
            {bannerUrl ? (
              <Image source={{ uri: bannerUrl }} style={{ width: '100%' as any, height: 120 }} resizeMode="cover" />
            ) : (
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>No banner</Text>
            )}
          </View>

          <Text style={labelStyle}>Splash</Text>
          <View style={[previewStyle, { height: 160 }]}>
            {splashUrl ? (
              <Image source={{ uri: splashUrl }} style={{ width: '100%' as any, height: 160 }} resizeMode="cover" />
            ) : (
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>No splash</Text>
            )}
          </View>
        </View>

        {/* Colors */}
        <View style={sectionStyle}>
          <Text style={sectionTitleStyle}>Colors</Text>
          <Text style={labelStyle}>Accent Color</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {ACCENT_PRESETS.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => onAccentColorChange?.(color)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: color,
                  borderWidth: color === accentColor ? 2 : 0,
                  borderColor: '#ffffff',
                }}
              />
            ))}
          </View>
        </View>

        {/* Custom CSS */}
        <View style={sectionStyle}>
          <Text style={sectionTitleStyle}>Custom CSS</Text>
          <TextInput
            value={customCss}
            onChangeText={onCustomCssChange}
            placeholder="/* Enter custom CSS here */"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={8}
            style={{
              padding: 12,
              borderRadius: theme.radii.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.sectionBg,
              color: colors.text,
              fontFamily: 'monospace',
              fontSize: 13,
              textAlignVertical: 'top',
              minHeight: 160,
            }}
          />
        </View>

        {/* Save */}
        <TouchableOpacity
          onPress={onSave}
          disabled={saving}
          style={{
            padding: 12,
            borderRadius: theme.radii.md,
            backgroundColor: accentColor,
            alignItems: 'center',
            opacity: saving ? 0.7 : 1,
            marginBottom: theme.spacing.xl,
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  },
);

BrandingSettingsPage.displayName = 'BrandingSettingsPage';
