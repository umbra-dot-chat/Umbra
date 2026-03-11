import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';

export interface AspectRatioProps {
  /** Desired aspect ratio expressed as width / height. @default 1 */
  ratio?: number;
  /** Content to render inside the aspect-ratio container. */
  children?: React.ReactNode;
  style?: object;
}

/**
 * AspectRatio — Constrains its children to a given width-to-height ratio.
 *
 * Uses the `aspectRatio` style property available in React Native to
 * maintain a responsive aspect ratio regardless of the container width.
 */
export const AspectRatio = forwardRef<View, AspectRatioProps>(function AspectRatio(
  { ratio = 1, children, style: userStyle },
  ref,
) {
  const containerStyle = useMemo(
    () => ({
      width: '100%' as const,
      aspectRatio: ratio,
    }),
    [ratio],
  );

  return (
    <View ref={ref} style={[containerStyle, userStyle]}>
      {children}
    </View>
  );
});

AspectRatio.displayName = 'AspectRatio';
