import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { zIndex as zIndexScale } from '@coexist/wisp-core/tokens/z-index';

type StickyEdge = 'top' | 'bottom';

export interface StickyProps {
  children?: React.ReactNode;
  /** Edge to stick to. @default 'top' */
  edge?: StickyEdge;
  /** Offset from the sticky edge in pixels. @default 0 */
  offset?: number;
  /** Z-index value. @default 1100 */
  zIndex?: number;
  style?: object;
}

/**
 * Sticky — Sticky positioning helper for React Native.
 *
 * In React Native, true CSS `position: sticky` is not available.
 * This component uses absolute positioning to pin content to the
 * top or bottom of its parent. For scroll-based sticky headers,
 * use `stickyHeaderIndices` on FlatList/SectionList instead.
 *
 * For best results, ensure the parent View has `position: 'relative'`
 * or wrap content in a container that can anchor the sticky element.
 */
export const Sticky = forwardRef<View, StickyProps>(function Sticky(
  {
    children,
    edge = 'top',
    offset = 0,
    zIndex = zIndexScale.sticky,
    style: userStyle,
  },
  ref,
) {
  const positionStyle = edge === 'top'
    ? { top: offset }
    : { bottom: offset };

  return (
    <View
      ref={ref}
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          zIndex,
          ...positionStyle,
        },
        userStyle,
      ]}
    >
      {children}
    </View>
  );
});

Sticky.displayName = 'Sticky';
