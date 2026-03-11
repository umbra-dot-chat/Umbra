/**
 * TherapySessionBanner -- Renders in the chat-header slot.
 *
 * Shows a persistent sage-green banner when therapy mode is active,
 * displaying "In Session" with a lotus emoji and a running session timer.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useTheme } from '@coexist/wisp-react-native';
import { subscribe, therapyActive, sessionStartedAt } from '../state';

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function TherapySessionBanner() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Subscribe to state changes for reactivity
  useEffect(() => {
    const unsub = subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  // Session timer -- counts up every second
  useEffect(() => {
    if (therapyActive && sessionStartedAt > 0) {
      const update = () => setElapsed(Date.now() - sessionStartedAt);
      update();
      timerRef.current = setInterval(update, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setElapsed(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [therapyActive, sessionStartedAt]);

  if (!therapyActive) return null;

  return (
    <Box
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: tc.accent.highlight,
        borderBottomWidth: 1,
        borderBottomColor: tc.brand.border,
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 18 }}>{'\uD83E\uDDD8'}</Text>
      <Text
        size="sm"
        weight="semibold"
        style={{ color: tc.accent.primary }}
      >
        In Session
      </Text>
      <Box style={{ flex: 1 }} />
      <Text
        size="xs"
        style={{ color: tc.text.muted }}
      >
        {formatElapsed(elapsed)}
      </Text>
    </Box>
  );
}
