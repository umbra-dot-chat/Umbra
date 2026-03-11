import React, { forwardRef, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Pressable, Animated, PanResponder, Dimensions, Modal, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { defaultSpacing, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

type SheetSize = 'sm' | 'md' | 'lg' | 'full';

const sheetSizePercent: Record<SheetSize, number> = {
  sm: 0.4,
  md: 0.6,
  lg: 0.8,
  full: 1,
};

const DISMISS_THRESHOLD = 100;

export interface SheetProps {
  children?: React.ReactNode;
  open: boolean;
  onClose: () => void;
  size?: SheetSize;
  overlay?: boolean;
  closeOnOverlayClick?: boolean;
  style?: ViewStyle;
}

export const Sheet = forwardRef<View, SheetProps>(function Sheet(
  {
    children,
    open,
    onClose,
    size = 'md',
    overlay = true,
    closeOnOverlayClick = true,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const screenHeight = Dimensions.get('window').height;
  const maxHeight = screenHeight * sheetSizePercent[size];

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: screenHeight, duration: 250, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [open, screenHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DISMISS_THRESHOLD) {
          Animated.timing(translateY, { toValue: screenHeight, duration: 200, useNativeDriver: true }).start(() => onClose());
        } else {
          Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  const sheetStyle = useMemo<ViewStyle>(
    () => ({
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight,
      backgroundColor: themeColors.background.raised,
      borderTopLeftRadius: defaultRadii.xl,
      borderTopRightRadius: defaultRadii.xl,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    }),
    [maxHeight, themeColors],
  );

  const handleStyle = useMemo<ViewStyle>(
    () => ({
      width: 36,
      height: 4,
      borderRadius: defaultRadii.sm,
      backgroundColor: themeColors.border.strong,
      alignSelf: 'center',
      marginTop: defaultSpacing.sm,
      marginBottom: defaultSpacing.sm,
    }),
    [themeColors],
  );

  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill}>
        {overlay && (
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: overlayOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeOnOverlayClick ? onClose : undefined} />
          </Animated.View>
        )}

        <Animated.View
          ref={ref}
          style={[sheetStyle, { transform: [{ translateY }] }, userStyle]}
        >
          <View {...panResponder.panHandlers}>
            <View style={handleStyle} />
          </View>
          <View style={{ flex: 1, paddingHorizontal: defaultSpacing.lg, paddingBottom: defaultSpacing.lg }}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

Sheet.displayName = 'Sheet';
