import React, { useEffect, useRef, useState } from 'react';
import { View, Platform, Animated, Text as RNText } from 'react-native';
import { useBlobPath, AnimatedBlobs } from '@/components/auth/AnimatedBlobs';

// ---------------------------------------------------------------------------
// Load BBH Bartle from Google Fonts (web only) — same as auth screen
// ---------------------------------------------------------------------------

const FONT_FAMILY = 'BBH Bartle';
const FONT_URL = 'https://fonts.googleapis.com/css2?family=BBH+Bartle&display=swap';

function useGoogleFont() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setLoaded(true);
      return;
    }

    if (!document.querySelector(`link[href="${FONT_URL}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONT_URL;
      document.head.appendChild(link);
    }

    if ('fonts' in document) {
      document.fonts.load(`400 72px "${FONT_FAMILY}"`).then(() => {
        setLoaded(true);
      }).catch(() => {
        setLoaded(true);
      });
    } else {
      const timer = setTimeout(() => setLoaded(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return loaded;
}

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
// Step indicator — animated dot/check for each loading step
// ---------------------------------------------------------------------------

function StepIndicator({ status }: { status: LoadingStep['status'] }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'active') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  const dotColor =
    status === 'complete' ? '#22c55e' :
    status === 'active' ? '#3b82f6' :
    status === 'error' ? '#ef4444' :
    'rgba(0,0,0,0.2)';

  const dotSize = status === 'complete' ? 8 : 6;

  return (
    <Animated.View
      style={{
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        transform: status === 'active' ? [{ scale: pulseAnim }] : [],
      }}
    >
      {status === 'complete' ? (
        // Checkmark
        <RNText style={{ fontSize: 12, color: '#22c55e', fontWeight: '700' }}>
          {'\u2713'}
        </RNText>
      ) : (
        <View
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
          }}
        />
      )}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// LoadingScreen
// ---------------------------------------------------------------------------

export function LoadingScreen({ steps, onComplete }: LoadingScreenProps) {
  const fontLoaded = useGoogleFont();
  const { pathData } = useBlobPath();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [hidden, setHidden] = useState(false);

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

  const clipStyle =
    Platform.OS === 'web'
      ? ({ clipPath: `path('${pathData}')` } as any)
      : { display: 'none' as const };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        zIndex: 9999,
        opacity: fadeAnim,
      }}
    >
      {/* Layer 1: Animated blob */}
      <AnimatedBlobs pathData={pathData} />

      {/* Layer 2: Normal content (black text on white) */}
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
          fontLoaded={fontLoaded}
          inverted={false}
        />
      </View>

      {/* Layer 3: Inverted content (white text, clipped to blob) */}
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
            fontLoaded={fontLoaded}
            inverted
          />
        </View>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Inner content — rendered twice (normal + inverted for blob clip)
// ---------------------------------------------------------------------------

function LoadingContent({
  steps,
  fontLoaded,
  inverted,
}: {
  steps: LoadingStep[];
  fontLoaded: boolean;
  inverted: boolean;
}) {
  const textColor = inverted ? '#FFFFFF' : '#000000';
  const mutedColor = inverted ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)';

  return (
    <View style={{ alignItems: 'center', gap: 48 }}>
      {/* Umbra title */}
      <View style={{ alignItems: 'center', gap: 8 }}>
        <RNText
          style={{
            fontFamily: fontLoaded ? `"${FONT_FAMILY}", sans-serif` : 'sans-serif',
            fontSize: 72,
            lineHeight: 80,
            letterSpacing: 2,
            color: textColor,
            textAlign: 'center',
            opacity: fontLoaded ? 1 : 0,
          }}
        >
          Umbra
        </RNText>
        <RNText
          style={{
            fontSize: 14,
            color: mutedColor,
            textAlign: 'center',
          }}
        >
          Encrypted messaging, powered by your keys
        </RNText>
      </View>

      {/* Loading steps */}
      <View style={{ gap: 12, minWidth: 220 }}>
        {steps.map((step) => {
          const labelColor =
            step.status === 'complete' ? (inverted ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)') :
            step.status === 'active' ? textColor :
            step.status === 'error' ? '#ef4444' :
            mutedColor;

          return (
            <View
              key={step.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <StepIndicator status={step.status} />
              <RNText
                style={{
                  fontSize: 13,
                  fontWeight: step.status === 'active' ? '600' : '400',
                  color: labelColor,
                  letterSpacing: 0.3,
                }}
              >
                {step.label}
              </RNText>
            </View>
          );
        })}
      </View>
    </View>
  );
}
