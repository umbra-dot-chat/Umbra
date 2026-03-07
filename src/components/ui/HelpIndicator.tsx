/**
 * HelpIndicator — Interactive help icon that opens a tooltip via root portal.
 *
 * Shows a small circle icon ("?", "i", or "!") that opens a help popup
 * when pressed. The popup renders at the root level via HelpContext's
 * popover state, ensuring correct viewport-relative positioning.
 *
 * Features:
 * - Animated gradient overlay when active (matches GradientIcon palette)
 * - Priority-based animation (only one animates at a time)
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
  Platform,
  Text as RNText,
  View,
} from 'react-native';
import type { ViewStyle, GestureResponderEvent } from 'react-native';
import { useTheme } from '@coexist/wisp-react-native';
import { useHelp } from '@/contexts/HelpContext';

// ─────────────────────────────────────────────────────────────────────────────
// Gradient CSS injection (web only)
// ─────────────────────────────────────────────────────────────────────────────

const GRADIENT_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#8B5CF6'];
const CSS_ANIM_NAME = 'umbra-help-gradient';
let cssInjected = false;

function injectGradientCSS(): void {
  if (cssInjected || Platform.OS !== 'web' || typeof document === 'undefined') return;
  cssInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes ${CSS_ANIM_NAME} {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;
  document.head.appendChild(style);
}

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

  // Native fallback: cycle through gradient colors
  const colorAnim = useRef(new Animated.Value(0)).current;

  const active = isActive(id);
  const viewed = isViewed(id);
  const showGradient = active && !viewed;

  // Inject CSS keyframes on first active render (web only)
  useEffect(() => {
    if (showGradient) injectGradientCSS();
  }, [showGradient]);

  // Register/unregister with HelpContext
  useEffect(() => {
    registerHint(id, priority);
    return () => unregisterHint(id);
  }, [id, priority, registerHint, unregisterHint]);

  // Native: animate color index for a shifting hue fallback
  useEffect(() => {
    if (showGradient && Platform.OS !== 'web') {
      const loop = Animated.loop(
        Animated.timing(colorAnim, {
          toValue: GRADIENT_COLORS.length - 1,
          duration: 4000,
          useNativeDriver: false,
        }),
      );
      loop.start();
      return () => loop.stop();
    } else {
      colorAnim.setValue(0);
    }
  }, [showGradient, colorAnim]);

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

  // ── Colors ────────────────────────────────────────────────────────────

  const iconColor = viewed
    ? tc.text.secondary
    : showGradient
      ? '#FFFFFF'
      : tc.text.primary;

  const iconBg = viewed
    ? tc.background.raised
    : tc.background.raised;

  const borderColor = viewed
    ? tc.border.subtle
    : tc.border.strong;

  const iconOpacity = viewed ? 0.5 : 1;

  // ── Gradient styles (web) ─────────────────────────────────────────────

  const gradientBg = `linear-gradient(135deg, ${GRADIENT_COLORS.join(', ')})`;

  const gradientStyle = showGradient && Platform.OS === 'web' ? {
    // @ts-ignore — web-only CSS properties
    background: gradientBg,
    backgroundSize: '300% 300%',
    animation: `${CSS_ANIM_NAME} 4s ease infinite`,
    borderColor: 'transparent',
  } : {};

  // ── Native animated background color ──────────────────────────────────

  const nativeAnimBg = showGradient && Platform.OS !== 'web'
    ? colorAnim.interpolate({
        inputRange: GRADIENT_COLORS.map((_, i) => i),
        outputRange: GRADIENT_COLORS,
      })
    : undefined;

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      {showGradient && Platform.OS !== 'web' ? (
        /* Native: Animated.View with interpolated background color */
        <Animated.View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: nativeAnimBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Pressable
            onPress={handlePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
          >
            <RNText
              style={{
                fontSize: size * 0.55,
                fontWeight: '700',
                color: '#FFFFFF',
                lineHeight: size * 0.7,
                textAlign: 'center',
              }}
            >
              {icon}
            </RNText>
          </Pressable>
        </Animated.View>
      ) : (
        /* Web + inactive/viewed states */
        <View style={{ opacity: iconOpacity }}>
          <Pressable
            onPress={handlePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => ({
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: pressed ? GRADIENT_COLORS[0] + '50' : iconBg,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: showGradient ? 0 : 1,
              borderColor: pressed ? GRADIENT_COLORS[0] : borderColor,
              ...gradientStyle,
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
        </View>
      )}
    </View>
  );
}
