/**
 * HelpIndicator — Interactive help icon that opens a tooltip via root portal.
 *
 * Shows a small circle icon ("?", "i", or "!") that opens a help popup
 * when pressed. The popup renders at the root level via HelpContext's
 * popover state, ensuring correct viewport-relative positioning.
 *
 * Features:
 * - Priority-based pulsing animation (only one pulses at a time)
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
  Text as RNText,
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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const active = isActive(id);
  const viewed = isViewed(id);

  // Register/unregister with HelpContext
  useEffect(() => {
    registerHint(id, priority);
    return () => unregisterHint(id);
  }, [id, priority, registerHint, unregisterHint]);

  // Pulse animation when active
  useEffect(() => {
    if (active && !viewed) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [active, viewed, pulseAnim]);

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

  // Colors
  const iconColor = viewed
    ? tc.text.muted
    : active
      ? tc.accent.primary
      : tc.text.secondary;

  const iconBg = viewed
    ? tc.background.sunken
    : active
      ? tc.accent.primary + '18'
      : tc.background.sunken;

  const iconOpacity = viewed ? 0.6 : 1;

  return (
    <Animated.View
      style={[
        {
          transform: active && !viewed ? [{ scale: pulseAnim }] : [],
          opacity: iconOpacity,
        },
        style,
      ]}
    >
      <Pressable
        onPress={handlePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={({ pressed }) => ({
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: pressed ? tc.accent.primary + '30' : iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: viewed
            ? 'transparent'
            : active
              ? tc.accent.primary + '40'
              : 'transparent',
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
  );
}
