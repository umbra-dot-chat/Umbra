/**
 * @module components/new-message-divider
 * @description React Native NewMessageDivider for the Wisp design system.
 *
 * Horizontal divider marking the boundary between read and unread messages.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface NewMessageDividerProps extends ViewProps {
  /** Label text centered on the divider. @default 'New' */
  label?: string;
  /** Override color for line and label. Defaults to theme danger color. */
  color?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const NewMessageDivider = forwardRef<View, NewMessageDividerProps>(function NewMessageDivider(
  {
    label = 'New',
    color,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const resolvedColor = color ?? themeColors.status.danger;

  const containerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: defaultSpacing.md,
  }), []);

  const lineStyle = useMemo<ViewStyle>(() => ({
    flex: 1,
    height: 1,
    backgroundColor: resolvedColor,
    opacity: 0.4,
  }), [resolvedColor]);

  const labelStyle = useMemo<TextStyle>(() => ({
    fontSize: defaultTypography.sizes.xs.fontSize,
    lineHeight: 16,
    fontWeight: defaultTypography.weights.semibold,
    color: resolvedColor,
  }), [resolvedColor]);

  return (
    <View
      ref={ref}
      style={[containerStyle, userStyle]}
      accessibilityRole="none"
      accessibilityLabel="New messages"
      {...rest}
    >
      <View style={lineStyle} />
      <Text style={labelStyle}>{label}</Text>
      <View style={lineStyle} />
    </View>
  );
});

NewMessageDivider.displayName = 'NewMessageDivider';
