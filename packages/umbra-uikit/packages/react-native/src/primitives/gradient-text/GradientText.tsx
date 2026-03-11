/**
 * @module primitives/gradient-text
 * @description Animated gradient text effect for the Wisp design system.
 *
 * - **Web**: Uses CSS `background-clip: text` with injected keyframes.
 * - **Native**: Uses MaskedView + LinearGradient (optional peer dependencies).
 *
 * Falls back to solid colored text if native peer dependencies are unavailable.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Animated, Platform, View } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { Text } from '../text';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#8B5CF6'];
const DEFAULT_SPEED = 3000;
const KEYFRAMES_ID = 'wisp-gradient-text-keyframes';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GradientTextProps {
  /** Text content to apply gradient to. */
  children: React.ReactNode;
  /**
   * Gradient color stops. Must have at least 2 colors.
   * @default ['#8B5CF6', '#EC4899', '#3B82F6', '#8B5CF6']
   */
  colors?: string[];
  /**
   * Whether the gradient animates (shifts position over time).
   * @default true
   */
  animated?: boolean;
  /**
   * Duration of one full gradient cycle in milliseconds.
   * @default 3000
   */
  speed?: number;
  /** Style applied to the text element. */
  style?: TextStyle;
  /** Style applied to the outer container. */
  containerStyle?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Web — inject keyframes once, use CSS background-clip: text
// ---------------------------------------------------------------------------

let keyframesInjected = false;

function injectKeyframes(): void {
  if (keyframesInjected || typeof document === 'undefined') return;
  keyframesInjected = true;
  const sheet = document.createElement('style');
  sheet.id = KEYFRAMES_ID;
  sheet.textContent = `@keyframes wisp-gradient-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}`;
  document.head.appendChild(sheet);
}

function GradientTextWeb({
  children,
  colors,
  animated,
  speed,
  style,
  containerStyle,
}: Required<Pick<GradientTextProps, 'colors' | 'animated' | 'speed'>> & GradientTextProps): React.JSX.Element {
  useEffect(() => {
    if (animated) injectKeyframes();
  }, [animated]);

  const gradientStr = `linear-gradient(90deg, ${colors.join(', ')})`;

  const webStyle: any = {
    ...style,
    backgroundImage: gradientStr,
    backgroundSize: animated ? '300% 300%' : '100% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    ...(animated
      ? { animationName: 'wisp-gradient-shift', animationDuration: `${speed}ms`, animationTimingFunction: 'ease', animationIterationCount: 'infinite' }
      : {}),
  };

  return (
    <View style={containerStyle}>
      <Text style={webStyle}>{children}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Native — MaskedView + LinearGradient
// ---------------------------------------------------------------------------

function GradientTextNative({
  children,
  colors,
  animated,
  speed,
  style,
  containerStyle,
}: Required<Pick<GradientTextProps, 'colors' | 'animated' | 'speed'>> & GradientTextProps): React.JSX.Element {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const [deps, setDeps] = useState<{
    MaskedView: React.ComponentType<any>;
    AnimatedGradient: React.ComponentType<any>;
    StaticGradient: React.ComponentType<any>;
  } | null>(null);

  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const MV = require('@react-native-masked-view/masked-view').default;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const LG = require('expo-linear-gradient').LinearGradient;
      if (MV && LG) {
        setDeps({
          MaskedView: MV,
          AnimatedGradient: Animated.createAnimatedComponent(LG),
          StaticGradient: LG,
        });
      }
    } catch {
      // Dependencies not available
    }
  }, []);

  useEffect(() => {
    if (!animated || !deps) return;
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: speed,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, speed, translateX, deps]);

  if (!deps) {
    return (
      <Text style={[{ color: colors[0] || theme.colors.accent.primary }, style]}>
        {children}
      </Text>
    );
  }

  const { MaskedView, AnimatedGradient, StaticGradient } = deps;

  const maskElement = (
    <Text style={[{ color: 'black' }, style]}>{children}</Text>
  );

  const gradientStyle: ViewStyle = {
    width: '200%' as any,
    height: '100%',
  };

  const animatedTranslateX = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -200],
  });

  return (
    <View style={containerStyle}>
      <MaskedView maskElement={maskElement}>
        {animated ? (
          <AnimatedGradient
            colors={colors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[gradientStyle, { transform: [{ translateX: animatedTranslateX }] }]}
          />
        ) : (
          <StaticGradient
            colors={colors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={gradientStyle}
          />
        )}
      </MaskedView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export function GradientText(props: GradientTextProps): React.JSX.Element {
  const {
    colors = DEFAULT_COLORS,
    animated = true,
    speed = DEFAULT_SPEED,
    ...rest
  } = props;

  const resolved = { ...rest, colors, animated, speed };

  if (Platform.OS === 'web') {
    return <GradientTextWeb {...resolved} />;
  }
  return <GradientTextNative {...resolved} />;
}

GradientText.displayName = 'GradientText';
