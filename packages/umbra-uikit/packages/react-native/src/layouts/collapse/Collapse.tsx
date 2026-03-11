import React, { forwardRef, useRef, useState, useEffect, useCallback } from 'react';
import { View, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import type { CollapseDuration } from '@coexist/wisp-core/types/Collapse.types';
import { collapseDurationMap } from '@coexist/wisp-core/types/Collapse.types';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface CollapseProps {
  /** Content to show/hide. */
  children?: React.ReactNode;
  /** Whether the content is expanded. @default false */
  open?: boolean;
  /** Animation duration preset. @default 'normal' */
  duration?: CollapseDuration;
  /** Custom duration in ms (overrides duration preset). */
  durationMs?: number;
  /** Whether to unmount children when collapsed. @default false */
  unmountOnClose?: boolean;
  /** Called when the expand/collapse animation ends. */
  onTransitionEnd?: () => void;
  style?: object;
}

/**
 * Collapse — Animated expand/collapse container for React Native.
 *
 * Uses Animated API to animate height from 0 to measured content height.
 */
export const Collapse = forwardRef<View, CollapseProps>(function Collapse(
  {
    children,
    open = false,
    duration = 'normal',
    durationMs,
    unmountOnClose = false,
    onTransitionEnd,
    style: userStyle,
  },
  ref,
) {
  const ms = durationMs ?? collapseDurationMap[duration];
  const animatedHeight = useRef(new Animated.Value(open ? 1 : 0)).current;
  const [contentHeight, setContentHeight] = useState(0);
  const [shouldRender, setShouldRender] = useState(open);
  const isFirstRender = useRef(true);

  // Ensure children are rendered before measuring
  useEffect(() => {
    if (open) {
      setShouldRender(true);
    }
  }, [open]);

  // Animate open/close
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (ms === 0) {
      animatedHeight.setValue(open ? 1 : 0);
      if (!open && unmountOnClose) setShouldRender(false);
      onTransitionEnd?.();
      return;
    }

    Animated.timing(animatedHeight, {
      toValue: open ? 1 : 0,
      duration: ms,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        if (!open && unmountOnClose) setShouldRender(false);
        onTransitionEnd?.();
      }
    });
  }, [open, ms]);

  const handleLayout = useCallback(
    (e: { nativeEvent: { layout: { height: number } } }) => {
      const h = e.nativeEvent.layout.height;
      if (h > 0 && h !== contentHeight) {
        setContentHeight(h);
      }
    },
    [contentHeight],
  );

  if (unmountOnClose && !shouldRender) {
    return null;
  }

  const maxHeight = contentHeight > 0
    ? animatedHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, contentHeight],
      })
    : open ? undefined : 0;

  return (
    <Animated.View
      ref={ref}
      style={[
        {
          overflow: 'hidden',
          maxHeight,
        },
        userStyle,
      ]}
      accessibilityElementsHidden={!open}
    >
      <View onLayout={handleLayout}>
        {children}
      </View>
    </Animated.View>
  );
});

Collapse.displayName = 'Collapse';
