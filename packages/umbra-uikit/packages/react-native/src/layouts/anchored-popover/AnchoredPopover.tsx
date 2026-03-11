/**
 * @module layouts/anchored-popover
 * @description Positions content near a given screen coordinate with
 * clamping math to prevent off-screen overflow. Useful for profile cards,
 * context menus, and any element that should appear near a click/press point.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import { zIndex } from '@coexist/wisp-core/tokens/z-index';
import { durations } from '@coexist/wisp-core/tokens/motion';
import { Presence } from '../../animation';
import type { PresenceAnimation } from '../../animation';

export interface AnchoredPopoverProps {
  /** Whether the popover is visible. */
  open: boolean;
  /** Screen coordinate to anchor near. */
  anchor: { x: number; y: number } | null;
  /** Called when the backdrop is pressed or dismiss is requested. */
  onClose: () => void;
  /** Content to render inside the popover. */
  children: React.ReactNode;
  /** Entrance/exit animation. @default 'scaleIn' */
  animation?: PresenceAnimation;
  /** Animation duration in ms. @default durations.fast */
  duration?: number;
  /** Backdrop style. @default 'transparent' */
  backdrop?: 'transparent' | 'dim';
  /** Minimum padding from screen edges in px. @default 12 */
  screenPadding?: number;
}

/**
 * AnchoredPopover — renders children in a floating layer near the given
 * anchor point. Automatically clamps position so content stays on-screen.
 */
export function AnchoredPopover({
  open,
  anchor,
  onClose,
  children,
  animation = 'scaleIn',
  duration = durations.fast,
  backdrop = 'transparent',
  screenPadding = 12,
}: AnchoredPopoverProps): React.JSX.Element | null {
  const [contentSize, setContentSize] = useState<{ w: number; h: number } | null>(null);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContentSize((prev) => {
      if (prev && prev.w === width && prev.h === height) return prev;
      return { w: width, h: height };
    });
  }, []);

  const position = useMemo(() => {
    if (!anchor) return { left: 0, top: 0 };

    const { width: screenW, height: screenH } = Dimensions.get('window');
    let x = anchor.x;
    let y = anchor.y;

    if (contentSize) {
      const maxX = screenW - contentSize.w - screenPadding;
      const maxY = screenH - contentSize.h - screenPadding;
      x = Math.max(screenPadding, Math.min(x, maxX));
      y = Math.max(screenPadding, Math.min(y, maxY));
    } else {
      // Before measurement, just clamp anchor within padding
      x = Math.max(screenPadding, Math.min(x, screenW - screenPadding));
      y = Math.max(screenPadding, Math.min(y, screenH - screenPadding));
    }

    return { left: x, top: y };
  }, [anchor, contentSize, screenPadding]);

  const backdropColor = backdrop === 'dim' ? 'rgba(0,0,0,0.3)' : 'transparent';

  if (!open || !anchor) return null;

  return (
    <View style={[styles.container, { backgroundColor: backdropColor }]} pointerEvents="box-none">
      {/* Dismiss backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      {/* Positioned content */}
      <View
        style={[styles.content, position]}
        onLayout={handleLayout}
        pointerEvents="box-none"
      >
        <Presence visible={open} animation={animation} duration={duration}>
          {children}
        </Presence>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: zIndex.popover,
  },
  content: {
    position: 'absolute',
  },
});

AnchoredPopover.displayName = 'AnchoredPopover';
