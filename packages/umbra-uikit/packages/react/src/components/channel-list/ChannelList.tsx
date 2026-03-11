/**
 * @module ChannelList
 * @description Collapsible category-grouped channel list for messaging apps.
 */
import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type {
  ChannelListProps,
  ChannelItem as ChannelItemType,
  ChannelCategory,
  ChannelType,
} from '@coexist/wisp-core/types/ChannelList.types';
import {
  resolveChannelListColors,
  buildChannelListContainerStyle,
  buildChannelListHeaderSlotStyle,
  buildCategoryHeaderStyle,
  buildCategoryLabelStyle,
  buildCategoryCreateButtonStyle,
  buildChannelItemStyle,
  buildChannelIconStyle,
  buildChannelNameStyle,
  buildChannelBadgeStyle,
  buildChannelListLoadingStyle,
  buildChannelListSkeletonCategoryStyle,
  buildChannelListSkeletonItemStyle,
} from '@coexist/wisp-core/styles/ChannelList.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function HashIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function SpeakerIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function MegaphoneIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 11 18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

function MessageSquareIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function MessagesIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
    </svg>
  );
}

function ChevronIcon({ size = 12, color, collapsed }: { size?: number; color?: string; collapsed?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: 'transform 150ms ease-out',
        transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function PlusIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Channel type icon map
// ---------------------------------------------------------------------------

function ChannelTypeIcon({
  type,
  size,
  color,
}: {
  type: ChannelType;
  size?: number;
  color?: string;
}) {
  switch (type) {
    case 'voice':
      return <SpeakerIcon size={size} color={color} />;
    case 'announcement':
      return <MegaphoneIcon size={size} color={color} />;
    case 'thread':
      return <MessageSquareIcon size={size} color={color} />;
    case 'forum':
      return <MessagesIcon size={size} color={color} />;
    case 'text':
    default:
      return <HashIcon size={size} color={color} />;
  }
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ChannelListSkeleton({
  colors,
  theme,
}: {
  colors: ReturnType<typeof resolveChannelListColors>;
  theme: Parameters<typeof buildChannelListSkeletonCategoryStyle>[1];
}) {
  const catStyle = useMemo(
    () => buildChannelListSkeletonCategoryStyle(colors, theme),
    [colors, theme],
  );
  const itemStyle = useMemo(
    () => buildChannelListSkeletonItemStyle(colors, theme),
    [colors, theme],
  );

  return (
    <>
      {[0, 1, 2].map((catIdx) => (
        <div key={catIdx}>
          <div style={catStyle} />
          {[0, 1, 2, 3].map((itemIdx) => (
            <div
              key={itemIdx}
              style={{ ...itemStyle, width: `${55 + (itemIdx % 3) * 15}%` }}
            />
          ))}
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// ChannelList
// ---------------------------------------------------------------------------

/**
 * ChannelList -- Collapsible category-grouped channel sidebar.
 *
 * @remarks
 * Renders a list of category groups, each containing channel items.
 * Categories are collapsible with a chevron toggle. Channels display
 * a type icon, name, and optional unread/mention badge. Active channels
 * receive highlighted styling and muted channels have reduced opacity.
 *
 * @example
 * ```tsx
 * <ChannelList
 *   categories={categories}
 *   onChannelClick={(ch) => setActiveChannel(ch.id)}
 *   onCategoryToggle={(catId) => toggleCategory(catId)}
 *   header={<span>My Server</span>}
 * />
 * ```
 */
export const ChannelList = forwardRef<HTMLDivElement, ChannelListProps>(
  function ChannelList(
    {
      categories,
      onChannelClick,
      onCategoryToggle,
      onChannelCreate,
      header,
      loading = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // Track collapsed state per category, initialized from category.collapsed
    const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>(
      () => {
        const initial: Record<string, boolean> = {};
        for (const cat of categories) {
          if (cat.collapsed) {
            initial[cat.id] = true;
          }
        }
        return initial;
      },
    );

    // ----- Colors -----
    const colors = useMemo(
      () => resolveChannelListColors(theme),
      [theme],
    );

    // ----- Styles -----
    const containerStyle = useMemo(
      () => buildChannelListContainerStyle(colors, theme),
      [colors, theme],
    );

    const headerSlotStyle = useMemo(
      () => buildChannelListHeaderSlotStyle(colors, theme),
      [colors, theme],
    );

    const categoryHeaderStyle = useMemo(
      () => buildCategoryHeaderStyle(colors, theme),
      [colors, theme],
    );

    const categoryLabelStyle = useMemo(
      () => buildCategoryLabelStyle(colors, theme),
      [colors, theme],
    );

    const categoryCreateBtnStyle = useMemo(
      () => buildCategoryCreateButtonStyle(colors, theme),
      [colors, theme],
    );

    const badgeStyle = useMemo(
      () => buildChannelBadgeStyle(colors, theme),
      [colors, theme],
    );

    const loadingStyle = useMemo(
      () => buildChannelListLoadingStyle(colors, theme),
      [colors, theme],
    );

    // ----- Handlers -----
    const handleCategoryToggle = useCallback(
      (categoryId: string) => {
        setCollapsedMap((prev) => ({
          ...prev,
          [categoryId]: !prev[categoryId],
        }));
        onCategoryToggle?.(categoryId);
      },
      [onCategoryToggle],
    );

    const handleChannelClick = useCallback(
      (channel: ChannelItemType) => {
        onChannelClick?.(channel);
      },
      [onChannelClick],
    );

    const handleChannelCreate = useCallback(
      (e: React.MouseEvent, categoryId: string) => {
        e.stopPropagation();
        onChannelCreate?.(categoryId);
      },
      [onChannelCreate],
    );

    // ----- Render helpers -----
    const renderChannel = useCallback(
      (channel: ChannelItemType) => {
        const active = channel.active ?? false;
        const muted = channel.muted ?? false;
        const type = channel.type ?? 'text';
        const hasUnread = (channel.unreadCount ?? 0) > 0;

        const itemStyle = buildChannelItemStyle(colors, active, muted, theme);
        const iconStyle = buildChannelIconStyle(colors, active, theme);
        const nameStyle = buildChannelNameStyle(colors, active, hasUnread, theme);

        return (
          <div
            key={channel.id}
            role="button"
            tabIndex={0}
            style={itemStyle}
            onClick={() => handleChannelClick(channel)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleChannelClick(channel);
              }
            }}
          >
            {/* Channel icon */}
            <span style={iconStyle}>
              {channel.icon ?? <ChannelTypeIcon type={type} size={18} />}
            </span>

            {/* Channel name */}
            <span style={nameStyle}>{channel.name}</span>

            {/* Badge */}
            {hasUnread && !muted && (
              <span style={badgeStyle}>
                {channel.hasMention
                  ? `@${channel.unreadCount}`
                  : channel.unreadCount}
              </span>
            )}
          </div>
        );
      },
      [colors, theme, badgeStyle, handleChannelClick],
    );

    const renderCategory = useCallback(
      (category: ChannelCategory) => {
        const isCollapsed = collapsedMap[category.id] ?? false;

        return (
          <div key={category.id} role="group" aria-label={category.label}>
            {/* Category header */}
            <button
              type="button"
              style={categoryHeaderStyle}
              onClick={() => handleCategoryToggle(category.id)}
              aria-expanded={!isCollapsed}
              className="wisp-channel-category"
            >
              <ChevronIcon
                size={12}
                color={colors.categoryIcon}
                collapsed={isCollapsed}
              />
              <span style={categoryLabelStyle}>{category.label}</span>
              {onChannelCreate && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Create channel in ${category.label}`}
                  style={categoryCreateBtnStyle}
                  className="wisp-category-create-btn"
                  onClick={(e) => handleChannelCreate(e, category.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onChannelCreate(category.id);
                    }
                  }}
                >
                  <PlusIcon size={14} />
                </span>
              )}
            </button>

            {/* Channel items */}
            {!isCollapsed &&
              category.channels.map((channel) => renderChannel(channel))}
          </div>
        );
      },
      [
        collapsedMap,
        categoryHeaderStyle,
        categoryLabelStyle,
        categoryCreateBtnStyle,
        colors.categoryIcon,
        handleCategoryToggle,
        handleChannelCreate,
        onChannelCreate,
        renderChannel,
      ],
    );

    return (
      <div
        ref={ref}
        role="navigation"
        aria-label="Channel list"
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Hover style for category create button */}
        {onChannelCreate && (
          <style>{`
            .wisp-channel-category:hover .wisp-category-create-btn {
              opacity: 1 !important;
            }
            .wisp-category-create-btn:hover {
              color: ${colors.channelTextActive} !important;
            }
          `}</style>
        )}

        {/* Header slot */}
        {header && <div style={headerSlotStyle}>{header}</div>}

        {/* Loading state */}
        {loading && !skeleton && (
          <div style={loadingStyle}>Loading channels...</div>
        )}

        {/* Skeleton state */}
        {skeleton && (
          <ChannelListSkeleton colors={colors} theme={theme} />
        )}

        {/* Categories */}
        {!loading && !skeleton && categories.map((cat) => renderCategory(cat))}
      </div>
    );
  },
);

ChannelList.displayName = 'ChannelList';
