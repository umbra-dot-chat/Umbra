import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Pressable, Modal, FlatList, StyleSheet, Text as RNText, SafeAreaView } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Polyline, Path } from 'react-native-svg';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

type SelectSize = 'sm' | 'md' | 'lg';

const selectSizeMap: Record<SelectSize, { height: number; fontSize: number; paddingX: number }> = {
  sm: { height: 32, fontSize: defaultTypography.sizes.sm.fontSize, paddingX: 10 },
  md: { height: 40, fontSize: defaultTypography.sizes.sm.fontSize, paddingX: 14 },
  lg: { height: 48, fontSize: defaultTypography.sizes.base.fontSize, paddingX: 16 },
};

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  size?: SelectSize;
  label?: string;
  error?: string | boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Select = forwardRef<View, SelectProps>(function Select(
  {
    options,
    value: controlledValue,
    defaultValue,
    onChange,
    placeholder = 'Select…',
    size = 'md',
    label,
    error,
    disabled = false,
    fullWidth = false,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const cfg = selectSizeMap[size];
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const activeValue = isControlled ? controlledValue : internalValue;
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((o) => o.value === activeValue);
  const hasError = !!error;

  const handleSelect = useCallback(
    (optionValue: string) => {
      if (!isControlled) setInternalValue(optionValue);
      onChange?.(optionValue);
      setIsOpen(false);
    },
    [isControlled, onChange],
  );

  const triggerStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: 'row',
      alignItems: 'center',
      height: cfg.height,
      paddingHorizontal: cfg.paddingX,
      borderRadius: defaultRadii.md,
      borderWidth: 1,
      borderColor: hasError ? themeColors.status.danger : themeColors.border.strong,
      backgroundColor: 'transparent',
      gap: defaultSpacing.sm,
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
      opacity: disabled ? 0.4 : 1,
    }),
    [cfg, hasError, themeColors, fullWidth, disabled],
  );

  const triggerTextStyle = useMemo<TextStyle>(
    () => ({
      flex: 1,
      fontSize: cfg.fontSize,
      color: selectedOption ? themeColors.text.primary : themeColors.text.muted,
    }),
    [cfg, selectedOption, themeColors],
  );

  const errorMsg = typeof error === 'string' ? error : undefined;

  return (
    <View ref={ref} style={[{ gap: defaultSpacing.sm }, userStyle]}>
      {label && (
        <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: defaultTypography.weights.medium, color: themeColors.text.primary } as TextStyle}>
          {label}
        </RNText>
      )}

      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        style={triggerStyle}
      >
        {selectedOption?.icon && <View style={{ flexShrink: 0 }}>{selectedOption.icon}</View>}
        <RNText style={triggerTextStyle} numberOfLines={1}>
          {selectedOption?.label ?? placeholder}
        </RNText>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Polyline points="6 9 12 15 18 9" stroke={themeColors.text.secondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>

      {errorMsg && (
        <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: themeColors.status.danger } as TextStyle}>{errorMsg}</RNText>
      )}

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)} statusBarTranslucent>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={() => setIsOpen(false)}>
          <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: defaultSpacing.xl }}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={{
                backgroundColor: themeColors.background.canvas,
                borderRadius: defaultRadii.xl,
                maxHeight: '70%',
                maxWidth: 400,
                minWidth: 240,
                width: '100%',
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: themeColors.border.subtle,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 24,
                elevation: 8,
              }}>
                {label && (
                  <View style={{ paddingHorizontal: defaultSpacing.lg, paddingTop: defaultSpacing.lg, paddingBottom: defaultSpacing.sm }}>
                    <RNText style={{ fontSize: defaultTypography.sizes.base.fontSize, fontWeight: defaultTypography.weights.semibold, color: themeColors.text.primary } as TextStyle}>
                      {label}
                    </RNText>
                  </View>
                )}
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => {
                    const isSelected = item.value === activeValue;
                    const isDisabled = !!item.disabled;
                    return (
                      <Pressable
                        onPress={() => !isDisabled && handleSelect(item.value)}
                        disabled={isDisabled}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: defaultSpacing.md,
                          paddingVertical: defaultSpacing.md,
                          paddingHorizontal: defaultSpacing.lg,
                          backgroundColor: pressed ? themeColors.accent.highlight : 'transparent',
                          opacity: isDisabled ? 0.4 : 1,
                        })}
                      >
                        {item.icon && <View style={{ flexShrink: 0 }}>{item.icon}</View>}
                        <View style={{ flex: 1 }}>
                          <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: isSelected ? '600' : '400', color: themeColors.text.primary } as TextStyle}>
                            {item.label}
                          </RNText>
                          {item.description && (
                            <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: themeColors.text.secondary, marginTop: defaultSpacing['2xs'] } as TextStyle}>
                              {item.description}
                            </RNText>
                          )}
                        </View>
                        {isSelected && (
                          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                            <Polyline points="20 6 9 17 4 12" stroke={themeColors.accent.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                          </Svg>
                        )}
                      </Pressable>
                    );
                  }}
                />
              </View>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </View>
  );
});

Select.displayName = 'Select';
