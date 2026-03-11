import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText } from 'react-native';
import type { AlertVariant } from '@coexist/wisp-core/types/Alert.types';
import type { ThemeColors } from '@coexist/wisp-core/theme/types';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  style?: object;
}

function resolveVariantColors(variant: AlertVariant, themeColors: ThemeColors) {
  switch (variant) {
    case 'success':
      return { bg: themeColors.status.successSurface, border: themeColors.status.successBorder, icon: themeColors.status.success };
    case 'warning':
      return { bg: themeColors.status.warningSurface, border: themeColors.status.warningBorder, icon: themeColors.status.warning };
    case 'danger':
      return { bg: themeColors.status.dangerSurface, border: themeColors.status.dangerBorder, icon: themeColors.status.danger };
    case 'info':
      return { bg: themeColors.status.infoSurface, border: themeColors.status.infoBorder, icon: themeColors.status.info };
    case 'default':
    default:
      return { bg: themeColors.background.raised, border: themeColors.accent.dividerRaised, icon: themeColors.text.onRaised };
  }
}

export const Alert = forwardRef<View, AlertProps>(function Alert(
  {
    variant = 'default',
    title,
    description,
    icon,
    action,
    children,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const colors = useMemo(() => resolveVariantColors(variant, themeColors), [variant, themeColors]);

  const isRaised = variant === 'default';
  const body = description ?? (typeof children === 'string' ? children : null);

  return (
    <View
      ref={ref}
      accessibilityRole="alert"
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: defaultSpacing.md,
          padding: defaultSpacing.md,
          paddingHorizontal: defaultSpacing.lg,
          borderRadius: defaultRadii.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.bg,
        },
        userStyle,
      ]}
    >
      {icon && (
        <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </View>
      )}

      <View style={{ flex: 1, gap: defaultSpacing['2xs'] }}>
        {title && (
          <RNText
            style={{
              fontSize: defaultTypography.sizes.sm.fontSize,
              lineHeight: 20,
              fontWeight: defaultTypography.weights.semibold,
              color: isRaised ? themeColors.text.onRaised : themeColors.text.primary,
            }}
          >
            {title}
          </RNText>
        )}
        {body && (
          <RNText
            style={{
              fontSize: defaultTypography.sizes.sm.fontSize,
              lineHeight: 20,
              fontWeight: defaultTypography.weights.regular,
              color: isRaised ? themeColors.text.onRaisedSecondary : themeColors.text.secondary,
            }}
          >
            {body}
          </RNText>
        )}
        {!body && typeof children === 'number' ? (
          <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 20, fontWeight: defaultTypography.weights.regular, color: isRaised ? themeColors.text.onRaisedSecondary : themeColors.text.secondary }}>{children}</RNText>
        ) : !body && typeof children !== 'string' ? children : null}
      </View>

      {action && (
        <View style={{ flexShrink: 0, marginLeft: 'auto' }}>
          {action}
        </View>
      )}
    </View>
  );
});

Alert.displayName = 'Alert';
