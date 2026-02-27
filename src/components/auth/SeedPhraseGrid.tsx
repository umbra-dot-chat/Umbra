/**
 * Read-only grid displaying 24 recovery seed words.
 *
 * Laid out as 3 columns × 8 rows on mobile, 4 columns × 6 rows on web.
 * Each word is shown in a compact outlined card with a numbered label.
 * Optionally shows a "Copy to clipboard" button.
 */

import React, { useCallback, useState } from 'react';
import { View, Platform, type ViewStyle } from 'react-native';
import { Text, Button, Card, HStack, Alert } from '@coexist/wisp-react-native';
import { CopyIcon } from '@/components/ui';

const isMobile = Platform.OS !== 'web';

export interface SeedPhraseGridProps {
  words: string[];
  /** Show copy-to-clipboard button. @default false */
  showCopy?: boolean;
}

export function SeedPhraseGrid({ words, showCopy = false }: SeedPhraseGridProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const phrase = words.join(' ');
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(phrase);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // fallback: do nothing
      }
    }
  }, [words]);

  return (
    <View>
      <View style={gridStyle}>
        {words.map((word, i) => (
          <View key={i} style={cellStyle}>
            <Card variant="outlined" radius="sm" padding={isMobile ? 'none' : 'sm'} style={isMobile ? cardStyleMobile : { width: '100%' }}>
              <HStack gap="xs" style={{ alignItems: 'center' }}>
                <Text size="xs" color="muted" style={{ minWidth: isMobile ? 16 : 20 }}>
                  {i + 1}.
                </Text>
                <Text size="sm" weight="semibold" numberOfLines={1}>
                  {word}
                </Text>
              </HStack>
            </Card>
          </View>
        ))}
      </View>

      {showCopy && (
        <View style={{ marginTop: 16, gap: 12 }}>
          <Button
            variant="tertiary"
            size="sm"
            onPress={handleCopy}
            iconLeft={<CopyIcon size={14} />}
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </Button>
          <Alert
            variant="warning"
            description="Your clipboard may be accessible to other apps. Clear it after use."
          />
        </View>
      )}
    </View>
  );
}

const gridStyle: ViewStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginHorizontal: isMobile ? -3 : -4,
};

const cellStyle: ViewStyle = {
  width: isMobile ? '33.33%' : '25%',
  paddingHorizontal: isMobile ? 3 : 4,
  paddingVertical: isMobile ? 3 : 4,
};

const cardStyleMobile: ViewStyle = {
  width: '100%',
  paddingHorizontal: 8,
  paddingVertical: 6,
};
