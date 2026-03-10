/**
 * SpeakerBorder -- Animated gradient border indicating the active speaker.
 *
 * Wraps child content with a cycling brand-gradient border
 * (violet -> pink -> blue) when `active` is true.
 *
 * Web: CSS @keyframes for box-shadow + border-color animation.
 * Native: Animated.Value cycling border color through the 3 brand colors.
 *
 * Respects reduced motion / animation-disabled preferences via useAppTheme().
 * When inactive, renders a transparent border to preserve layout.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, Platform } from 'react-native';
import { useTheme } from '@coexist/wisp-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';

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
  style.textContent = [
    '@keyframes speakerGlow {',
    `  0%, 100% { box-shadow: 0 0 8px 2px ${violet}; border-color: ${violet}; }`,
    `  33% { box-shadow: 0 0 8px 2px ${pink}; border-color: ${pink}; }`,
    `  66% { box-shadow: 0 0 8px 2px ${blue}; border-color: ${blue}; }`,
    '}',
  ].join('\n');
  document.head.appendChild(style);
}

// ── Props ────────────────────────────────────────────────────────────────────

interface SpeakerBorderProps {
  active: boolean;
  children: React.ReactNode;
  borderRadius?: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export function SpeakerBorder({ active, children, borderRadius = 12 }: SpeakerBorderProps) {
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

  if (!active) {
    return (
      <View style={{ borderWidth: BORDER_WIDTH, borderColor: 'transparent', borderRadius }}>
        {children}
      </View>
    );
  }

  // Static border (reduced motion or animations disabled)
  if (!animationsEnabled) {
    return (
      <View
        style={{
          borderWidth: BORDER_WIDTH,
          borderColor: colors.accent.primary,
          borderRadius,
        }}
      >
        {children}
      </View>
    );
  }

  // Web: CSS animation
  if (Platform.OS === 'web') {
    return (
      <View
        style={
          {
            borderWidth: BORDER_WIDTH,
            borderColor: brandViolet,
            borderRadius,
            animationName: 'speakerGlow',
            animationDuration: `${ANIMATION_DURATION}ms`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          } as any
        }
      >
        {children}
      </View>
    );
  }

  // Native: interpolated border color
  const borderColor = animValue.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [brandViolet, brandPink, brandBlue, brandViolet],
  });

  return (
    <Animated.View style={{ borderWidth: BORDER_WIDTH, borderColor, borderRadius }}>
      {children}
    </Animated.View>
  );
}
