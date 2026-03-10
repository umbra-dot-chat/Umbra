/**
 * MessageDecorator — Renders in the message-decorator slot on Ghost messages.
 *
 * When Ghost annotates words with {{word|translation|pronunciation}}, those
 * are now rendered natively inline by parseMessageContent(). This decorator
 * only activates as a **fallback** — when Ghost responds with foreign words
 * but omits annotations, we detect non-ASCII words client-side and highlight
 * them with a dotted underline (no translation available).
 *
 * Cross-platform: uses React Native primitives.
 * On web: hover to reveal tooltips.
 * On mobile: tap to reveal, auto-dismiss.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { subscribe, tutorActive, targetLanguage } from '../state';

interface MessageDecoratorProps {
  message: { text?: string; senderId?: string };
  conversationId: string;
}

interface Annotation {
  word: string;
  translation: string;
  pronunciation: string;
}

type Segment =
  | { type: 'text'; value: string }
  | { type: 'annotation'; annotation: Annotation };

/**
 * Client-side fallback: detect non-English/non-ASCII words as likely foreign words.
 * Highlights them with a dotted underline — no translation available client-side.
 */
function detectForeignWords(text: string): Segment[] {
  // Match words containing non-ASCII letters (accented chars, CJK, Hangul, etc.)
  const regex = /(\b[a-zA-Z]*[\u00C0-\u024F\u1100-\u11FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF\u0400-\u04FF\u0600-\u06FF]+[a-zA-Z]*\b)/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    segments.push({
      type: 'annotation',
      annotation: {
        word: match[1],
        translation: '',
        pronunciation: '',
      },
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}

export function MessageDecorator({ message }: MessageDecoratorProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  if (!tutorActive || !targetLanguage) return null;

  const text = message.text;
  if (!text) return null;

  // If Ghost provided {{annotations}}, parseMessageContent() renders them
  // natively inline — no need for the decorator to duplicate them.
  if (text.includes('{{') && text.includes('}}')) return null;

  // Fallback: detect non-ASCII words client-side
  const segments = detectForeignWords(text);
  const hasAnnotations = segments.some((s) => s.type === 'annotation');
  if (!hasAnnotations) return null;

  return (
    <View style={{ marginTop: 4 }}>
      <Text style={{ fontSize: 11, color: 'rgba(167, 139, 250, 0.5)', marginBottom: 2 }}>
        Detected words:
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {segments
          .filter((s): s is { type: 'annotation'; annotation: Annotation } => s.type === 'annotation')
          .map((seg, i) => (
            <Text
              key={i}
              style={{
                fontSize: 13,
                color: '#c4b5fd',
                fontWeight: '500',
                textDecorationLine: 'underline',
                textDecorationStyle: 'dotted',
                textDecorationColor: '#a78bfa',
              }}
            >
              {seg.annotation.word}
            </Text>
          ))}
      </View>
    </View>
  );
}
