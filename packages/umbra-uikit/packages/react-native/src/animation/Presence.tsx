import React, { useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useTransition } from './use-transition';
import type { TransitionPhase } from './use-transition';
import { DEFAULT_DURATION } from '@coexist/wisp-core/animation/constants';

export type PresenceAnimation = 'fadeIn' | 'scaleIn' | 'slideUp' | 'slideDown';

export type PresenceProps = {
  visible: boolean;
  animation?: PresenceAnimation;
  duration?: number;
  children: React.ReactNode;
};

function buildAnimationStyle(
  animation: PresenceAnimation,
  progress: Animated.Value,
): Animated.WithAnimatedObject<ViewStyle> {
  switch (animation) {
    case 'fadeIn':
      return { opacity: progress };

    case 'scaleIn':
      return {
        opacity: progress,
        transform: [
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.95, 1],
            }),
          },
        ],
      };

    case 'slideUp':
      return {
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 0],
            }),
          },
        ],
      };

    case 'slideDown':
      return {
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-8, 0],
            }),
          },
        ],
      };

    default: {
      const _exhaustive: never = animation;
      return { opacity: progress };
    }
  }
}

/**
 * Renders children with an animated mount/unmount transition.
 * The component keeps children in the tree during the exit animation
 * and removes them only after the animation completes.
 */
export function Presence({
  visible,
  animation = 'fadeIn',
  duration = DEFAULT_DURATION,
  children,
}: PresenceProps): React.JSX.Element | null {
  const { mounted, phase } = useTransition(visible, { duration });
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [visible, duration, progress]);

  const style = useMemo(
    () => buildAnimationStyle(animation, progress),
    [animation, progress],
  );

  if (!mounted) return null;

  return <Animated.View style={style}>{children}</Animated.View>;
}
