/**
 * @module CommunitySidebar
 * @description Community navigation panel with space tabs and channel list.
 *
 * Renders inside an existing sidebar container — it does **not** provide
 * its own sidebar chrome. The layout is:
 *
 *   ┌─────────────────────┐
 *   │ Community Header    │  ← clickable (name, icon, subtitle)
 *   ├─────────────────────┤
 *   │ Space1 │ Space2 │ … │  ← horizontal tab strip
 *   ├─────────────────────┤
 *   │ ChannelList          │  ← categories for active space
 *   │  ▸ TEXT CHANNELS     │
 *   │    # general         │
 *   │    # random          │
 *   │  ▸ VOICE CHANNELS    │
 *   │    🔊 Lounge         │
 *   └─────────────────────┘
 */

import React, { forwardRef, useMemo, useCallback, useState } from 'react';
import type { CommunitySidebarProps } from '@coexist/wisp-core/types/CommunitySidebar.types';
import {
  resolveCommunitySidebarColors,
  buildCommunitySidebarContainerStyle,
  buildCommunityHeaderStyle,
  buildCommunityNameStyle,
  buildCommunitySubtitleStyle,
  buildSpaceTabStripStyle,
  buildSpaceTabScrollStyle,
  buildSpaceTabStyle,
  buildSpaceTabIndicatorStyle,
  buildSpaceTabBadgeStyle,
  buildChannelListAreaStyle,
  buildCommunitySidebarSkeletonHeaderStyle,
  buildCommunitySidebarSkeletonBarStyle,
  buildCommunitySidebarSkeletonTabStyle,
  buildCommunitySidebarSkeletonCategoryStyle,
  buildCommunitySidebarSkeletonChannelRowStyle,
  buildCommunitySidebarSkeletonIconStyle,
  buildCommunitySidebarSkeletonChannelNameStyle,
} from '@coexist/wisp-core/styles/CommunitySidebar.styles';
import { ChannelList } from '../channel-list';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function ChevronDownIcon({ size = 14, color }: { size?: number; color?: string }) {
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
      style={{ flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

/** Skeleton data describing category groups with varying channel counts & widths. */
const SKELETON_CATEGORIES = [
  { categoryWidth: '45%', channels: ['70%', '55%', '80%'] },
  { categoryWidth: '55%', channels: ['60%', '75%', '50%', '65%'] },
  { categoryWidth: '35%', channels: ['65%'] },
];

function CommunitySidebarSkeleton({
  colors,
  theme,
}: {
  colors: ReturnType<typeof resolveCommunitySidebarColors>;
  theme: Parameters<typeof buildCommunitySidebarSkeletonHeaderStyle>[1];
}) {
  const headerWrapperStyle = useMemo(
    () => buildCommunitySidebarSkeletonHeaderStyle(colors, theme),
    [colors, theme],
  );
  const barStyle = useMemo(
    () => buildCommunitySidebarSkeletonBarStyle(colors, theme),
    [colors, theme],
  );
  const tabSkeletonStyle = useMemo(
    () => buildCommunitySidebarSkeletonTabStyle(colors, theme),
    [colors, theme],
  );
  const categoryStyle = useMemo(
    () => buildCommunitySidebarSkeletonCategoryStyle(colors, theme),
    [colors, theme],
  );
  const channelRowStyle = useMemo(
    () => buildCommunitySidebarSkeletonChannelRowStyle(colors, theme),
    [colors, theme],
  );
  const iconStyle = useMemo(
    () => buildCommunitySidebarSkeletonIconStyle(colors, theme),
    [colors, theme],
  );
  const channelNameStyle = useMemo(
    () => buildCommunitySidebarSkeletonChannelNameStyle(colors, theme),
    [colors, theme],
  );

  return (
    <>
      {/* Header skeleton — name bar + subtitle bar */}
      <div style={headerWrapperStyle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...barStyle, width: '65%' }} />
          <div style={{ ...barStyle, width: '40%', height: 10, marginTop: 6 }} />
        </div>
      </div>

      {/* Tab strip skeleton */}
      <div style={{ display: 'flex', padding: '0 4px', borderBottom: `1px solid ${colors.border}` }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ ...tabSkeletonStyle, width: 48 + i * 12 }} />
        ))}
      </div>

      {/* Channel list skeleton — category sections with channel rows */}
      {SKELETON_CATEGORIES.map((cat, catIdx) => (
        <div key={catIdx}>
          {/* Category label bar */}
          <div style={{ ...categoryStyle, width: cat.categoryWidth }} />
          {/* Channel rows */}
          {cat.channels.map((nameWidth, chIdx) => (
            <div key={chIdx} style={channelRowStyle}>
              <div style={iconStyle} />
              <div style={{ ...channelNameStyle, maxWidth: nameWidth }} />
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// CommunitySidebar
// ---------------------------------------------------------------------------

/**
 * CommunitySidebar — Community navigation with space tabs and channel list.
 *
 * @remarks
 * This component renders **inside** an existing sidebar container.
 * It composes a community header, horizontal space tabs, and the
 * existing {@link ChannelList} component for channel navigation.
 *
 * @example
 * ```tsx
 * <CommunitySidebar
 *   community={{ name: 'Umbra', subtitle: '128 members' }}
 *   spaces={[
 *     { id: 'general', name: 'General' },
 *     { id: 'dev', name: 'Development', unreadCount: 5 },
 *   ]}
 *   activeSpaceId="general"
 *   onSpaceChange={(id) => setActiveSpace(id)}
 *   categories={channelCategories}
 *   onChannelClick={(ch) => setActiveChannel(ch.id)}
 * />
 * ```
 */
export const CommunitySidebar = forwardRef<HTMLDivElement, CommunitySidebarProps>(
  function CommunitySidebar(
    {
      community,
      spaces,
      activeSpaceId,
      onSpaceChange,
      categories,
      onChannelClick,
      onCategoryToggle,
      onChannelCreate,
      onCommunityClick,
      loading = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [hoveredTab, setHoveredTab] = useState<string | null>(null);

    // ----- Colors -----
    const colors = useMemo(
      () => resolveCommunitySidebarColors(theme),
      [theme],
    );

    // ----- Styles -----
    const containerStyle = useMemo(
      () => buildCommunitySidebarContainerStyle(colors, theme),
      [colors, theme],
    );

    const headerStyle = useMemo(
      () => buildCommunityHeaderStyle(colors, theme),
      [colors, theme],
    );

    const nameStyle = useMemo(
      () => buildCommunityNameStyle(colors, theme),
      [colors, theme],
    );

    const subtitleStyle = useMemo(
      () => buildCommunitySubtitleStyle(colors, theme),
      [colors, theme],
    );

    const tabStripStyle = useMemo(
      () => buildSpaceTabStripStyle(colors, theme),
      [colors, theme],
    );

    const tabScrollStyle = useMemo(
      () => buildSpaceTabScrollStyle(theme),
      [theme],
    );

    const tabIndicatorStyle = useMemo(
      () => buildSpaceTabIndicatorStyle(colors, theme),
      [colors, theme],
    );

    const tabBadgeStyle = useMemo(
      () => buildSpaceTabBadgeStyle(colors, theme),
      [colors, theme],
    );

    const channelListAreaStyle = useMemo(
      () => buildChannelListAreaStyle(theme),
      [theme],
    );

    // ----- Handlers -----
    const handleSpaceChange = useCallback(
      (spaceId: string) => {
        onSpaceChange?.(spaceId);
      },
      [onSpaceChange],
    );

    const handleCommunityClick = useCallback(() => {
      onCommunityClick?.();
    }, [onCommunityClick]);

    // ----- Render -----
    return (
      <div
        ref={ref}
        role="navigation"
        aria-label={`${community.name} community navigation`}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Skeleton state */}
        {skeleton && (
          <CommunitySidebarSkeleton colors={colors} theme={theme} />
        )}

        {!skeleton && (
          <>
            {/* Community header */}
            <div
              role="button"
              tabIndex={0}
              style={headerStyle}
              onClick={handleCommunityClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCommunityClick();
                }
              }}
            >
              {community.icon && (
                <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                  {community.icon}
                </span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={nameStyle}>{community.name}</div>
                {community.subtitle && (
                  <div style={subtitleStyle}>{community.subtitle}</div>
                )}
              </div>
              <ChevronDownIcon size={14} color={colors.headerSubtext} />
            </div>

            {/* Space tab strip */}
            {spaces.length > 1 && (
              <div style={tabStripStyle}>
                <div
                  style={tabScrollStyle}
                  role="tablist"
                  aria-label="Community spaces"
                >
                  {spaces.map((space) => {
                    const isActive = space.id === activeSpaceId;
                    const isHovered = space.id === hoveredTab;
                    const tabStyle = buildSpaceTabStyle(colors, isActive, theme);

                    return (
                      <button
                        key={space.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        tabIndex={isActive ? 0 : -1}
                        style={{
                          ...tabStyle,
                          backgroundColor: isHovered && !isActive
                            ? colors.tabHoverBg
                            : 'transparent',
                        }}
                        onClick={() => handleSpaceChange(space.id)}
                        onMouseEnter={() => setHoveredTab(space.id)}
                        onMouseLeave={() => setHoveredTab(null)}
                      >
                        {space.icon && (
                          <span style={{ display: 'inline-flex' }}>
                            {space.icon}
                          </span>
                        )}
                        {space.name}
                        {(space.unreadCount ?? 0) > 0 && (
                          <span style={tabBadgeStyle}>
                            {space.unreadCount}
                          </span>
                        )}
                        {isActive && <span style={tabIndicatorStyle} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Channel list for active space */}
            <div style={channelListAreaStyle}>
              <ChannelList
                categories={categories}
                onChannelClick={onChannelClick}
                onCategoryToggle={onCategoryToggle}
                onChannelCreate={onChannelCreate}
                loading={loading}
                skeleton={false}
                style={{ height: '100%' }}
              />
            </div>
          </>
        )}
      </div>
    );
  },
);

CommunitySidebar.displayName = 'CommunitySidebar';
