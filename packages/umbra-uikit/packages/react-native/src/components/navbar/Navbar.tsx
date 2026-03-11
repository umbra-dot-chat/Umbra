/**
 * @module components/navbar
 * @description React Native Navbar for the Wisp design system.
 *
 * Renders a horizontal navigation bar with brand, content, and item slots.
 * Variants: solid, transparent, glass (glass uses semi-transparent bg on RN).
 */

import React, { forwardRef, createContext, useContext, useMemo } from 'react';
import { View, Pressable, Text } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { NavbarVariant } from '@coexist/wisp-core/types/Navbar.types';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface NavbarContextValue {
  variant: NavbarVariant;
}

const NavbarContext = createContext<NavbarContextValue>({ variant: 'solid' });

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export interface NavbarProps extends ViewProps {
  /** Visual variant. @default 'solid' */
  variant?: NavbarVariant;
  /** Navbar height in px. @default 56 */
  height?: number;
  children?: React.ReactNode;
}

export const Navbar = forwardRef<View, NavbarProps>(
  function Navbar(
    { variant = 'solid', height = 56, children, style: userStyle, ...rest },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const containerStyle = useMemo<ViewStyle>(() => {
      const base: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        height,
        paddingHorizontal: defaultSpacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: themeColors.border.subtle,
      };

      switch (variant) {
        case 'glass':
          return {
            ...base,
            backgroundColor: `${themeColors.background.surface}CC`,
          };
        case 'transparent':
          return {
            ...base,
            backgroundColor: 'transparent',
            borderBottomWidth: 0,
          };
        case 'solid':
        default:
          return {
            ...base,
            backgroundColor: themeColors.background.surface,
          };
      }
    }, [variant, height, themeColors]);

    return (
      <NavbarContext.Provider value={{ variant }}>
        <View ref={ref} style={[containerStyle, userStyle]} {...rest}>
          {children}
        </View>
      </NavbarContext.Provider>
    );
  },
);

Navbar.displayName = 'Navbar';

// ---------------------------------------------------------------------------
// NavbarBrand
// ---------------------------------------------------------------------------

export interface NavbarBrandProps extends ViewProps {
  children?: React.ReactNode;
}

export const NavbarBrand = forwardRef<View, NavbarBrandProps>(
  function NavbarBrand({ children, style: userStyle, ...rest }, ref) {
    const brandStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
      flexShrink: 0,
    }), []);

    return (
      <View ref={ref} style={[brandStyle, userStyle]} {...rest}>
        {children}
      </View>
    );
  },
);

NavbarBrand.displayName = 'NavbarBrand';

// ---------------------------------------------------------------------------
// NavbarContent
// ---------------------------------------------------------------------------

export interface NavbarContentProps extends ViewProps {
  /** Alignment of items within the content area. @default 'end' */
  align?: 'start' | 'center' | 'end';
  children?: React.ReactNode;
}

export const NavbarContent = forwardRef<View, NavbarContentProps>(
  function NavbarContent({ align = 'end', children, style: userStyle, ...rest }, ref) {
    const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end' } as const;

    const contentStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.xs,
      flex: 1,
      justifyContent: justifyMap[align],
    }), [align]);

    return (
      <View ref={ref} style={[contentStyle, userStyle]} {...rest}>
        {children}
      </View>
    );
  },
);

NavbarContent.displayName = 'NavbarContent';

// ---------------------------------------------------------------------------
// NavbarItem
// ---------------------------------------------------------------------------

export interface NavbarItemProps extends ViewProps {
  /** Highlights this item as the active/current route. @default false */
  active?: boolean;
  /** Called when the item is pressed. */
  onPress?: () => void;
  children?: React.ReactNode;
}

export const NavbarItem = forwardRef<View, NavbarItemProps>(
  function NavbarItem({ active = false, onPress, children, style: userStyle, ...rest }, ref) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const { variant } = useContext(NavbarContext);
    const isSolid = variant === 'solid';

    const itemStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
      borderRadius: defaultRadii.md,
    }), []);

    const textStyle = useMemo<TextStyle>(() => {
      const textColor = isSolid ? themeColors.text.onRaised : themeColors.text.primary;
      const mutedColor = isSolid ? themeColors.text.onRaisedSecondary : themeColors.text.secondary;

      return {
        fontSize: defaultTypography.sizes.sm.fontSize,
        fontWeight: active ? '600' : '400',
        color: active ? textColor : mutedColor,
      };
    }, [active, isSolid, themeColors]);

    const content = typeof children === 'string' ? (
      <Text style={textStyle}>{children}</Text>
    ) : (
      children
    );

    if (onPress) {
      return (
        <Pressable ref={ref as any} onPress={onPress} style={[itemStyle, userStyle]} {...rest}>
          {content}
        </Pressable>
      );
    }

    return (
      <View ref={ref} style={[itemStyle, userStyle]} {...rest}>
        {content}
      </View>
    );
  },
);

NavbarItem.displayName = 'NavbarItem';
