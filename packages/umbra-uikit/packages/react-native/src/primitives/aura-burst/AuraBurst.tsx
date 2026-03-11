/**
 * @module primitives/aura-burst
 * @description Gradient trail sweep effect for the Wisp design system.
 *
 * Renders a comet-like gradient trail that sweeps around the wrapped element's
 * border. The bright leading point zips around the full perimeter with the
 * tail fading to transparent, covering ~15% of the circumference.
 *
 * - **Web**: CSS conic-gradient with @property animated angle + mask.
 * - **Native**: SVG dashed stroke with animated rotation.
 *
 * Respects `prefers-reduced-motion` — skips the animation entirely when set.
 */

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Animated, Platform, View, Easing } from 'react-native';
import type { ViewStyle, LayoutChangeEvent } from 'react-native';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6'];
const DEFAULT_RADIUS = 16;
const DEFAULT_BORDER_WIDTH = 1.5;
const DEFAULT_DURATION = 1000; // ms for full sweep
const DEFAULT_DELAY = 50; // ms before sweep starts
const DEFAULT_BLUR = 0;
const TRAIL_ARC = 54; // degrees — ~15% of 360°

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AuraBurstProps {
  children: React.ReactNode;
  /** Trigger the sweep. Each false→true transition fires once. @default false */
  active?: boolean;
  /** Trail colors (tip → tail). @default ['#8B5CF6','#EC4899','#3B82F6'] */
  colors?: string[];
  /** Border radius to match the wrapped element. @default 16 */
  radius?: number;
  /** Trail width in px. @default 1.5 */
  width?: number;
  /** Sweep duration in ms. @default 600 */
  duration?: number;
  /** Delay before sweep starts in ms. @default 50 */
  delay?: number;
  /** Glow blur radius (px). 0 = none. @default 0 */
  blur?: number;
  /** Style applied to the outer container. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Web — CSS conic-gradient sweep
// ---------------------------------------------------------------------------

let webKeyframesInjected = false;

function injectWebKeyframes(): void {
  if (webKeyframesInjected || typeof document === 'undefined') return;
  webKeyframesInjected = true;

  const css = `
@property --wisp-sweep-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
@keyframes wisp-aura-sweep {
  0% {
    --wisp-sweep-angle: 0deg;
    opacity: 0;
  }
  4% {
    opacity: 1;
  }
  88% {
    opacity: 1;
  }
  100% {
    --wisp-sweep-angle: 360deg;
    opacity: 0;
  }
}`;

  const sheet = document.createElement('style');
  sheet.id = 'wisp-aura-sweep-keyframes';
  sheet.textContent = css;
  document.head.appendChild(sheet);
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function AuraBurstWeb({
  children,
  active,
  colors,
  radius,
  width: borderWidth,
  duration,
  delay,
  blur,
  style,
}: Required<Omit<AuraBurstProps, 'children' | 'style'>> & Pick<AuraBurstProps, 'children' | 'style'>): React.JSX.Element {
  const [sweepKey, setSweepKey] = useState(0);
  const prevActive = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [childSize, setChildSize] = useState<{ w: number; h: number } | null>(null);

  // Measure the first child element.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const child = container.firstElementChild as HTMLElement;
    if (!child) return;

    const measure = () => {
      setChildSize({ w: child.offsetWidth, h: child.offsetHeight });
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(child);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (active && !prevActive.current) {
      injectWebKeyframes();
      const container = containerRef.current;
      if (container) {
        const child = container.firstElementChild as HTMLElement;
        if (child) setChildSize({ w: child.offsetWidth, h: child.offsetHeight });
      }
      setSweepKey((k) => k + 1);
    }
    prevActive.current = active;
  }, [active]);

  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const showSweep = sweepKey > 0 && !reducedMotion && childSize != null;

  // Build conic-gradient: trail at 306°→360° so the bright tip leads the sweep.
  // As the angle rotates clockwise, the 360° end (bright tip) arrives first
  // at any point, followed by the fading tail.
  const [c0, c1, c2] = colors.length >= 3
    ? colors
    : [...colors, ...colors, ...colors].slice(0, 3);

  const tailStart = 360 - TRAIL_ARC; // 306°
  const conicGradient = `conic-gradient(from var(--wisp-sweep-angle), transparent 0deg, transparent ${tailStart}deg, ${c2}33 ${tailStart}deg, ${c1}80 ${360 - TRAIL_ARC * 0.35}deg, ${c0}cc ${360 - 3}deg, ${c0} 360deg)`;

  const overlayStyle: any = showSweep ? {
    position: 'absolute',
    top: -borderWidth,
    left: -borderWidth,
    width: childSize.w + borderWidth * 2,
    height: childSize.h + borderWidth * 2,
    boxSizing: 'border-box',
    padding: borderWidth,
    background: conicGradient,
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    borderRadius: radius + borderWidth,
    pointerEvents: 'none',
    opacity: 0,
    animation: `wisp-aura-sweep ${duration}ms ease-in-out ${delay}ms forwards`,
  } : null;

  return (
    <div ref={containerRef} style={{ position: 'relative', ...(style as any) }}>
      {children}
      {showSweep && <div key={sweepKey} style={overlayStyle} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Native — SVG dashed stroke with animated rotation
// ---------------------------------------------------------------------------

let SvgImport: any = null;
let DefsImport: any = null;
let LinearGradientImport: any = null;
let StopImport: any = null;
let RectImport: any = null;

try {
  const svg = require('react-native-svg');
  SvgImport = svg.default || svg.Svg;
  DefsImport = svg.Defs;
  LinearGradientImport = svg.LinearGradient;
  StopImport = svg.Stop;
  RectImport = svg.Rect;
} catch {
  // SVG not available — native will be a no-op wrapper
}

function AuraBurstNative({
  children,
  active,
  colors,
  radius,
  width: borderWidth,
  duration,
  delay,
  blur: _blur,
  style,
}: Required<Omit<AuraBurstProps, 'children' | 'style'>> & Pick<AuraBurstProps, 'children' | 'style'>): React.JSX.Element {
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const prevActive = useRef(false);
  const [layout, setLayout] = useState<{ w: number; h: number } | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout((prev) =>
      prev && prev.w === width && prev.h === height ? prev : { w: width, h: height },
    );
  }, []);

  useEffect(() => {
    if (active && !prevActive.current) {
      rotation.setValue(0);
      opacity.setValue(0);

      const sweepAnim = Animated.timing(rotation, {
        toValue: 1,
        duration,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      });

      const fadeIn = Animated.timing(opacity, {
        toValue: 1,
        duration: duration * 0.06,
        useNativeDriver: true,
      });

      const fadeOut = Animated.timing(opacity, {
        toValue: 0,
        duration: duration * 0.15,
        useNativeDriver: true,
      });

      setTimeout(() => {
        Animated.parallel([
          sweepAnim,
          Animated.sequence([
            fadeIn,
            Animated.delay(duration * 0.75),
            fadeOut,
          ]),
        ]).start();
      }, delay);
    }
    prevActive.current = active;
  }, [active]);

  const rotateInterp = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Calculate perimeter for dash sizing
  const perimeter = layout
    ? 2 * (layout.w + layout.h) - radius * (8 - 2 * Math.PI)
    : 0;
  const dashLength = perimeter * 0.15;
  const gapLength = perimeter - dashLength;

  const hasSvg = SvgImport && DefsImport && LinearGradientImport && StopImport && RectImport;

  return (
    <View style={[{ position: 'relative' } as ViewStyle, style]} onLayout={onLayout}>
      {children}
      {hasSvg && layout && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -borderWidth / 2,
            left: -borderWidth / 2,
            width: layout.w + borderWidth,
            height: layout.h + borderWidth,
            opacity,
            transform: [{ rotate: rotateInterp }],
          }}
        >
          <SvgImport width="100%" height="100%">
            <DefsImport>
              <LinearGradientImport id="wisp-sweep-grad" x1="0" y1="0" x2="1" y2="0">
                <StopImport offset="0" stopColor={colors[0]} stopOpacity="1" />
                <StopImport offset="0.4" stopColor={colors[1] || colors[0]} stopOpacity="0.5" />
                <StopImport offset="1" stopColor={colors[2] || colors[0]} stopOpacity="0" />
              </LinearGradientImport>
            </DefsImport>
            <RectImport
              x={borderWidth / 2}
              y={borderWidth / 2}
              width={layout.w}
              height={layout.h}
              rx={radius}
              ry={radius}
              stroke="url(#wisp-sweep-grad)"
              strokeWidth={borderWidth}
              strokeDasharray={`${dashLength} ${gapLength}`}
              fill="none"
            />
          </SvgImport>
        </Animated.View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export function AuraBurst(props: AuraBurstProps): React.JSX.Element {
  const {
    active = false,
    colors = DEFAULT_COLORS,
    radius = DEFAULT_RADIUS,
    width = DEFAULT_BORDER_WIDTH,
    duration = DEFAULT_DURATION,
    delay = DEFAULT_DELAY,
    blur = DEFAULT_BLUR,
    ...rest
  } = props;

  const resolved = { ...rest, active, colors, radius, width, duration, delay, blur };

  if (Platform.OS === 'web') {
    return <AuraBurstWeb {...resolved} />;
  }
  return <AuraBurstNative {...resolved} />;
}

AuraBurst.displayName = 'AuraBurst';
