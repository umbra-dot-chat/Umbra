/**
 * Read-only grid displaying 24 recovery seed words.
 *
 * Laid out as 3 columns × 8 rows on mobile, 4 columns × 6 rows on web.
 * Each word is shown in a compact outlined card with a numbered label.
 * Cards animate in one-by-one with a text scramble decode effect.
 * Optionally shows a "Copy to clipboard" button.
 */

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Animated, View, Platform, type ViewStyle } from 'react-native';
import { Text, Button, Card, HStack, Alert, useTextScramble } from '@coexist/wisp-react-native';
import { CopyIcon } from '@/components/ui';
import { TEST_IDS } from '@/constants/test-ids';

const isMobile = Platform.OS !== 'web';

// ---------------------------------------------------------------------------
// Animated word card — fades/scales in + text scramble decode
// ---------------------------------------------------------------------------

const STAGGER_DELAY = 100; // ms between each card entrance
const CARD_ANIM_DURATION = 300;

interface AnimatedWordCardProps {
  word: string;
  index: number;
}

function AnimatedWordCard({ word, index }: AnimatedWordCardProps) {
  const delay = index * STAGGER_DELAY;
  const [visible, setVisible] = useState(false);
  const entrance = useRef(new Animated.Value(0)).current;

  // Stagger the card entrance
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
      Animated.timing(entrance, {
        toValue: 1,
        duration: CARD_ANIM_DURATION,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, entrance]);

  // Text scramble starts when card becomes visible
  const { display } = useTextScramble(word, {
    delay: 0,
    speed: 28,
    scrambleCycles: 2,
    enabled: visible,
  });

  const animatedStyle = {
    opacity: entrance,
    transform: [
      {
        scale: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
    ],
  };

  return (
    <View style={cellStyle}>
      <Animated.View style={animatedStyle}>
        <Card variant="outlined" radius="sm" padding={isMobile ? 'none' : 'sm'} style={isMobile ? cardStyleMobile : { width: '100%' }}>
          <HStack gap="xs" style={{ alignItems: 'center' }}>
            <Text size="xs" color="muted" style={{ minWidth: isMobile ? 16 : 20 }}>
              {index + 1}.
            </Text>
            <Text
              size="sm"
              weight="semibold"
              numberOfLines={1}
              style={{ fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}
            >
              {visible ? display : ''}
            </Text>
          </HStack>
        </Card>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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
      <View style={gridStyle} testID={TEST_IDS.SEED.GRID} accessibilityValue={{ text: words.join(' ') }}>
        {words.map((word, i) => (
          <AnimatedWordCard key={i} word={word} index={i} />
        ))}
      </View>

      {showCopy && (
        <View style={{ marginTop: 16, gap: 12 }}>
          <Button
            variant="tertiary"
            size="sm"
            onPress={handleCopy}
            iconLeft={<CopyIcon size={14} />}
            testID={TEST_IDS.SEED.COPY_BUTTON}
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </Button>
          <Alert
            variant="warning"
            description="Your clipboard may be accessible to other apps. Clear it after use."
            testID={TEST_IDS.SEED.WARNING}
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
