/**
 * GradientIcon — Wraps any icon component to apply an animated gradient shimmer.
 *
 * Accepts children that follow the standard `{ size, color }` icon interface.
 * When `active` is true, the icon renders with an animated gradient fill/stroke.
 * When `active` is false, children are rendered as-is (pass-through).
 *
 * ## Web
 * Injects a hidden SVG with a `<linearGradient>` definition into the document.
 * A requestAnimationFrame loop shifts the gradient position over time.
 * The child icon receives `color="url(#umbra-icon-shimmer)"` so its fill/stroke
 * references the animated gradient.
 *
 * ## Native (iOS / Android)
 * Uses MaskedView — the child icon (rendered in black) acts as the mask,
 * and an animated expo-linear-gradient fills behind it.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Platform, View } from 'react-native';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#8B5CF6'];
const DEFAULT_SPEED = 4000;
const GRADIENT_SVG_ID = 'umbra-icon-shimmer';

// ---------------------------------------------------------------------------
// Web — global SVG gradient with JS-driven animation
// ---------------------------------------------------------------------------

let webGradientInjected = false;
let webRafId: number | null = null;
let webRefCount = 0;

function injectWebGradient(colors: string[]): void {
  if (webGradientInjected || typeof document === 'undefined') return;
  webGradientInjected = true;

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('style', 'position:absolute;pointer-events:none');
  svg.setAttribute('aria-hidden', 'true');
  svg.id = 'umbra-icon-shimmer-defs';

  const defs = document.createElementNS(ns, 'defs');
  const lg = document.createElementNS(ns, 'linearGradient');
  lg.id = GRADIENT_SVG_ID;
  lg.setAttribute('gradientUnits', 'userSpaceOnUse');
  // Initial positions — will be animated
  lg.setAttribute('x1', '0');
  lg.setAttribute('y1', '0');
  lg.setAttribute('x2', '24');
  lg.setAttribute('y2', '24');

  colors.forEach((color, i) => {
    const stop = document.createElementNS(ns, 'stop');
    stop.setAttribute('offset', `${(i / (colors.length - 1)) * 100}%`);
    stop.setAttribute('stop-color', color);
    lg.appendChild(stop);
  });

  defs.appendChild(lg);
  svg.appendChild(defs);
  document.body.appendChild(svg);
}

function startWebAnimation(speed: number): void {
  if (typeof document === 'undefined' || webRafId !== null) return;

  const start = performance.now();
  const tick = (now: number) => {
    const elapsed = (now - start) % speed;
    const t = elapsed / speed;
    // Shift gradient diagonally across the 0-24 viewBox coordinate space
    const offset = t * 48 - 12;
    const lg = document.getElementById(GRADIENT_SVG_ID);
    if (lg) {
      lg.setAttribute('x1', `${offset}`);
      lg.setAttribute('y1', `${offset * 0.5}`);
      lg.setAttribute('x2', `${offset + 24}`);
      lg.setAttribute('y2', `${offset * 0.5 + 24}`);
    }
    webRafId = requestAnimationFrame(tick);
  };
  webRafId = requestAnimationFrame(tick);
}

function stopWebAnimation(): void {
  if (webRafId !== null) {
    cancelAnimationFrame(webRafId);
    webRafId = null;
  }
}

// ---------------------------------------------------------------------------
// Native — lazy-load MaskedView + LinearGradient
// ---------------------------------------------------------------------------

let MaskedViewComponent: React.ComponentType<any> | null = null;
let AnimatedGradientComponent: React.ComponentType<any> | null = null;

if (Platform.OS !== 'web') {
  try {
    const MV = require('@react-native-masked-view/masked-view').default;
    const LG = require('expo-linear-gradient').LinearGradient;
    if (MV && LG) {
      MaskedViewComponent = MV;
      AnimatedGradientComponent = Animated.createAnimatedComponent(LG);
    }
  } catch {
    // Dependencies not available — will fall back to solid color
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GradientIconProps {
  /** The icon element to apply the gradient to. Must accept `size` and `color` props. */
  children: React.ReactElement<{ size?: number; color?: string }>;
  /** Whether the gradient effect is active. When false, children render as-is. */
  active?: boolean;
  /** Gradient color stops. @default ['#8B5CF6', '#EC4899', '#3B82F6', '#8B5CF6'] */
  colors?: string[];
  /** Duration of one full gradient cycle in ms. @default 12000 */
  speed?: number;
  /** Fallback color when gradient is inactive or unavailable. */
  fallbackColor?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GradientIcon({
  children,
  active = true,
  colors = DEFAULT_COLORS,
  speed = DEFAULT_SPEED,
  fallbackColor,
}: GradientIconProps) {
  if (!active) {
    return fallbackColor
      ? React.cloneElement(children, { color: fallbackColor })
      : children;
  }

  if (Platform.OS === 'web') {
    return (
      <GradientIconWeb colors={colors} speed={speed}>
        {children}
      </GradientIconWeb>
    );
  }

  return (
    <GradientIconNative colors={colors} speed={speed} fallbackColor={fallbackColor}>
      {children}
    </GradientIconNative>
  );
}

// ---------------------------------------------------------------------------
// Web implementation
// ---------------------------------------------------------------------------

function GradientIconWeb({
  children,
  colors,
  speed,
}: {
  children: React.ReactElement<{ size?: number; color?: string }>;
  colors: string[];
  speed: number;
}) {
  useEffect(() => {
    injectWebGradient(colors);
    webRefCount++;
    startWebAnimation(speed);
    return () => {
      webRefCount--;
      if (webRefCount <= 0) {
        webRefCount = 0;
        stopWebAnimation();
      }
    };
  }, [colors, speed]);

  return React.cloneElement(children, {
    color: `url(#${GRADIENT_SVG_ID})`,
  });
}

// ---------------------------------------------------------------------------
// Native implementation
// ---------------------------------------------------------------------------

function GradientIconNative({
  children,
  colors,
  speed,
  fallbackColor,
}: {
  children: React.ReactElement<{ size?: number; color?: string }>;
  colors: string[];
  speed: number;
  fallbackColor?: string;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const size = children.props.size ?? 18;

  useEffect(() => {
    if (!AnimatedGradientComponent) return;
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: speed,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [speed, translateX]);

  // Fallback: if native deps aren't available, use first gradient color
  if (!MaskedViewComponent || !AnimatedGradientComponent) {
    return React.cloneElement(children, {
      color: fallbackColor ?? colors[0],
    });
  }

  const animatedTranslateX = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -size],
  });

  const maskElement = React.cloneElement(children, { color: 'black' });

  return (
    <View style={{ width: size, height: size }}>
      <MaskedViewComponent maskElement={maskElement}>
        <AnimatedGradientComponent
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: size * 2,
            height: size,
            transform: [{ translateX: animatedTranslateX }],
          }}
        />
      </MaskedViewComponent>
    </View>
  );
}

GradientIcon.displayName = 'GradientIcon';
