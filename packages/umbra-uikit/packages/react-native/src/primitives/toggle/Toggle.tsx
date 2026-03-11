/**
 * @module primitives/toggle
 * @description React Native Toggle (switch) primitive for the Wisp design system.
 *
 * Reuses color resolution and size maps from `@coexist/wisp-core`.
 * Key differences from the React DOM version:
 *
 * - Uses `<Pressable>` instead of `<button>`.
 * - Handle sliding via `Animated.timing` instead of CSS `transition`.
 * - No CSS grid spacer trick — track width is computed directly.
 * - No `className` or mouse event props.
 * - Gradient track uses CSS animation on web, expo-linear-gradient on native.
 */

import React, { forwardRef, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Pressable, View, Animated, Platform } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';

// Inject CSS keyframes for the toggle gradient animation (web only, once)
let toggleGradientInjected = false;
function injectToggleGradientKeyframes(): void {
  if (toggleGradientInjected || typeof document === 'undefined') return;
  toggleGradientInjected = true;
  const sheet = document.createElement('style');
  sheet.id = 'wisp-toggle-gradient';
  sheet.textContent = '@keyframes wisp-toggle-gradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}';
  document.head.appendChild(sheet);
}

// Native gradient: try to load expo-linear-gradient (optional peer dep)
let NativeLinearGradient: React.ComponentType<any> | null = null;
let NativeAnimatedGradient: React.ComponentType<any> | null = null;
try {
  if (Platform.OS !== 'web') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const LG = require('expo-linear-gradient').LinearGradient;
    if (LG) {
      NativeLinearGradient = LG;
      NativeAnimatedGradient = Animated.createAnimatedComponent(LG);
    }
  }
} catch {
  // expo-linear-gradient not available — native gradient will be skipped
}

import type { ComponentSize } from '@coexist/wisp-core/tokens/shared';
import type { ToggleSizeConfig } from '@coexist/wisp-core/types/Toggle.types';
import {
  resolveToggleColors,
  getDisabledToggleColors,
  resolveSizeConfig,
} from '@coexist/wisp-core/styles/Toggle.styles';
import { useTheme } from '../../providers';

const GRADIENT_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#8B5CF6'];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ToggleProps extends Omit<ViewProps, 'children'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: ComponentSize;
  slim?: boolean;
  disabled?: boolean;
  handleIcon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
  checkedColor?: string;
  uncheckedColor?: string;
  label?: string;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Toggle = forwardRef<View, ToggleProps>(function Toggle(
  {
    checked: controlledChecked,
    defaultChecked = false,
    onChange,
    size = 'md',
    slim = false,
    disabled = false,
    handleIcon: HandleIconComponent,
    checkedColor,
    uncheckedColor,
    label,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  // Controlled / uncontrolled
  const isControlled = controlledChecked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isChecked = isControlled ? controlledChecked : internalChecked;

  // Animated position for handle
  const slideAnim = useRef(new Animated.Value(isChecked ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isChecked ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isChecked, slideAnim]);

  const sizeConfig = useMemo(
    () => resolveSizeConfig(size, slim),
    [size, slim],
  );

  const colors = useMemo(() => {
    if (disabled) return getDisabledToggleColors(theme);
    return resolveToggleColors(isChecked, theme, checkedColor, uncheckedColor);
  }, [isChecked, disabled, themeColors, checkedColor, uncheckedColor]);

  // Inject CSS keyframes for gradient track (web only)
  useEffect(() => {
    if (isChecked && Platform.OS === 'web') injectToggleGradientKeyframes();
  }, [isChecked]);

  // Native gradient animation (shift gradient position over time)
  const nativeGradientAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'web' || !isChecked || disabled || !NativeAnimatedGradient) return;
    const loop = Animated.loop(
      Animated.timing(nativeGradientAnim, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [isChecked, disabled, nativeGradientAnim]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  }, [disabled, isChecked, isControlled, onChange]);

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const useWebGradient = isChecked && !disabled && Platform.OS === 'web';
  const useNativeGradient = isChecked && !disabled && Platform.OS !== 'web' && !!NativeAnimatedGradient;

  const trackStyle = useMemo<ViewStyle>(() => ({
    width: sizeConfig.trackWidth,
    height: sizeConfig.trackHeight,
    borderRadius: sizeConfig.trackHeight / 2,
    overflow: 'hidden' as const,
    backgroundColor: (useWebGradient || useNativeGradient) ? undefined : colors.trackBg,
    justifyContent: 'center',
    paddingHorizontal: sizeConfig.padding,
    opacity: disabled ? 0.5 : 1,
    ...(useWebGradient ? {
      backgroundImage: 'linear-gradient(90deg, #8B5CF6, #EC4899, #3B82F6, #8B5CF6)',
      backgroundSize: '300% 300%',
      animationName: 'wisp-toggle-gradient',
      animationDuration: '12000ms',
      animationTimingFunction: 'ease',
      animationIterationCount: 'infinite',
    } as any : {}),
  }), [sizeConfig, colors, disabled, useWebGradient, useNativeGradient]);

  const handleSize = sizeConfig.handleSize;
  const travelDistance = sizeConfig.trackWidth - handleSize - sizeConfig.padding * 2;

  const animatedLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, travelDistance],
  });

  const handleStyle = useMemo<ViewStyle>(() => ({
    width: handleSize,
    height: handleSize,
    borderRadius: handleSize / 2,
    backgroundColor: colors.handleBg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  }), [handleSize, colors]);

  // Animated translateX for native gradient (shifts the oversized gradient left over time)
  const nativeGradientTranslateX = nativeGradientAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -sizeConfig.trackWidth, 0],
  });

  return (
    <Pressable
      ref={ref}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: isChecked, disabled }}
      accessibilityLabel={label}
      style={[userStyle]}
      {...rest}
    >
      <View style={trackStyle}>
        {/* Native gradient track background */}
        {useNativeGradient && NativeAnimatedGradient && (
          <NativeAnimatedGradient
            colors={GRADIENT_COLORS}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: sizeConfig.trackWidth * 2,
              height: sizeConfig.trackHeight,
              transform: [{ translateX: nativeGradientTranslateX }],
            } as any}
          />
        )}
        <Animated.View
          style={[
            handleStyle,
            { transform: [{ translateX: animatedLeft }] },
          ]}
        >
          {HandleIconComponent && (
            <HandleIconComponent
              size={sizeConfig.handleIconSize}
              color={colors.handleIconColor}
              strokeWidth={2}
            />
          )}
        </Animated.View>
      </View>
    </Pressable>
  );
});

Toggle.displayName = 'Toggle';
