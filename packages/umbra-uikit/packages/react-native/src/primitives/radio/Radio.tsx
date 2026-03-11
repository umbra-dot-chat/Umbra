/**
 * @module primitives/radio
 * @description React Native Radio and RadioGroup primitives for the Wisp design system.
 *
 * Reuses color resolution and size maps from `@coexist/wisp-core`.
 * Key differences from the React DOM version:
 *
 * - Uses `<Pressable>` instead of `<label>` for Radio.
 * - Uses `<View>` instead of `<div>` for RadioGroup.
 * - Outer circle and inner dot are `<View>` elements with `borderRadius`.
 * - Inner dot animates via `Animated.timing` instead of CSS `transform`/`opacity`.
 * - No hidden `<input>` element (not needed in RN).
 * - No hover state, focus-visible ring, or keyboard arrow navigation.
 * - No `className` or mouse event props.
 */

import React, {
  forwardRef,
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
} from 'react';
import { Pressable, View, Animated } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { ComponentSize } from '@coexist/wisp-core/tokens/shared';
import { radioSizeMap } from '@coexist/wisp-core/types/Radio.types';
import { resolveRadioColors } from '@coexist/wisp-core/styles/Radio.styles';
import { Text } from '../text';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/** Internal context value shared between RadioGroup and Radio. */
interface RadioGroupContextValue {
  /** Currently selected value. */
  value: string | undefined;
  /** Callback invoked when a radio option is selected. */
  onChange: (value: string) => void;
  /** Active size propagated to all child radios. */
  size: ComponentSize;
  /** Whether all radios in the group are disabled. */
  disabled: boolean;
  /** Whether the group is in an error state. */
  error: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/**
 * Retrieves the nearest RadioGroupContextValue from context.
 *
 * @throws Error if called outside of a RadioGroup.
 * @returns The current radio-group context value.
 */
function useRadioGroupContext(): RadioGroupContextValue {
  const ctx = useContext(RadioGroupContext);
  if (ctx === null) {
    throw new Error(
      '[Wisp] <Radio> must be used within a <RadioGroup>. ' +
        'Wrap your Radio components with <RadioGroup> to provide context.',
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// RadioGroup Props
// ---------------------------------------------------------------------------

export interface RadioGroupProps extends ViewProps {
  /** Currently selected value. Pass this for controlled mode. */
  value?: string;
  /** Initial value used when operating in uncontrolled mode. */
  defaultValue?: string;
  /** Callback invoked with the new value whenever the selection changes. */
  onChange?: (value: string) => void;
  /** Size tier applied to every child radio indicator and label. @default 'md' */
  size?: ComponentSize;
  /** When `true`, disables every radio in the group. @default false */
  disabled?: boolean;
  /** When `true`, renders all radio indicators in the error (danger) color. @default false */
  error?: boolean;
  /** Layout direction for the radios. @default 'vertical' */
  orientation?: 'vertical' | 'horizontal';
  /** Child Radio elements (or any valid React children). */
  children: React.ReactNode;
  /** Optional style override for the root container. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// RadioGroup Component
// ---------------------------------------------------------------------------

export const RadioGroup = forwardRef<View, RadioGroupProps>(function RadioGroup(
  {
    value: controlledValue,
    defaultValue,
    onChange,
    size = 'md',
    disabled = false,
    error = false,
    orientation = 'vertical',
    children,
    style: userStyle,
    ...rest
  },
  ref,
) {
  // ---------------------------------------------------------------------------
  // Controlled / uncontrolled state
  // ---------------------------------------------------------------------------
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleChange = useCallback(
    (nextValue: string) => {
      if (!isControlled) setInternalValue(nextValue);
      onChange?.(nextValue);
    },
    [isControlled, onChange],
  );

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------
  const contextValue = useMemo<RadioGroupContextValue>(
    () => ({
      value: currentValue,
      onChange: handleChange,
      size,
      disabled,
      error,
    }),
    [currentValue, handleChange, size, disabled, error],
  );

  // ---------------------------------------------------------------------------
  // Root style
  // ---------------------------------------------------------------------------
  const rootStyle = useMemo<ViewStyle>(() => ({
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    gap: orientation === 'horizontal' ? 16 : 12,
  }), [orientation]);

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <View
        ref={ref}
        accessibilityRole="radiogroup"
        style={[rootStyle, userStyle]}
        {...rest}
      >
        {children}
      </View>
    </RadioGroupContext.Provider>
  );
});

RadioGroup.displayName = 'RadioGroup';

// ---------------------------------------------------------------------------
// Radio Props
// ---------------------------------------------------------------------------

export interface RadioProps extends Omit<ViewProps, 'children'> {
  /** Unique string value that identifies this option within the group. */
  value: string;
  /** Primary label rendered beside the radio indicator. */
  label?: string;
  /** Secondary description rendered below the label in a smaller font. */
  description?: string;
  /** Whether this individual radio is disabled. @default false */
  disabled?: boolean;
  /** Optional style override for the root container. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Radio Component
// ---------------------------------------------------------------------------

export const Radio = forwardRef<View, RadioProps>(function Radio(
  {
    value,
    label,
    description,
    disabled: localDisabled,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const group = useRadioGroupContext();

  const disabled = localDisabled || group.disabled;
  const selected = group.value === value;
  const sizeConfig = radioSizeMap[group.size];

  // ---------------------------------------------------------------------------
  // Animated press scale
  // ---------------------------------------------------------------------------
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    Animated.timing(scaleAnim, {
      toValue: 0.9,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [disabled, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  // ---------------------------------------------------------------------------
  // Animated inner dot scale
  // ---------------------------------------------------------------------------
  const dotAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(dotAnim, {
      toValue: selected ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [selected, dotAnim]);

  // ---------------------------------------------------------------------------
  // Click handler
  // ---------------------------------------------------------------------------
  const handlePress = useCallback(() => {
    if (disabled) return;
    group.onChange(value);
  }, [disabled, group, value]);

  // ---------------------------------------------------------------------------
  // Resolve colors + styles
  // ---------------------------------------------------------------------------
  const colors = useMemo(
    () => resolveRadioColors(selected, disabled, group.error, theme),
    [selected, disabled, group.error, themeColors],
  );

  const outerStyle = useMemo<ViewStyle>(() => ({
    width: sizeConfig.outerSize,
    height: sizeConfig.outerSize,
    borderRadius: sizeConfig.outerSize / 2,
    borderWidth: sizeConfig.borderWidth,
    borderColor: colors.outerBorder,
    backgroundColor: colors.outerBg,
    alignItems: 'center',
    justifyContent: 'center',
  }), [sizeConfig, colors]);

  const innerStyle = useMemo<ViewStyle>(() => ({
    width: sizeConfig.innerSize,
    height: sizeConfig.innerSize,
    borderRadius: sizeConfig.innerSize / 2,
    backgroundColor: colors.innerBg,
  }), [sizeConfig, colors]);

  const rootStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sizeConfig.gap,
    opacity: disabled ? 0.5 : 1,
  }), [sizeConfig, disabled]);

  const labelStyle = useMemo<TextStyle>(() => ({
    fontSize: sizeConfig.labelFontSize,
    lineHeight: sizeConfig.labelFontSize * sizeConfig.labelLineHeight,
    color: colors.labelColor,
  }), [sizeConfig, colors]);

  const descriptionStyle = useMemo<TextStyle>(() => ({
    fontSize: Math.max(sizeConfig.labelFontSize - 2, 11),
    lineHeight: Math.max(sizeConfig.labelFontSize - 2, 11) * sizeConfig.labelLineHeight,
    color: colors.descriptionColor,
  }), [sizeConfig, colors]);

  // Animated dot transforms
  const dotScale = dotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const dotOpacity = dotAnim;

  // ---------------------------------------------------------------------------
  // Text container
  // ---------------------------------------------------------------------------
  const hasText = Boolean(label || description);

  const textContainer = hasText ? (
    <View style={{ flexDirection: 'column', gap: defaultSpacing['2xs'], flexShrink: 1 }}>
      {label && (
        <Text style={labelStyle}>{label}</Text>
      )}
      {description && (
        <Text style={descriptionStyle}>{description}</Text>
      )}
    </View>
  ) : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Pressable
      ref={ref}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={label}
      style={[rootStyle, userStyle]}
      {...rest}
    >
      {/* Visual outer circle with inner dot */}
      <Animated.View style={[outerStyle, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.View
          style={[
            innerStyle,
            {
              opacity: dotOpacity,
              transform: [{ scale: dotScale }],
            },
          ]}
        />
      </Animated.View>

      {/* Label + description text */}
      {textContainer}
    </Pressable>
  );
});

Radio.displayName = 'Radio';
