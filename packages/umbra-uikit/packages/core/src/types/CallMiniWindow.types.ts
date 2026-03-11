/**
 * @module types/CallMiniWindow
 * @description Type definitions for the CallMiniWindow (picture-in-picture) component.
 *
 * A small floating window that can be dragged and snapped to corners,
 * showing the active call while browsing the app.
 */

import type React from 'react';
import type { CallParticipant, CallType } from './CallControls.types';

// ---------------------------------------------------------------------------
// Snap positions
// ---------------------------------------------------------------------------

export const snapPositions = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] as const;
export type SnapPosition = (typeof snapPositions)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CallMiniWindowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The currently speaking or focused participant. */
  participant: CallParticipant;
  /** The local user's participant info. */
  localParticipant: CallParticipant;
  /** Type of call. */
  callType: CallType;
  /** Call duration in seconds. */
  duration?: number;
  /** Expand to full call screen. */
  onExpand: () => void;
  /** End the call from mini window. */
  onEndCall: () => void;
  /** Current snap position. @default 'bottom-right' */
  snapPosition?: SnapPosition;
  /** Snap position change handler (after drag). */
  onSnapChange?: (position: SnapPosition) => void;
  /** Whether the window can be dragged. @default true */
  draggable?: boolean;
}
