/**
 * TutorStatusBanner — Renders in the chat-header slot.
 *
 * Shows a persistent inline banner when tutor mode is active,
 * displaying the target language flag, CEFR level, and score.
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useTheme } from '@coexist/wisp-react-native';
import { LANGUAGES, getCefrLevel } from '../constants';
import { subscribe, tutorActive, targetLanguage, currentScore } from '../state';

export function TutorStatusBanner() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [, setTick] = useState(0);

  // Subscribe to state changes for reactivity
  useEffect(() => {
    const unsub = subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  if (!tutorActive || !targetLanguage) return null;

  const lang = LANGUAGES[targetLanguage];
  if (!lang) return null;

  const { level, label } = getCefrLevel(currentScore);

  return (
    <Box
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: tc.brand.surface,
        borderBottomWidth: 1,
        borderBottomColor: tc.brand.border,
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 18 }}>{lang.flag}</Text>
      <Text
        size="sm"
        weight="semibold"
        style={{ color: tc.brand.primary }}
      >
        {lang.name}
      </Text>
      <Box
        style={{
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          backgroundColor: tc.brand.surface,
        }}
      >
        <Text
          size="xs"
          weight="bold"
          style={{ color: tc.brand.primary }}
        >
          {level}
        </Text>
      </Box>
      <Text
        size="xs"
        style={{ color: tc.text.secondary }}
      >
        {label}
      </Text>
      <Box style={{ flex: 1 }} />
      <Text
        size="xs"
        style={{ color: tc.text.muted }}
      >
        Score: {Math.round(currentScore)}
      </Text>
    </Box>
  );
}
