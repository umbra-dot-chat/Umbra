import React, { forwardRef, useState, useCallback, useMemo } from 'react';
import { View, Text } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { SwitchGroupOption, SwitchGroupOrientation } from '@coexist/wisp-core/types/SwitchGroup.types';
import { Checkbox } from '../../primitives/checkbox';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

export interface CheckboxGroupProps {
  label?: string;
  description?: string;
  options: SwitchGroupOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  orientation?: SwitchGroupOrientation;
  disabled?: boolean;
  error?: string;
  style?: ViewStyle;
}

export const CheckboxGroup = forwardRef<View, CheckboxGroupProps>(function CheckboxGroup(
  {
    label,
    description,
    options,
    value: controlledValue,
    defaultValue = [],
    onChange,
    orientation = 'vertical',
    disabled = false,
    error,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue);
  const selected = isControlled ? controlledValue : internalValue;

  const handleToggle = useCallback(
    (optionValue: string, checked: boolean) => {
      const next = checked
        ? [...selected, optionValue]
        : selected.filter((v) => v !== optionValue);
      if (!isControlled) setInternalValue(next);
      onChange?.(next);
    },
    [selected, isControlled, onChange],
  );

  const containerStyle = useMemo<ViewStyle>(
    () => ({ gap: defaultSpacing.md }),
    [],
  );

  const optionsStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      gap: orientation === 'horizontal' ? 16 : 8,
      flexWrap: orientation === 'horizontal' ? 'wrap' : undefined,
    }),
    [orientation],
  );

  const labelStyle = useMemo<TextStyle>(
    () => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      fontWeight: defaultTypography.weights.semibold,
      color: themeColors.text.primary,
    }),
    [themeColors],
  );

  const descriptionStyle = useMemo<TextStyle>(
    () => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      color: themeColors.text.secondary,
      marginTop: defaultSpacing['2xs'],
    }),
    [themeColors],
  );

  const errorStyle = useMemo<TextStyle>(
    () => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      color: themeColors.status.danger,
      marginTop: defaultSpacing.xs,
    }),
    [themeColors],
  );

  return (
    <View ref={ref} accessibilityRole="none" style={[containerStyle, userStyle]}>
      {(label || description) && (
        <View>
          {label && <Text style={labelStyle}>{label}</Text>}
          {description && <Text style={descriptionStyle}>{description}</Text>}
        </View>
      )}

      <View style={optionsStyle}>
        {options.map((option) => {
          const isOptionDisabled = disabled || !!option.disabled;
          const isChecked = selected.includes(option.value);

          return (
            <Checkbox
              key={option.value}
              checked={isChecked}
              onChange={(checked) => handleToggle(option.value, checked)}
              disabled={isOptionDisabled}
              size="md"
              label={option.label}
              description={option.description}
            />
          );
        })}
      </View>

      {error && <Text style={errorStyle}>{error}</Text>}
    </View>
  );
});

CheckboxGroup.displayName = 'CheckboxGroup';
