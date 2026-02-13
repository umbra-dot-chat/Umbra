/**
 * Editable 24-word seed phrase input grid.
 *
 * Laid out as 3 columns × 8 rows. Each cell is a small Input with a numbered label.
 * Supports paste detection and focus management (submit → next input).
 */

import React, { useRef, useCallback } from 'react';
import { View, TextInput, Platform, type ViewStyle } from 'react-native';
import { Input, Button, Alert } from '@coexist/wisp-react-native';
import { ClipboardIcon } from '@/components/icons';

export interface SeedPhraseInputProps {
  words: string[];
  onWordChange: (index: number, value: string) => void;
  /** Called when a paste fills all words at once */
  onPasteAll?: (words: string[]) => void;
  /** Error message to display below the grid */
  error?: string | null;
}

export function SeedPhraseInput({
  words,
  onWordChange,
  onPasteAll,
  error,
}: SeedPhraseInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChangeText = useCallback(
    (index: number, value: string) => {
      // Detect paste: if value has spaces, it's likely a pasted full phrase
      const trimmed = value.trim();
      if (trimmed.includes(' ')) {
        const pastedWords = trimmed.split(/\s+/).slice(0, 24);
        if (pastedWords.length > 1 && onPasteAll) {
          // Pad to 24
          const padded = [...pastedWords, ...Array(24 - pastedWords.length).fill('')].slice(0, 24);
          onPasteAll(padded);
          // Focus last filled input or the first empty
          const lastFilledIdx = pastedWords.length - 1;
          const nextIdx = Math.min(lastFilledIdx + 1, 23);
          inputRefs.current[nextIdx]?.focus();
          return;
        }
      }

      onWordChange(index, trimmed.toLowerCase());
    },
    [onWordChange, onPasteAll],
  );

  const handleSubmitEditing = useCallback((index: number) => {
    if (index < 23) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handlePasteFromClipboard = useCallback(async () => {
    if (Platform.OS !== 'web') return;
    try {
      const text = await navigator.clipboard.readText();
      const pastedWords = text.trim().split(/\s+/).slice(0, 24);
      if (pastedWords.length > 0 && onPasteAll) {
        const padded = [...pastedWords, ...Array(24 - pastedWords.length).fill('')].slice(0, 24);
        onPasteAll(padded);
      }
    } catch {
      // Clipboard access denied
    }
  }, [onPasteAll]);

  return (
    <View>
      {/* 3-column grid */}
      <View style={gridStyle}>
        {words.map((word, i) => (
          <View key={i} style={cellStyle}>
            <Input
              ref={(ref: any) => {
                inputRefs.current[i] = ref;
              }}
              size="sm"
              label={`${i + 1}`}
              value={word}
              onChangeText={(v: string) => handleChangeText(i, v)}
              onSubmitEditing={() => handleSubmitEditing(i)}
              placeholder="word"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType={i < 23 ? 'next' : 'done'}
              fullWidth
            />
          </View>
        ))}
      </View>

      {/* Paste button */}
      <View style={{ marginTop: 12 }}>
        <Button
          variant="tertiary"
          size="sm"
          onPress={handlePasteFromClipboard}
          iconLeft={<ClipboardIcon size={14} />}
        >
          Paste from clipboard
        </Button>
      </View>

      {/* Error */}
      {error && (
        <View style={{ marginTop: 12 }}>
          <Alert variant="danger" description={error} />
        </View>
      )}
    </View>
  );
}

const gridStyle: ViewStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginHorizontal: -4,
};

const cellStyle: ViewStyle = {
  width: '33.33%',
  paddingHorizontal: 4,
  paddingVertical: 4,
};
