/**
 * @module FriendSection
 * @description Collapsible section header for the Wisp design system.
 *
 * Groups friend list items under a titled section with a count badge
 * and expandable/collapsible content area.
 */
import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { FriendSectionProps } from '@coexist/wisp-core/types/FriendSection.types';
import {
  resolveFriendSectionColors,
  buildFriendSectionHeaderStyle,
  buildFriendSectionTitleStyle,
  buildFriendSectionCountStyle,
  buildFriendSectionEmptyStyle,
} from '@coexist/wisp-core/styles/FriendSection.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG chevron
// ---------------------------------------------------------------------------

function ChevronIcon({ size = 12, color, rotated }: { size?: number; color?: string; rotated?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: rotated ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 150ms ease-out' }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// FriendSection
// ---------------------------------------------------------------------------

/**
 * FriendSection — A collapsible section header with count badge.
 *
 * @remarks
 * Wraps a group of FriendListItem or FriendRequestItem children with a
 * collapsible header. Supports both controlled and uncontrolled collapsed state.
 *
 * @example
 * ```tsx
 * <FriendSection title="Online" count={5}>
 *   <FriendListItem name="Alice" ... />
 *   <FriendListItem name="Bob" ... />
 * </FriendSection>
 * ```
 */
export const FriendSection = forwardRef<HTMLDivElement, FriendSectionProps>(
  function FriendSection(
    {
      title,
      count,
      defaultCollapsed = false,
      collapsed: controlledCollapsed,
      onCollapsedChange,
      children,
      emptyMessage,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
    const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

    const colors = useMemo(
      () => resolveFriendSectionColors(theme),
      [theme],
    );

    const toggleCollapsed = useCallback(() => {
      const next = !isCollapsed;
      if (controlledCollapsed === undefined) {
        setInternalCollapsed(next);
      }
      onCollapsedChange?.(next);
    }, [isCollapsed, controlledCollapsed, onCollapsedChange]);

    const headerStyle = useMemo(
      () => buildFriendSectionHeaderStyle(colors, theme),
      [colors, theme],
    );

    const titleStyle = useMemo(
      () => buildFriendSectionTitleStyle(colors, theme),
      [colors, theme],
    );

    const countStyle = useMemo(
      () => buildFriendSectionCountStyle(colors, theme),
      [colors, theme],
    );

    const emptyStyle = useMemo(
      () => buildFriendSectionEmptyStyle(colors, theme),
      [colors, theme],
    );

    const hasChildren = React.Children.count(children) > 0;

    return (
      <div
        ref={ref}
        className={className}
        style={{ width: '100%', ...userStyle }}
        {...rest}
      >
        {/* Header */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={!isCollapsed}
          style={headerStyle}
          onClick={toggleCollapsed}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleCollapsed();
            }
          }}
        >
          <ChevronIcon size={12} color={colors.chevron} rotated={!isCollapsed} />
          <span style={titleStyle}>{title}</span>
          {count != null && (
            <span style={countStyle}>{count}</span>
          )}
        </div>

        {/* Content */}
        {!isCollapsed && (
          hasChildren
            ? <div>{children}</div>
            : emptyMessage
              ? <span style={emptyStyle}>{emptyMessage}</span>
              : null
        )}
      </div>
    );
  },
);

FriendSection.displayName = 'FriendSection';
