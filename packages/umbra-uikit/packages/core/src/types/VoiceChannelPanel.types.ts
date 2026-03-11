/**
 * @module types/VoiceChannelPanel
 * @description Type definitions for the VoiceChannelPanel component.
 *
 * A bottom bar panel showing the current voice channel connection status,
 * connected participants, and quick controls (mute/deafen/disconnect).
 */

import type React from 'react';
import type { CallParticipant } from './CallControls.types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface VoiceChannelPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Name of the voice channel. */
  channelName: string;
  /** Community or server name. */
  communityName?: string;
  /** Participants currently in the channel. */
  participants: CallParticipant[];
  /** The local user (undefined if not connected). */
  localParticipant?: CallParticipant;
  /** Whether the local user is connected to this channel. */
  isConnected: boolean;
  /** Join the voice channel. */
  onJoin?: () => void;
  /** Leave the voice channel. */
  onLeave?: () => void;
  /** Toggle local microphone mute. */
  onToggleMute?: () => void;
  /** Toggle local deafen state. */
  onToggleDeafen?: () => void;
  /** Whether the local user is muted. */
  isMuted?: boolean;
  /** Whether the local user is deafened. */
  isDeafened?: boolean;
}
