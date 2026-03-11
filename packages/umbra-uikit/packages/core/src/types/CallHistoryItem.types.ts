/**
 * @module types/CallHistoryItem
 * @description Type definitions for the CallHistoryItem component —
 * a rich list item for displaying call history entries.
 */

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export const CALL_HISTORY_STATUSES = ['completed', 'missed', 'declined', 'cancelled'] as const;
export type CallHistoryStatus = (typeof CALL_HISTORY_STATUSES)[number];

// ---------------------------------------------------------------------------
// Direction
// ---------------------------------------------------------------------------

export const CALL_HISTORY_DIRECTIONS = ['incoming', 'outgoing'] as const;
export type CallHistoryDirection = (typeof CALL_HISTORY_DIRECTIONS)[number];

// ---------------------------------------------------------------------------
// Type
// ---------------------------------------------------------------------------

export const CALL_HISTORY_TYPES = ['voice', 'video'] as const;
export type CallHistoryType = (typeof CALL_HISTORY_TYPES)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the CallHistoryItem component.
 *
 * @remarks
 * Used inside a call history list to represent a past call. Shows an avatar,
 * caller name, call type icon, direction arrow, status with color coding,
 * duration, timestamp, and a callback button.
 */
export interface CallHistoryItemProps {
  /** Display name of the caller. */
  callerName: string;

  /** Avatar element (typically an `<Avatar>` component). */
  callerAvatar?: React.ReactNode;

  /** Whether the call was voice or video. */
  callType: CallHistoryType;

  /** Whether the call was incoming or outgoing. */
  direction: CallHistoryDirection;

  /** Outcome status of the call. */
  status: CallHistoryStatus;

  /** Duration of the call in seconds. Only relevant for completed calls. */
  duration?: number;

  /** Formatted time string (e.g. "2m ago", "Yesterday", "3:42 PM"). */
  timestamp: string;

  /** Called when the row is pressed. */
  onPress?: () => void;

  /** Called when the callback button is pressed. */
  onCallBack?: () => void;
}
