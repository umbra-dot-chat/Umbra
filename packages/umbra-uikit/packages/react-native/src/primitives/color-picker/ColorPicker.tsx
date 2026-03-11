import React, { forwardRef, useMemo, useCallback, useState } from 'react';
import { View, TextInput, Pressable, Text, Platform } from 'react-native';
import type { ViewProps } from 'react-native';
import { colorPickerSizeMap } from '@coexist/wisp-core/types/ColorPicker.types';
import type { ColorPickerSize, ColorPickerSizeConfig } from '@coexist/wisp-core/types/ColorPicker.types';
import { defaultSpacing, defaultTypography, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PRESETS: string[] = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
];

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

function normalizeHex(hex: string): string {
  if (hex.length === 4) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return hex.toUpperCase();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A preset can be a plain hex string or an object with a name for tooltip/label. */
export type ColorPreset = string | { color: string; name: string };

function getPresetColor(p: ColorPreset): string {
  return typeof p === 'string' ? p : p.color;
}

function getPresetName(p: ColorPreset): string | undefined {
  return typeof p === 'string' ? undefined : p.name;
}

// ---------------------------------------------------------------------------
// Props (RN-specific)
// ---------------------------------------------------------------------------

export interface ColorPickerProps {
  value?: string;
  defaultValue?: string;
  onChange?: (color: string) => void;
  size?: ColorPickerSize;
  presets?: ColorPreset[];
  showInput?: boolean;
  disabled?: boolean;
  skeleton?: boolean;
  label?: string;
  style?: ViewProps['style'];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ColorPicker = forwardRef<View, ColorPickerProps>(function ColorPicker(
  {
    value: controlledValue,
    defaultValue = '#000000',
    onChange,
    size = 'md',
    presets,
    showInput = true,
    disabled = false,
    skeleton = false,
    label,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const sizeConfig = useMemo(() => colorPickerSizeMap[size], [size]);
  const resolvedBorderRadius = typeof sizeConfig.borderRadius === 'number' ? sizeConfig.borderRadius : (defaultRadii as any)[sizeConfig.borderRadius] ?? defaultRadii.md;
  const resolvedPresets: ColorPreset[] = presets ?? DEFAULT_PRESETS;

  // Controlled / uncontrolled
  const [internalColor, setInternalColor] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const currentColor = isControlled ? controlledValue : internalColor;

  const updateColor = useCallback(
    (newColor: string) => {
      if (disabled) return;
      if (!isControlled) setInternalColor(newColor);
      onChange?.(newColor);
    },
    [disabled, isControlled, onChange],
  );

  // Hex input state
  const [inputValue, setInputValue] = useState(currentColor);
  const [inputFocused, setInputFocused] = useState(false);
  const displayInput = inputFocused ? inputValue : currentColor;

  const handleInputChange = useCallback(
    (raw: string) => {
      if (raw.length > 0 && raw[0] !== '#') raw = `#${raw}`;
      setInputValue(raw);
      if (HEX_REGEX.test(raw)) updateColor(normalizeHex(raw));
    },
    [updateColor],
  );

  const handleInputFocus = useCallback(() => {
    setInputValue(currentColor);
    setInputFocused(true);
  }, [currentColor]);

  const handleInputBlur = useCallback(() => {
    setInputFocused(false);
    if (!HEX_REGEX.test(inputValue)) setInputValue(currentColor);
  }, [inputValue, currentColor]);

  // Pressed swatch tracking
  const [pressedSwatch, setPressedSwatch] = useState<string | null>(null);

  // Find the name of the currently selected color (if it matches a named preset)
  const selectedName = useMemo(() => {
    const norm = currentColor.toUpperCase();
    for (const p of resolvedPresets) {
      if (normalizeHex(getPresetColor(p)) === norm) {
        return getPresetName(p);
      }
    }
    return undefined;
  }, [currentColor, resolvedPresets]);

  // Skeleton
  if (skeleton) {
    return (
      <View
        ref={ref}
        style={[
          {
            width: sizeConfig.previewSize * 4,
            height: sizeConfig.previewSize * 2,
            borderRadius: resolvedBorderRadius,
            backgroundColor: tc.background.raised,
            opacity: 0.5,
          },
          userStyle,
        ]}
      />
    );
  }

  return (
    <View
      ref={ref}
      accessibilityRole="none"
      accessibilityLabel={label || 'Colour picker'}
      style={[
        { gap: sizeConfig.gap, opacity: disabled ? 0.5 : 1 },
        userStyle,
      ]}
      pointerEvents={disabled ? 'none' : 'auto'}
    >
      {/* Label */}
      {label != null && (
        <Text
          style={{
            fontSize: sizeConfig.fontSize,
            fontWeight: defaultTypography.weights.semibold,
            color: tc.text.primary,
            marginBottom: defaultSpacing['2xs'],
          }}
        >
          {label}
        </Text>
      )}

      {/* Preview row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: sizeConfig.gap }}>
        {/* Color swatch preview */}
        <View
          style={{
            width: sizeConfig.previewSize,
            height: sizeConfig.previewSize,
            borderRadius: resolvedBorderRadius,
            overflow: 'hidden',
            backgroundColor: currentColor,
            borderWidth: 1,
            borderColor: tc.border.subtle,
          }}
        />
        {/* Hex input */}
        {showInput && (
          <TextInput
            value={displayInput}
            onChangeText={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            editable={!disabled}
            maxLength={7}
            autoCapitalize="characters"
            autoCorrect={false}
            spellCheck={false}
            accessibilityLabel="Hex colour value"
            style={{
              height: sizeConfig.inputHeight,
              flex: 1,
              fontSize: sizeConfig.fontSize,
              fontFamily: 'monospace' as const,
              color: tc.text.primary,
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: tc.border.strong,
              borderRadius: resolvedBorderRadius,
              paddingHorizontal: defaultSpacing.sm,
            }}
          />
        )}
        {/* Selected color name */}
        {selectedName != null && (
          <Text
            style={{
              fontSize: sizeConfig.fontSize,
              color: tc.text.secondary,
            }}
          >
            {selectedName}
          </Text>
        )}
      </View>

      {/* Preset swatch grid */}
      {resolvedPresets.length > 0 && (
        <View
          accessibilityRole="none"
          accessibilityLabel="Colour presets"
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: sizeConfig.gap / 2,
          }}
        >
          {resolvedPresets.map((preset) => {
            const color = getPresetColor(preset);
            const name = getPresetName(preset);
            const normalised = normalizeHex(color);
            const isSelected = currentColor.toUpperCase() === normalised;
            const isPressed = pressedSwatch === color;

            const swatchEl = (
              <Pressable
                key={color}
                accessibilityRole="button"
                accessibilityLabel={name ? `Select ${name}` : `Select colour ${color}`}
                accessibilityState={{ selected: isSelected }}
                disabled={disabled}
                onPressIn={() => setPressedSwatch(color)}
                onPressOut={() => setPressedSwatch(null)}
                onPress={() => updateColor(normalised)}
                style={{
                  width: sizeConfig.swatchSize,
                  height: sizeConfig.swatchSize,
                  borderRadius: sizeConfig.swatchSize / 2,
                  backgroundColor: color,
                  borderWidth: isSelected ? 2 : isPressed ? 1.5 : 1,
                  borderColor: isSelected
                    ? tc.accent.primary
                    : isPressed
                      ? tc.text.primary
                      : tc.border.subtle,
                  transform: [{ scale: isPressed ? 0.9 : 1 }],
                }}
              />
            );

            // Wrap in a View with title prop for web tooltip
            if (Platform.OS === 'web' && name) {
              return (
                <View key={color} {...({ title: name } as any)}>
                  {swatchEl}
                </View>
              );
            }

            return swatchEl;
          })}
        </View>
      )}
    </View>
  );
});

ColorPicker.displayName = 'ColorPicker';
