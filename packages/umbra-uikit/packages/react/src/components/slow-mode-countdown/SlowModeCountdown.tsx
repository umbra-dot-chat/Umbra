/**
 * @module SlowModeCountdown
 * @description Countdown timer shown when slow mode is active in a channel.
 *
 * @remarks
 * Counts down from `remaining` seconds to 0, calling `onComplete` when
 * finished. Supports both an inline text variant (with a clock icon) and
 * a circular progress ring variant.
 *
 * @example
 * ```tsx
 * <SlowModeCountdown remaining={30} onComplete={() => setCanSend(true)} />
 * <SlowModeCountdown remaining={60} variant="circular" size="lg" />
 * ```
 */
import React, { forwardRef, useMemo, useState, useEffect, useRef } from 'react';
import type { SlowModeCountdownProps } from '@coexist/wisp-core/types/SlowModeCountdown.types';
import {
  buildSlowModeInlineStyle,
  buildSlowModeCircularContainerStyle,
  buildSlowModeCircularTextStyle,
  resolveSlowModeRingColors,
  slowModeSizeMap,
} from '@coexist/wisp-core/styles/SlowModeCountdown.styles';
import { useTheme } from '../../providers';
import { Clock } from 'lucide-react';

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

export const SlowModeCountdown = forwardRef<HTMLDivElement, SlowModeCountdownProps>(
  function SlowModeCountdown(
    {
      remaining: initialRemaining,
      onComplete,
      size = 'md',
      variant = 'inline',
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const [remaining, setRemaining] = useState(initialRemaining);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;
    const completedRef = useRef(false);

    // Reset when prop changes
    useEffect(() => {
      setRemaining(initialRemaining);
      completedRef.current = false;
    }, [initialRemaining]);

    // Timer
    useEffect(() => {
      if (remaining <= 0) return;

      const id = setInterval(() => {
        setRemaining((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(id);
            if (!completedRef.current) {
              completedRef.current = true;
              onCompleteRef.current?.();
            }
            return 0;
          }
          return next;
        });
      }, 1000);

      return () => clearInterval(id);
    }, [remaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

    const cfg = slowModeSizeMap[size];

    // ----- Inline variant -----
    const inlineStyle = useMemo(
      () => buildSlowModeInlineStyle(size, theme),
      [size, theme],
    );

    // ----- Circular variant -----
    const circularContainerStyle = useMemo(
      () => buildSlowModeCircularContainerStyle(size),
      [size],
    );

    const circularTextStyle = useMemo(
      () => buildSlowModeCircularTextStyle(size, theme),
      [size, theme],
    );

    const ringColors = useMemo(
      () => resolveSlowModeRingColors(theme),
      [theme],
    );

    if (variant === 'circular') {
      const radius = (cfg.circleSize - cfg.strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;
      const progress = initialRemaining > 0 ? remaining / initialRemaining : 0;
      const dashOffset = circumference * (1 - progress);

      return (
        <div
          ref={ref}
          role="timer"
          aria-label={`${remaining} seconds remaining`}
          className={className}
          style={{ ...circularContainerStyle, ...userStyle } as React.CSSProperties}
          {...rest}
        >
          <svg
            width={cfg.circleSize}
            height={cfg.circleSize}
            viewBox={`0 0 ${cfg.circleSize} ${cfg.circleSize}`}
            style={{ transform: 'rotate(-90deg)' }}
          >
            {/* Track */}
            <circle
              cx={cfg.circleSize / 2}
              cy={cfg.circleSize / 2}
              r={radius}
              fill="none"
              stroke={ringColors.track}
              strokeWidth={cfg.strokeWidth}
            />
            {/* Progress */}
            <circle
              cx={cfg.circleSize / 2}
              cy={cfg.circleSize / 2}
              r={radius}
              fill="none"
              stroke={ringColors.fill}
              strokeWidth={cfg.strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span style={circularTextStyle as React.CSSProperties}>
            {remaining}
          </span>
        </div>
      );
    }

    // ----- Inline (default) -----
    return (
      <div
        ref={ref}
        role="timer"
        aria-label={`${remaining} seconds remaining`}
        className={className}
        style={{ ...inlineStyle, ...userStyle } as React.CSSProperties}
        {...rest}
      >
        <Clock size={cfg.iconSize} strokeWidth={2} />
        <span>{formatTime(remaining)}</span>
      </div>
    );
  },
);

SlowModeCountdown.displayName = 'SlowModeCountdown';
