/**
 * @module types/CallControls
 * @description Type definitions for the CallControls component.
 *
 * Provides a row of circular control buttons for audio/video calls
 * (mute, video, screen share, speaker, end call).
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Enums & constants
// ---------------------------------------------------------------------------

export const callTypes = ['audio', 'video'] as const;
export type CallType = (typeof callTypes)[number];

export const callStatuses = [
  'idle',
  'ringing',
  'connecting',
  'connected',
  'reconnecting',
  'ended',
  'failed',
] as const;
export type CallStatus = (typeof callStatuses)[number];

export const participantStatuses = [
  'connecting',
  'connected',
  'muted',
  'speaking',
  'disconnected',
] as const;
export type ParticipantStatus = (typeof participantStatuses)[number];

export const callControlLayouts = ['horizontal', 'compact'] as const;
export type CallControlLayout = (typeof callControlLayouts)[number];

// ---------------------------------------------------------------------------
// Participant
// ---------------------------------------------------------------------------

export interface CallParticipant {
  /** Unique participant identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** Avatar element. */
  avatar?: React.ReactNode;
  /** Whether the participant is muted. */
  isMuted?: boolean;
  /** Whether the participant's camera is off. */
  isVideoOff?: boolean;
  /** Whether the participant is currently speaking. */
  isSpeaking?: boolean;
  /** Whether the participant is sharing their screen. */
  isScreenSharing?: boolean;
  /** Connection status. */
  status?: ParticipantStatus;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CallControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether local microphone is muted. */
  isMuted: boolean;
  /** Whether local camera is off. */
  isVideoOff: boolean;
  /** Whether screen sharing is active. */
  isScreenSharing: boolean;
  /** Whether speaker/audio output is on. */
  isSpeakerOn: boolean;
  /** Toggle microphone mute. */
  onToggleMute: () => void;
  /** Toggle camera on/off. */
  onToggleVideo: () => void;
  /** Toggle screen sharing. */
  onToggleScreenShare: () => void;
  /** Toggle speaker/audio output. */
  onToggleSpeaker: () => void;
  /** End the current call. */
  onEndCall: () => void;
  /** Type of call (audio or video). */
  callType: CallType;
  /** Layout variant. @default 'horizontal' */
  layout?: CallControlLayout;
}
