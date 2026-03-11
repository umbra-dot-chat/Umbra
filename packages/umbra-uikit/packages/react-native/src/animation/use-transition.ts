import { useState, useEffect, useRef, useMemo } from 'react';
import { Animated, Easing } from 'react-native';
import type { ViewStyle } from 'react-native';
import { DEFAULT_DURATION } from '@coexist/wisp-core/animation/constants';

export type TransitionPhase = 'enter' | 'idle' | 'exit';

export type TransitionConfig = {
  duration?: number;
  easing?: string;
};

export type TransitionResult = {
  /** Whether the element should be rendered. */
  mounted: boolean;
  /** Animated style to apply (opacity + transform). */
  style: Animated.WithAnimatedObject<ViewStyle>;
  /** Current lifecycle phase. */
  phase: TransitionPhase;
};

const EASING_MAP: Record<string, (value: number) => number> = {
  linear: Easing.linear,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
};

/**
 * Manages mount/unmount lifecycle with animated opacity and transform.
 * The element stays mounted during the exit animation.
 */
export function useTransition(
  visible: boolean,
  config?: TransitionConfig,
): TransitionResult {
  const duration = config?.duration ?? DEFAULT_DURATION;
  const easingFn = EASING_MAP[config?.easing ?? 'easeOut'] ?? EASING_MAP.easeOut;

  const [mounted, setMounted] = useState(visible);
  const [phase, setPhase] = useState<TransitionPhase>(visible ? 'idle' : 'exit');
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const initialRenderRef = useRef(true);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setPhase('enter');

      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: easingFn,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setPhase('idle');
      });
    } else {
      if (initialRenderRef.current) {
        setMounted(false);
        setPhase('exit');
      } else {
        setPhase('exit');

        Animated.timing(progress, {
          toValue: 0,
          duration,
          easing: easingFn,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) setMounted(false);
        });
      }
    }

    initialRenderRef.current = false;
  }, [visible, duration, easingFn, progress]);

  const style = useMemo(
    () => ({
      opacity: progress,
      transform: [
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [4, 0],
          }),
        },
        {
          scale: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.98, 1],
          }),
        },
      ],
    }),
    [progress],
  );

  return { mounted, style, phase };
}
