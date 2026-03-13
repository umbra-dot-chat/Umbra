/**
 * SpeakerBorder -- Animated gradient border indicating the active speaker.
 *
 * Wraps child content with a cycling brand-gradient glow
 * (violet -> pink -> blue) when `active` is true.
 *
 * IMPORTANT: Uses box-shadow (web) so the border renders OUTSIDE the element
 * and never shrinks the video content inside.
 *
 * Web: CSS @keyframes for box-shadow animation (outset glow + ring).
 * Native: Animated.Value cycling border color through the 3 brand colors.
 *
 * Respects reduced motion / animation-disabled preferences via useAppTheme().
 * When inactive, renders children in a plain wrapper with no visual border.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useTheme, Box } from '@coexist/wisp-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { dbg } from '@/utils/debug';

const BORDER_WIDTH = 3;
const ANIMATION_DURATION = 3000;

// ── CSS injection (web only) ─────────────────────────────────────────────────

const KEYFRAMES_ID = 'umbra-speaker-glow';

function injectSpeakerKeyframes(violet: string, pink: string, blue: string): void {
  if (typeof document === 'undefined') return;
  // Remove existing keyframes if present (theme may have changed)
  const existing = document.getElementById(KEYFRAMES_ID);
  if (existing) existing.remove();

  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  // box-shadow: solid ring (spread) + outer glow (blur) — renders OUTSIDE the element
  style.textContent = [
    '@keyframes speakerGlow {',
    `  0%, 100% { box-shadow: 0 0 0 ${BORDER_WIDTH}px ${violet}, 0 0 10px 1px ${violet}; }`,
    `  33% { box-shadow: 0 0 0 ${BORDER_WIDTH}px ${pink}, 0 0 10px 1px ${pink}; }`,
    `  66% { box-shadow: 0 0 0 ${BORDER_WIDTH}px ${blue}, 0 0 10px 1px ${blue}; }`,
    '}',
  ].join('\n');
  document.head.appendChild(style);
}

// ── Props ────────────────────────────────────────────────────────────────────

interface SpeakerBorderProps {
  active: boolean;
  children: React.ReactNode;
  borderRadius?: number;
  style?: ViewStyle;
}

// ── Component ────────────────────────────────────────────────────────────────

export function SpeakerBorder({ active, children, borderRadius = 12, style }: SpeakerBorderProps) {
  if (__DEV__) dbg.trackRender('SpeakerBorder');
  const { theme } = useTheme();
  const colors = theme.colors;
  const { motionPreferences } = useAppTheme();
  const animValue = useRef(new Animated.Value(0)).current;

  // Theme-aware brand gradient colors
  const brandViolet = colors.data.violet;
  const brandPink = colors.brand.primary;
  const brandBlue = colors.data.blue;

  const animationsEnabled =
    motionPreferences.enableAnimations && !motionPreferences.reduceMotion;

  // Inject CSS keyframes on web (re-inject when theme colors change)
  useEffect(() => {
    if (Platform.OS === 'web') injectSpeakerKeyframes(brandViolet, brandPink, brandBlue);
  }, [brandViolet, brandPink, brandBlue]);

  // Native: cycle animated value 0 -> 1 looping
  useEffect(() => {
    if (Platform.OS === 'web' || !active || !animationsEnabled) return;

    const animation = Animated.loop(
      Animated.timing(animValue, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [active, animationsEnabled, animValue]);

  // Reset animation value when deactivated
  useEffect(() => {
    if (!active) animValue.setValue(0);
  }, [active, animValue]);

  // Inactive: plain wrapper, no visual border, no layout shift
  if (!active) {
    return (
      <Box style={{ borderRadius, ...style }}>
        {children}
      </Box>
    );
  }

  // Static border (reduced motion or animations disabled)
  // Use box-shadow on web, borderWidth on native (native doesn't support boxShadow)
  if (!animationsEnabled) {
    if (Platform.OS === 'web') {
      return (
        <Box
          style={{
            borderRadius,
            boxShadow: `0 0 0 ${BORDER_WIDTH}px ${colors.accent.primary}, 0 0 10px 1px ${colors.accent.primary}`,
            ...style,
          } as any}
        >
          {children}
        </Box>
      );
    }
    return (
      <Box
        style={{
          borderWidth: BORDER_WIDTH,
          borderColor: colors.accent.primary,
          borderRadius,
          ...style,
        }}
      >
        {children}
      </Box>
    );
  }

  // Web: CSS animation using box-shadow (renders OUTSIDE the element)
  if (Platform.OS === 'web') {
    return (
      <Box
        style={{
          borderRadius,
          animationName: 'speakerGlow',
          animationDuration: `${ANIMATION_DURATION}ms`,
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          ...style,
        } as any}
      >
        {children}
      </Box>
    );
  }

  // Native: interpolated border color (borderWidth is the only option on RN)
  const borderColor = animValue.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [brandViolet, brandPink, brandBlue, brandViolet],
  });

  return (
    <Animated.View style={[{ borderWidth: BORDER_WIDTH, borderColor, borderRadius }, style]}>
      {children}
    </Animated.View>
  );
}
