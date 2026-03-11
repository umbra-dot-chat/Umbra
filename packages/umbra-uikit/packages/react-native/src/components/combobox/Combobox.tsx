import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Pressable, Modal, FlatList, StyleSheet, TextInput, Text as RNText, SafeAreaView } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import type { SelectOption } from '../select/Select';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

type ComboboxSize = 'sm' | 'md' | 'lg';

const comboboxSizeMap: Record<ComboboxSize, { height: number; fontSize: number; paddingX: number }> = {
  sm: { height: 32, fontSize: defaultTypography.sizes.sm.fontSize, paddingX: 10 },
  md: { height: 40, fontSize: defaultTypography.sizes.sm.fontSize, paddingX: 14 },
  lg: { height: 48, fontSize: defaultTypography.sizes.base.fontSize, paddingX: 16 },
};

export interface ComboboxProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  size?: ComboboxSize;
  label?: string;
  error?: string | boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  emptyMessage?: string;
  style?: ViewStyle;
}

export const Combobox = forwardRef<View, ComboboxProps>(function Combobox(
  {
    options,
    value: controlledValue,
    defaultValue,
    onChange,
    placeholder = '',
    size = 'md',
    label,
    error,
    disabled = false,
    fullWidth = false,
    emptyMessage = 'No results found',
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const cfg = comboboxSizeMap[size];
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const activeValue = isControlled ? controlledValue : internalValue;
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const selectedOption = options.find((o) => o.value === activeValue);
  const hasError = !!error;

  const filteredOptions = useMemo(() => {
    if (!searchText) return options;
    const lower = searchText.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }, [options, searchText]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      if (!isControlled) setInternalValue(optionValue);
      onChange?.(optionValue);
      setSearchText('');
      setIsOpen(false);
    },
    [isControlled, onChange],
  );

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setSearchText('');
    setIsOpen(true);
  }, [disabled]);

  const triggerStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: 'row',
      alignItems: 'center',
      height: cfg.height,
      paddingHorizontal: cfg.paddingX,
      borderRadius: defaultRadii.md,
      borderWidth: 1,
      borderColor: hasError ? themeColors.status.danger : themeColors.border.subtle,
      backgroundColor: themeColors.background.surface,
      gap: defaultSpacing.sm,
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
      opacity: disabled ? 0.4 : 1,
    }),
    [cfg, hasError, themeColors, fullWidth, disabled],
  );

  const errorMsg = typeof error === 'string' ? error : undefined;

  return (
    <View ref={ref} style={[{ gap: defaultSpacing.sm }, userStyle]}>
      {label && (
        <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: defaultTypography.weights.medium, color: themeColors.text.primary } as TextStyle}>
          {label}
        </RNText>
      )}

      <Pressable onPress={handleOpen} disabled={disabled} style={triggerStyle}>
        <RNText
          style={{ flex: 1, fontSize: cfg.fontSize, color: selectedOption ? themeColors.text.primary : themeColors.text.muted } as TextStyle}
          numberOfLines={1}
        >
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
          <SafeAreaView style={{ flex: 1, justifyContent: 'center', paddingHorizontal: defaultSpacing.xl }}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={{
                backgroundColor: themeColors.background.raised,
                borderRadius: defaultRadii.xl,
                maxHeight: '70%',
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 24,
                elevation: 8,
              }}>
                <View style={{ paddingHorizontal: defaultSpacing.lg, paddingTop: defaultSpacing.md, paddingBottom: defaultSpacing.sm }}>
                  <TextInput
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Search…"
                    placeholderTextColor={themeColors.text.muted}
                    autoFocus
                    style={{
                      height: 36,
                      borderRadius: defaultRadii.md,
                      borderWidth: 1,
                      borderColor: themeColors.border.subtle,
                      paddingHorizontal: defaultSpacing.md,
                      fontSize: defaultTypography.sizes.sm.fontSize,
                      color: themeColors.text.onRaised,
                      backgroundColor: themeColors.background.surface,
                    } as any}
                  />
                </View>
                <FlatList
                  data={filteredOptions}
                  keyExtractor={(item) => item.value}
                  ListEmptyComponent={
                    <View style={{ padding: defaultSpacing.xl, alignItems: 'center' }}>
                      <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: themeColors.text.onRaisedSecondary } as TextStyle}>
                        {emptyMessage}
                      </RNText>
                    </View>
                  }
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
                          <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: isSelected ? '600' : '400', color: themeColors.text.onRaised } as TextStyle}>
                            {item.label}
                          </RNText>
                          {item.description && (
                            <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: themeColors.text.onRaisedSecondary, marginTop: defaultSpacing['2xs'] } as TextStyle}>
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

Combobox.displayName = 'Combobox';
