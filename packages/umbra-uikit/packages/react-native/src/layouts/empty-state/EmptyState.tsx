import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText } from 'react-native';
import type { EmptyStateSize } from '@coexist/wisp-core/types/EmptyState.types';
import { emptyStateSizeMap } from '@coexist/wisp-core/types/EmptyState.types';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

export interface EmptyStateProps {
  /** Icon element displayed above the title. */
  icon?: React.ReactNode;
  /** Primary message. */
  title: string;
  /** Supporting text below the title. */
  description?: string;
  /** Action element (e.g. Button) displayed below the description. */
  action?: React.ReactNode;
  /** Size variant. @default 'md' */
  size?: EmptyStateSize;
  style?: object;
}

export const EmptyState = forwardRef<View, EmptyStateProps>(function EmptyState(
  { icon, title, description, action, size = 'md', style: userStyle },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = emptyStateSizeMap[size];

  return (
    <View
      ref={ref}
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: sizeConfig.minHeight,
          gap: sizeConfig.gap,
          padding: defaultSpacing.xl,
        },
        userStyle,
      ]}
    >
      {icon && (
        <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: defaultSpacing.xs }}>
          {icon}
        </View>
      )}
      <RNText
        style={{
          fontSize: sizeConfig.titleFontSize,
          fontWeight: defaultTypography.weights.semibold,
          color: themeColors.text.primary,
          textAlign: 'center',
        }}
      >
        {title}
      </RNText>
      {description && (
        <RNText
          style={{
            fontSize: sizeConfig.descriptionFontSize,
            fontWeight: defaultTypography.weights.regular,
            color: themeColors.text.secondary,
            textAlign: 'center',
            maxWidth: 320,
          }}
        >
          {description}
        </RNText>
      )}
      {action && <View style={{ marginTop: defaultSpacing.sm }}>{action}</View>}
    </View>
  );
});

EmptyState.displayName = 'EmptyState';
