import React, { forwardRef, useMemo, useState, useCallback, useRef, createContext, useContext } from 'react';
import { View, Pressable, Modal, StyleSheet } from 'react-native';
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
  const { open, setOpen } = usePopoverContext();
  const themeColors = theme.colors;

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

  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => setOpen(false)}
      statusBarTranslucent
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Pressable onPress={(e) => e.stopPropagation()} ref={ref} style={[contentStyle, userStyle]}>
            {children}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
});

PopoverContent.displayName = 'PopoverContent';
