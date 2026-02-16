/**
 * HelpIndicator — Interactive help icon that opens a tooltip via root portal.
 *
 * Shows a small circle icon ("?", "i", or "!") that opens a help popup
 * when pressed. The popup renders at the root level via HelpContext's
 * popover state, ensuring correct viewport-relative positioning.
 *
 * Features:
 * - Ghost HotspotIndicator-style glow + pulse animation
 * - Priority-based animation (only one pulses at a time)
 * - Persistent viewed state via HelpContext
 * - Root-level popup anchored near the click point
 * - Muted appearance after viewed
 *
 * ## Usage
 *
 * ```tsx
 * <HelpIndicator
 *   id="friends-did"
 *   title="What is a DID?"
 * >
 *   <HelpText>Your Decentralized ID is a unique identifier...</HelpText>
 * </HelpIndicator>
 * ```
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  Pressable,
  Animated,
  Easing,
  Platform,
  Text as RNText,
  View,
} from 'react-native';
import type { ViewStyle, GestureResponderEvent } from 'react-native';
import { useTheme } from '@coexist/wisp-react-native';
import { useHelp } from '@/contexts/HelpContext';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface HelpIndicatorProps {
  /** Unique hint ID for persistence */
  id: string;
  /** Popup title */
  title: string;
  /** Rich content inside the popup */
  children: React.ReactNode;
  /** Icon variant */
  icon?: 'i' | '?' | '!';
  /** Lower = higher priority for pulsing (default: 100) */
  priority?: number;
  /** Icon size in pixels (default: 16) */
  size?: number;
  /** Container style */
  style?: ViewStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function HelpIndicator({
  id,
  title,
  children,
  icon = '?',
  priority = 100,
  size = 16,
  style,
}: HelpIndicatorProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { registerHint, unregisterHint, isActive, isViewed, openPopover } = useHelp();

  // Ghost HotspotIndicator-style animations: gentle scale + glow opacity
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const active = isActive(id);
  const viewed = isViewed(id);

  // Register/unregister with HelpContext
  useEffect(() => {
    registerHint(id, priority);
    return () => unregisterHint(id);
  }, [id, priority, registerHint, unregisterHint]);

  // Ghost HotspotIndicator-style animation: gentle scale + glow pulse
  useEffect(() => {
    if (active && !viewed) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.15,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.6,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      scaleAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [active, viewed, scaleAnim, glowAnim]);

  const handlePress = useCallback((e: GestureResponderEvent) => {
    const x = e.nativeEvent?.pageX ?? 0;
    const y = e.nativeEvent?.pageY ?? 0;
    openPopover({
      anchor: { x, y },
      title,
      icon,
      children,
      hintId: id,
    });
  }, [title, icon, children, openPopover, id]);

  // Accent color for the indicator
  const accentColor = '#A78BFA';

  // Colors — boosted contrast for visibility
  const iconColor = viewed
    ? tc.text.secondary
    : active
      ? '#FFFFFF'
      : tc.text.primary;

  const iconBg = viewed
    ? tc.background.raised
    : active
      ? accentColor
      : tc.background.raised;

  const borderColor = viewed
    ? tc.border.default
    : active
      ? accentColor
      : tc.border.strong;

  const iconOpacity = viewed ? 0.5 : 1;

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* Glow ring (Ghost HotspotIndicator style) */}
      {active && !viewed && (
        <Animated.View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: accentColor,
            opacity: glowAnim,
            transform: [{ scale: 1.8 }],
          }}
        />
      )}
      <Animated.View
        style={{
          transform: active && !viewed ? [{ scale: scaleAnim }] : [],
          opacity: iconOpacity,
          ...(active && !viewed && Platform.OS === 'web' ? {
            // @ts-ignore — web-only boxShadow
            boxShadow: `0 0 ${size * 0.6}px ${accentColor}`,
          } : {}),
        }}
      >
        <Pressable
          onPress={handlePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => ({
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: pressed ? accentColor + '50' : iconBg,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: pressed ? accentColor : borderColor,
          })}
        >
          <RNText
            style={{
              fontSize: size * 0.55,
              fontWeight: '700',
              color: iconColor,
              lineHeight: size * 0.7,
              textAlign: 'center',
            }}
          >
            {icon}
          </RNText>
        </Pressable>
      </Animated.View>
    </View>
  );
}
