/**
 * @module components/community-sidebar
 * @description React Native CommunitySidebar for the Wisp design system.
 *
 * Renders inside an existing sidebar/navigation container. Provides a
 * community header, horizontal space tab strip, and ChannelList for
 * the active space.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle, GestureResponderEvent } from 'react-native';

/**
 * Creates a web-compatible onContextMenu handler that maps right-click
 * to the same handler used for mobile long-press.
 * Returns undefined on non-web platforms.
 */
function webContextMenu(handler: ((e: GestureResponderEvent) => void) | undefined) {
  if (Platform.OS !== 'web' || !handler) return undefined;
  return (e: any) => {
    e.preventDefault();
    const syntheticEvent = {
      nativeEvent: {
        pageX: e.clientX ?? e.pageX ?? 0,
        pageY: e.clientY ?? e.pageY ?? 0,
        locationX: 0,
        locationY: 0,
        target: e.target,
        identifier: 0,
        timestamp: Date.now(),
      },
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
    } as unknown as GestureResponderEvent;
    handler(syntheticEvent);
  };
}
import type { CommunitySpace, CommunityInfo } from '@coexist/wisp-core/types/CommunitySidebar.types';
import type { ChannelCategory, ChannelItem } from '@coexist/wisp-core/types/ChannelList.types';
import { resolveCommunitySidebarColors } from '@coexist/wisp-core/styles/CommunitySidebar.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { ChannelList } from '../channel-list';
import { useTheme } from '../../providers';
import Svg, { Polyline } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props (RN-specific override — ViewProps instead of HTMLAttributes)
// ---------------------------------------------------------------------------

export interface CommunitySidebarProps extends ViewProps {
  community: CommunityInfo;
  spaces: CommunitySpace[];
  activeSpaceId: string;
  onSpaceChange?: (spaceId: string) => void;
  /** Called when a space tab is long-pressed (context menu). */
  onSpaceLongPress?: (spaceId: string, event: GestureResponderEvent) => void;
  /** Called to create a new space. Shows "+" tab when provided. */
  onSpaceCreate?: () => void;
  categories: ChannelCategory[];
  onChannelClick?: (channel: ChannelItem) => void;
  /** Called when a channel is long-pressed (context menu). */
  onChannelLongPress?: (channel: ChannelItem, event: GestureResponderEvent) => void;
  onCategoryToggle?: (categoryId: string) => void;
  /** Called when a category is long-pressed (context menu). */
  onCategoryLongPress?: (categoryId: string, event: GestureResponderEvent) => void;
  onChannelCreate?: (categoryId: string) => void;
  onCommunityClick?: () => void;
  /** Enable drag-and-drop reordering of channels and categories. @default false */
  draggable?: boolean;
  /** Called when a channel is dropped to a new position/category. */
  onChannelReorder?: (channelId: string, targetCategoryId: string | null, newIndex: number) => void;
  /** Called when a category header is dropped to a new position. */
  onCategoryReorder?: (categoryId: string, newIndex: number) => void;
  /** Called when the sidebar background is long-pressed / right-clicked (empty area context menu). */
  onSidebarLongPress?: (event: GestureResponderEvent) => void;
  loading?: boolean;
  skeleton?: boolean;
  /** Render extra content below a channel row (e.g. voice channel participants). */
  renderChannelExtra?: (channel: ChannelItem) => React.ReactNode;
  /** Override the default channel icon. Receives the channel and default icon element. */
  renderChannelIcon?: (channel: ChannelItem, defaultIcon: React.ReactNode) => React.ReactNode;
}

// ---------------------------------------------------------------------------
// Inline SVG icon
// ---------------------------------------------------------------------------

function ChevronDownIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? '#888'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline points="6 9 12 15 18 9" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// CommunitySidebar
// ---------------------------------------------------------------------------

export const CommunitySidebar = forwardRef<View, CommunitySidebarProps>(
  function CommunitySidebar(
    {
      community,
      spaces,
      activeSpaceId,
      onSpaceChange,
      onSpaceLongPress,
      onSpaceCreate,
      categories,
      onChannelClick,
      onChannelLongPress,
      onCategoryToggle,
      onCategoryLongPress,
      onChannelCreate,
      onCommunityClick,
      draggable,
      onChannelReorder,
      onCategoryReorder,
      onSidebarLongPress,
      loading = false,
      skeleton = false,
      renderChannelExtra,
      renderChannelIcon,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const colors = useMemo(
      () => resolveCommunitySidebarColors(theme),
      [theme],
    );

    // ----- Styles -----
    const containerStyle = useMemo<ViewStyle>(
      () => ({
        flex: 1,
        backgroundColor: 'transparent',
      }),
      [colors],
    );

    const headerStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.sm,
        paddingHorizontal: defaultSpacing.md,
        paddingVertical: defaultSpacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        height: 56,
        minHeight: 56,
      }),
      [colors],
    );

    const nameStyle = useMemo<TextStyle>(
      () => ({
        fontSize: defaultTypography.sizes.base.fontSize,
        fontWeight: defaultTypography.weights.bold,
        color: colors.headerText,
        flex: 1,
      }),
      [colors],
    );

    const subtitleStyle = useMemo<TextStyle>(
      () => ({
        fontSize: defaultTypography.sizes.xs.fontSize,
        fontWeight: defaultTypography.weights.regular,
        color: colors.headerSubtext,
      }),
      [colors],
    );

    const tabStripStyle = useMemo<ViewStyle>(
      () => ({
        borderBottomWidth: 1,
        borderBottomColor: colors.tabBorder,
        paddingHorizontal: defaultSpacing.sm,
      }),
      [colors],
    );

    const tabBadgeStyle = useMemo<ViewStyle>(
      () => ({
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        paddingHorizontal: 4,
        backgroundColor: colors.badgeBg,
        alignItems: 'center',
        justifyContent: 'center',
      }),
      [colors],
    );

    // ----- Handlers -----
    const handleSpaceChange = useCallback(
      (spaceId: string) => onSpaceChange?.(spaceId),
      [onSpaceChange],
    );

    const handleCommunityClick = useCallback(
      () => onCommunityClick?.(),
      [onCommunityClick],
    );

    // ----- Skeleton -----
    if (skeleton) {
      const skeletonBar = {
        height: 14,
        borderRadius: defaultRadii.sm,
        backgroundColor: colors.border,
      };

      const skeletonCategories = [
        { catWidth: '45%', channels: ['70%', '55%', '80%'] },
        { catWidth: '55%', channels: ['60%', '75%', '50%', '65%'] },
        { catWidth: '35%', channels: ['65%'] },
      ] as const;

      return (
        <View ref={ref} style={[containerStyle, userStyle]} {...rest}>
          {/* Header skeleton — name + subtitle */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: defaultSpacing.sm,
              padding: defaultSpacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              height: 56,
              minHeight: 56,
            }}
          >
            <View style={{ flex: 1 }}>
              <View style={{ ...skeletonBar, width: '65%' }} />
              <View style={{ ...skeletonBar, width: '40%', height: 10, marginTop: 6 }} />
            </View>
          </View>

          {/* Tab strip skeleton */}
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: defaultSpacing.xs,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            {[48, 60, 48].map((w, i) => (
              <View
                key={i}
                style={{
                  height: 10,
                  width: w,
                  borderRadius: defaultRadii.sm,
                  backgroundColor: colors.border,
                  margin: defaultSpacing.xs,
                }}
              />
            ))}
          </View>

          {/* Channel list skeleton — categories with channel rows */}
          {skeletonCategories.map((cat, catIdx) => (
            <View key={catIdx}>
              {/* Category label bar */}
              <View
                style={{
                  height: 8,
                  width: cat.catWidth,
                  borderRadius: defaultRadii.sm,
                  backgroundColor: colors.border,
                  marginTop: defaultSpacing.sm,
                  marginBottom: defaultSpacing.xs,
                  marginHorizontal: defaultSpacing.md,
                }}
              />
              {/* Channel rows */}
              {cat.channels.map((nameWidth, chIdx) => (
                <View
                  key={chIdx}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: defaultSpacing.sm,
                    paddingVertical: defaultSpacing.xs,
                    paddingHorizontal: defaultSpacing.md,
                    marginVertical: 1,
                    marginHorizontal: defaultSpacing.sm,
                    minHeight: 28,
                  }}
                >
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: defaultRadii.sm,
                      backgroundColor: colors.border,
                      flexShrink: 0,
                    }}
                  />
                  <View
                    style={{
                      height: 12,
                      maxWidth: nameWidth,
                      borderRadius: defaultRadii.sm,
                      backgroundColor: colors.border,
                      flex: 1,
                    }}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }

    // Web context menu for the sidebar background (empty area)
    const sidebarCtxHandler = webContextMenu(onSidebarLongPress);
    const sidebarWebProps = sidebarCtxHandler
      ? { onContextMenu: sidebarCtxHandler } as any
      : {};

    // ----- Render -----
    return (
      <View
        ref={ref}
        style={[containerStyle, userStyle]}
        accessibilityRole="menu"
        accessibilityLabel={`${community.name} community navigation`}
        {...sidebarWebProps}
        {...rest}
      >
        {/* Community header */}
        <Pressable
          style={headerStyle}
          onPress={handleCommunityClick}
          accessibilityRole="button"
          accessibilityLabel={`${community.name} settings`}
        >
          {community.icon && (
            <View style={{ flexShrink: 0 }}>{community.icon}</View>
          )}
          <View style={{ flex: 1, minWidth: 0, paddingRight: 36 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ ...nameStyle, flex: undefined, flexShrink: 1 }} numberOfLines={1}>
                {community.name}
              </Text>
              <View style={{ flexShrink: 0 }}>
                <ChevronDownIcon size={14} color={colors.headerSubtext} />
              </View>
            </View>
            {community.subtitle ? (
              <Text style={subtitleStyle} numberOfLines={1}>
                {community.subtitle}
              </Text>
            ) : null}
          </View>
        </Pressable>

        {/* Space tab strip */}
        {(spaces.length > 1 || onSpaceCreate) && (
          <View
            style={[tabStripStyle, { flexDirection: 'row', overflow: 'hidden' }]}
          >
            {spaces.map((space) => {
              const isActive = space.id === activeSpaceId;
              // Web context menu for space tab right-click
              const spaceCtxHandler = onSpaceLongPress
                ? webContextMenu((e) => onSpaceLongPress(space.id, e))
                : undefined;
              const spaceWebProps = spaceCtxHandler
                ? { onContextMenu: spaceCtxHandler } as any
                : {};
              return (
                <Pressable
                  key={space.id}
                  onPress={() => handleSpaceChange(space.id)}
                  onLongPress={onSpaceLongPress ? (e) => onSpaceLongPress(space.id, e) : undefined}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: defaultSpacing.xs,
                    paddingHorizontal: defaultSpacing.md,
                    paddingVertical: defaultSpacing.md,
                    position: 'relative',
                  }}
                  {...spaceWebProps}
                >
                  {space.icon && <View>{space.icon}</View>}
                  <Text
                    style={{
                      fontSize: defaultTypography.sizes.sm.fontSize,
                      fontWeight: isActive
                        ? defaultTypography.weights.semibold
                        : defaultTypography.weights.medium,
                      color: isActive ? colors.tabTextActive : colors.tabText,
                    }}
                    numberOfLines={1}
                  >
                    {space.name}
                  </Text>
                  {(space.unreadCount ?? 0) > 0 && (
                    <View style={tabBadgeStyle}>
                      <Text
                        style={{
                          fontSize: defaultTypography.sizes['2xs'].fontSize,
                          fontWeight: defaultTypography.weights.semibold,
                          color: colors.badgeText,
                        }}
                      >
                        {space.unreadCount}
                      </Text>
                    </View>
                  )}
                  {/* Active indicator bar */}
                  {isActive && (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        backgroundColor: colors.tabIndicator,
                        borderRadius: defaultRadii.sm,
                      }}
                    />
                  )}
                </Pressable>
              );
            })}
            {/* Create space "+" tab */}
            {onSpaceCreate && (
              <Pressable
                onPress={onSpaceCreate}
                accessibilityRole="button"
                accessibilityLabel="Create space"
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: defaultSpacing.sm,
                  paddingVertical: defaultSpacing.md,
                }}
              >
                <Text style={{ fontSize: 16, color: colors.tabText, fontWeight: '500' }}>+</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Channel list for active space */}
        <View style={{ flex: 1 }}>
          <ChannelList
            categories={categories}
            onChannelClick={onChannelClick}
            onChannelLongPress={onChannelLongPress}
            onCategoryToggle={onCategoryToggle}
            onCategoryLongPress={onCategoryLongPress}
            onChannelCreate={onChannelCreate}
            draggable={draggable}
            onChannelReorder={onChannelReorder}
            onCategoryReorder={onCategoryReorder}
            renderChannelExtra={renderChannelExtra}
            renderChannelIcon={renderChannelIcon}
            loading={loading}
            skeleton={false}
          />
        </View>
      </View>
    );
  },
);

CommunitySidebar.displayName = 'CommunitySidebar';
