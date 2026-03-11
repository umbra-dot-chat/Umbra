import React, { forwardRef, useMemo, useRef, useEffect } from 'react';
import { View, Pressable, Animated, Text as RNText, Dimensions } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Overlay } from '../../layouts/overlay';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

type DialogSize = 'sm' | 'md' | 'lg';

const dialogSizeMap: Record<DialogSize, number> = {
  sm: 360,
  md: 480,
  lg: 600,
};

export interface DialogProps {
  children?: React.ReactNode;
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  size?: DialogSize;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  style?: ViewStyle;
}

export const Dialog = forwardRef<View, DialogProps>(function Dialog(
  {
    children,
    open,
    onClose,
    title,
    description,
    icon,
    footer,
    size = 'md',
    closeOnOverlayClick = true,
    showCloseButton = true,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [open]);

  const screenWidth = Dimensions.get('window').width;
  const maxWidth = Math.min(dialogSizeMap[size], screenWidth - 32);

  const panelStyle = useMemo<ViewStyle>(
    () => ({
      width: maxWidth,
      maxWidth,
      backgroundColor: themeColors.background.canvas,
      borderRadius: defaultRadii.xl,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 8,
    }),
    [maxWidth, themeColors],
  );

  const headerStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: defaultSpacing.xl,
      paddingBottom: children ? 12 : 20,
      gap: defaultSpacing.md,
    }),
    [children],
  );

  const titleStyle = useMemo<TextStyle>(
    () => ({
      fontSize: defaultTypography.sizes.base.fontSize,
      fontWeight: defaultTypography.weights.semibold,
      color: themeColors.text.primary,
    }),
    [themeColors],
  );

  const descStyle = useMemo<TextStyle>(
    () => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      color: themeColors.text.secondary,
      marginTop: defaultSpacing.xs,
    }),
    [themeColors],
  );

  return (
    <Overlay
      open={open}
      backdrop="dim"
      center
      onBackdropPress={closeOnOverlayClick ? onClose : undefined}
      animationType="none"
    >
      <Animated.View
        ref={ref}
        style={[panelStyle, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }, userStyle]}
      >
        {(title || description || icon || showCloseButton) && (
          <View style={headerStyle}>
            {icon && <View style={{ flexShrink: 0, marginTop: defaultSpacing['2xs'] }}>{icon}</View>}
            <View style={{ flex: 1, minWidth: 0 }}>
              {title && <RNText style={titleStyle}>{title}</RNText>}
              {description && <RNText style={descStyle}>{description}</RNText>}
            </View>
            {showCloseButton && (
              <Pressable
                onPress={onClose}
                accessibilityLabel="Close dialog"
                accessibilityRole="button"
                style={{
                  width: 28,
                  height: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: defaultRadii.md,
                  marginTop: -2,
                  marginRight: -4,
                }}
              >
                <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                  <Path d="M4 4l8 8M12 4l-8 8" stroke={themeColors.text.secondary} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </Pressable>
            )}
          </View>
        )}

        {children && (
          <View style={{ paddingHorizontal: defaultSpacing.xl, paddingBottom: footer ? 12 : 20 }}>
            {children}
          </View>
        )}

        {footer && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: defaultSpacing.sm,
              padding: defaultSpacing.lg,
              borderTopWidth: 1,
              borderTopColor: themeColors.border.subtle,
            }}
          >
            {footer}
          </View>
        )}
      </Animated.View>
    </Overlay>
  );
});

Dialog.displayName = 'Dialog';
