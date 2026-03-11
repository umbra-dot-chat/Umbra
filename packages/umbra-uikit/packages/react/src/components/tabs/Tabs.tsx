import React, {
  forwardRef,
  useMemo,
  useCallback,
  useState,
  useRef,
  useId,
  useEffect,
  useLayoutEffect,
  createContext,
  useContext,
} from 'react';
import type {
  TabsProps,
  TabListProps,
  TabProps,
  TabPanelProps,
  TabsContextValue,
} from '@coexist/wisp-core/types/Tabs.types';
import type { CSSStyleObject } from '@coexist/wisp-core/types';
import { fontFamilyStacks } from '@coexist/wisp-core/tokens/shared';
import {
  buildTabListStyle,
  buildTabIndicatorStyle,
  buildTabStyle,
  buildTabFocusStyle,
  buildTabPanelStyle,
} from '@coexist/wisp-core/styles/Tabs.styles';
import { useTheme } from '../../providers';

/** Use `useLayoutEffect` on the client and `useEffect` during SSR. */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** @internal React context that distributes shared state to tab sub-components. */
const TabsContext = createContext<TabsContextValue | null>(null);

/**
 * Retrieves the nearest {@link TabsContextValue} or throws if called outside
 * of a {@link Tabs} provider.
 *
 * @returns The current tabs context value.
 * @internal
 */
function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (ctx === null) {
    throw new Error('[Wisp] Tab components must be used within <Tabs>.');
  }
  return ctx;
}

/**
 * Derives a deterministic DOM id for a tab button.
 *
 * @param baseId - Auto-generated base identifier for the Tabs instance.
 * @param value  - The tab's value string.
 * @returns A unique element id.
 * @internal
 */
function getTabId(baseId: string, value: string): string {
  return baseId + '-tab-' + value;
}

/**
 * Derives a deterministic DOM id for a tab panel.
 *
 * @param baseId - Auto-generated base identifier for the Tabs instance.
 * @param value  - The panel's value string.
 * @returns A unique element id.
 * @internal
 */
function getPanelId(baseId: string, value: string): string {
  return baseId + '-panel-' + value;
}

/**
 * Tabs -- Root container that manages tab state and orientation.
 *
 * @remarks
 * - Supports controlled and uncontrolled usage patterns.
 * - Provides shared context to {@link TabList}, {@link Tab}, and {@link TabPanel}.
 * - Renders a flex container whose direction follows the `orientation` prop.
 *
 * @module primitives/tabs
 * @example
 * ```tsx
 * <Tabs defaultValue="one" orientation="horizontal">
 *   <TabList>
 *     <Tab value="one">First</Tab>
 *     <Tab value="two">Second</Tab>
 *   </TabList>
 *   <TabPanel value="one">Content one</TabPanel>
 *   <TabPanel value="two">Content two</TabPanel>
 * </Tabs>
 * ```
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    value: controlledValue,
    defaultValue,
    onChange,
    orientation = 'horizontal',
    children,
    className,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const baseId = useMemo(() => 'wisp-tabs-' + reactId.replace(/:/g, ''), [reactId]);

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string>(defaultValue || '');
  const activeValue = isControlled ? controlledValue : internalValue;

  const handleChange = useCallback(
    (nextValue: string) => {
      if (!isControlled) setInternalValue(nextValue);
      onChange?.(nextValue);
    },
    [isControlled, onChange],
  );

  const contextValue = useMemo<TabsContextValue>(
    () => ({ activeValue, onChange: handleChange, orientation, baseId }),
    [activeValue, handleChange, orientation, baseId],
  );

  const rootStyle: React.CSSProperties = useMemo(
    () => ({
      display: 'flex',
      flexDirection: orientation === 'horizontal' ? ('column' as const) : ('row' as const),
      fontFamily: fontFamilyStacks.sans,
      ...userStyle,
    }),
    [orientation, userStyle],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div ref={ref} className={className} style={rootStyle} data-orientation={orientation} {...rest}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});
Tabs.displayName = 'Tabs';

// ---------------------------------------------------------------------------
// TabList — renders the tab buttons + sliding indicator
// ---------------------------------------------------------------------------

/**
 * TabList -- Horizontal or vertical strip of tab buttons with a sliding indicator.
 *
 * @remarks
 * - Renders a `div` with `role="tablist"` and `aria-orientation`.
 * - Automatically measures the active tab and positions a sliding indicator bar.
 * - The indicator animates on subsequent tab changes but not on initial mount.
 *
 * @example
 * ```tsx
 * <TabList>
 *   <Tab value="a">Alpha</Tab>
 *   <Tab value="b">Beta</Tab>
 * </TabList>
 * ```
 */
export const TabList = forwardRef<HTMLDivElement, TabListProps>(function TabList(
  { children, className, style: userStyle, ...rest },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const { activeValue, orientation } = useTabsContext();
  const innerRef = useRef<HTMLDivElement | null>(null);

  // Indicator measurement state
  const [indicator, setIndicator] = useState<{ offset: number; extent: number } | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const hasMountedRef = useRef(false);

  // Measure active tab position whenever activeValue changes
  useIsomorphicLayoutEffect(() => {
    const container = innerRef.current;
    if (!container) return;

    const activeTab = container.querySelector<HTMLElement>('button[role="tab"][aria-selected="true"]');
    if (!activeTab) {
      setIndicator(null);
      return;
    }

    // Check if the tab has an icon sibling — if so, span the full button
    const hasIcon = activeTab.querySelector<HTMLElement>('[data-tab-text]')?.previousElementSibling != null;
    const textSpan = !hasIcon ? activeTab.querySelector<HTMLElement>('[data-tab-text]') : null;

    if (orientation === 'horizontal') {
      if (textSpan) {
        // Position indicator under the text only (no icon present)
        const textLeft = textSpan.offsetLeft + activeTab.offsetLeft;
        setIndicator({ offset: textLeft, extent: textSpan.offsetWidth });
      } else {
        // Full button width — covers icon + text together
        setIndicator({ offset: activeTab.offsetLeft, extent: activeTab.offsetWidth });
      }
    } else {
      setIndicator({ offset: activeTab.offsetTop, extent: activeTab.offsetHeight });
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
    } else {
      setShouldAnimate(true);
    }
  }, [activeValue, orientation]);

  const listStyle = useMemo(
    () => buildTabListStyle(orientation, theme, userStyle as CSSStyleObject),
    [orientation, theme, userStyle],
  );

  // Merge refs (forwarded + internal)
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [ref],
  );

  return (
    <div ref={setRefs} role="tablist" aria-orientation={orientation} className={className} style={listStyle} {...rest}>
      {children}

      {/* Sliding active indicator */}
      {indicator !== null && (
        <div
          aria-hidden
          style={buildTabIndicatorStyle({
            orientation,
            offset: indicator.offset,
            extent: indicator.extent,
            animate: shouldAnimate,
            theme,
          })}
        />
      )}
    </div>
  );
});
TabList.displayName = 'TabList';

// ---------------------------------------------------------------------------
// Tab button
// ---------------------------------------------------------------------------

/**
 * Tab -- An individual tab trigger rendered as a `button` with `role="tab"`.
 *
 * @remarks
 * - Supports keyboard navigation (ArrowLeft/Right for horizontal, ArrowUp/Down
 *   for vertical, plus Home/End).
 * - Manages focus-visible styling independently of hover state.
 * - Automatically wired to its corresponding {@link TabPanel} via ARIA attributes.
 *
 * @example
 * ```tsx
 * <Tab value="settings" icon={<GearIcon />}>Settings</Tab>
 * ```
 */
export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { value, disabled = false, icon, children, className, style: userStyle, ...rest },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const { activeValue, onChange, orientation, baseId } = useTabsContext();
  const active = activeValue === value;

  const [hovered, setHovered] = useState(false);
  const handleMouseEnter = useCallback(() => { if (!disabled) setHovered(true); }, [disabled]);
  const handleMouseLeave = useCallback(() => { setHovered(false); }, []);

  const [focusVisible, setFocusVisible] = useState(false);
  const isKeyboardRef = useRef(false);
  const handleFocus = useCallback(() => { if (isKeyboardRef.current) setFocusVisible(true); }, []);
  const handleBlur = useCallback(() => { setFocusVisible(false); isKeyboardRef.current = false; }, []);

  const handleClick = useCallback(() => {
    if (disabled) return;
    onChange(value);
  }, [disabled, onChange, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      isKeyboardRef.current = true;
      const tablist = (e.currentTarget as HTMLElement).closest('[role="tablist"]');
      if (!tablist) return;
      const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('button[role="tab"]'));
      const enabledTabs = tabs.filter((t) => !t.disabled);
      const currentIndex = enabledTabs.indexOf(e.currentTarget);
      if (currentIndex === -1) return;

      let nextIndex: number | null = null;
      if (orientation === 'horizontal') {
        if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % enabledTabs.length;
        else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
      } else {
        if (e.key === 'ArrowDown') nextIndex = (currentIndex + 1) % enabledTabs.length;
        else if (e.key === 'ArrowUp') nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
      }
      if (e.key === 'Home') nextIndex = 0;
      else if (e.key === 'End') nextIndex = enabledTabs.length - 1;

      if (nextIndex !== null) {
        e.preventDefault();
        const nextTab = enabledTabs[nextIndex];
        nextTab.focus();
        const nextValue = nextTab.getAttribute('data-tab-value');
        if (nextValue) onChange(nextValue);
      }
    },
    [orientation, onChange],
  );

  const tabStyle = useMemo(
    () => buildTabStyle(active, disabled, hovered, orientation, theme, userStyle as CSSStyleObject),
    [active, disabled, hovered, orientation, theme, userStyle],
  );
  const focusStyle = useMemo(() => buildTabFocusStyle(theme), [theme]);
  const mergedStyle: React.CSSProperties = focusVisible ? { ...tabStyle, ...focusStyle } : tabStyle;

  const tabId = getTabId(baseId, value);
  const panelId = getPanelId(baseId, value);

  return (
    <button
      ref={ref}
      role="tab"
      type="button"
      id={tabId}
      aria-selected={active}
      aria-controls={panelId}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      tabIndex={active ? 0 : -1}
      data-tab-value={value}
      className={className}
      style={mergedStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...rest}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span data-tab-text style={{ position: 'relative' }}>{children}</span>
    </button>
  );
});
Tab.displayName = 'Tab';

// ---------------------------------------------------------------------------
// TabPanel
// ---------------------------------------------------------------------------

/**
 * TabPanel -- Content area associated with a single {@link Tab}.
 *
 * @remarks
 * - Only the panel whose `value` matches the active tab is rendered; inactive
 *   panels return `null` (unmounted).
 * - Linked to its trigger via `aria-labelledby` / `id`.
 *
 * @example
 * ```tsx
 * <TabPanel value="settings">
 *   <p>Settings content here.</p>
 * </TabPanel>
 * ```
 */
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(
  { value, children, className, style: userStyle, ...rest },
  ref,
) {
  const { activeValue, baseId } = useTabsContext();
  const active = activeValue === value;
  const { theme } = useTheme();
  const panelStyle = useMemo(() => buildTabPanelStyle(theme, userStyle as CSSStyleObject), [theme, userStyle]);
  const tabId = getTabId(baseId, value);
  const panelId = getPanelId(baseId, value);

  if (!active) return null;

  return (
    <div ref={ref} role="tabpanel" id={panelId} aria-labelledby={tabId} tabIndex={0} className={className} style={panelStyle} {...rest}>
      {children}
    </div>
  );
});
TabPanel.displayName = 'TabPanel';
