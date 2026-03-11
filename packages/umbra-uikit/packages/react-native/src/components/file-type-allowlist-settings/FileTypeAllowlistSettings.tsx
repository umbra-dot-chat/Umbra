import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText, Pressable, ScrollView } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileTypePreset {
  label: string;
  types: string[];
}

export interface FileTypeAllowlistSettingsProps {
  allowedTypes: string[];
  blockedTypes: string[];
  onUpdate: (allowed: string[], blocked: string[]) => void;
  presets?: FileTypePreset[];
  skeleton?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// FileTypeAllowlistSettings
// ---------------------------------------------------------------------------

export const FileTypeAllowlistSettings = forwardRef<View, FileTypeAllowlistSettingsProps>(
  function FileTypeAllowlistSettings(
    {
      allowedTypes,
      blockedTypes,
      onUpdate,
      presets = [],
      skeleton = false,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;

    const handleRemoveAllowed = (type: string) => {
      onUpdate(allowedTypes.filter(t => t !== type), blockedTypes);
    };

    const handleRemoveBlocked = (type: string) => {
      onUpdate(allowedTypes, blockedTypes.filter(t => t !== type));
    };

    const handlePresetToggle = (types: string[]) => {
      const allPresent = types.every(t => allowedTypes.includes(t));
      if (allPresent) {
        onUpdate(allowedTypes.filter(t => !types.includes(t)), blockedTypes);
      } else {
        const newAllowed = [...new Set([...allowedTypes, ...types])];
        onUpdate(newAllowed, blockedTypes);
      }
    };

    const isPresetActive = (types: string[]) => types.every(t => allowedTypes.includes(t));

    const sectionTitle = (text: string) => (
      <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: '600', color: tc.text.primary } as TextStyle}>
        {text}
      </RNText>
    );

    const renderTag = (type: string, variant: 'allowed' | 'blocked', onRemove: () => void) => {
      const isBlocked = variant === 'blocked';
      return (
        <View key={type} style={{
          flexDirection: 'row', alignItems: 'center', gap: 2,
          paddingVertical: 2, paddingHorizontal: defaultSpacing.xs,
          borderRadius: defaultRadii.md,
          backgroundColor: isBlocked ? tc.status.danger + '1A' : tc.status.success + '1A',
        }}>
          <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, fontWeight: '500', color: isBlocked ? tc.status.danger : tc.status.success } as TextStyle}>
            {type}
          </RNText>
          <Pressable onPress={onRemove}>
            <RNText style={{ fontSize: 14, color: isBlocked ? tc.status.danger : tc.status.success } as TextStyle}>{'\u00D7'}</RNText>
          </Pressable>
        </View>
      );
    };

    return (
      <View ref={ref} style={[{ gap: defaultSpacing.md }, userStyle]}>
        {/* Presets */}
        {presets.length > 0 && (
          <>
            {sectionTitle('Quick Presets')}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: defaultSpacing.xs }}>
              {presets.map(preset => {
                const active = isPresetActive(preset.types);
                return (
                  <Pressable
                    key={preset.label}
                    onPress={() => handlePresetToggle(preset.types)}
                    style={{
                      paddingVertical: 4, paddingHorizontal: defaultSpacing.sm,
                      borderRadius: defaultRadii.full,
                      borderWidth: 1,
                      borderColor: active ? tc.accent.primary : tc.border.subtle,
                      backgroundColor: active ? tc.accent.highlight : 'transparent',
                    }}
                  >
                    <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, fontWeight: '500', color: active ? tc.accent.primary : tc.text.secondary } as TextStyle}>
                      {preset.label}
                    </RNText>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* Allowed */}
        {sectionTitle('Allowed Types')}
        {allowedTypes.length === 0 ? (
          <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted, padding: defaultSpacing.sm } as TextStyle}>
            All file types are allowed
          </RNText>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: defaultSpacing.xs }}>
            {allowedTypes.map(type => renderTag(type, 'allowed', () => handleRemoveAllowed(type)))}
          </View>
        )}

        {/* Blocked */}
        {sectionTitle('Blocked Types')}
        {blockedTypes.length === 0 ? (
          <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted, padding: defaultSpacing.sm } as TextStyle}>
            No file types are blocked
          </RNText>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: defaultSpacing.xs }}>
            {blockedTypes.map(type => renderTag(type, 'blocked', () => handleRemoveBlocked(type)))}
          </View>
        )}
      </View>
    );
  },
);

FileTypeAllowlistSettings.displayName = 'FileTypeAllowlistSettings';
