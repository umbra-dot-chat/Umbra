/**
 * @module layouts/floating
 * @description React Native Floating layout for the Wisp design system.
 *
 * Simple absolute positioning wrapper for floating action buttons,
 * tooltips, and overlays.
 */

import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';
import { zIndex } from '@coexist/wisp-core/tokens/z-index';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface FloatingProps extends ViewProps {
  /** Anchor position. @default 'bottom-right' */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  /** Offset from the edge in pixels. @default 16 */
  offset?: number;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Floating = forwardRef<View, FloatingProps>(
  function Floating(
    { position = 'bottom-right', offset = 16, children, style: userStyle, ...rest },
    ref,
  ) {
    const containerStyle = useMemo<ViewStyle>(() => {
      const base: ViewStyle = {
        position: 'absolute',
        zIndex: zIndex.dropdown,
      };

      switch (position) {
        case 'top-left':
          return { ...base, top: offset, left: offset };
        case 'top-right':
          return { ...base, top: offset, right: offset };
        case 'bottom-left':
          return { ...base, bottom: offset, left: offset };
        case 'bottom-right':
          return { ...base, bottom: offset, right: offset };
        case 'center':
          return {
            ...base,
            top: '50%',
            left: '50%',
            transform: [{ translateX: -50 }, { translateY: -50 }],
          };
        default:
          return { ...base, bottom: offset, right: offset };
      }
    }, [position, offset]);

    return (
      <View ref={ref} style={[containerStyle, userStyle]} pointerEvents="box-none" {...rest}>
        {children}
      </View>
    );
  },
);

Floating.displayName = 'Floating';
