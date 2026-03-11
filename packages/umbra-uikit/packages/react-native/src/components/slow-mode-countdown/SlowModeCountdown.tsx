import React, { forwardRef, useMemo, useState, useEffect, useRef } from 'react';
import { View, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { slowModeSizeMap, resolveSlowModeRingColors } from '@coexist/wisp-core/styles/SlowModeCountdown.styles';
import { defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SlowModeCountdownProps {
  /** Remaining seconds until the user can send again. */
  remaining: number;
  /** Called when countdown reaches 0. */
  onComplete?: () => void;
  /** Visual size. @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Show as inline text or as a circular indicator. @default 'inline' */
  variant?: 'inline' | 'circular';
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}:${String(s).padStart(2, '0')}`;
  return `${s}s`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SlowModeCountdown = forwardRef<View, SlowModeCountdownProps>(
  function SlowModeCountdown(
    {
      remaining: initialRemaining,
      onComplete,
      size = 'md',
      variant = 'inline',
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;

    const [remaining, setRemaining] = useState(initialRemaining);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useEffect(() => {
      setRemaining(initialRemaining);
    }, [initialRemaining]);

    useEffect(() => {
      if (remaining <= 0) return;

      const id = setInterval(() => {
        setRemaining((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(id);
            onCompleteRef.current?.();
            return 0;
          }
          return next;
        });
      }, 1000);

      return () => clearInterval(id);
    }, [remaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

    const cfg = slowModeSizeMap[size];

    const ringColors = useMemo(
      () => resolveSlowModeRingColors(theme),
      [tc],
    );

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------

    const inlineStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: cfg.gap,
      }),
      [cfg],
    );

    const inlineTextStyle = useMemo<TextStyle>(
      () => ({
        fontSize: cfg.fontSize,
        color: tc.text.muted,
      }),
      [tc, cfg],
    );

    const circularContainerStyle = useMemo<ViewStyle>(
      () => ({
        width: cfg.circleSize,
        height: cfg.circleSize,
        alignItems: 'center',
        justifyContent: 'center',
      }),
      [cfg],
    );

    const circularTextStyle = useMemo<TextStyle>(
      () => ({
        position: 'absolute',
        fontSize: cfg.fontSize - 2,
        fontWeight: defaultTypography.weights.semibold,
        color: tc.text.secondary,
      }),
      [tc, cfg],
    );

    // -----------------------------------------------------------------------
    // Circular variant
    // -----------------------------------------------------------------------

    if (variant === 'circular') {
      const radius = (cfg.circleSize - cfg.strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;
      const progress = initialRemaining > 0 ? remaining / initialRemaining : 0;
      const dashOffset = circumference * (1 - progress);

      return (
        <View
          ref={ref}
          accessibilityRole="timer"
          accessibilityLabel={`${remaining} seconds remaining`}
          style={[circularContainerStyle, userStyle]}
        >
          <Svg
            width={cfg.circleSize}
            height={cfg.circleSize}
            viewBox={`0 0 ${cfg.circleSize} ${cfg.circleSize}`}
            style={{ transform: [{ rotate: '-90deg' }] }}
          >
            <Circle
              cx={cfg.circleSize / 2}
              cy={cfg.circleSize / 2}
              r={radius}
              fill="none"
              stroke={ringColors.track}
              strokeWidth={cfg.strokeWidth}
            />
            <Circle
              cx={cfg.circleSize / 2}
              cy={cfg.circleSize / 2}
              r={radius}
              fill="none"
              stroke={ringColors.fill}
              strokeWidth={cfg.strokeWidth}
              strokeDasharray={`${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </Svg>
          <RNText style={circularTextStyle}>{remaining}</RNText>
        </View>
      );
    }

    // -----------------------------------------------------------------------
    // Inline (default)
    // -----------------------------------------------------------------------

    return (
      <View
        ref={ref}
        accessibilityRole="timer"
        accessibilityLabel={`${remaining} seconds remaining`}
        style={[inlineStyle, userStyle]}
      >
        <RNText style={inlineTextStyle}>{'\u{1F552}'}</RNText>
        <RNText style={inlineTextStyle}>{formatTime(remaining)}</RNText>
      </View>
    );
  },
);

SlowModeCountdown.displayName = 'SlowModeCountdown';
