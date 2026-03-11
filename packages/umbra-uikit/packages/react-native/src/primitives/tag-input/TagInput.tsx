import React, { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import { View, TextInput, Text as RNText, Pressable } from 'react-native';
import type { ComponentSize } from '@coexist/wisp-core/tokens/shared';
import { tagInputSizeMap } from '@coexist/wisp-core/types/TagInput.types';
import { resolveTagInputColors } from '@coexist/wisp-core/styles/TagInput.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

export interface TagInputProps {
  size?: ComponentSize;
  value?: string[];
  defaultValue?: string[];
  onChange?: (tags: string[]) => void;
  onTagAdd?: (tag: string) => void;
  onTagRemove?: (tag: string) => void;
  label?: string;
  hint?: string;
  error?: string | boolean;
  warning?: string | boolean;
  placeholder?: string;
  max?: number;
  allowDuplicates?: boolean;
  separators?: string[];
  fullWidth?: boolean;
  disabled?: boolean;
  style?: object;
}

export const TagInput = forwardRef<View, TagInputProps>(function TagInput(
  {
    size = 'md',
    value,
    defaultValue = [],
    onChange,
    onTagAdd,
    onTagRemove,
    label,
    hint,
    error,
    warning,
    placeholder = '',
    max = Infinity,
    allowDuplicates = false,
    separators = [','],
    fullWidth = false,
    disabled = false,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = tagInputSizeMap[size];

  const isControlled = value !== undefined;
  const [internalTags, setInternalTags] = useState(defaultValue);
  const tags = isControlled ? value : internalTags;

  const [inputValue, setInputValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const hasError = Boolean(error);
  const hasWarning = Boolean(warning);
  const errorMessage = typeof error === 'string' ? error : undefined;
  const warningMessage = typeof warning === 'string' ? warning : undefined;
  const bottomText = errorMessage || warningMessage || hint;
  const atMax = tags.length >= max;

  const setTags = useCallback(
    (next: string[]) => {
      if (!isControlled) setInternalTags(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim();
      if (!tag) return;
      if (!allowDuplicates && tags.includes(tag)) return;
      if (tags.length >= max) return;
      const next = [...tags, tag];
      setTags(next);
      onTagAdd?.(tag);
    },
    [tags, allowDuplicates, max, setTags, onTagAdd],
  );

  const removeTag = useCallback(
    (index: number) => {
      const removed = tags[index];
      const next = tags.filter((_, i) => i !== index);
      setTags(next);
      if (removed) onTagRemove?.(removed);
    },
    [tags, setTags, onTagRemove],
  );

  const handleChangeText = useCallback(
    (text: string) => {
      if (separators.some((sep) => text.endsWith(sep))) {
        const raw = text.slice(0, -1);
        if (raw.trim()) addTag(raw);
        setInputValue('');
        return;
      }
      setInputValue(text);
    },
    [separators, addTag],
  );

  const handleSubmitEditing = useCallback(() => {
    if (inputValue.trim()) {
      addTag(inputValue);
      setInputValue('');
    }
  }, [inputValue, addTag]);

  const handleKeyPress = useCallback(
    (e: { nativeEvent: { key: string } }) => {
      if (e.nativeEvent.key === 'Backspace' && !inputValue && tags.length > 0) {
        removeTag(tags.length - 1);
      }
    },
    [inputValue, tags, removeTag],
  );

  const colors = useMemo(
    () => resolveTagInputColors(focused, hasError, hasWarning, disabled, theme),
    [focused, hasError, hasWarning, disabled, themeColors],
  );

  return (
    <View ref={ref} style={[{ width: fullWidth ? '100%' : undefined }, userStyle]}>
      {label && (
        <RNText
          style={{
            fontSize: sizeConfig.fontSize,
            fontWeight: defaultTypography.weights.medium,
            color: colors.label,
            marginBottom: defaultSpacing.sm,
          }}
        >
          {label}
        </RNText>
      )}

      <Pressable
        onPress={() => !disabled && inputRef.current?.focus()}
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: defaultSpacing.xs,
          minHeight: sizeConfig.minHeight,
          paddingHorizontal: sizeConfig.paddingX,
          paddingVertical: defaultSpacing.xs,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: sizeConfig.borderRadius,
          overflow: 'hidden',
          backgroundColor: colors.bg,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {tags.map((tag, index) => (
          <View
            key={`${tag}-${index}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: defaultSpacing['2xs'],
              paddingHorizontal: defaultSpacing.sm,
              paddingVertical: defaultSpacing['2xs'],
              borderRadius: defaultRadii.sm,
              backgroundColor: colors.tagBg,
              borderWidth: 1,
              borderColor: colors.tagBorder,
            }}
          >
            <RNText
              style={{
                fontSize: sizeConfig.fontSize - 1,
                fontWeight: defaultTypography.weights.medium,
                color: colors.tagText,
              }}
            >
              {tag}
            </RNText>
            <Pressable
              onPress={() => !disabled && removeTag(index)}
              accessibilityLabel={`Remove ${tag}`}
              hitSlop={4}
              style={{ padding: defaultSpacing['2xs'] }}
            >
              <View style={{ width: sizeConfig.tagRemoveSize, height: sizeConfig.tagRemoveSize }}>
                <View
                  style={{
                    position: 'absolute',
                    width: sizeConfig.tagRemoveSize,
                    height: 1.5,
                    backgroundColor: colors.tagText,
                    top: sizeConfig.tagRemoveSize / 2 - 0.75,
                    transform: [{ rotate: '45deg' }],
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    width: sizeConfig.tagRemoveSize,
                    height: 1.5,
                    backgroundColor: colors.tagText,
                    top: sizeConfig.tagRemoveSize / 2 - 0.75,
                    transform: [{ rotate: '-45deg' }],
                  }}
                />
              </View>
            </Pressable>
          </View>
        ))}

        <TextInput
          ref={inputRef}
          value={inputValue}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmitEditing}
          onKeyPress={handleKeyPress}
          onFocus={() => !disabled && setFocused(true)}
          onBlur={() => {
            setFocused(false);
            if (inputValue.trim()) {
              addTag(inputValue);
              setInputValue('');
            }
          }}
          placeholder={tags.length === 0 ? placeholder : atMax ? '' : placeholder}
          placeholderTextColor={themeColors.text.muted}
          editable={!disabled && !atMax}
          style={{
            flex: 1,
            minWidth: 60,
            fontSize: sizeConfig.fontSize,
            color: colors.text,
            paddingVertical: defaultSpacing['2xs'],
            padding: 0,
          }}
          blurOnSubmit={false}
        />
      </Pressable>

      {bottomText && (
        <RNText
          style={{
            fontSize: sizeConfig.fontSize - 2,
            color: colors.hint,
            marginTop: defaultSpacing.xs,
          }}
        >
          {bottomText}
        </RNText>
      )}
    </View>
  );
});

TagInput.displayName = 'TagInput';
