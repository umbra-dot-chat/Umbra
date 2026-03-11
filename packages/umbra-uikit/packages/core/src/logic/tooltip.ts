/**
 * Tooltip -- Pure state logic for hover/focus-triggered tooltips.
 *
 * Extracted from the Tooltip React component. Contains zero framework
 * dependencies -- every function is a pure transformation of its arguments.
 *
 * @module logic/tooltip
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported tooltip placement directions. */
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

/** The state of the tooltip visibility machine. */
export interface TooltipState {
  /** Whether the tooltip is currently visible. */
  isVisible: boolean;
  /** Whether a show-delay timer is currently pending. */
  isDelayPending: boolean;
}

/** Actions that can be dispatched against the tooltip state machine. */
export type TooltipAction =
  | { type: 'SHOW_REQUESTED' }
  | { type: 'SHOW_AFTER_DELAY' }
  | { type: 'HIDE' }
  | { type: 'DISMISS' };

/** Configuration for the tooltip delay behaviour. */
export interface TooltipDelayConfig {
  /** Whether the tooltip is disabled entirely. */
  disabled: boolean;
  /** Delay in milliseconds before the tooltip becomes visible. */
  delay: number;
}

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/**
 * Creates the initial tooltip state.
 *
 * @returns A fresh {@link TooltipState} with the tooltip hidden.
 */
export function createInitialTooltipState(): TooltipState {
  return { isVisible: false, isDelayPending: false };
}

/**
 * Pure reducer for the tooltip state machine.
 *
 * State transitions:
 * - `SHOW_REQUESTED` -- A hover/focus event started. Marks a delay as pending
 *   but does not make the tooltip visible yet.
 * - `SHOW_AFTER_DELAY` -- The delay timer fired. Makes the tooltip visible
 *   and clears the pending flag.
 * - `HIDE` -- A blur/mouseleave event. Hides the tooltip and cancels any
 *   pending delay.
 * - `DISMISS` -- An Escape key press. Immediately hides the tooltip.
 *
 * @param state  - The current tooltip state.
 * @param action - The action to process.
 * @returns The next tooltip state.
 */
export function tooltipReducer(
  state: TooltipState,
  action: TooltipAction,
): TooltipState {
  switch (action.type) {
    case 'SHOW_REQUESTED':
      return { isVisible: false, isDelayPending: true };
    case 'SHOW_AFTER_DELAY':
      return { isVisible: true, isDelayPending: false };
    case 'HIDE':
      return { isVisible: false, isDelayPending: false };
    case 'DISMISS':
      return { isVisible: false, isDelayPending: false };
    default:
      return state;
  }
}

/**
 * Determines whether a show request should be ignored (e.g. when disabled).
 *
 * @param config - The tooltip delay configuration.
 * @returns `true` when the tooltip should not respond to show events.
 */
export function shouldIgnoreShow(config: TooltipDelayConfig): boolean {
  return config.disabled;
}

/**
 * Determines whether a keyboard event should dismiss the tooltip.
 *
 * @param key - The keyboard event `key` string.
 * @returns `true` when the key is `Escape`.
 */
export function shouldDismissTooltip(key: string): boolean {
  return key === 'Escape';
}
