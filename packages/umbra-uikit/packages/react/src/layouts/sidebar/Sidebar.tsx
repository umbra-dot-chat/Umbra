import React, {
  forwardRef,
  useMemo,
  useCallback,
  useState,
  createContext,
  useContext,
} from 'react';
import type {
  SidebarProps,
  SidebarSectionProps,
  SidebarItemProps,
  SidebarContextValue,
} from '@coexist/wisp-core/types/Sidebar.types';
import type { CSSStyleObject } from '@coexist/wisp-core/types';

import {
  buildSidebarStyle,
  buildSectionStyle,
  buildSectionTitleStyle,
  buildSectionChevronStyle,
  buildSectionContentStyle,
  buildItemStyle,
  buildItemIconStyle,
  buildItemLabelStyle,
  buildItemBadgeStyle,
} from '@coexist/wisp-core/styles/Sidebar.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/** @internal React context that propagates sidebar width and collapsed state to child components. */
const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * Reads the current sidebar state from the nearest {@link Sidebar} ancestor.
 *
 * @throws Error if called outside a `<Sidebar>` provider tree.
 * @returns The sidebar context value containing `collapsed` and `width`.
 */
function useSidebarContext(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (ctx === null) {
    throw new Error('[Wisp] SidebarSection and SidebarItem must be used within <Sidebar>.');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Sidebar — root container
// ---------------------------------------------------------------------------

/**
 * Sidebar -- Vertical navigation container for the Wisp design system.
 *
 * @remarks
 * Provides a fixed-width, scrollable navigation panel with collapsible
 * behaviour and contextual width/collapsed state for child components.
 *
 * - Four width presets: `collapsed`, `compact`, `default`, `wide`.
 * - Supports both controlled and uncontrolled collapsed state.
 * - Renders a `<nav>` element with `role="navigation"` for accessibility.
 * - Internal collapse toggle button is rendered when `collapsible` is `true`.
 *
 * @module primitives/sidebar
 * @example
 * ```tsx
 * <Sidebar width="default">
 *   <SidebarSection title="Main">
 *     <SidebarItem icon={<Home size={20} />} label="Dashboard" active />
 *     <SidebarItem icon={<Users size={20} />} label="Team" />
 *   </SidebarSection>
 * </Sidebar>
 * ```
 */
export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  {
    children,
    width = 'default',
    collapsible = false,
    collapsed: controlledCollapsed,
    onCollapsedChange,
    position = 'left',
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  // Support both controlled and uncontrolled collapsed state
  const isControlled = controlledCollapsed !== undefined;
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = isControlled ? controlledCollapsed : internalCollapsed;

  const handleCollapsedChange = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalCollapsed(next);
      onCollapsedChange?.(next);
    },
    [isControlled, onCollapsedChange],
  );

  // When collapsible and collapsed, override width to 'collapsed'
  const resolvedWidth = collapsible && collapsed ? 'collapsed' : width;

  // Items should collapse (hide labels, center icons) when the sidebar
  // is in a narrow width mode OR when explicitly collapsed via the
  // collapsible mechanism.
  const isNarrow = resolvedWidth === 'collapsed' || resolvedWidth === 'compact';

  const contextValue = useMemo<SidebarContextValue>(
    () => ({ collapsed: isNarrow, width: resolvedWidth }),
    [isNarrow, resolvedWidth],
  );

  const sidebarStyle = useMemo(
    () => buildSidebarStyle(resolvedWidth, position, theme, userStyle as CSSStyleObject),
    [resolvedWidth, position, theme, userStyle],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <nav
        ref={ref}
        className={className}
        style={sidebarStyle}
        role="navigation"
        data-sidebar-width={resolvedWidth}
        data-sidebar-position={position}
        {...rest}
      >
        {children}

        {/* Collapse toggle for collapsible sidebars */}
        {collapsible && (
          <CollapseToggle
            collapsed={collapsed}
            onToggle={() => handleCollapsedChange(!collapsed)}
          />
        )}
      </nav>
    </SidebarContext.Provider>
  );
});
Sidebar.displayName = 'Sidebar';

// ---------------------------------------------------------------------------
// Internal collapse toggle button
// ---------------------------------------------------------------------------

function CollapseToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const [hovered, setHovered] = useState(false);

  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    padding: '12px 8px',
    border: 'none',
    borderTop: `1px solid ${themeColors.border.subtle}`,
    background: hovered ? themeColors.accent.highlightRaised : 'transparent',
    color: themeColors.text.onRaisedSecondary,
    cursor: 'pointer',
    transition: 'background-color 150ms ease',
  };

  const chevronStyle: React.CSSProperties = {
    display: 'inline-flex',
    width: 16,
    height: 16,
    transition: 'transform 200ms ease',
    transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
  };

  return (
    <button
      type="button"
      style={style}
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={chevronStyle}
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// SidebarSection
// ---------------------------------------------------------------------------

/**
 * SidebarSection -- Groups sidebar items with an optional heading.
 *
 * @remarks
 * Supports collapsible behaviour via the `collapsible` prop, toggling
 * visibility of its children with a rotating chevron indicator.
 * Section titles are hidden when the parent Sidebar is in a collapsed or
 * compact width mode.
 *
 * @example
 * ```tsx
 * <SidebarSection title="Navigation" collapsible defaultCollapsed={false}>
 *   <SidebarItem icon={<Home />} label="Home" />
 *   <SidebarItem icon={<Settings />} label="Settings" />
 * </SidebarSection>
 * ```
 */
export const SidebarSection = forwardRef<HTMLDivElement, SidebarSectionProps>(function SidebarSection(
  {
    children,
    title,
    collapsible = false,
    defaultCollapsed = false,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const { collapsed: sidebarCollapsed } = useSidebarContext();
  const [sectionCollapsed, setSectionCollapsed] = useState(defaultCollapsed);

  const sectionStyle = useMemo(
    () => buildSectionStyle(userStyle as CSSStyleObject),
    [userStyle],
  );

  const titleStyle = useMemo(
    () => buildSectionTitleStyle(theme, collapsible),
    [theme, collapsible],
  );

  const chevronStyle = useMemo(
    () => buildSectionChevronStyle(sectionCollapsed),
    [sectionCollapsed],
  );

  const contentStyle = useMemo(
    () => buildSectionContentStyle(sectionCollapsed),
    [sectionCollapsed],
  );

  const handleToggle = useCallback(() => {
    if (collapsible) setSectionCollapsed((prev) => !prev);
  }, [collapsible]);

  // Hide section title when sidebar itself is collapsed
  const showTitle = title && !sidebarCollapsed;

  return (
    <div ref={ref} className={className} style={sectionStyle} role="group" {...rest}>
      {showTitle && (
        <button
          type="button"
          style={titleStyle}
          onClick={handleToggle}
          aria-expanded={collapsible ? !sectionCollapsed : undefined}
        >
          <span>{title}</span>
          {collapsible && (
            <span style={chevronStyle} aria-hidden>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          )}
        </button>
      )}
      <div style={contentStyle}>{children}</div>
    </div>
  );
});
SidebarSection.displayName = 'SidebarSection';

// ---------------------------------------------------------------------------
// SidebarItem
// ---------------------------------------------------------------------------

/**
 * SidebarItem -- A single navigation entry inside the sidebar.
 *
 * @remarks
 * Renders an icon, label, and optional badge. In collapsed mode the label
 * and badge are hidden, showing only the centred icon. When an `href` is
 * provided, the item renders as a semantic `<a>` element; otherwise it
 * renders as a `<div>` with `role="button"`.
 *
 * @example
 * ```tsx
 * <SidebarItem
 *   icon={<Dashboard />}
 *   label="Dashboard"
 *   active
 *   badge={<Badge count={3} />}
 * />
 * ```
 */
export const SidebarItem = forwardRef<HTMLDivElement, SidebarItemProps>(function SidebarItem(
  {
    icon,
    label,
    active = false,
    disabled = false,
    badge,
    href,
    onClick,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const { collapsed: sidebarCollapsed, width: sidebarWidth } = useSidebarContext();
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (!disabled) setHovered(true);
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
  }, [theme]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    },
    [disabled, onClick],
  );

  const itemStyle = useMemo(
    () => buildItemStyle(active, disabled, hovered, sidebarCollapsed, sidebarWidth, theme, userStyle as CSSStyleObject),
    [active, disabled, hovered, sidebarCollapsed, sidebarWidth, theme, userStyle],
  );

  const iconStyle = useMemo(() => buildItemIconStyle(), []);
  const labelStyle = useMemo(() => buildItemLabelStyle(sidebarCollapsed), [sidebarCollapsed]);
  const badgeStyle = useMemo(() => buildItemBadgeStyle(sidebarCollapsed), [sidebarCollapsed]);

  const content = (
    <>
      {icon && <span style={iconStyle}>{icon}</span>}
      <span style={labelStyle}>{label}</span>
      {badge && <span style={badgeStyle}>{badge}</span>}
    </>
  );

  // If an href is provided, render as an anchor for semantic navigation
  if (href && !disabled) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={className}
        style={itemStyle}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-current={active ? 'page' : undefined}
        {...(rest as React.HTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={disabled ? -1 : 0}
      className={className}
      style={itemStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-current={active ? 'page' : undefined}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      {content}
    </div>
  );
});
SidebarItem.displayName = 'SidebarItem';
