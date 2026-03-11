/**
 * @module types/ChannelHeader
 * @description Type definitions for the ChannelHeader component —
 * header bar for active community channels with name, topic, and actions.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Channel type
// ---------------------------------------------------------------------------

/** Channel types that determine the icon displayed. */
export type ChannelHeaderType = 'text' | 'voice' | 'announcement' | 'files' | 'bulletin' | 'welcome' | 'thread' | 'forum';

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

/** An action button in the channel header. */
export interface ChannelHeaderAction {
  /** Unique key. */
  key: string;
  /** Tooltip / aria-label. */
  label: string;
  /** Icon element. */
  icon: React.ReactNode;
  /** Click handler. */
  onClick: () => void;
  /** Whether this action is active/toggled. @default false */
  active?: boolean;
  /** Whether this action is disabled. @default false */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the ChannelHeader component.
 */
export interface ChannelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Channel display name. */
  name: string;

  /** Channel type (determines the leading icon). @default 'text' */
  type?: ChannelHeaderType;

  /** Channel topic / description text. */
  topic?: string;

  /** Action buttons displayed on the right side of the header. */
  actions?: ChannelHeaderAction[];

  /** Whether the channel is E2EE enabled (shows a lock icon). @default false */
  encrypted?: boolean;

  /** Whether slow mode is active (shows a clock icon). @default false */
  slowMode?: boolean;

  /** Custom icon override (replaces the type-based icon). */
  icon?: React.ReactNode;

  /** Called when the channel name / topic area is clicked (e.g. to edit). */
  onTopicClick?: () => void;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}
