/**
 * @module ContextMenu
 */
import React, { forwardRef, useMemo, useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import type {
  ContextMenuProps,
  ContextMenuTriggerProps,
  ContextMenuContentProps,
  ContextMenuItemProps,
  ContextMenuSeparatorProps,
} from '@coexist/wisp-core/types/ContextMenu.types';
import {
  buildContextMenuContentStyle,
  buildContextMenuItemStyle,
  buildContextMenuShortcutStyle,
  buildContextMenuSeparatorStyle,
} from '@coexist/wisp-core/styles/ContextMenu.styles';
import { useTheme } from '../../providers';
import { Text } from '../../primitives/text';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ContextMenuContextValue {
  open: boolean;
  position: { x: number; y: number };
  openMenu: (x: number, y: number) => void;
  closeMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue>({
  open: false,
  position: { x: 0, y: 0 },
  openMenu: () => {},
  closeMenu: () => {},
});

// ---------------------------------------------------------------------------
// ContextMenu (provider)
// ---------------------------------------------------------------------------

export function ContextMenu({ children }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const openMenu = useCallback((x: number, y: number) => {
    setPosition({ x, y });
    setOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const ctx = useMemo(
    () => ({ open, position, openMenu, closeMenu }),
    [open, position, openMenu, closeMenu],
  );

  return (
    <ContextMenuContext.Provider value={ctx}>
      {children}
    </ContextMenuContext.Provider>
  );
}
ContextMenu.displayName = 'ContextMenu';

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

export const ContextMenuTrigger = forwardRef<HTMLDivElement, ContextMenuTriggerProps>(
  function ContextMenuTrigger({ children, style: userStyle, ...rest }, ref) {
    const { openMenu } = useContext(ContextMenuContext);

    const handleContextMenu = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        openMenu(e.clientX, e.clientY);
      },
      [openMenu],
    );

    return (
      <div ref={ref} onContextMenu={handleContextMenu} style={userStyle} {...rest}>
        {children}
      </div>
    );
  },
);
ContextMenuTrigger.displayName = 'ContextMenuTrigger';

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export const ContextMenuContent = forwardRef<HTMLDivElement, ContextMenuContentProps>(
  function ContextMenuContent({ children, style: userStyle, className, ...rest }, ref) {
    const { theme } = useTheme();
  const themeColors = theme.colors;
    const { open, position, closeMenu } = useContext(ContextMenuContext);
    const contentRef = useRef<HTMLDivElement | null>(null);

    // Close on click outside or Escape
    useEffect(() => {
      if (!open) return;

      const handleClick = (e: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
          closeMenu();
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeMenu();
      };

      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClick);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [open, closeMenu]);

    const contentStyle = useMemo(
      () => buildContextMenuContentStyle(theme),
      [theme],
    );

    if (!open) return null;

    return createPortal(
      <div
        ref={(node) => {
          contentRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        role="menu"
        style={{
          ...contentStyle,
          left: position.x,
          top: position.y,
          ...userStyle,
        }}
        className={className}
        {...rest}
      >
        {children}
      </div>,
      document.body,
    );
  },
);
ContextMenuContent.displayName = 'ContextMenuContent';

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export const ContextMenuItem = forwardRef<HTMLDivElement, ContextMenuItemProps>(
  function ContextMenuItem(
    {
      onSelect,
      disabled = false,
      destructive = false,
      icon,
      shortcut,
      children,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const { closeMenu } = useContext(ContextMenuContext);
    const [hovered, setHovered] = useState(false);

    const itemStyle = useMemo(
      () => buildContextMenuItemStyle(destructive, disabled, theme),
      [destructive, disabled, theme],
    );

    const shortcutStyle = useMemo(
      () => buildContextMenuShortcutStyle(theme),
      [theme],
    );

    const handleClick = useCallback(() => {
      if (disabled) return;
      onSelect?.();
      closeMenu();
    }, [disabled, onSelect, closeMenu]);

    return (
      <div
        ref={ref}
        role="menuitem"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          ...itemStyle,
          ...(hovered && !disabled ? { backgroundColor: themeColors.accent.highlightRaised } : {}),
          ...userStyle,
        }}
        className={className}
        {...rest}
      >
        {icon && <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>}
        <Text style={{ flex: 1 }}>{children}</Text>
        {shortcut && <Text style={shortcutStyle}>{shortcut}</Text>}
      </div>
    );
  },
);
ContextMenuItem.displayName = 'ContextMenuItem';

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

export const ContextMenuSeparator = forwardRef<HTMLDivElement, ContextMenuSeparatorProps>(
  function ContextMenuSeparator({ style: userStyle, className, ...rest }, ref) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const separatorStyle = useMemo(
      () => buildContextMenuSeparatorStyle(theme),
      [theme],
    );

    return (
      <div ref={ref} role="separator" style={{ ...separatorStyle, ...userStyle }} className={className} {...rest} />
    );
  },
);
ContextMenuSeparator.displayName = 'ContextMenuSeparator';
