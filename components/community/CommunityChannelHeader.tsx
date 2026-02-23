/**
 * @module CommunityChannelHeader
 * @description Umbra wrapper around the Wisp ChannelHeader component.
 *
 * Renders a community channel header bar with:
 * - Channel type icon + name
 * - Topic text
 * - E2EE lock indicator (all Umbra community channels are encrypted)
 * - Action buttons: Search, Pinned Messages, Members, Settings cog
 */

import React, { useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { ChannelHeader, useTheme } from '@coexist/wisp-react-native';
import type { ChannelHeaderType, ChannelHeaderAction } from '@coexist/wisp-react-native';
import type { RightPanel } from '@/types/panels';
import { SearchIcon, PinIcon, UsersIcon, SettingsIcon, ArrowLeftIcon } from '@/components/icons';
import { useIsMobile } from '@/hooks/useIsMobile';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CommunityChannelHeaderProps {
  /** Channel display name. */
  name: string;
  /** Channel type (determines the leading icon). @default 'text' */
  type?: ChannelHeaderType;
  /** Channel topic / description text. */
  topic?: string;
  /** Whether the channel is E2EE enabled. @default false */
  encrypted?: boolean;
  /** Currently active right panel (for toggling active states on action buttons). */
  rightPanel: RightPanel;
  /** Toggle a right panel (search, pins, members). */
  togglePanel: (panel: NonNullable<RightPanel>) => void;
  /** Called when the settings cog is pressed. */
  onSettingsPress?: () => void;
  /** Called when the topic area is pressed (e.g. to edit). */
  onTopicClick?: () => void;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
  /** Called when the mobile back button is pressed (navigates back to channel list). */
  onBackPress?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommunityChannelHeader({
  name,
  type = 'text',
  topic,
  encrypted = false,
  rightPanel,
  togglePanel,
  onSettingsPress,
  onTopicClick,
  skeleton = false,
  onBackPress,
}: CommunityChannelHeaderProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const isMobile = useIsMobile();

  // Build action buttons — highlight the active panel
  const actions = useMemo<ChannelHeaderAction[]>(() => {
    const iconColor = themeColors.text.secondary;
    const items: ChannelHeaderAction[] = [];

    // On mobile, only show the members toggle (no search/pins in header to save space)
    if (isMobile) {
      items.push({
        key: 'members',
        label: 'Member List',
        icon: <UsersIcon size={18} color={iconColor} />,
        onClick: () => togglePanel('members'),
        active: rightPanel === 'members',
      });
    } else {
      items.push(
        {
          key: 'search',
          label: 'Search messages',
          icon: <SearchIcon size={18} color={iconColor} />,
          onClick: () => togglePanel('search'),
          active: rightPanel === 'search',
        },
        {
          key: 'pins',
          label: 'Pinned Messages',
          icon: <PinIcon size={18} color={iconColor} />,
          onClick: () => togglePanel('pins'),
          active: rightPanel === 'pins',
        },
        {
          key: 'members',
          label: 'Member List',
          icon: <UsersIcon size={18} color={iconColor} />,
          onClick: () => togglePanel('members'),
          active: rightPanel === 'members',
        },
      );
    }

    if (onSettingsPress) {
      items.push({
        key: 'settings',
        label: 'Channel Settings',
        icon: <SettingsIcon size={18} color={iconColor} />,
        onClick: onSettingsPress,
      });
    }

    return items;
  }, [themeColors.text.secondary, rightPanel, togglePanel, onSettingsPress, isMobile]);

  // On mobile, wrap with a back button
  if (isMobile && onBackPress) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: themeColors.border.subtle, backgroundColor: themeColors.background.surface }}>
        <Pressable
          onPress={onBackPress}
          accessibilityRole="button"
          accessibilityLabel="Back to channels"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <ArrowLeftIcon size={20} color={themeColors.text.secondary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <ChannelHeader
            name={name}
            type={type}
            encrypted={encrypted}
            actions={actions}
            onTopicClick={onTopicClick}
            skeleton={skeleton}
            style={{ borderBottomWidth: 0 }}
          />
        </View>
      </View>
    );
  }

  return (
    <ChannelHeader
      name={name}
      type={type}
      topic={topic}
      encrypted={encrypted}
      actions={actions}
      onTopicClick={onTopicClick}
      skeleton={skeleton}
    />
  );
}
