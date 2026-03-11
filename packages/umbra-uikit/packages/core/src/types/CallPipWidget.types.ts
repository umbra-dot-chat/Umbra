/**
 * @module types/CallPipWidget
 * @description Type definitions for the CallPipWidget (picture-in-picture) component.
 *
 * A freely draggable floating widget that displays the active call
 * with video preview, caller info, and quick controls.
 * Unlike CallMiniWindow, this widget does not snap to corners --
 * it stays wherever the user drops it.
 */

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CallPipWidgetProps {
  /** Remote video/audio stream to display. */
  stream: MediaStream | null;
  /** Name of the person on the call. */
  callerName: string;
  /** Call start time (unix ms) for timer display. */
  connectedAt: number | null;
  /** Whether local mic is muted. */
  isMuted: boolean;
  /** Whether local camera is off. */
  isCameraOff: boolean;
  /** Tap the widget to expand/navigate to call. */
  onPress: () => void;
  /** End the call from PiP. */
  onEndCall: () => void;
  /** Toggle mute from PiP. */
  onToggleMute: () => void;
  /** Initial position of the widget. */
  initialPosition?: { x: number; y: number };
}
