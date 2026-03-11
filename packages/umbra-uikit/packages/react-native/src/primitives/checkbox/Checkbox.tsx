/**
 * @module primitives/checkbox
 * @description React Native Checkbox primitive for the Wisp design system.
 *
 * Reuses color resolution and size maps from `@coexist/wisp-core`.
 * Key differences from the React DOM version:
 *
 * - Uses `<Pressable>` instead of `<label>`.
 * - Uses `<View>` instead of `<span>` for the checkbox box.
 * - View-based checkmark/dash instead of SVG stroke-draw animation.
 * - `Animated` press scale instead of CSS `transition`.
 * - No hidden `<input>` element (not needed in RN).
 * - No hover state, focus-visible ring, or CSS transitions.
 * - No `className` or mouse event props.
 */

import React, { forwardRef, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Pressable, View, Animated } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { ComponentSize } from '@coexist/wisp-core/tokens/shared';
import { checkboxSizeMap } from '@coexist/wisp-core/types/Checkbox.types';
import { resolveCheckboxColors } from '@coexist/wisp-core/styles/Checkbox.styles';
import { Text } from '../text';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CheckboxProps extends Omit<ViewProps, 'children'> {
  /** Controlled checked state. When provided the component enters controlled mode. */
  checked?: boolean;
  /** Initial checked state for uncontrolled mode. @default false */
  defaultChecked?: boolean;
  /** When `true`, displays a horizontal dash instead of a checkmark. @default false */
  indeterminate?: boolean;
  /** Callback fired when the checked state changes. Receives the next `boolean` value. */
  onChange?: (checked: boolean) => void;
  /** Visual size of the checkbox. @default 'md' */
  size?: ComponentSize;
  /** Whether the checkbox is disabled. @default false */
  disabled?: boolean;
  /** Label text rendered beside the checkbox square. */
  label?: string;
  /** Description text rendered below the label in a smaller font. */
  description?: string;
  /** Error state -- renders a danger-colored border around the checkbox square. @default false */
  error?: boolean;
  /** Warning state -- renders a warning-colored border around the checkbox square. @default false */
  warning?: boolean;
  /** Optional style override for the root container. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Checkbox = forwardRef<View, CheckboxProps>(function Checkbox(
  {
    checked: controlledChecked,
    defaultChecked = false,
    indeterminate = false,
    onChange,
    size = 'md',
    disabled = false,
    label,
    description,
    error = false,
    warning = false,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  // ---------------------------------------------------------------------------
  // Controlled / uncontrolled state
  // ---------------------------------------------------------------------------
  const isControlled = controlledChecked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isChecked = isControlled ? controlledChecked : internalChecked;

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
  // Animated icon opacity + scale
  // ---------------------------------------------------------------------------
  const iconAnim = useRef(new Animated.Value(isChecked || indeterminate ? 1 : 0)).current;

  useEffect(() => {
    const isVisible = isChecked || indeterminate;
    Animated.timing(iconAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [isChecked, indeterminate, iconAnim]);

  // ---------------------------------------------------------------------------
  // Toggle handler
  // ---------------------------------------------------------------------------
  const handlePress = useCallback(() => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  }, [disabled, isChecked, isControlled, onChange]);

  // ---------------------------------------------------------------------------
  // Resolve dimensions + colors
  // ---------------------------------------------------------------------------
  const sizeConfig = checkboxSizeMap[size];

  const colors = useMemo(
    () => resolveCheckboxColors(isChecked, indeterminate, error, warning, disabled, theme),
    [isChecked, indeterminate, error, warning, disabled, themeColors],
  );

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const boxStyle = useMemo<ViewStyle>(() => ({
    width: sizeConfig.boxSize,
    height: sizeConfig.boxSize,
    borderRadius: sizeConfig.borderRadius,
    overflow: 'hidden' as const,
    backgroundColor: colors.boxBg,
    borderWidth: 1.5,
    borderColor: colors.boxBorder,
    alignItems: 'center',
    justifyContent: 'center',
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

  // ---------------------------------------------------------------------------
  // Checkmark / dash icon (View-based approach)
  // ---------------------------------------------------------------------------

  const iconOpacity = iconAnim;
  const iconScale = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const checkIcon = indeterminate ? (
    // Horizontal dash
    <Animated.View
      style={{
        opacity: iconOpacity,
        transform: [{ scale: iconScale }],
      }}
    >
      <View
        style={{
          width: sizeConfig.iconSize * 0.7,
          height: sizeConfig.iconStrokeWidth,
          borderRadius: sizeConfig.iconStrokeWidth / 2,
          backgroundColor: colors.iconColor,
        }}
      />
    </Animated.View>
  ) : (
    // Checkmark -- two rotated bars forming an L-shape
    <Animated.View
      style={{
        opacity: iconOpacity,
        transform: [{ scale: iconScale }, { rotate: '45deg' }],
        width: sizeConfig.iconSize * 0.45,
        height: sizeConfig.iconSize * 0.7,
        marginTop: -(sizeConfig.iconStrokeWidth),
      }}
    >
      {/* Vertical bar (long side) */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: sizeConfig.iconStrokeWidth,
          height: '100%',
          borderRadius: sizeConfig.iconStrokeWidth / 2,
          backgroundColor: colors.iconColor,
        }}
      />
      {/* Horizontal bar (short side) */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '100%',
          height: sizeConfig.iconStrokeWidth,
          borderRadius: sizeConfig.iconStrokeWidth / 2,
          backgroundColor: colors.iconColor,
        }}
      />
    </Animated.View>
  );

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
      accessibilityRole="checkbox"
      accessibilityState={{
        checked: indeterminate ? 'mixed' : isChecked,
        disabled,
      }}
      accessibilityLabel={label}
      style={[rootStyle, userStyle]}
      {...rest}
    >
      {/* Visual checkbox box */}
      <Animated.View style={[boxStyle, { transform: [{ scale: scaleAnim }] }]}>
        {checkIcon}
      </Animated.View>

      {/* Label + description text */}
      {textContainer}
    </Pressable>
  );
});

Checkbox.displayName = 'Checkbox';
