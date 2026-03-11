import React, { forwardRef, useMemo, useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import { View, Pressable, Modal, ScrollView, StyleSheet, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle, LayoutRectangle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerLayout: LayoutRectangle | null;
  setTriggerLayout: (layout: LayoutRectangle | null) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext(): DropdownMenuContextValue {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) throw new Error('[Wisp] DropdownMenu sub-components must be used within <DropdownMenu>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Explicit trigger position (x, y, width, height in window coordinates). When provided, skips auto-measurement. */
  anchorLayout?: { x: number; y: number; width: number; height: number } | null;
}

export interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Alignment relative to trigger: 'start' (left-aligned) or 'end' (right-aligned). Default: 'start'. */
  align?: 'start' | 'end';
}

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  danger?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export interface DropdownMenuSeparatorProps {
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// DropdownMenu (root)
// ---------------------------------------------------------------------------

export const DropdownMenu = forwardRef<View, DropdownMenuProps>(function DropdownMenu(
  { children, open: controlledOpen, defaultOpen = false, onOpenChange, anchorLayout },
  ref,
) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isControlled ? controlledOpen : internalOpen;
  const [triggerLayout, setTriggerLayout] = useState<LayoutRectangle | null>(null);
  const rootRef = useRef<View>(null);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  // Use explicit anchorLayout when provided
  const effectiveLayout = anchorLayout ?? triggerLayout;

  // Auto-measure root when open transitions to true (fallback for controlled mode without DropdownMenuTrigger or anchorLayout)
  useEffect(() => {
    if (open && !anchorLayout && !triggerLayout && rootRef.current) {
      rootRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          setTriggerLayout({ x, y, width, height });
        }
      });
    }
    if (!open && !anchorLayout) {
      setTriggerLayout(null);
    }
  }, [open, anchorLayout]);

  const ctxValue = useMemo<DropdownMenuContextValue>(
    () => ({ open, setOpen, triggerLayout: effectiveLayout, setTriggerLayout }),
    [open, setOpen, effectiveLayout],
  );

  return (
    <DropdownMenuContext.Provider value={ctxValue}>
      <View
        ref={(node) => {
          (rootRef as React.MutableRefObject<View | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<View | null>).current = node;
        }}
      >
        {children}
      </View>
    </DropdownMenuContext.Provider>
  );
});

DropdownMenu.displayName = 'DropdownMenu';

// ---------------------------------------------------------------------------
// DropdownMenuTrigger
// ---------------------------------------------------------------------------

export const DropdownMenuTrigger = forwardRef<View, DropdownMenuTriggerProps>(function DropdownMenuTrigger(
  { children, style: userStyle },
  ref,
) {
  const { open, setOpen, setTriggerLayout } = useDropdownMenuContext();
  const triggerRef = useRef<View>(null);

  const handlePress = useCallback(() => {
    // Measure trigger position before opening
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height });
      setOpen(!open);
    });
  }, [open, setOpen, setTriggerLayout]);

  return (
    <Pressable
      ref={(node) => {
        // Forward both refs
        (triggerRef as React.MutableRefObject<View | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<View | null>).current = node;
      }}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      style={userStyle}
    >
      {children}
    </Pressable>
  );
});

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

// ---------------------------------------------------------------------------
// DropdownMenuContent
// ---------------------------------------------------------------------------

export const DropdownMenuContent = forwardRef<View, DropdownMenuContentProps>(function DropdownMenuContent(
  { children, style: userStyle, align = 'start' },
  ref,
) {
  const { theme } = useTheme();
  const { open, setOpen, triggerLayout } = useDropdownMenuContext();
  const themeColors = theme.colors;

  const contentStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: themeColors.background.raised,
      borderRadius: defaultRadii.lg,
      paddingVertical: defaultSpacing.sm,
      minWidth: 200,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 6,
    }),
    [themeColors],
  );

  // Calculate position based on trigger layout
  const positionStyle = useMemo<ViewStyle>(() => {
    if (!triggerLayout) {
      return { position: 'absolute', top: 8, left: 8 };
    }

    const style: ViewStyle = {
      position: 'absolute',
      top: triggerLayout.y + triggerLayout.height + 4,
    };

    if (align === 'end') {
      // Right-align: dropdown right edge aligns with trigger right edge
      style.left = triggerLayout.x + triggerLayout.width - 220;
    } else {
      // Left-align: dropdown left edge aligns with trigger left edge
      style.left = triggerLayout.x;
    }

    // Match trigger width when wider than minWidth
    if (triggerLayout.width > 200) {
      style.width = triggerLayout.width;
    }

    return style;
  }, [triggerLayout, align]);

  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={() => setOpen(false)}
      statusBarTranslucent
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)}>
        <View style={positionStyle}>
          <Pressable onPress={(e) => e.stopPropagation()} ref={ref} style={[contentStyle, userStyle]}>
            {children}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
});

DropdownMenuContent.displayName = 'DropdownMenuContent';

// ---------------------------------------------------------------------------
// DropdownMenuItem
// ---------------------------------------------------------------------------

export const DropdownMenuItem = forwardRef<View, DropdownMenuItemProps>(function DropdownMenuItem(
  { children, onSelect, disabled = false, danger = false, icon, style: userStyle },
  ref,
) {
  const { theme } = useTheme();
  const { setOpen } = useDropdownMenuContext();
  const themeColors = theme.colors;

  const handlePress = useCallback(() => {
    if (disabled) return;
    onSelect?.();
    setOpen(false);
  }, [disabled, onSelect, setOpen]);

  const textColor = danger ? themeColors.status.danger : themeColors.text.onRaised;

  const itemStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: defaultSpacing.sm,
    paddingVertical: defaultSpacing.sm,
    paddingHorizontal: defaultSpacing.md,
    borderRadius: defaultRadii.sm,
    marginHorizontal: defaultSpacing.xs,
    opacity: disabled ? 0.4 : 1,
  };

  return (
    <Pressable
      ref={ref}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="menuitem"
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        itemStyle,
        (pressed || hovered)
          ? {
              backgroundColor: danger
                ? themeColors.status.danger
                : themeColors.accent.highlight,
            }
          : undefined,
        userStyle,
      ]}
    >
      {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => {
        const isHighlighted = pressed || hovered;
        const activeTextColor = danger && isHighlighted ? '#fff' : textColor;
        return (
          <>
            {icon && (
              <View style={{ flexShrink: 0, opacity: danger && !isHighlighted ? 0.9 : 1 }}>
                {React.isValidElement(icon)
                  ? React.cloneElement(icon as React.ReactElement<{ color?: string }>, {
                      color: activeTextColor,
                    })
                  : icon}
              </View>
            )}
            <RNText
              style={
                {
                  fontSize: defaultTypography.sizes.sm.fontSize,
                  color: activeTextColor,
                  flex: 1,
                } as TextStyle
              }
            >
              {children}
            </RNText>
          </>
        );
      }}
    </Pressable>
  );
});

DropdownMenuItem.displayName = 'DropdownMenuItem';

// ---------------------------------------------------------------------------
// DropdownMenuSeparator
// ---------------------------------------------------------------------------

export const DropdownMenuSeparator = forwardRef<View, DropdownMenuSeparatorProps>(
  function DropdownMenuSeparator({ style: userStyle }, ref) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    return (
      <View
        ref={ref}
        style={[
          { height: 1, backgroundColor: themeColors.border.subtle, marginVertical: defaultSpacing.xs, marginHorizontal: defaultSpacing.sm },
          userStyle,
        ]}
      />
    );
  },
);

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';
