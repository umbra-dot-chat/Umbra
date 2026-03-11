import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../providers";
import { Text } from "../../primitives/text";
import type {
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuSeparatorProps,
  DropdownMenuContextValue,
} from "@coexist/wisp-core/types/DropdownMenu.types";
import {
  buildContentStyle,
  buildItemStyle,
  buildItemIconStyle,
  buildShortcutStyle,
  buildSeparatorStyle,
} from "@coexist/wisp-core/styles/DropdownMenu.styles";

/** Internal React context that shares open state and refs between compound components. */
const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

/**
 * Reads the nearest {@link DropdownMenuContextValue} or throws if called
 * outside a `<DropdownMenu>` provider.
 *
 * @returns The current dropdown menu context value.
 * @throws If no `<DropdownMenu>` ancestor is found.
 */
function useDropdownMenuContext(): DropdownMenuContextValue {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) {
    throw new Error(
      "[Wisp] DropdownMenu compound components must be used within <DropdownMenu>.",
    );
  }
  return ctx;
}

/**
 * DropdownMenu -- Compound-component root that manages open/close state for a dropdown menu.
 *
 * @remarks
 * - Supports both controlled (`open` / `onOpenChange`) and uncontrolled (`defaultOpen`) modes.
 * - Provides context consumed by {@link DropdownMenuTrigger}, {@link DropdownMenuContent},
 *   {@link DropdownMenuItem}, and {@link DropdownMenuSeparator}.
 * - Keyboard navigation (Arrow keys, Escape, Enter/Space) is handled in {@link DropdownMenuContent}.
 *
 * @module primitives/dropdown-menu
 * @example
 * ```tsx
 * <DropdownMenu>
 *   <DropdownMenuTrigger>Open</DropdownMenuTrigger>
 *   <DropdownMenuContent>
 *     <DropdownMenuItem onSelect={handleEdit}>Edit</DropdownMenuItem>
 *     <DropdownMenuSeparator />
 *     <DropdownMenuItem onSelect={handleDelete} danger>Delete</DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 * ```
 */
export function DropdownMenu({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: DropdownMenuProps): React.JSX.Element {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const triggerRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) { setUncontrolledOpen(nextOpen); }
      onOpenChange?.(nextOpen);
      if (!nextOpen) { setActiveIndex(-1); }
    },
    [isControlled, onOpenChange],
  );

  const contextValue = useMemo<DropdownMenuContextValue>(
    () => ({ open, onOpenChange: handleOpenChange, triggerRef, activeIndex, setActiveIndex }),
    [open, handleOpenChange, activeIndex],
  );

  return (
    <DropdownMenuContext.Provider value={contextValue}>
      {children}
    </DropdownMenuContext.Provider>
  );
}
DropdownMenu.displayName = "DropdownMenu";

/**
 * DropdownMenuTrigger -- Button (or custom element via `asChild`) that toggles the dropdown.
 *
 * @remarks
 * Sets `aria-haspopup="menu"` and `aria-expanded` on the trigger element.
 * When `asChild` is `true`, the trigger props are merged onto the provided child element
 * rather than wrapping it in a `<button>`.
 */
export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  function DropdownMenuTrigger({ children, asChild = false, style, className }, ref) {
    const { open, onOpenChange, triggerRef } = useDropdownMenuContext();
    const handleClick = useCallback(() => { onOpenChange(!open); }, [open, onOpenChange]);
    const setTriggerRef = useCallback(
      (node: HTMLElement | null) => {
        (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
        if (typeof ref === "function") { ref(node as HTMLButtonElement | null); }
        else if (ref) { (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node as HTMLButtonElement | null; }
      },
      [triggerRef, ref],
    );
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        ref: setTriggerRef, onClick: handleClick, "aria-haspopup": "menu", "aria-expanded": open,
      });
    }
    return (
      <button ref={setTriggerRef as React.Ref<HTMLButtonElement>} type="button" className={className}
        style={{ background: "none", border: "none", padding: 0, margin: 0, cursor: "pointer", color: "inherit", ...style }}
        onClick={handleClick} aria-haspopup="menu" aria-expanded={open}>
        {children}
      </button>
    );
  },
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

/**
 * DropdownMenuContent -- Portal-rendered menu panel positioned relative to the trigger.
 *
 * @remarks
 * - Portaled to `document.body` so it escapes parent overflow/stacking contexts.
 * - Supports `align` (`start` | `center` | `end`) and `side` (`top` | `bottom`) positioning.
 * - Handles keyboard navigation (ArrowUp/Down, Enter, Escape, Tab).
 * - Auto-focuses itself on open for immediate keyboard interaction.
 * - Closes on outside click.
 */
export const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  function DropdownMenuContent(
    { children, align = "start", side = "bottom", sideOffset = 4, variant = "solid", className, style: userStyle }, ref,
  ) {
    const { open, onOpenChange, triggerRef, activeIndex, setActiveIndex } = useDropdownMenuContext();
    const { theme } = useTheme();
  const themeColors = theme.colors;
    const contentRef = useRef<HTMLDivElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLDivElement>) || contentRef;
    const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const getItems = useCallback((): HTMLElement[] => {
      const container = resolvedRef.current ?? contentRef.current;
      if (!container) return [];
      return Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'));
    }, [resolvedRef]);

    useEffect(() => {
      if (!open || !triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      let top = 0; let left = rect.left;
      if (side === "bottom") { top = rect.bottom + sideOffset; } else { top = rect.top - sideOffset; }
      if (align === "center") { left = rect.left + rect.width / 2; } else if (align === "end") { left = rect.right; }
      setPosition({ top, left });
    }, [open, triggerRef, side, sideOffset, align]);

    useEffect(() => {
      if (!open) return;
      const handleClickOutside = (e: MouseEvent) => {
        const container = resolvedRef.current ?? contentRef.current;
        if (container && !container.contains(e.target as Node) && triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
          onOpenChange(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, onOpenChange, triggerRef, resolvedRef]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      const items = getItems(); const count = items.length;
      if (count === 0) return;
      switch (e.key) {
        case "ArrowDown": { e.preventDefault(); const next = activeIndex < count - 1 ? activeIndex + 1 : 0; setActiveIndex(next); items[next]?.focus(); break; }
        case "ArrowUp": { e.preventDefault(); const prev = activeIndex > 0 ? activeIndex - 1 : count - 1; setActiveIndex(prev); items[prev]?.focus(); break; }
        case "Escape": e.preventDefault(); onOpenChange(false); triggerRef.current?.focus(); break;
        case "Enter": case " ": { e.preventDefault(); if (activeIndex >= 0 && activeIndex < count) { items[activeIndex]?.click(); } break; }
        case "Tab": e.preventDefault(); onOpenChange(false); break;
        default: break;
      }
    }, [activeIndex, setActiveIndex, getItems, onOpenChange, triggerRef]);

    useEffect(() => {
      if (!open) return;
      const timer = setTimeout(() => { const container = resolvedRef.current ?? contentRef.current; if (container) container.focus(); }, 0);
      return () => clearTimeout(timer);
    }, [open, resolvedRef]);

    const contentStyle = useMemo(() => buildContentStyle(theme, variant), [theme, variant]);
    const alignTransform = useMemo(() => {
      if (align === "center") return "translateX(-50%)";
      if (align === "end") return "translateX(-100%)";
      return undefined;
    }, [align]);

    if (!open) return null;
    const portalContent = (
      <div ref={resolvedRef as React.Ref<HTMLDivElement>} role="menu" aria-orientation="vertical" tabIndex={-1}
        className={className} style={{ ...contentStyle, top: position.top, left: position.left, transform: alignTransform, ...userStyle }}
        onKeyDown={handleKeyDown}>{children}</div>
    );
    if (typeof document === "undefined") return portalContent;
    return createPortal(portalContent, document.body);
  },
);
DropdownMenuContent.displayName = "DropdownMenuContent";

/**
 * DropdownMenuItem -- An individual selectable item within the dropdown menu.
 *
 * @remarks
 * - Calls `onSelect` and closes the menu when clicked (unless disabled).
 * - Supports an optional leading `icon` and trailing keyboard `shortcut` label.
 * - `danger` variant uses the theme danger color for destructive actions.
 * - Participates in keyboard focus management via `activeIndex`.
 */
export const DropdownMenuItem = forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  function DropdownMenuItem(
    { children, onSelect, disabled = false, danger = false, icon, shortcut, style: userStyle, className }, ref,
  ) {
    const { onOpenChange, activeIndex, setActiveIndex } = useDropdownMenuContext();
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const itemRef = useRef<HTMLDivElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLDivElement>) || itemRef;
    const [hovered, setHovered] = useState(false);
    const [itemIndex, setItemIndex] = useState(-1);

    useEffect(() => {
      const el = resolvedRef.current ?? itemRef.current;
      if (!el) return;
      const parent = el.parentElement;
      if (!parent) return;
      const allItems = Array.from(parent.querySelectorAll<HTMLElement>('[role="menuitem"]'));
      setItemIndex(allItems.indexOf(el));
    });

    const isActive = hovered || (itemIndex >= 0 && itemIndex === activeIndex);
    const itemStyle = useMemo(() => buildItemStyle({ theme, disabled, danger, isActive }), [theme, disabled, danger, isActive]);
    const iconStyleVal = useMemo(() => buildItemIconStyle(), []);
    const shortcutStyleVal = useMemo(() => buildShortcutStyle(theme), [theme]);

    const handleClick = useCallback(() => { if (disabled) return; onSelect?.(); onOpenChange(false); }, [disabled, onSelect, onOpenChange]);
    const handleMouseEnter = useCallback(() => { if (!disabled) { setHovered(true); setActiveIndex(itemIndex); } }, [disabled, itemIndex, setActiveIndex]);
    const handleMouseLeave = useCallback(() => { setHovered(false); }, []);

    return (
      <div ref={resolvedRef as React.Ref<HTMLDivElement>} role="menuitem" tabIndex={disabled ? undefined : -1}
        aria-disabled={disabled || undefined} className={className} style={{ ...itemStyle, ...userStyle }}
        onClick={handleClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {icon && <span style={iconStyleVal}>{icon}</span>}
        <Text style={{ flex: 1 }}>{children}</Text>
        {shortcut && <Text style={shortcutStyleVal}>{shortcut}</Text>}
      </div>
    );
  },
);
DropdownMenuItem.displayName = "DropdownMenuItem";

/**
 * DropdownMenuSeparator -- A visual divider between groups of menu items.
 *
 * @remarks
 * Renders a `<div role="separator">` with a 1px themed border.
 */
export const DropdownMenuSeparator = forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  function DropdownMenuSeparator({ style: userStyle, className }, ref) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const separatorStyle = useMemo(() => buildSeparatorStyle(theme), [theme]);
    return (<div ref={ref} role="separator" className={className} style={{ ...separatorStyle, ...userStyle }} />);
  },
);
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";
