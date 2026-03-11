/**
 * @module types/GroupCallPanel
 * @description Type definitions for the unified GroupCallPanel component.
 *
 * Handles both voice-only and video calls with adaptive layouts, speaking
 * indicators, and comprehensive participant state. Inspired by Discord,
 * Google Meet, Telegram, and WhatsApp call UIs.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Layout modes
// ---------------------------------------------------------------------------

/**
 * Available layout modes for the call panel.
 *
 * - `'grid'`      — Equal-sized tiles that auto-scale columns (1→2→3→4).
 * - `'spotlight'`  — One participant large with others in a bottom strip.
 * - `'voice'`     — Voice-only mode with avatar cards in a centered grid.
 * - `'auto'`      — Automatically selects the best layout based on context:
 *                    `voice` when all cameras are off, `spotlight` when one
 *                    person is screen-sharing, `grid` otherwise.
 */
export const groupCallLayouts = ['grid', 'spotlight', 'voice', 'auto'] as const;
export type GroupCallLayout = (typeof groupCallLayouts)[number];

// ---------------------------------------------------------------------------
// View modes (user-switchable)
// ---------------------------------------------------------------------------

/**
 * User-selectable view modes for the grid portion.
 *
 * - `'equal'`     — All tiles equal size (standard grid).
 * - `'speaker'`   — Active speaker gets a larger tile.
 * - `'gallery'`   — Paginated grid view for large calls (future).
 */
export const groupCallViewModes = ['equal', 'speaker', 'gallery'] as const;
export type GroupCallViewMode = (typeof groupCallViewModes)[number];

// ---------------------------------------------------------------------------
// Video aspect
// ---------------------------------------------------------------------------

/**
 * Hints for how a participant's video stream should be displayed.
 *
 * - `'landscape'` — 16:9 horizontal video (default).
 * - `'portrait'`  — 9:16 vertical video (mobile cameras).
 * - `'auto'`      — Detect from stream dimensions.
 */
export const videoAspects = ['landscape', 'portrait', 'auto'] as const;
export type VideoAspect = (typeof videoAspects)[number];

// ---------------------------------------------------------------------------
// Participant
// ---------------------------------------------------------------------------

/**
 * Describes a single participant in the group call.
 */
export interface GroupCallParticipant {
  /** Unique identifier (DID or user ID). */
  did: string;
  /** Display name shown on the tile / avatar card. */
  displayName: string;
  /** Media stream for video (null if audio-only or camera off). */
  stream: MediaStream | null;
  /** Whether the participant's microphone is muted. */
  isMuted: boolean;
  /** Whether the participant's camera is off. */
  isCameraOff: boolean;
  /** Whether the participant is currently speaking (audio level above threshold). */
  isSpeaking?: boolean;
  /** Whether the participant is deafened (cannot hear others). */
  isDeafened?: boolean;
  /** Whether the participant is sharing their screen. */
  isScreenSharing?: boolean;
  /** Avatar URI or element for fallback display. */
  avatar?: string | React.ReactNode;
  /** Hint about the video orientation. @default 'auto' */
  videoAspect?: VideoAspect;
  /** Optional audio level (0–1) for visualizing audio intensity. */
  audioLevel?: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GroupCallPanelProps {
  // -- Participants ----------------------------------------------------------
  /** All participants including the local user. */
  participants: GroupCallParticipant[];
  /** Current user's DID (for identifying self in the participant list). */
  localDid?: string;

  // -- Media state -----------------------------------------------------------
  /** Local camera stream (for self-view tile). */
  localStream: MediaStream | null;
  /** Screen share stream (shown in spotlight or as an extra tile). */
  screenShareStream?: MediaStream | null;
  /** DID of the participant who is currently screen sharing. */
  screenShareDid?: string | null;

  // -- Call metadata ---------------------------------------------------------
  /** Name displayed in the header (group name, channel name, etc.). */
  groupName: string;
  /** Call type hint — controls which buttons appear. */
  callType?: 'audio' | 'video';
  /** DID of the participant who is currently the active speaker. */
  activeSpeakerDid?: string | null;
  /** Unix timestamp (ms) when the call connected. Used for the timer. */
  connectedAt: number | null;
  /** Whether the call is still connecting (shows a loading state). */
  isConnecting?: boolean;
  /** Subtitle text shown under the group name (e.g. "Community • General"). */
  subtitle?: string;

  // -- Local user state ------------------------------------------------------
  /** Whether the local user's microphone is muted. */
  isMuted: boolean;
  /** Whether the local user's camera is off. */
  isCameraOff: boolean;
  /** Whether screen sharing is active from the local user. */
  isScreenSharing: boolean;
  /** Whether the local user is deafened. */
  isDeafened?: boolean;

  // -- Layout ----------------------------------------------------------------
  /**
   * Layout mode for the call panel.
   * @default 'auto'
   */
  layout?: GroupCallLayout;
  /**
   * View mode for grid layout.
   * @default 'equal'
   */
  viewMode?: GroupCallViewMode;
  /**
   * Maximum number of visible participant tiles before showing overflow count.
   * @default 25
   */
  maxVisible?: number;

  // -- Callbacks -------------------------------------------------------------
  /** Toggle local microphone mute. */
  onToggleMute: () => void;
  /** Toggle local camera on/off. */
  onToggleCamera: () => void;
  /** End or leave the call. */
  onEndCall: () => void;
  /** Switch between front/back camera (mobile). */
  onSwitchCamera?: () => void;
  /** Toggle screen sharing. */
  onToggleScreenShare?: () => void;
  /** Toggle deafen state. */
  onToggleDeafen?: () => void;
  /** Callback when a participant tile is clicked (for spotlight selection). */
  onParticipantClick?: (participantDid: string) => void;
  /** Callback to change the layout mode. */
  onLayoutChange?: (layout: GroupCallLayout) => void;

  // -- Customization ---------------------------------------------------------
  /** Custom style override. */
  style?: React.CSSProperties;
  /** CSS class name. */
  className?: string;
  /** Whether to hide the top bar. @default false */
  hideHeader?: boolean;
  /** Whether to hide participant names on tiles. @default false */
  hideNames?: boolean;
  /** Whether to show the call timer. @default true */
  showTimer?: boolean;
}
