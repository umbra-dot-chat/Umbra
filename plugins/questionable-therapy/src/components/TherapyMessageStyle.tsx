/**
 * TherapyMessageStyle -- Renders in the message-decorator slot.
 *
 * Adds a subtle sage-green left border to Ghost messages that contain
 * the [THERAPY-SESSION] tag. Returns null for non-therapy messages.
 */

import React, { useState, useEffect } from 'react';
import { Box, useTheme } from '@coexist/wisp-react-native';
import { THERAPY_TAG } from '../constants';
import { subscribe, therapyActive } from '../state';

interface TherapyMessageStyleProps {
  message: { text?: string; senderId?: string };
  conversationId: string;
  children?: React.ReactNode;
}

export function TherapyMessageStyle({ message, children }: TherapyMessageStyleProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  if (!therapyActive) return null;

  const text = message.text ?? '';
  if (!text.includes(THERAPY_TAG)) return null;

  return (
    <Box
      style={{
        borderLeftWidth: 3,
        borderLeftColor: tc.brand.border,
        paddingLeft: 8,
        marginTop: 2,
        marginBottom: 2,
      }}
    >
      {children}
    </Box>
  );
}
