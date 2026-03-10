/**
 * WordTooltip — Floating card showing translation and pronunciation.
 *
 * On web: appears on hover (mouseEnter/mouseLeave).
 * On mobile: appears on tap, auto-dismisses after 3 seconds.
 */

import React, { useEffect } from 'react';
import { View, Text, Platform, Pressable } from 'react-native';

export interface WordTooltipProps {
  word: string;
  translation: string;
  pronunciation?: string;
  onDismiss: () => void;
}

export function WordTooltip({ word, translation, pronunciation, onDismiss }: WordTooltipProps) {
  // On mobile, auto-dismiss after 3 seconds
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [onDismiss]);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: '100%' as any,
        left: 0,
        marginBottom: 4,
        padding: 8,
        paddingHorizontal: 12,
        backgroundColor: '#1a1a2e',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        // Shadow for elevation
        ...(Platform.OS === 'web'
          ? { boxShadow: '0 4px 12px rgba(0,0,0,0.3)' } as any
          : {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }),
        zIndex: 100,
        minWidth: 120,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#e0e0ff', marginBottom: 2 }}>
        {word}
      </Text>
      <Text style={{ fontSize: 13, color: '#a0a0d0' }}>
        {translation}
      </Text>
      {pronunciation ? (
        <Text style={{ fontSize: 11, color: '#7070a0', marginTop: 2, fontStyle: 'italic' }}>
          {pronunciation}
        </Text>
      ) : null}
    </View>
  );
}
