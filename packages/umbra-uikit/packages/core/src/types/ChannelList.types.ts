/**
 * @module types/ChannelList
 * @description Type definitions for the ChannelList component —
 * collapsible category groups with channel items for messaging apps.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/** Channel type determines the icon shown. */
export type ChannelType = 'text' | 'voice' | 'announcement' | 'thread' | 'forum' | 'files' | 'bulletin' | 'welcome';

/** A single channel entry. */
export interface ChannelItem {
  /** Unique identifier. */
  id: string;
  /** Channel display name. */
  name: string;
  /** Channel type. @default 'text' */
  type?: ChannelType;
  /** Whether the channel is currently active/selected. */
  active?: boolean;
  /** Unread message count. */
  unreadCount?: number;
  /** Whether the channel has unread mentions. */
  hasMention?: boolean;
  /** Whether the channel is muted. */
  muted?: boolean;
  /** Optional icon override. */
  icon?: React.ReactNode;
}

/** A category that groups channels. */
export interface ChannelCategory {
  /** Unique identifier. */
  id: string;
  /** Category label (e.g. "TEXT CHANNELS", "VOICE CHANNELS"). */
  label: string;
  /** Channels within this category. */
  channels: ChannelItem[];
  /** Whether the category starts collapsed. @default false */
  collapsed?: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the ChannelList component.
 */
export interface ChannelListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** List of channel categories. */
  categories: ChannelCategory[];

  /** Called when a channel is clicked. */
  onChannelClick?: (channel: ChannelItem) => void;

  /** Called when a category collapse state toggles. */
  onCategoryToggle?: (categoryId: string) => void;

  /** Optional header element above the channel list (e.g. server name). */
  header?: React.ReactNode;

  /** Whether the list is loading. @default false */
  loading?: boolean;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;

  // -- Community space management --

  /** Called when the "create space" button is clicked. */
  onSpaceCreate?: () => void;

  /** Called when spaces are reordered. Receives the new order of category IDs. */
  onSpaceReorder?: (orderedIds: string[]) => void;

  /** Called when a space (category) delete action is triggered. */
  onSpaceDelete?: (categoryId: string) => void;

  /** Called when a channel create action is triggered within a category. */
  onChannelCreate?: (categoryId: string) => void;

  /** Show space management controls (create/delete/reorder). @default false */
  showSpaceManagement?: boolean;
}
