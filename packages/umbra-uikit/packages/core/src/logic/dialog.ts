/**
 * Dialog -- Pure state logic for modal dialogs.
 *
 * Extracted from the Dialog React component. Contains zero framework
 * dependencies -- every function is a pure transformation of its arguments.
 *
 * @module logic/dialog
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Configuration for a dialog's dismiss behaviour. */
export interface DialogDismissConfig {
  /** Whether the dialog is currently open. */
  open: boolean;
  /** Whether clicking the overlay should close the dialog. */
  closeOnOverlayClick: boolean;
  /** Whether pressing Escape should close the dialog. */
  closeOnEscape: boolean;
}

/** Result of evaluating a potential dismiss event. */
export interface DialogDismissResult {
  /** Whether the dialog should close. */
  shouldClose: boolean;
}

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/**
 * Determines whether a keyboard event should dismiss the dialog.
 *
 * @param key              - The keyboard event `key` string.
 * @param config           - The dialog's dismiss configuration.
 * @returns A {@link DialogDismissResult} indicating whether to close.
 */
export function shouldDismissOnKey(
  key: string,
  config: DialogDismissConfig,
): DialogDismissResult {
  if (!config.open) return { shouldClose: false };
  if (key === 'Escape' && config.closeOnEscape) {
    return { shouldClose: true };
  }
  return { shouldClose: false };
}

/**
 * Determines whether an overlay click should dismiss the dialog.
 *
 * The overlay click only dismisses when the click target IS the overlay
 * itself (not a child element inside the panel).
 *
 * @param isOverlayTarget  - Whether the click landed directly on the overlay element.
 * @param config           - The dialog's dismiss configuration.
 * @returns A {@link DialogDismissResult} indicating whether to close.
 */
export function shouldDismissOnOverlayClick(
  isOverlayTarget: boolean,
  config: DialogDismissConfig,
): DialogDismissResult {
  if (!config.open) return { shouldClose: false };
  if (config.closeOnOverlayClick && isOverlayTarget) {
    return { shouldClose: true };
  }
  return { shouldClose: false };
}

/**
 * Computes the next open state of a dialog.
 *
 * A trivial helper kept for consistency with other state machines -- the
 * dialog is either open or closed, no intermediate states.
 *
 * @param action - `'open'` or `'close'`.
 * @returns The new boolean open state.
 */
export function nextDialogState(action: 'open' | 'close'): boolean {
  return action === 'open';
}

/**
 * Determines whether focus cycling should wrap from the given position.
 *
 * When focus is on the first focusable element and Shift+Tab is pressed,
 * or on the last focusable element and Tab is pressed, focus should wrap.
 *
 * @param key             - The keyboard event `key` string.
 * @param shiftKey        - Whether the Shift modifier is held.
 * @param focusableCount  - Total number of focusable elements in the trap.
 * @param activeIndex     - The index of the currently focused element within the list.
 * @returns An object indicating whether wrapping should occur and the target index.
 */
export function getFocusTrapTarget(
  key: string,
  shiftKey: boolean,
  focusableCount: number,
  activeIndex: number,
): { shouldWrap: boolean; targetIndex: number } {
  if (key !== 'Tab' || focusableCount === 0) {
    return { shouldWrap: false, targetIndex: -1 };
  }

  if (shiftKey && activeIndex === 0) {
    return { shouldWrap: true, targetIndex: focusableCount - 1 };
  }

  if (!shiftKey && activeIndex === focusableCount - 1) {
    return { shouldWrap: true, targetIndex: 0 };
  }

  return { shouldWrap: false, targetIndex: -1 };
}
