/**
 * @module types/CommunitySidebar
 * @description Type definitions for the CommunitySidebar component —
 * community navigation panel with space tabs and channel list.
 *
 * Renders inside an existing sidebar container. Provides tabbed
 * space navigation at the top and a ChannelList for the active space.
 */

import type React from 'react';
import type { ChannelCategory, ChannelItem } from './ChannelList.types';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/** A community space (organisational group within a community). */
export interface CommunitySpace {
  /** Unique identifier. */
  id: string;
  /** Display name shown in the space tab. */
  name: string;
  /** Optional icon rendered in the tab. */
  icon?: React.ReactNode;
  /** Total unread count across all channels in this space. */
  unreadCount?: number;
}

/** Community metadata shown in the header area. */
export interface CommunityInfo {
  /** Community display name. */
  name: string;
  /** Optional icon/avatar element. */
  icon?: React.ReactNode;
  /** Optional subtitle (e.g. member count). */
  subtitle?: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the CommunitySidebar component.
 *
 * @remarks
 * This component is designed to render **inside** an existing sidebar
 * layout. It does not provide its own sidebar chrome — only the
 * community header, space tab strip, and active-space channel list.
 */
export interface CommunitySidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Community metadata for the header area. */
  community: CommunityInfo;

  /** Available spaces within the community. */
  spaces: CommunitySpace[];

  /** The currently active space ID. */
  activeSpaceId: string;

  /** Called when the user selects a different space tab. */
  onSpaceChange?: (spaceId: string) => void;

  /** Channel categories for the currently active space. */
  categories: ChannelCategory[];

  /** Called when a channel is clicked. */
  onChannelClick?: (channel: ChannelItem) => void;

  /** Called when a category collapse state toggles. */
  onCategoryToggle?: (categoryId: string) => void;

  /** Called when the "create channel" button (+) is clicked in a category header. */
  onChannelCreate?: (categoryId: string) => void;

  /** Called when the community header/name is clicked (e.g. open settings). */
  onCommunityClick?: () => void;

  /** Whether the channel list is loading. @default false */
  loading?: boolean;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}
