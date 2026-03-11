/**
 * @module components/text-effect-picker
 * @description React Native TextEffectPicker for the Wisp design system.
 *
 * Displays a popup grid of iMessage-style text effects that can be
 * applied when sending a message. Designed to appear above the send button
 * on long-press.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { resolveTextEffectPickerColors } from '@coexist/wisp-core/styles/TextEffectPicker.styles';
import {
  textEffects,
  textEffectInfoMap,
} from '@coexist/wisp-core/types/TextEffectPicker.types';
import type {
  TextEffectType,
  TextEffectPickerProps,
} from '@coexist/wisp-core/types/TextEffectPicker.types';
import { defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import { Text } from '../../primitives';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TextEffectPicker = forwardRef<View, TextEffectPickerProps & ViewProps>(
  function TextEffectPicker(
    { onSelect, onDismiss, visible = true, selectedEffect, style, ...rest },
    ref,
  ) {
    const { theme } = useTheme();
    const colors = useMemo(() => resolveTextEffectPickerColors(theme), [theme]);

    const containerStyle = useMemo<ViewStyle>(
      () => ({
        backgroundColor: colors.bg,
        borderRadius: defaultRadii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 12,
        paddingHorizontal: 12,
        width: 280,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      }),
      [colors],
    );

    const headerStyle = useMemo<TextStyle>(
      () => ({
        fontSize: 13,
        fontWeight: '600',
        color: colors.header,
        textAlign: 'center',
        marginBottom: 10,
      }),
      [colors],
    );

    const gridStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
      }),
      [],
    );

    const handleSelect = useCallback(
      (effect: TextEffectType) => {
        onSelect(effect);
      },
      [onSelect],
    );

    if (!visible) return null;

    return (
      <View ref={ref} style={[containerStyle, style as ViewStyle]} {...rest}>
        <Text style={headerStyle}>Send with effect</Text>
        <View style={{ height: 1, backgroundColor: colors.divider, marginBottom: 10 }} />
        <View style={gridStyle}>
          {textEffects.map((effect) => {
            const info = textEffectInfoMap[effect];
            const isSelected = selectedEffect === effect;

            return (
              <EffectCard
                key={effect}
                icon={info.icon}
                label={info.label}
                isSelected={isSelected}
                colors={colors}
                onPress={() => handleSelect(effect)}
              />
            );
          })}
        </View>
      </View>
    );
  },
);

TextEffectPicker.displayName = 'TextEffectPicker';

// ---------------------------------------------------------------------------
// EffectCard sub-component
// ---------------------------------------------------------------------------

interface EffectCardProps {
  icon: string;
  label: string;
  isSelected: boolean;
  colors: ReturnType<typeof resolveTextEffectPickerColors>;
  onPress: () => void;
}

function EffectCard({ icon, label, isSelected, colors, onPress }: EffectCardProps) {
  const cardStyle = useMemo<ViewStyle>(
    () => ({
      width: 60,
      height: 68,
      borderRadius: defaultRadii.md,
      backgroundColor: isSelected ? colors.cardBgSelected : colors.cardBg,
      borderWidth: isSelected ? 1.5 : 0,
      borderColor: isSelected ? colors.cardBorderSelected : 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    }),
    [isSelected, colors],
  );

  const iconStyle = useMemo<TextStyle>(
    () => ({
      fontSize: 22,
    }),
    [],
  );

  const labelStyle = useMemo<TextStyle>(
    () => ({
      fontSize: 10,
      fontWeight: '500',
      color: colors.label,
      textAlign: 'center',
    }),
    [colors],
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Send with ${label} effect`}
      accessibilityRole="button"
      style={({ pressed }) => [
        cardStyle,
        pressed && { backgroundColor: colors.cardBgHover },
      ]}
    >
      <Text style={iconStyle}>{icon}</Text>
      <Text style={labelStyle} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
