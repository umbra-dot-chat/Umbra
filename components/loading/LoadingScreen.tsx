import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Platform, Animated, Dimensions, Image, Text as RNText } from 'react-native';
import { useTheme } from '@coexist/wisp-react-native';
import { useBlobPath, AnimatedBlobs } from '@/components/auth/AnimatedBlobs';
import { TAGLINES } from '@/app/(auth)/index';
import Svg, { Path } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Ghost logo assets — black and white variants for theme + blob inversion
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ghostBlack = require('@/assets/images/ghost-black.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ghostWhite = require('@/assets/images/ghost-white.png');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

interface LoadingScreenProps {
  steps: LoadingStep[];
  onComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Native inverted layer — MaskedView (same pattern as auth screen)
// ---------------------------------------------------------------------------

function NativeInvertedLayer({
  pathData,
  children,
}: {
  pathData: string;
  children: React.ReactNode;
}) {
  // Lazy-require MaskedView so it's never bundled on web
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const MaskedViewComponent = require('@react-native-masked-view/masked-view').default;

  const [dims, setDims] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setDims(window);
    });
    return () => sub?.remove();
  }, []);

  if (!pathData || dims.width === 0) return null;

  return (
    <MaskedViewComponent
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      pointerEvents="none"
      maskElement={
        <Svg
          width={dims.width}
          height={dims.height}
          viewBox={`0 0 ${dims.width} ${dims.height}`}
        >
          <Path d={pathData} fill="black" />
        </Svg>
      }
    >
      {children}
    </MaskedViewComponent>
  );
}

// ---------------------------------------------------------------------------
// LoadingScreen
// ---------------------------------------------------------------------------

const TAGLINE_INTERVAL = 3500;
const TAGLINE_ANIM_DURATION = 500;

export function LoadingScreen({ steps, onComplete }: LoadingScreenProps) {
  const { pathData } = useBlobPath();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [hidden, setHidden] = useState(false);
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const tc = theme.colors;

  // Tagline rotation — shared across both layers
  const taglineLineHeight = 20;
  const [taglineIndex, setTaglineIndex] = useState(() => Math.floor(Math.random() * TAGLINES.length));
  const taglineSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(taglineSlideAnim, {
        toValue: -taglineLineHeight,
        duration: TAGLINE_ANIM_DURATION,
        useNativeDriver: true,
      }).start(() => {
        setTaglineIndex((prev) => {
          let next;
          do { next = Math.floor(Math.random() * TAGLINES.length); } while (next === prev && TAGLINES.length > 1);
          return next;
        });
        taglineSlideAnim.setValue(taglineLineHeight);
        Animated.timing(taglineSlideAnim, {
          toValue: 0,
          duration: TAGLINE_ANIM_DURATION,
          useNativeDriver: true,
        }).start();
      });
    }, TAGLINE_INTERVAL);
    return () => clearInterval(interval);
  }, [taglineSlideAnim]);

  // Check if all steps are complete
  const allComplete = steps.length > 0 && steps.every(s => s.status === 'complete');

  useEffect(() => {
    if (allComplete) {
      // Brief delay then fade out
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setHidden(true);
          onComplete?.();
        });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [allComplete, fadeAnim, onComplete]);

  if (hidden) return null;

  const isNative = Platform.OS !== 'web';

  // CSS clip-path for web
  const clipStyle =
    !isNative
      ? ({ clipPath: `path('${pathData}')` } as any)
      : undefined;

  // Inverted content wrapper
  const invertedContent = (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}
      pointerEvents="none"
    >
      <LoadingContent
        steps={steps}
        inverted
        isDark={isDark}
        tc={tc}
        taglineIndex={taglineIndex}
        taglineSlideAnim={taglineSlideAnim}
        taglineLineHeight={taglineLineHeight}
      />
    </View>
  );

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: tc.background.canvas,
        zIndex: 9999,
        opacity: fadeAnim,
      }}
    >
      {/* Layer 1: Animated blob — color inverts with theme */}
      <AnimatedBlobs pathData={pathData} color={tc.text.primary} />

      {/* Layer 2: Normal content (ghost logo + progress bar) */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <LoadingContent
          steps={steps}
          inverted={false}
          isDark={isDark}
          tc={tc}
          taglineIndex={taglineIndex}
          taglineSlideAnim={taglineSlideAnim}
          taglineLineHeight={taglineLineHeight}
        />
      </View>

      {/* Layer 3: Inverted content clipped to blob shape */}
      {isNative ? (
        <NativeInvertedLayer pathData={pathData}>
          {invertedContent}
        </NativeInvertedLayer>
      ) : (
        <View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
            clipStyle,
          ]}
          pointerEvents="none"
        >
          {invertedContent}
        </View>
      )}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Inner content — rendered twice (normal + inverted for blob clip)
// Displays: Ghost logo + animated progress bar
// ---------------------------------------------------------------------------

const GHOST_SIZE = 300;

function LoadingContent({
  steps,
  inverted,
  isDark,
  tc,
  taglineIndex,
  taglineSlideAnim,
  taglineLineHeight,
}: {
  steps: LoadingStep[];
  inverted: boolean;
  isDark: boolean;
  tc: {
    text: { primary: string; secondary: string };
    background: { canvas: string };
    accent: { primary: string };
  };
  taglineIndex: number;
  taglineSlideAnim: Animated.Value;
  taglineLineHeight: number;
}) {
  // Normal layer: dark mode → white ghost, light mode → black ghost
  // Inverted layer (on blob): dark mode → black ghost, light mode → white ghost
  const ghostSource = inverted
    ? (isDark ? ghostBlack : ghostWhite)
    : (isDark ? ghostWhite : ghostBlack);

  // Progress calculation
  const completed = steps.filter(s => s.status === 'complete').length;
  const progress = steps.length > 0 ? completed / steps.length : 0;

  // Animated progress bar width
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false, // width animation can't use native driver
    }).start();
  }, [progress, progressAnim]);

  // Progress bar colors
  const barBgColor = inverted
    ? (isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)')
    : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)');
  const barFillColor = inverted ? tc.background.canvas : tc.text.primary;

  // Current active step label
  const activeStep = steps.find(s => s.status === 'active');
  const statusLabel = activeStep?.label ?? (completed === steps.length ? 'Ready' : '');
  const mutedColor = inverted
    ? (isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)')
    : tc.text.secondary;

  return (
    <View style={{ alignItems: 'center', gap: 32 }}>
      {/* Ghost logo */}
      <Image
        source={ghostSource}
        style={{
          width: GHOST_SIZE,
          height: GHOST_SIZE,
        }}
        resizeMode="contain"
      />

      {/* Tagline rotation */}
      <View style={{ height: taglineLineHeight, overflow: 'hidden' }}>
        <Animated.View style={{ transform: [{ translateY: taglineSlideAnim }] }}>
          <RNText
            style={{
              fontSize: 13,
              color: mutedColor,
              textAlign: 'center',
              letterSpacing: 0.3,
            }}
          >
            {TAGLINES[taglineIndex]}
          </RNText>
        </Animated.View>
      </View>

      {/* Progress bar + status label */}
      <View style={{ alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 200,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: barBgColor,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              height: '100%',
              borderRadius: 1.5,
              backgroundColor: barFillColor,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        </View>

        {/* Status text describing current loading step */}
        {statusLabel ? (
          <RNText
            style={{
              fontSize: 13,
              color: mutedColor,
              textAlign: 'center',
              letterSpacing: 0.3,
            }}
          >
            {statusLabel}
          </RNText>
        ) : null}
      </View>
    </View>
  );
}
