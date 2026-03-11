/**
 * @module components/text-effect-wrapper
 * @description React Native TextEffectWrapper for the Wisp design system.
 *
 * Wraps message content with iMessage-style animations:
 * - Slam: scale 3x→1x with spring bounce
 * - Gentle: slow fade-in with upward drift
 * - Loud: scale pulse 1x→1.3x→1x, repeated
 * - Invisible Ink: blurred overlay, tap to reveal
 * - Shake: horizontal oscillation for ~1s
 * - Fade In: opacity fade from 0→1 over 0.8s
 * - Confetti: triggers screen-wide confetti via callback
 * - Balloons: triggers screen-wide balloons via callback
 *
 * Each animation plays only once per message ID (tracked via a module-level Set).
 * Uses react-native-reanimated for performant native animations.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import type { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import type { TextEffectWrapperProps } from '@coexist/wisp-core/types/TextEffectWrapper.types';

// ---------------------------------------------------------------------------
// Track which message IDs have already played their animation.
// Module-level Set so it persists across re-renders but resets on HMR/reload.
// ---------------------------------------------------------------------------

const playedMessageIds = new Set<string>();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TextEffectWrapper({
  effect,
  messageId,
  children,
  onScreenEffect,
}: TextEffectWrapperProps) {
  // If no effect, render children directly (no overhead).
  if (!effect) return <>{children}</>;

  // Check if this animation already played.
  const alreadyPlayed = playedMessageIds.has(messageId);

  // Mark as played immediately so re-renders don't replay.
  if (!alreadyPlayed) {
    playedMessageIds.add(messageId);
  }

  switch (effect) {
    case 'slam':
      return (
        <SlamEffect played={alreadyPlayed} messageId={messageId}>
          {children}
        </SlamEffect>
      );
    case 'gentle':
      return (
        <GentleEffect played={alreadyPlayed} messageId={messageId}>
          {children}
        </GentleEffect>
      );
    case 'loud':
      return (
        <LoudEffect played={alreadyPlayed} messageId={messageId}>
          {children}
        </LoudEffect>
      );
    case 'invisible_ink':
      return <InvisibleInkEffect messageId={messageId}>{children}</InvisibleInkEffect>;
    case 'shake':
      return (
        <ShakeEffect played={alreadyPlayed} messageId={messageId}>
          {children}
        </ShakeEffect>
      );
    case 'fade_in':
      return (
        <FadeInEffect played={alreadyPlayed} messageId={messageId}>
          {children}
        </FadeInEffect>
      );
    case 'confetti':
      return (
        <ScreenTriggerEffect
          played={alreadyPlayed}
          messageId={messageId}
          screenEffect="confetti"
          onScreenEffect={onScreenEffect}
        >
          {children}
        </ScreenTriggerEffect>
      );
    case 'balloons':
      return (
        <ScreenTriggerEffect
          played={alreadyPlayed}
          messageId={messageId}
          screenEffect="balloons"
          onScreenEffect={onScreenEffect}
        >
          {children}
        </ScreenTriggerEffect>
      );
    default:
      return <>{children}</>;
  }
}

TextEffectWrapper.displayName = 'TextEffectWrapper';

// ---------------------------------------------------------------------------
// Slam Effect: scale 3x→1x with spring bounce
// ---------------------------------------------------------------------------

function SlamEffect({
  played,
  children,
}: {
  played: boolean;
  messageId: string;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(played ? 1 : 3);

  useEffect(() => {
    if (!played) {
      scale.value = withSpring(1, {
        damping: 8,
        stiffness: 150,
        mass: 0.8,
      });
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

// ---------------------------------------------------------------------------
// Gentle Effect: slow fade-in with upward drift
// ---------------------------------------------------------------------------

function GentleEffect({
  played,
  children,
}: {
  played: boolean;
  messageId: string;
  children: React.ReactNode;
}) {
  const opacity = useSharedValue(played ? 1 : 0);
  const translateY = useSharedValue(played ? 0 : 20);

  useEffect(() => {
    if (!played) {
      opacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) });
      translateY.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) });
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

// ---------------------------------------------------------------------------
// Loud Effect: scale pulse 1x→1.3x→1x repeated 3x
// ---------------------------------------------------------------------------

function LoudEffect({
  played,
  children,
}: {
  played: boolean;
  messageId: string;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!played) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) }),
        ),
        3,
        false,
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

// ---------------------------------------------------------------------------
// Invisible Ink Effect: blurred overlay, tap to reveal
// ---------------------------------------------------------------------------

function InvisibleInkEffect({
  children,
}: {
  messageId: string;
  children: React.ReactNode;
}) {
  const [revealed, setRevealed] = useState(false);
  const overlayOpacity = useSharedValue(1);

  const handleReveal = () => {
    if (revealed) return;
    setRevealed(true);
    overlayOpacity.value = withTiming(0, { duration: 400 });
  };

  const overlayStyle = useAnimatedStyle(() => ({
    ...coverStyle,
    opacity: overlayOpacity.value,
  }));

  return (
    <Pressable onPress={handleReveal}>
      <View>
        {children}
        {!revealed && (
          <Animated.View style={overlayStyle}>
            <View style={blurFillStyle} />
          </Animated.View>
        )}
      </View>
    </Pressable>
  );
}

const coverStyle: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: 8,
  overflow: 'hidden',
};

const blurFillStyle: ViewStyle = {
  flex: 1,
  backgroundColor: 'rgba(128, 128, 128, 0.85)',
};

// ---------------------------------------------------------------------------
// Shake Effect: horizontal oscillation for ~1s
// ---------------------------------------------------------------------------

function ShakeEffect({
  played,
  children,
}: {
  played: boolean;
  messageId: string;
  children: React.ReactNode;
}) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (!played) {
      translateX.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 60 }),
          withTiming(8, { duration: 60 }),
          withTiming(-6, { duration: 60 }),
          withTiming(6, { duration: 60 }),
          withTiming(-4, { duration: 60 }),
          withTiming(4, { duration: 60 }),
          withTiming(0, { duration: 60 }),
        ),
        2,
        false,
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

// ---------------------------------------------------------------------------
// Fade In Effect: simple opacity animation 0→1
// ---------------------------------------------------------------------------

function FadeInEffect({
  played,
  children,
}: {
  played: boolean;
  messageId: string;
  children: React.ReactNode;
}) {
  const opacity = useSharedValue(played ? 1 : 0);

  useEffect(() => {
    if (!played) {
      opacity.value = withTiming(1, { duration: 800, easing: Easing.in(Easing.ease) });
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

// ---------------------------------------------------------------------------
// Screen-trigger Effect (confetti / balloons)
// Plays the message animation (scale bump) and fires onScreenEffect callback.
// ---------------------------------------------------------------------------

function ScreenTriggerEffect({
  played,
  messageId,
  screenEffect,
  onScreenEffect,
  children,
}: {
  played: boolean;
  messageId: string;
  screenEffect: 'confetti' | 'balloons';
  onScreenEffect?: (effect: 'confetti' | 'balloons', messageId: string) => void;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(played ? 1 : 0.5);
  const opacity = useSharedValue(played ? 1 : 0);

  useEffect(() => {
    if (!played) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 10, stiffness: 120 });

      // Trigger screen-wide effect after a short delay
      if (onScreenEffect) {
        const timer = setTimeout(() => {
          onScreenEffect(screenEffect, messageId);
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
