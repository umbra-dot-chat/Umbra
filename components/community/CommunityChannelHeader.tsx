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
import { ChannelHeader, useTheme } from '@coexist/wisp-react-native';
import type { ChannelHeaderType, ChannelHeaderAction } from '@coexist/wisp-react-native';
import type { RightPanel } from '@/types/panels';
import { SearchIcon, PinIcon, UsersIcon, SettingsIcon } from '@/components/icons';

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
  /** Whether the channel is E2EE enabled. @default true */
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
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommunityChannelHeader({
  name,
  type = 'text',
  topic,
  encrypted = true,
  rightPanel,
  togglePanel,
  onSettingsPress,
  onTopicClick,
  skeleton = false,
}: CommunityChannelHeaderProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  // Build action buttons — highlight the active panel
  const actions = useMemo<ChannelHeaderAction[]>(() => {
    const iconColor = themeColors.text.secondary;
    const items: ChannelHeaderAction[] = [
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
    ];

    if (onSettingsPress) {
      items.push({
        key: 'settings',
        label: 'Channel Settings',
        icon: <SettingsIcon size={18} color={iconColor} />,
        onClick: onSettingsPress,
      });
    }

    return items;
  }, [themeColors.text.secondary, rightPanel, togglePanel, onSettingsPress]);

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
