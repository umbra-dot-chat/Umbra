/**
 * @module primitives/call-timer
 * @description React Native CallTimer for the Wisp design system.
 *
 * A live-updating timer that displays call duration.
 */

import React, { forwardRef, useState, useEffect, useMemo, useRef } from 'react';
import { Text } from 'react-native';
import type { TextProps, TextStyle } from 'react-native';
import {
  callTimerSizeMap,
} from '@coexist/wisp-core/types/CallTimer.types';
import type { CallTimerSize } from '@coexist/wisp-core/types/CallTimer.types';
import { resolveCallTimerColors } from '@coexist/wisp-core/styles/CallTimer.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props (RN-specific)
// ---------------------------------------------------------------------------

export interface CallTimerProps extends Omit<TextProps, 'style'> {
  /** Unix timestamp (ms) when the call started. */
  startedAt: number;
  /** Size variant. @default 'md' */
  size?: CallTimerSize;
  /** Custom text color. */
  color?: string;
  /** Additional style override. */
  style?: TextStyle;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

// ---------------------------------------------------------------------------
// CallTimer
// ---------------------------------------------------------------------------

export const CallTimer = forwardRef<Text, CallTimerProps>(
  function CallTimer(
    {
      startedAt,
      size = 'md',
      color,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const colors = useMemo(() => resolveCallTimerColors(theme), [theme]);
    const sizeConfig = callTimerSizeMap[size];

    const [elapsed, setElapsed] = useState(() => Date.now() - startedAt);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
      setElapsed(Date.now() - startedAt);
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - startedAt);
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [startedAt]);

    const textStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.fontSize,
      lineHeight: sizeConfig.lineHeight,
      color: color ?? colors.text,
      fontVariant: ['tabular-nums'],
    }), [sizeConfig, color, colors.text]);

    return (
      <Text
        ref={ref}
        accessibilityRole="timer"
        accessibilityLabel={`Call duration: ${formatDuration(elapsed)}`}
        style={[textStyle, userStyle]}
        {...rest}
      >
        {formatDuration(elapsed)}
      </Text>
    );
  },
);

CallTimer.displayName = 'CallTimer';
