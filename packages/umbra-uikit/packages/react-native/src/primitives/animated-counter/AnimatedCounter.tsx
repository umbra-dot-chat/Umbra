/**
 * @module primitives/animated-counter
 * @description Smoothly interpolating numeric counter (odometer effect).
 *
 * Tweens between numeric values over a configurable duration,
 * displaying the formatted result each frame.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform } from 'react-native';
import type { TextStyle } from 'react-native';
import { Text } from '../text';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AnimatedCounterProps {
  /** The target numeric value to display. */
  value: number;
  /**
   * Duration of the tween in milliseconds.
   * @default 600
   */
  duration?: number;
  /**
   * Formatter for the displayed value.
   * @default (v) => Math.round(v).toString()
   */
  formatValue?: (v: number) => string;
  /** Style applied to the Text element. */
  style?: TextStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnimatedCounter({
  value,
  duration = 600,
  formatValue = (v) => Math.round(v).toString(),
  style,
}: AnimatedCounterProps): React.JSX.Element {
  const animValue = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(() => formatValue(value));
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === value) return;
    prevValue.current = value;

    Animated.timing(animValue, {
      toValue: value,
      duration,
      useNativeDriver: false, // must be false — we read the value in a listener
    }).start();
  }, [value, duration, animValue]);

  useEffect(() => {
    const listenerId = animValue.addListener(({ value: v }) => {
      setDisplay(formatValue(v));
    });
    return () => animValue.removeListener(listenerId);
  }, [animValue, formatValue]);

  return (
    <Text style={[{ fontVariant: ['tabular-nums'] }, style]}>
      {display}
    </Text>
  );
}

AnimatedCounter.displayName = 'AnimatedCounter';
