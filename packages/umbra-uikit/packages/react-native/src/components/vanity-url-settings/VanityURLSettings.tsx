/**
 * @module components/vanity-url-settings
 * @description React Native VanityURLSettings component for the Wisp design system.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { VanityUrlAvailability } from '@coexist/wisp-core/types/VanityURLSettings.types';
import { resolveVanityURLSettingsColors } from '@coexist/wisp-core/styles/VanityURLSettings.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface VanityURLSettingsProps extends ViewProps {
  currentSlug?: string;
  baseUrl?: string;
  onChange?: (slug: string) => void;
  onCheck?: (slug: string) => void;
  onSave?: (slug: string) => void;
  availability?: VanityUrlAvailability;
  saving?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const VanityURLSettings = forwardRef<View, VanityURLSettingsProps>(
  function VanityURLSettings(
    {
      currentSlug = '',
      baseUrl = 'umbra.app/c/',
      onChange,
      onCheck,
      onSave,
      availability,
      saving = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [slug, setSlug] = useState(currentSlug);

    const colors = useMemo(
      () => resolveVanityURLSettingsColors(theme),
      [theme],
    );

    const handleSlugChange = useCallback(
      (val: string) => {
        const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setSlug(clean);
        onChange?.(clean);
      },
      [onChange],
    );

    const statusColor = availability === 'available' ? colors.available
      : availability === 'taken' ? colors.taken
      : availability === 'invalid' ? colors.invalid
      : colors.checking;

    const statusLabel: Record<string, string> = {
      available: 'Available',
      taken: 'Taken',
      checking: 'Checking...',
      invalid: 'Invalid',
    };

    return (
      <View
        ref={ref}
        style={[{
          padding: theme.spacing.lg,
          backgroundColor: colors.cardBg,
          borderRadius: theme.radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
          gap: theme.spacing.md,
        }, userStyle]}
        {...rest}
      >
        <Text style={{ fontSize: theme.typography.sizes.md.fontSize, fontWeight: theme.typography.weights.semibold, color: colors.text }}>
          Vanity URL
        </Text>
        <Text style={{ fontSize: theme.typography.sizes.sm.fontSize, color: colors.textSecondary }}>
          Set a custom URL for your community.
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            backgroundColor: colors.bg,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
            borderTopLeftRadius: theme.radii.md,
            borderBottomLeftRadius: theme.radii.md,
            borderWidth: 1,
            borderRightWidth: 0,
            borderColor: colors.border,
            height: 40,
            justifyContent: 'center',
          }}>
            <Text style={{ fontSize: theme.typography.sizes.sm.fontSize, color: colors.textMuted }}>{baseUrl}</Text>
          </View>
          <TextInput
            value={slug}
            onChangeText={handleSlugChange}
            placeholder="your-community"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            style={{
              flex: 1,
              height: 40,
              paddingHorizontal: theme.spacing.sm,
              borderTopRightRadius: theme.radii.md,
              borderBottomRightRadius: theme.radii.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.bg,
              color: colors.text,
              fontSize: theme.typography.sizes.sm.fontSize,
            }}
          />
        </View>

        {availability && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
            {availability === 'checking' && <ActivityIndicator size="small" color={colors.checking} />}
            <Text style={{ fontSize: theme.typography.sizes.sm.fontSize, color: statusColor }}>
              {statusLabel[availability]}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <TouchableOpacity
            onPress={() => onCheck?.(slug)}
            disabled={!slug}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: theme.radii.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.cardBg,
              opacity: slug ? 1 : 0.5,
            }}
          >
            <Text style={{ fontSize: theme.typography.sizes.sm.fontSize, color: colors.text }}>
              Check Availability
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onSave?.(slug)}
            disabled={saving || availability !== 'available'}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: theme.radii.md,
              backgroundColor: availability === 'available' ? theme.colors.accent.primary : colors.border,
              opacity: saving || availability !== 'available' ? 0.5 : 1,
            }}
          >
            <Text style={{ fontSize: theme.typography.sizes.sm.fontSize, color: '#ffffff', fontWeight: '600' }}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

VanityURLSettings.displayName = 'VanityURLSettings';
