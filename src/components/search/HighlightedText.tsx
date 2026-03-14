/**
 * HighlightedText — Renders text with search term matches highlighted.
 *
 * Uses Wisp theme accent colors for the highlight.
 */

import React, { useMemo } from 'react';
import { Text as RNText } from 'react-native';
import { Text, GradientText, useTheme } from '@coexist/wisp-react-native';

interface HighlightedTextProps {
  /** The full text to display */
  text: string;
  /** Terms to highlight (case-insensitive) */
  terms: string[];
  /** Text size */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Text color */
  color?: string;
  /** Max number of lines before truncation */
  numberOfLines?: number;
}

export function HighlightedText({
  text,
  terms,
  size = 'sm',
  color = 'primary',
  numberOfLines,
}: HighlightedTextProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const segments = useMemo(() => {
    if (!terms.length || !text) return [{ text, highlight: false }];

    // Build regex from terms, escaping special chars
    const escaped = terms
      .filter(Boolean)
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (escaped.length === 0) return [{ text, highlight: false }];

    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part) => ({
      text: part,
      highlight: escaped.some((e) => new RegExp(`^${e}$`, 'i').test(part)),
    }));
  }, [text, terms]);

  return (
    <Text size={size} color={color as any} numberOfLines={numberOfLines}>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <GradientText key={i} animated speed={3000} style={{ fontSize: 'inherit' as any, lineHeight: 'inherit' as any }}>
            {seg.text}
          </GradientText>
        ) : (
          <RNText key={i}>{seg.text}</RNText>
        ),
      )}
    </Text>
  );
}

HighlightedText.displayName = 'HighlightedText';
