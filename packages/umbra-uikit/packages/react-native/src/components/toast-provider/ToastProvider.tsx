/**
 * @module components/toast-provider
 * @description React Native ToastProvider for the Wisp design system.
 *
 * Context-based toast notification system using Animated for entry/exit.
 * Toast components render in an absolute overlay at the top of the screen.
 */

import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { zIndex } from '@coexist/wisp-core/tokens/z-index';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toast: (options: Omit<ToastItem, 'id'> & { id?: string }) => void;
  dismiss: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  dismiss: () => {},
});

export const useToast = () => useContext(ToastContext);

// ---------------------------------------------------------------------------
// Individual toast component
// ---------------------------------------------------------------------------

function ToastItemView({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    if (item.duration > 0) {
      const timer = setTimeout(() => onDismiss(item.id), item.duration);
      return () => clearTimeout(timer);
    }
  }, [item.id, item.duration, onDismiss, slideAnim, opacityAnim]);

  const variantColorMap: Record<ToastVariant, string> = {
    default: themeColors.text.secondary,
    success: themeColors.status.success,
    error: themeColors.status.danger,
    warning: themeColors.status.warning,
    info: themeColors.status.info,
  };

  const accentColor = variantColorMap[item.variant];

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: defaultSpacing.md,
    padding: defaultSpacing.lg,
    marginBottom: defaultSpacing.sm,
    borderRadius: defaultRadii.lg,
    borderLeftWidth: 3,
    borderLeftColor: accentColor,
    backgroundColor: themeColors.background.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  };

  const titleStyle: TextStyle = {
    fontSize: defaultTypography.sizes.sm.fontSize,
    fontWeight: defaultTypography.weights.semibold,
    color: themeColors.text.primary,
  };

  const descStyle: TextStyle = {
    fontSize: defaultTypography.sizes.xs.fontSize,
    color: themeColors.text.muted,
    marginTop: defaultSpacing['2xs'],
  };

  return (
    <Animated.View style={[containerStyle, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
      <View style={{ flex: 1 }}>
        <Text style={titleStyle}>{item.title}</Text>
        {item.description && <Text style={descStyle}>{item.description}</Text>}
      </View>
      <Pressable onPress={() => onDismiss(item.id)}>
        <Text style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: themeColors.text.muted }}>{'\u{2715}'}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface ToastProviderProps {
  children: React.ReactNode;
  /** Maximum number of visible toasts. @default 5 */
  maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  let counter = useRef(0);

  const toast = useCallback(
    (options: Omit<ToastItem, 'id'> & { id?: string }) => {
      const id = options.id ?? `toast-${++counter.current}`;
      const newToast: ToastItem = {
        id,
        title: options.title,
        description: options.description,
        variant: options.variant ?? 'default',
        duration: options.duration ?? 4000,
      };
      setToasts((prev) => [newToast, ...prev].slice(0, maxToasts));
    },
    [maxToasts],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const overlayStyle: ViewStyle = {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: zIndex.toast,
    pointerEvents: 'box-none',
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <View style={overlayStyle} pointerEvents="box-none">
        {toasts.map((item) => (
          <ToastItemView key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

ToastProvider.displayName = 'ToastProvider';
