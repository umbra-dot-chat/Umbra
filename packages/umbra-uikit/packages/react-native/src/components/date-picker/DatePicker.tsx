import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Pressable, Modal, SafeAreaView, StyleSheet, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Calendar } from '../calendar';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

type DatePickerSize = 'sm' | 'md' | 'lg';

const datePickerSizeMap: Record<DatePickerSize, { height: number; fontSize: number; paddingX: number; iconSize: number }> = {
  sm: { height: 32, fontSize: defaultTypography.sizes.sm.fontSize, paddingX: 10, iconSize: 14 },
  md: { height: 40, fontSize: defaultTypography.sizes.sm.fontSize, paddingX: 14, iconSize: 16 },
  lg: { height: 48, fontSize: defaultTypography.sizes.base.fontSize, paddingX: 16, iconSize: 18 },
};

type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

export interface DatePickerProps {
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date | null) => void;
  size?: DatePickerSize;
  placeholder?: string;
  format?: DateFormat;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  disabled?: boolean;
  label?: string;
  error?: string | boolean;
  clearable?: boolean;
  style?: ViewStyle;
}

function formatDate(date: Date, format: DateFormat): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  switch (format) {
    case 'DD/MM/YYYY': return `${dd}/${mm}/${yyyy}`;
    case 'YYYY-MM-DD': return `${yyyy}-${mm}-${dd}`;
    default: return `${mm}/${dd}/${yyyy}`;
  }
}

export const DatePicker = forwardRef<View, DatePickerProps>(function DatePicker(
  { value: controlledValue, defaultValue, onChange, size = 'md', placeholder = 'Select date',
    format = 'MM/DD/YYYY', minDate, maxDate, disabledDates, disabled = false, label, error,
    clearable = true, style: userStyle },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const cfg = datePickerSizeMap[size];
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<Date | undefined>(defaultValue);
  const selectedDate = isControlled ? controlledValue : internalValue;
  const [isOpen, setIsOpen] = useState(false);
  const hasError = !!error;
  const errorMsg = typeof error === 'string' ? error : undefined;

  const handleSelect = useCallback((date: Date) => {
    if (!isControlled) setInternalValue(date);
    onChange?.(date);
    setIsOpen(false);
  }, [isControlled, onChange]);

  const handleClear = useCallback(() => {
    if (!isControlled) setInternalValue(undefined);
    onChange?.(null);
  }, [isControlled, onChange]);

  const triggerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row', alignItems: 'center', height: cfg.height, paddingHorizontal: cfg.paddingX,
    borderRadius: defaultRadii.md, borderWidth: 1, borderColor: hasError ? themeColors.status.danger : themeColors.border.subtle,
    backgroundColor: themeColors.background.surface, gap: defaultSpacing.sm, opacity: disabled ? 0.4 : 1,
  }), [cfg, hasError, themeColors, disabled]);

  const displayText = selectedDate ? formatDate(selectedDate, format) : undefined;

  return (
    <View ref={ref} style={[{ gap: defaultSpacing.sm }, userStyle]}>
      {label && <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: defaultTypography.weights.medium, color: themeColors.text.primary } as TextStyle}>{label}</RNText>}
      <Pressable onPress={() => !disabled && setIsOpen(true)} disabled={disabled} accessibilityRole="button" style={triggerStyle}>
        <Svg width={cfg.iconSize} height={cfg.iconSize} viewBox="0 0 24 24" fill="none">
          <Path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke={themeColors.text.secondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <RNText style={{ flex: 1, fontSize: cfg.fontSize, color: displayText ? themeColors.text.primary : themeColors.text.muted } as TextStyle} numberOfLines={1}>
          {displayText || placeholder}
        </RNText>
        {clearable && selectedDate && !disabled && (
          <Pressable onPress={handleClear} accessibilityLabel="Clear date" style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={cfg.iconSize} height={cfg.iconSize} viewBox="0 0 24 24" fill="none">
              <Path d="M18 6L6 18M6 6l12 12" stroke={themeColors.text.secondary} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </Pressable>
        )}
      </Pressable>
      {errorMsg && <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: themeColors.status.danger } as TextStyle}>{errorMsg}</RNText>}
      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)} statusBarTranslucent>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={() => setIsOpen(false)}>
          <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={{ backgroundColor: themeColors.background.raised, borderRadius: defaultRadii.xl, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 8 }}>
                <Calendar value={selectedDate} onChange={handleSelect} size={size} minDate={minDate} maxDate={maxDate} disabledDates={disabledDates} />
              </View>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </View>
  );
});

DatePicker.displayName = 'DatePicker';
