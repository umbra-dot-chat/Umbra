/**
 * TutorStatusBanner — Renders in the chat-header slot.
 *
 * Shows a persistent inline banner when tutor mode is active,
 * displaying the target language flag, CEFR level, and score.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { LANGUAGES, getCefrLevel } from '../constants';
import { subscribe, tutorActive, targetLanguage, currentScore } from '../state';

export function TutorStatusBanner() {
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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(139, 92, 246, 0.15)',
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 18 }}>{lang.flag}</Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: '#a78bfa',
        }}
      >
        {lang.name}
      </Text>
      <View
        style={{
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          backgroundColor: 'rgba(139, 92, 246, 0.15)',
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: '#a78bfa',
          }}
        >
          {level}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 12,
          color: 'rgba(167, 139, 250, 0.7)',
        }}
      >
        {label}
      </Text>
      <View style={{ flex: 1 }} />
      <Text
        style={{
          fontSize: 11,
          color: 'rgba(167, 139, 250, 0.5)',
        }}
      >
        Score: {Math.round(currentScore)}
      </Text>
    </View>
  );
}
