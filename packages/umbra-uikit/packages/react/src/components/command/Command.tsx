/**
 * Command -- Compound component for a Cmd+K command palette.
 *
 * @remarks
 * - Renders in a React portal over a dimmed backdrop.
 * - Built-in search filtering with keyboard navigation.
 * - Supports groups, shortcuts, descriptions, icons, and loading state.
 * - Traps keyboard focus within the panel while open.
 * - Compound components: Command, CommandInput, CommandList, CommandGroup,
 *   CommandItem, CommandSeparator, CommandEmpty.
 *
 * @module primitives/command
 * @example
 * ```tsx
 * <Command open={isOpen} onOpenChange={setIsOpen}>
 *   <CommandInput placeholder="Type a command..." />
 *   <CommandList>
 *     <CommandGroup heading="Actions">
 *       <CommandItem value="create">Create new file</CommandItem>
 *       <CommandItem value="delete">Delete file</CommandItem>
 *     </CommandGroup>
 *     <CommandEmpty />
 *   </CommandList>
 * </Command>
 * ```
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import { useTheme } from '../../providers';
import { Spinner } from '../../primitives/spinner';
import { Text } from '../../primitives/text';
import { Kbd } from '../../primitives/kbd';
import type {
  CommandProps,
  CommandInputProps,
  CommandListProps,
  CommandGroupProps,
  CommandItemProps,
  CommandSeparatorProps,
  CommandEmptyProps,
  CommandContextValue,
  CommandItemEntry,
} from '@coexist/wisp-core/types/Command.types';
import {
  buildOverlayStyle,
  buildPanelStyle,
  buildInputWrapperStyle,
  buildInputStyle,
  buildInputIconStyle,
  buildListStyle,
  buildGroupHeadingStyle,
  buildItemStyle,
  buildItemIconStyle,
  buildItemLabelStyle,
  buildItemDescriptionStyle,
  buildItemShortcutStyle,
  buildSeparatorStyle,
  buildEmptyStyle,
  buildLoadingStyle,
} from '@coexist/wisp-core/styles/Command.styles';

// ---------------------------------------------------------------------------
// Animation injection
// ---------------------------------------------------------------------------

let animationInjected = false;

function injectCommandAnimation() {
  if (animationInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = [
    '@keyframes wisp-command-overlay-in { from { opacity: 0; } to { opacity: 1; } }',
    '@keyframes wisp-command-panel-in { from { opacity: 0; transform: scale(0.96) translateY(-8px); } to { opacity: 1; transform: scale(1) translateY(0); } }',
  ].join('\n');
  document.head.appendChild(style);
  animationInjected = true;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CommandContext = createContext<CommandContextValue | null>(null);

function useCommandContext(): CommandContextValue {
  const ctx = useContext(CommandContext);
  if (!ctx) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    throw new Error('[Wisp] Command compound components must be used within <Command>.');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Default filter
// ---------------------------------------------------------------------------

function defaultFilter(value: string, search: string, keywords?: string[]): boolean {
  const lower = search.toLowerCase();
  if (value.toLowerCase().includes(lower)) return true;
  if (keywords?.some((kw) => kw.toLowerCase().includes(lower))) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Command (Root)
// ---------------------------------------------------------------------------

export function Command({
  open,
  onOpenChange,
  onSelect,
  size = 'md',
  filter,
  loop = true,
  loading = false,
  closeOnSelect = true,
  closeOnEscape = true,
  variant = 'solid',
  className,
  style: userStyle,
  children,
}: CommandProps): React.JSX.Element | null {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const panelRef = useRef<HTMLDivElement>(null);
  const itemRegistryRef = useRef<Map<string, CommandItemEntry>>(new Map());
  const [search, setSearch] = useState('');
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  useEffect(() => {
    injectCommandAnimation();
  }, []);

  // Reset state when opened/closed
  useEffect(() => {
    if (open) {
      setSearch('');
      setActiveItemId(null);
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (search) {
          setSearch('');
        } else {
          onOpenChange(false);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closeOnEscape, onOpenChange, search]);

  const registerItem = useCallback((entry: CommandItemEntry) => {
    itemRegistryRef.current.set(entry.id, entry);
  }, []);

  const unregisterItem = useCallback((id: string) => {
    itemRegistryRef.current.delete(id);
  }, []);

  const getVisibleItemIds = useCallback((): string[] => {
    if (!panelRef.current) return [];
    const elements = panelRef.current.querySelectorAll<HTMLElement>('[data-command-item]:not([data-disabled="true"])');
    return Array.from(elements).map((el) => el.getAttribute('data-command-item-id') || '');
  }, []);

  const handleItemSelect = useCallback(
    (value: string) => {
      onSelect?.(value);
      if (closeOnSelect) {
        onOpenChange(false);
      }
    },
    [onSelect, closeOnSelect, onOpenChange],
  );

  const contextValue = useMemo<CommandContextValue>(
    () => ({
      search,
      onSearchChange: setSearch,
      activeItemId,
      setActiveItemId,
      onItemSelect: handleItemSelect,
      registerItem,
      unregisterItem,
      getVisibleItemIds,
      filter,
      loop,
      size,
      loading,
    }),
    [search, activeItemId, handleItemSelect, registerItem, unregisterItem, getVisibleItemIds, filter, loop, size, loading],
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onOpenChange(false);
      }
    },
    [onOpenChange],
  );

  const overlayStyle = useMemo(() => ({
    ...buildOverlayStyle(theme),
    animation: 'wisp-command-overlay-in 150ms ease',
  }), [theme]);

  const panelStyle = useMemo(() => ({
    ...buildPanelStyle(size, theme, variant),
    animation: 'wisp-command-panel-in 150ms ease',
    ...userStyle,
  }), [size, theme, variant, userStyle]);

  if (!open) return null;

  const content = (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        className={className}
        style={panelStyle}
        tabIndex={-1}
      >
        <CommandContext.Provider value={contextValue}>
          {children}
        </CommandContext.Provider>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
}

Command.displayName = 'Command';

// ---------------------------------------------------------------------------
// CommandInput
// ---------------------------------------------------------------------------

export function CommandInput({
  placeholder = 'Type a command or search...',
  icon: IconComponent,
  ...inputProps
}: CommandInputProps): React.JSX.Element {
  const { search, onSearchChange, getVisibleItemIds, activeItemId, setActiveItemId, onItemSelect, loop } = useCommandContext();
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
      setActiveItemId(null);
    },
    [onSearchChange, setActiveItemId],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const visibleIds = getVisibleItemIds();
      if (visibleIds.length === 0) return;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const currentIdx = activeItemId ? visibleIds.indexOf(activeItemId) : -1;
          let nextIdx = currentIdx + 1;
          if (nextIdx >= visibleIds.length) {
            nextIdx = loop ? 0 : visibleIds.length - 1;
          }
          setActiveItemId(visibleIds[nextIdx] || null);
          const el = document.querySelector(`[data-command-item-id="${visibleIds[nextIdx]}"]`);
          if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const currentIdx = activeItemId ? visibleIds.indexOf(activeItemId) : visibleIds.length;
          let prevIdx = currentIdx - 1;
          if (prevIdx < 0) {
            prevIdx = loop ? visibleIds.length - 1 : 0;
          }
          setActiveItemId(visibleIds[prevIdx] || null);
          const el = document.querySelector(`[data-command-item-id="${visibleIds[prevIdx]}"]`);
          if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (activeItemId) {
            // Find the item's value from the DOM
            const el = document.querySelector(`[data-command-item-id="${activeItemId}"]`);
            const value = el?.getAttribute('data-command-value');
            if (value) {
              // Fire per-item onSelect if available
              const selectEvent = new CustomEvent('command-select', { detail: { value } });
              el?.dispatchEvent(selectEvent);
              onItemSelect(value);
            }
          }
          break;
        }
        default:
          break;
      }
    },
    [getVisibleItemIds, activeItemId, setActiveItemId, onItemSelect, loop],
  );

  const wrapperStyle = useMemo(() => buildInputWrapperStyle(theme), [theme]);
  const inputStyle = useMemo(() => buildInputStyle(theme), [theme]);
  const iconStyle = useMemo(() => buildInputIconStyle(theme), [theme]);

  const Icon = IconComponent || Search;

  return (
    <div style={wrapperStyle}>
      <span style={iconStyle}>
        <Icon size={18} />
      </span>
      <input
        {...inputProps}
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        style={inputStyle}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Command search"
        aria-autocomplete="list"
      />
    </div>
  );
}

CommandInput.displayName = 'CommandInput';

// ---------------------------------------------------------------------------
// CommandList
// ---------------------------------------------------------------------------

export function CommandList({
  children,
  className,
  style: userStyle,
}: CommandListProps): React.JSX.Element {
  const { loading } = useCommandContext();
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const listStyle = useMemo(() => buildListStyle(theme), [theme]);
  const loadingStyle = useMemo(() => buildLoadingStyle(theme), [theme]);

  if (loading) {
    return (
      <div style={{ ...loadingStyle, ...userStyle }} className={className}>
        <Spinner size="sm" />
      </div>
    );
  }

  return (
    <div role="listbox" className={className} style={{ ...listStyle, ...userStyle }}>
      {children}
    </div>
  );
}

CommandList.displayName = 'CommandList';

// ---------------------------------------------------------------------------
// CommandGroup
// ---------------------------------------------------------------------------

export function CommandGroup({
  heading,
  children,
  className,
  style: userStyle,
}: CommandGroupProps): React.JSX.Element {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const groupId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const [hasVisibleItems, setHasVisibleItems] = useState(true);

  const headingStyle = useMemo(() => buildGroupHeadingStyle(theme), [theme]);

  // Check if any items in this group are visible
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!groupRef.current) return;
      const items = groupRef.current.querySelectorAll('[data-command-item]');
      setHasVisibleItems(items.length > 0);
    });

    if (groupRef.current) {
      observer.observe(groupRef.current, { childList: true, subtree: true });
      // Initial check
      const items = groupRef.current.querySelectorAll('[data-command-item]');
      setHasVisibleItems(items.length > 0);
    }

    return () => observer.disconnect();
  }, []);

  if (!hasVisibleItems) return <></>;

  return (
    <div ref={groupRef} role="group" aria-label={heading} className={className} style={userStyle} data-command-group={groupId}>
      {heading && (
        <Text
          as="div"
          size="xs"
          weight="medium"
          style={headingStyle}
        >
          {heading}
        </Text>
      )}
      {children}
    </div>
  );
}

CommandGroup.displayName = 'CommandGroup';

// ---------------------------------------------------------------------------
// CommandItem
// ---------------------------------------------------------------------------

export function CommandItem({
  value,
  onSelect: onItemSelect,
  disabled = false,
  icon: IconComponent,
  shortcut,
  description,
  keywords,
  children,
  className,
  style: userStyle,
}: CommandItemProps): React.JSX.Element | null {
  const {
    search,
    activeItemId,
    setActiveItemId,
    onItemSelect: onRootSelect,
    registerItem,
    unregisterItem,
    filter,
  } = useCommandContext();
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const itemId = useId();
  const itemRef = useRef<HTMLDivElement>(null);

  // Register/unregister
  useEffect(() => {
    registerItem({ id: itemId, value, disabled, keywords });
    return () => unregisterItem(itemId);
  }, [itemId, value, disabled, keywords, registerItem, unregisterItem]);

  // Listen for custom select events from keyboard Enter
  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;
    const handler = () => {
      onItemSelect?.(value);
    };
    el.addEventListener('command-select', handler);
    return () => el.removeEventListener('command-select', handler);
  }, [value, onItemSelect]);

  // Filter
  const filterFn = filter || defaultFilter;
  const isVisible = !search || filterFn(value, search, keywords);

  const isActive = activeItemId === itemId;

  const itemStyle = useMemo(
    () => buildItemStyle(theme, isActive, disabled),
    [theme, isActive, disabled],
  );
  const iconStyle = useMemo(
    () => buildItemIconStyle(theme, disabled),
    [theme, disabled],
  );
  const labelStyle = useMemo(() => buildItemLabelStyle(theme), [theme]);
  const descStyle = useMemo(
    () => buildItemDescriptionStyle(theme),
    [theme],
  );
  const shortcutStyle = useMemo(
    () => buildItemShortcutStyle(theme),
    [theme],
  );
  const handleClick = useCallback(() => {
    if (disabled) return;
    onItemSelect?.(value);
    onRootSelect(value);
  }, [disabled, value, onItemSelect, onRootSelect]);

  const handlePointerEnter = useCallback(() => {
    if (!disabled) setActiveItemId(itemId);
  }, [disabled, itemId, setActiveItemId]);

  if (!isVisible) return null;

  // Parse shortcut keys for display
  const shortcutKeys = shortcut ? shortcut.split('+').map((k) => k.trim()) : null;

  return (
    <div
      ref={itemRef}
      role="option"
      aria-selected={isActive}
      aria-disabled={disabled || undefined}
      data-command-item
      data-command-item-id={itemId}
      data-command-value={value}
      data-disabled={disabled || undefined}
      className={className}
      style={{ ...itemStyle, ...userStyle }}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
    >
      {IconComponent && (
        <span style={iconStyle}>
          <IconComponent size={18} />
        </span>
      )}
      <div style={labelStyle}>
        <Text as="span" size="sm" style={{ color: 'inherit' }}>{children}</Text>
        {description && (
          <Text as="span" size="xs" style={descStyle}>{description}</Text>
        )}
      </div>
      {shortcutKeys && (
        <span style={shortcutStyle}>
          {shortcutKeys.map((key, i) => (
            <Kbd key={i} size="sm">{key}</Kbd>
          ))}
        </span>
      )}
    </div>
  );
}

CommandItem.displayName = 'CommandItem';

// ---------------------------------------------------------------------------
// CommandSeparator
// ---------------------------------------------------------------------------

export function CommandSeparator({
  className,
  style: userStyle,
}: CommandSeparatorProps): React.JSX.Element {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const separatorStyle = useMemo(() => buildSeparatorStyle(theme), [theme]);

  return (
    <div role="separator" className={className} style={{ ...separatorStyle, ...userStyle }} />
  );
}

CommandSeparator.displayName = 'CommandSeparator';

// ---------------------------------------------------------------------------
// CommandEmpty
// ---------------------------------------------------------------------------

export function CommandEmpty({
  children,
  className,
  style: userStyle,
}: CommandEmptyProps): React.JSX.Element | null {
  const { search, getVisibleItemIds, loading } = useCommandContext();
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const [isEmpty, setIsEmpty] = useState(false);

  // Check visibility after render
  useEffect(() => {
    // Small delay to let items filter themselves
    const timer = setTimeout(() => {
      const visibleIds = getVisibleItemIds();
      setIsEmpty(visibleIds.length === 0 && search.length > 0);
    }, 0);
    return () => clearTimeout(timer);
  }, [search, getVisibleItemIds]);

  const emptyStyle = useMemo(() => buildEmptyStyle(theme), [theme]);

  if (loading || !isEmpty) return null;

  return (
    <div className={className} style={{ ...emptyStyle, ...userStyle }}>
      <Text as="span" size="sm" style={{ color: 'inherit' }}>
        {children || 'No results found.'}
      </Text>
    </div>
  );
}

CommandEmpty.displayName = 'CommandEmpty';
