/**
 * DropdownMenu -- Pure state logic for dropdown menu components.
 *
 * Extracted from the DropdownMenu compound component. Contains zero
 * framework dependencies -- every function is a pure transformation of its
 * arguments.
 *
 * @module logic/dropdown-menu
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Represents the current state of the dropdown menu. */
export interface DropdownMenuState {
  /** Whether the menu is currently open. */
  open: boolean;
  /** The index of the currently keyboard-highlighted item (`-1` = none). */
  activeIndex: number;
}

/** Result of processing a keyboard event inside the dropdown. */
export interface DropdownKeyResult {
  /** The new active index (`-1` means none). */
  activeIndex: number;
  /** Whether the menu should close after this event. */
  shouldClose: boolean;
  /** Whether to trigger the click handler on the active item. */
  shouldActivate: boolean;
  /** Whether the default browser behaviour should be prevented. */
  preventDefault: boolean;
  /** Whether focus should return to the trigger element. */
  shouldFocusTrigger: boolean;
}

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/**
 * Toggles the open state of the dropdown menu.
 *
 * @param currentOpen - The current open state.
 * @returns The next open state.
 */
export function toggleDropdown(currentOpen: boolean): boolean {
  return !currentOpen;
}

/**
 * Computes the next state when the dropdown opens or closes.
 *
 * When closing, the active index is always reset to `-1`.
 *
 * @param nextOpen - The desired open state.
 * @returns The new {@link DropdownMenuState}.
 */
export function setDropdownOpen(nextOpen: boolean): DropdownMenuState {
  return {
    open: nextOpen,
    activeIndex: nextOpen ? -1 : -1,
  };
}

/**
 * Processes a keyboard event within the dropdown menu content and returns
 * the resulting navigation / activation state.
 *
 * Handles:
 * - `ArrowDown` -- move highlight forward (wraps).
 * - `ArrowUp` -- move highlight backward (wraps).
 * - `Enter` / `Space` -- activate the highlighted item.
 * - `Escape` -- close the menu and return focus to trigger.
 * - `Tab` -- close the menu.
 *
 * @param key         - The keyboard event `key` string.
 * @param activeIndex - The currently highlighted item index.
 * @param itemCount   - The total number of enabled menu items.
 * @returns A {@link DropdownKeyResult} describing what the component should do.
 */
export function handleDropdownKeyNavigation(
  key: string,
  activeIndex: number,
  itemCount: number,
): DropdownKeyResult {
  const base: DropdownKeyResult = {
    activeIndex,
    shouldClose: false,
    shouldActivate: false,
    preventDefault: false,
    shouldFocusTrigger: false,
  };

  if (itemCount === 0) return base;

  switch (key) {
    case 'ArrowDown': {
      const next = activeIndex < itemCount - 1 ? activeIndex + 1 : 0;
      return { ...base, activeIndex: next, preventDefault: true };
    }
    case 'ArrowUp': {
      const prev = activeIndex > 0 ? activeIndex - 1 : itemCount - 1;
      return { ...base, activeIndex: prev, preventDefault: true };
    }
    case 'Enter':
    case ' ': {
      if (activeIndex >= 0 && activeIndex < itemCount) {
        return { ...base, shouldActivate: true, preventDefault: true };
      }
      return { ...base, preventDefault: true };
    }
    case 'Escape': {
      return {
        ...base,
        shouldClose: true,
        preventDefault: true,
        shouldFocusTrigger: true,
      };
    }
    case 'Tab': {
      return { ...base, shouldClose: true, preventDefault: true };
    }
    default:
      return base;
  }
}

/**
 * Determines whether an outside click should close the dropdown.
 *
 * An outside click is one that lands neither inside the content area
 * nor inside the trigger element.
 *
 * @param clickInsideContent - Whether the click target is inside the content.
 * @param clickInsideTrigger - Whether the click target is inside the trigger.
 * @returns `true` if the menu should close.
 */
export function shouldCloseOnOutsideClick(
  clickInsideContent: boolean,
  clickInsideTrigger: boolean,
): boolean {
  return !clickInsideContent && !clickInsideTrigger;
}
