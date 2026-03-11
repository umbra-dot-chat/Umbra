import React, { forwardRef, useMemo, useState, useCallback, useRef, createContext, useContext, useEffect } from 'react';
import { View, Pressable, ScrollView, Animated, Text as RNText, Platform } from 'react-native';
import type { ViewStyle, TextStyle, LayoutChangeEvent } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabsOrientation = 'horizontal' | 'vertical';

export interface TabsProps {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  orientation?: TabsOrientation;
  style?: ViewStyle;
}

export interface TabListProps {
  children: React.ReactNode;
  /** Use a gradient fill for the active indicator. @default false */
  indicatorGradient?: boolean;
  style?: ViewStyle;
}

export interface TabProps {
  children?: React.ReactNode;
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  /** Notification badge count. Renders a small count indicator next to the label. */
  badge?: number;
  style?: ViewStyle;
}

export interface TabPanelProps {
  children?: React.ReactNode;
  value: string;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TabsContextValue {
  activeValue: string;
  onChange: (value: string) => void;
  orientation: TabsOrientation;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('[Wisp] Tab sub-components must be used within <Tabs>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Tabs (root)
// ---------------------------------------------------------------------------

export const Tabs = forwardRef<View, TabsProps>(function Tabs(
  {
    children,
    value: controlledValue,
    defaultValue = '',
    onChange,
    orientation = 'horizontal',
    style: userStyle,
  },
  ref,
) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeValue = isControlled ? controlledValue : internalValue;

  const handleChange = useCallback(
    (v: string) => {
      if (!isControlled) setInternalValue(v);
      onChange?.(v);
    },
    [isControlled, onChange],
  );

  const ctxValue = useMemo<TabsContextValue>(
    () => ({ activeValue, onChange: handleChange, orientation }),
    [activeValue, handleChange, orientation],
  );

  return (
    <TabsContext.Provider value={ctxValue}>
      <View ref={ref} style={userStyle}>
        {children}
      </View>
    </TabsContext.Provider>
  );
});

Tabs.displayName = 'Tabs';

// ---------------------------------------------------------------------------
// TabList
// ---------------------------------------------------------------------------

interface TabLayout {
  x: number;
  width: number;
}

// CSS keyframe injection for gradient indicator shimmer (web only)
let tabGradientKeyframesInjected = false;
function injectTabGradientKeyframes(): void {
  if (tabGradientKeyframesInjected || typeof document === 'undefined') return;
  tabGradientKeyframesInjected = true;
  const sheet = document.createElement('style');
  sheet.id = 'wisp-tab-gradient-indicator';
  sheet.textContent =
    '@keyframes wisp-tab-gradient-shift { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }';
  document.head.appendChild(sheet);
}

export const TabList = forwardRef<View, TabListProps>(function TabList(
  { children, indicatorGradient = false, style: userStyle },
  ref,
) {
  const { theme } = useTheme();
  const { activeValue, orientation } = useTabsContext();
  const themeColors = theme.colors;
  const [tabLayouts, setTabLayouts] = useState<Record<string, TabLayout>>({});
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorW = useRef(new Animated.Value(0)).current;
  const hasMounted = useRef(false);

  const activeLayout = tabLayouts[activeValue];

  useEffect(() => {
    if (indicatorGradient && Platform.OS === 'web') injectTabGradientKeyframes();
  }, [indicatorGradient]);

  useEffect(() => {
    if (!activeLayout) return;
    if (!hasMounted.current) {
      hasMounted.current = true;
      indicatorX.setValue(activeLayout.x);
      indicatorW.setValue(activeLayout.width);
      return;
    }
    Animated.parallel([
      Animated.spring(indicatorX, { toValue: activeLayout.x, tension: 300, friction: 20, useNativeDriver: false }),
      Animated.spring(indicatorW, { toValue: activeLayout.width, tension: 300, friction: 20, useNativeDriver: false }),
    ]).start();
  }, [activeLayout]);

  const registerLayout = useCallback((value: string, layout: TabLayout) => {
    setTabLayouts((prev) => {
      if (prev[value]?.x === layout.x && prev[value]?.width === layout.width) return prev;
      return { ...prev, [value]: layout };
    });
  }, []);

  const isHorizontal = orientation === 'horizontal';

  const listStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: isHorizontal ? 'row' : 'column',
      borderBottomWidth: isHorizontal ? 1 : 0,
      borderLeftWidth: !isHorizontal ? 1 : 0,
      borderColor: themeColors.border.subtle,
      position: 'relative',
    }),
    [isHorizontal, themeColors],
  );

  const childrenWithLayout = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    return React.cloneElement(child as React.ReactElement<any>, {
      _registerLayout: registerLayout,
    });
  });

  // Gradient indicator style (web CSS gradient + animation)
  const gradientIndicatorStyle: any = indicatorGradient && Platform.OS === 'web'
    ? {
        background: 'linear-gradient(90deg, #8B5CF6, #EC4899, #3B82F6, #8B5CF6)',
        backgroundSize: '200% 100%',
        animation: 'wisp-tab-gradient-shift 3s linear infinite',
      }
    : { backgroundColor: themeColors.accent.primary };

  return (
    <View ref={ref} style={[listStyle, userStyle]}>
      {childrenWithLayout}
      {activeLayout && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: -1,
              left: indicatorX,
              width: indicatorW,
              height: 2,
              borderTopLeftRadius: 1,
              borderTopRightRadius: 1,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            },
            gradientIndicatorStyle,
          ]}
        />
      )}
    </View>
  );
});

TabList.displayName = 'TabList';

// ---------------------------------------------------------------------------
// Tab
// ---------------------------------------------------------------------------

export const Tab = forwardRef<View, TabProps & { _registerLayout?: (value: string, layout: TabLayout) => void }>(
  function Tab(
    { children, value, disabled = false, icon, badge, style: userStyle, _registerLayout },
    ref,
  ) {
    const { theme } = useTheme();
    const { activeValue, onChange } = useTabsContext();
    const themeColors = theme.colors;
    const isActive = activeValue === value;

    const handleLayout = useCallback(
      (e: LayoutChangeEvent) => {
        const { x, width } = e.nativeEvent.layout;
        _registerLayout?.(value, { x, width });
      },
      [value, _registerLayout],
    );

    const tabStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.sm,
        paddingVertical: defaultSpacing.md,
        paddingHorizontal: defaultSpacing.lg,
        opacity: disabled ? 0.4 : 1,
      }),
      [disabled],
    );

    const labelStyle = useMemo<TextStyle>(
      () => ({
        fontSize: defaultTypography.sizes.sm.fontSize,
        fontWeight: isActive ? '600' : '400',
        color: isActive ? themeColors.text.primary : themeColors.text.secondary,
      }),
      [isActive, themeColors],
    );

    const badgeStyle = useMemo<ViewStyle>(
      () => ({
        backgroundColor: themeColors.status.danger,
        borderRadius: 99,
        paddingHorizontal: 4,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
      }),
      [themeColors],
    );

    const badgeTextStyle = useMemo<TextStyle>(
      () => ({
        fontSize: 9,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
      }),
      [],
    );

    return (
      <Pressable
        ref={ref}
        onLayout={handleLayout}
        onPress={() => !disabled && onChange(value)}
        disabled={disabled}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive, disabled }}
        style={[tabStyle, userStyle]}
      >
        {icon}
        {children != null && <RNText style={labelStyle}>{children}</RNText>}
        {badge != null && badge > 0 && (
          <View style={badgeStyle}>
            <RNText style={badgeTextStyle}>{badge > 99 ? '99+' : badge}</RNText>
          </View>
        )}
      </Pressable>
    );
  },
);

Tab.displayName = 'Tab';

// ---------------------------------------------------------------------------
// TabPanel
// ---------------------------------------------------------------------------

export const TabPanel = forwardRef<View, TabPanelProps>(function TabPanel(
  { children, value, style: userStyle },
  ref,
) {
  const { activeValue } = useTabsContext();

  if (activeValue !== value) return null;

  return (
    <View ref={ref} accessibilityRole="summary" style={userStyle}>
      {children}
    </View>
  );
});

TabPanel.displayName = 'TabPanel';
