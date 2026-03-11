import React, { forwardRef, useMemo, useState, useCallback, useRef, createContext, useContext } from 'react';
import { View, Pressable, Animated, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { Collapse } from '../../layouts/collapse';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AccordionType = 'single' | 'multiple';

export interface AccordionProps {
  children: React.ReactNode;
  type?: AccordionType;
  value?: string | string[];
  defaultValue?: string | string[];
  onChange?: (value: string | string[]) => void;
  collapsible?: boolean;
  style?: ViewStyle;
}

export interface AccordionItemProps {
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export interface AccordionTriggerProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export interface AccordionContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AccordionContextValue {
  openValues: string[];
  toggle: (id: string) => void;
  type: AccordionType;
  collapsible: boolean;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext(): AccordionContextValue {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('[Wisp] Accordion sub-components must be used within <Accordion>');
  return ctx;
}

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
  disabled: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function useAccordionItemContext(): AccordionItemContextValue {
  const ctx = useContext(AccordionItemContext);
  if (!ctx) throw new Error('[Wisp] AccordionTrigger/AccordionContent must be used within <AccordionItem>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normaliseValue(val: string | string[] | undefined): string[] {
  if (val === undefined) return [];
  return Array.isArray(val) ? val : [val];
}

// ---------------------------------------------------------------------------
// Accordion (root)
// ---------------------------------------------------------------------------

export const Accordion = forwardRef<View, AccordionProps>(function Accordion(
  {
    children,
    type = 'single',
    value: controlledValue,
    defaultValue,
    onChange,
    collapsible = true,
    style: userStyle,
  },
  ref,
) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string[]>(normaliseValue(defaultValue));
  const openValues = isControlled ? normaliseValue(controlledValue) : internalValue;

  const toggle = useCallback(
    (id: string) => {
      let next: string[];
      if (type === 'single') {
        const isOpen = openValues.includes(id);
        next = isOpen && collapsible ? [] : [id];
      } else {
        const isOpen = openValues.includes(id);
        if (isOpen) {
          if (!collapsible && openValues.length === 1) return;
          next = openValues.filter((v) => v !== id);
        } else {
          next = [...openValues, id];
        }
      }
      if (!isControlled) setInternalValue(next);
      onChange?.(type === 'single' ? (next[0] ?? '') : next);
    },
    [openValues, type, collapsible, isControlled, onChange],
  );

  const ctxValue = useMemo<AccordionContextValue>(
    () => ({ openValues, toggle, type, collapsible }),
    [openValues, toggle, type, collapsible],
  );

  return (
    <AccordionContext.Provider value={ctxValue}>
      <View ref={ref} style={userStyle}>
        {children}
      </View>
    </AccordionContext.Provider>
  );
});

Accordion.displayName = 'Accordion';

// ---------------------------------------------------------------------------
// AccordionItem
// ---------------------------------------------------------------------------

export const AccordionItem = forwardRef<View, AccordionItemProps>(function AccordionItem(
  { children, value, disabled = false, style: userStyle },
  ref,
) {
  const { theme } = useTheme();
  const { openValues } = useAccordionContext();
  const themeColors = theme.colors;
  const isOpen = openValues.includes(value);

  const ctxValue = useMemo<AccordionItemContextValue>(
    () => ({ value, isOpen, disabled }),
    [value, isOpen, disabled],
  );

  const itemStyle = useMemo<ViewStyle>(
    () => ({
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border.subtle,
      opacity: disabled ? 0.4 : 1,
    }),
    [themeColors, disabled],
  );

  return (
    <AccordionItemContext.Provider value={ctxValue}>
      <View ref={ref} style={[itemStyle, userStyle]}>
        {children}
      </View>
    </AccordionItemContext.Provider>
  );
});

AccordionItem.displayName = 'AccordionItem';

// ---------------------------------------------------------------------------
// AccordionTrigger
// ---------------------------------------------------------------------------

export const AccordionTrigger = forwardRef<View, AccordionTriggerProps>(function AccordionTrigger(
  { children, icon, style: userStyle },
  ref,
) {
  const { theme } = useTheme();
  const { toggle } = useAccordionContext();
  const { value, isOpen, disabled } = useAccordionItemContext();
  const themeColors = theme.colors;
  const rotateAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  const isFirstRender = useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const triggerStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: defaultSpacing.lg,
      paddingHorizontal: defaultSpacing.xs,
    }),
    [],
  );

  return (
    <Pressable
      ref={ref}
      onPress={() => !disabled && toggle(value)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      style={[triggerStyle, userStyle]}
    >
      {typeof children === 'string' || typeof children === 'number' ? (
        <RNText style={{ fontSize: 14, fontWeight: '500', color: themeColors.text.primary, flex: 1 } as TextStyle}>{children}</RNText>
      ) : (
        children
      )}
      <Animated.View style={{ transform: [{ rotate }] }}>
        {icon ?? (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Polyline
              points="6 9 12 15 18 9"
              stroke={themeColors.text.secondary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      </Animated.View>
    </Pressable>
  );
});

AccordionTrigger.displayName = 'AccordionTrigger';

// ---------------------------------------------------------------------------
// AccordionContent
// ---------------------------------------------------------------------------

export const AccordionContent = forwardRef<View, AccordionContentProps>(function AccordionContent(
  { children, style: userStyle },
  ref,
) {
  const { isOpen } = useAccordionItemContext();

  return (
    <Collapse open={isOpen}>
      <View ref={ref} style={[{ paddingBottom: defaultSpacing.lg, paddingHorizontal: defaultSpacing.xs }, userStyle]}>
        {children}
      </View>
    </Collapse>
  );
});

AccordionContent.displayName = 'AccordionContent';
