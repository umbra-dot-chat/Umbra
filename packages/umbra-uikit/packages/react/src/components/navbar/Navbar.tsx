/**
 * @module Navbar
 */
import React, { forwardRef, useMemo, createContext, useContext } from 'react';
import type {
  NavbarProps,
  NavbarBrandProps,
  NavbarContentProps,
  NavbarItemProps,
  NavbarVariant,
} from '@coexist/wisp-core/types/Navbar.types';
import {
  buildNavbarStyle,
  buildNavbarBrandStyle,
  buildNavbarContentStyle,
  buildNavbarItemStyle,
} from '@coexist/wisp-core/styles/Navbar.styles';
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

export const Navbar = forwardRef<HTMLElement, NavbarProps>(
  function Navbar(
    {
      variant = 'solid',
      sticky = false,
      height = 56,
      children,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
  const themeColors = theme.colors;

    const navStyle = useMemo(
      () => buildNavbarStyle(variant, sticky, height, theme),
      [variant, sticky, height, theme],
    );

    const ctx = useMemo(() => ({ variant }), [variant, theme]);

    return (
      <NavbarContext.Provider value={ctx}>
        <nav ref={ref} style={{ ...navStyle, ...userStyle }} className={className} {...rest}>
          {children}
        </nav>
      </NavbarContext.Provider>
    );
  },
);
Navbar.displayName = 'Navbar';

// ---------------------------------------------------------------------------
// NavbarBrand
// ---------------------------------------------------------------------------

export const NavbarBrand = forwardRef<HTMLDivElement, NavbarBrandProps>(
  function NavbarBrand({ children, style: userStyle, className, ...rest }, ref) {
    const { theme } = useTheme();
    const brandStyle = useMemo(() => buildNavbarBrandStyle(theme), [theme]);

    return (
      <div ref={ref} style={{ ...brandStyle, ...userStyle }} className={className} {...rest}>
        {children}
      </div>
    );
  },
);
NavbarBrand.displayName = 'NavbarBrand';

// ---------------------------------------------------------------------------
// NavbarContent
// ---------------------------------------------------------------------------

export const NavbarContent = forwardRef<HTMLDivElement, NavbarContentProps>(
  function NavbarContent(
    { align = 'end', children, style: userStyle, className, ...rest },
    ref,
  ) {
    const { theme } = useTheme();
    const contentStyle = useMemo(() => buildNavbarContentStyle(align, theme), [align, theme]);

    return (
      <div ref={ref} style={{ ...contentStyle, ...userStyle }} className={className} {...rest}>
        {children}
      </div>
    );
  },
);
NavbarContent.displayName = 'NavbarContent';

// ---------------------------------------------------------------------------
// NavbarItem
// ---------------------------------------------------------------------------

export const NavbarItem = forwardRef<HTMLDivElement, NavbarItemProps>(
  function NavbarItem(
    { active = false, children, style: userStyle, className, ...rest },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const { variant } = useContext(NavbarContext);
    const isSolid = variant === 'solid';

    const itemStyle = useMemo(
      () => buildNavbarItemStyle(active, theme, isSolid),
      [active, theme, isSolid],
    );

    return (
      <div ref={ref} style={{ ...itemStyle, ...userStyle }} className={className} {...rest}>
        {children}
      </div>
    );
  },
);
NavbarItem.displayName = 'NavbarItem';
