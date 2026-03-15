import React, { forwardRef, useMemo, useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import { View, Pressable, Modal, StyleSheet, Dimensions } from 'react-native';
import type { ViewStyle } from 'react-native';
import { defaultSpacing, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<View | null>;
  placement: PopoverPlacement;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(): PopoverContextValue {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error('[Wisp] Popover sub-components must be used within <Popover>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: PopoverPlacement;
}

export interface PopoverTriggerProps {
  children: React.ReactElement;
  style?: ViewStyle;
}

export interface PopoverContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Popover (root)
// ---------------------------------------------------------------------------

export const Popover = forwardRef<View, PopoverProps>(function Popover(
  {
    children,
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    placement = 'bottom',
  },
  ref,
) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isControlled ? controlledOpen : internalOpen;
  const triggerRef = useRef<View>(null);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const ctxValue = useMemo<PopoverContextValue>(
    () => ({ open, setOpen, triggerRef, placement }),
    [open, setOpen, placement],
  );

  return (
    <PopoverContext.Provider value={ctxValue}>
      <View ref={ref}>{children}</View>
    </PopoverContext.Provider>
  );
});

Popover.displayName = 'Popover';

// ---------------------------------------------------------------------------
// PopoverTrigger
// ---------------------------------------------------------------------------

export const PopoverTrigger = forwardRef<View, PopoverTriggerProps>(function PopoverTrigger(
  { children, style: userStyle },
  ref,
) {
  const { open, setOpen, triggerRef } = usePopoverContext();

  return (
    <Pressable
      ref={triggerRef as any}
      onPress={() => setOpen(!open)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      style={userStyle}
    >
      {children}
    </Pressable>
  );
});

PopoverTrigger.displayName = 'PopoverTrigger';

// ---------------------------------------------------------------------------
// PopoverContent
// ---------------------------------------------------------------------------

export const PopoverContent = forwardRef<View, PopoverContentProps>(function PopoverContent(
  { children, style: userStyle },
  ref,
) {
  const { theme } = useTheme();
  const { open, setOpen, triggerRef, placement } = usePopoverContext();
  const themeColors = theme.colors;
  const [triggerLayout, setTriggerLayout] = useState<{
    x: number; y: number; width: number; height: number;
  } | null>(null);
  const contentRef = useRef<View>(null);
  const [contentSize, setContentSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (open && triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        if (typeof x === 'number' && typeof y === 'number') {
          setTriggerLayout({ x, y, width, height });
        }
      });
    } else if (!open) {
      setTriggerLayout(null);
      setContentSize(null);
    }
  }, [open, triggerRef]);

  const contentStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: themeColors.background.raised,
      borderRadius: defaultRadii.lg,
      padding: defaultSpacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
      maxWidth: 320,
    }),
    [themeColors],
  );

  const positionStyle = useMemo<ViewStyle>(() => {
    if (!triggerLayout) return { opacity: 0 };

    const screen = Dimensions.get('window');
    const gap = 8;
    let top: number;
    let left: number;

    if (placement === 'top') {
      top = triggerLayout.y - (contentSize?.height ?? 0) - gap;
      left = triggerLayout.x + triggerLayout.width / 2 - (contentSize?.width ?? 0) / 2;
    } else if (placement === 'bottom') {
      top = triggerLayout.y + triggerLayout.height + gap;
      left = triggerLayout.x + triggerLayout.width / 2 - (contentSize?.width ?? 0) / 2;
    } else if (placement === 'left') {
      top = triggerLayout.y + triggerLayout.height / 2 - (contentSize?.height ?? 0) / 2;
      left = triggerLayout.x - (contentSize?.width ?? 0) - gap;
    } else {
      // right
      top = triggerLayout.y + triggerLayout.height / 2 - (contentSize?.height ?? 0) / 2;
      left = triggerLayout.x + triggerLayout.width + gap;
    }

    // Clamp to screen edges
    const padding = 8;
    if (contentSize) {
      left = Math.max(padding, Math.min(left, screen.width - contentSize.width - padding));
      top = Math.max(padding, Math.min(top, screen.height - contentSize.height - padding));
    }

    // If we don't have contentSize yet, render off-screen to measure
    if (!contentSize) {
      return { position: 'absolute', top: -9999, left: -9999, opacity: 0 };
    }

    return { position: 'absolute', top, left, opacity: 1 };
  }, [triggerLayout, contentSize, placement]);

  if (!open) return null;

  const handleContentLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout;
    if (!contentSize || contentSize.width !== width || contentSize.height !== height) {
      setContentSize({ width, height });
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => setOpen(false)}
      statusBarTranslucent
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          ref={ref}
          onLayout={handleContentLayout}
          style={[contentStyle, positionStyle, userStyle]}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
});

PopoverContent.displayName = 'PopoverContent';
