/**
 * @module components/video-grid
 * @description Type definitions for the VideoGrid component.
 *
 * A responsive grid layout for video call participants with grid and spotlight modes.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Layouts
// ---------------------------------------------------------------------------

/** Available layout modes for the video grid. */
export const videoGridLayouts = ['grid', 'spotlight'] as const;

/** Union of valid layout values. */
export type VideoGridLayout = (typeof videoGridLayouts)[number];

// ---------------------------------------------------------------------------
// Participant
// ---------------------------------------------------------------------------

/**
 * Describes a single participant in the video grid.
 */
export interface VideoParticipant {
  /** Unique identifier for this participant. */
  id: string;
  /** Display name shown on the tile. */
  name: string;
  /** Optional avatar element rendered when camera is off. */
  avatar?: React.ReactNode;
  /** Video stream element (e.g. a `<video>` tag or custom renderer). */
  videoStream?: React.ReactNode;
  /** Whether the participant's microphone is muted. */
  isMuted?: boolean;
  /** Whether the participant has deafened (cannot hear). */
  isDeafened?: boolean;
  /** Whether the participant is currently speaking. */
  isSpeaking?: boolean;
  /** Whether the participant is sharing their screen. */
  isScreenSharing?: boolean;
  /** Whether the participant's camera is off. */
  isCameraOff?: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link VideoGrid} component.
 *
 * @remarks
 * Extends the native `<div>` element attributes so any valid HTML div
 * prop (e.g. `aria-*`, `data-*`, `onClick`) can be forwarded.
 */
export interface VideoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of participants to display in the grid. */
  participants: VideoParticipant[];

  /**
   * Layout mode for the grid.
   * - `'grid'`: Equal-sized tiles that auto-scale column count based on participant count.
   * - `'spotlight'`: One participant large with others in a strip below.
   * @default 'grid'
   */
  layout?: VideoGridLayout;

  /**
   * ID of the participant to spotlight.
   * Only used when `layout` is `'spotlight'`.
   */
  spotlightId?: string;

  /** Callback fired when a participant tile is clicked. */
  onParticipantClick?: (participantId: string) => void;

  /**
   * Maximum number of visible participant tiles before overflow.
   * @default 25
   */
  maxVisible?: number;

  /**
   * Whether to show a "+N" overflow count when participants exceed `maxVisible`.
   * @default true
   */
  showOverflowCount?: boolean;

  /**
   * When `true`, renders a pulsing skeleton placeholder instead of content.
   * @default false
   */
  skeleton?: boolean;
}
