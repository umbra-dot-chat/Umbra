/**
 * Tabs -- Pure state logic for tabbed interfaces.
 *
 * Extracted from the Tabs compound component. Contains zero framework
 * dependencies -- every function is a pure transformation of its arguments.
 *
 * @module logic/tabs
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The orientation axis of the tab strip. */
export type TabsOrientation = 'horizontal' | 'vertical';

/** Configuration for resolving the active tab. */
export interface TabsState {
  /** The currently active tab value. */
  activeValue: string;
  /** The layout orientation of the tab strip. */
  orientation: TabsOrientation;
}

/** Result of a keyboard navigation action. */
export interface TabNavResult {
  /** The value of the tab to focus/activate, or `null` if no navigation occurred. */
  nextValue: string | null;
  /** Whether the event should be prevented from its default action. */
  preventDefault: boolean;
}

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/**
 * Resolves the active tab value given controlled and default inputs.
 *
 * @param controlledValue - The externally controlled value (may be `undefined`).
 * @param defaultValue    - The initial default value.
 * @param internalValue   - The current internal (uncontrolled) value.
 * @returns The effective active tab value.
 */
export function resolveActiveTab(
  controlledValue: string | undefined,
  defaultValue: string,
  internalValue: string,
): string {
  if (controlledValue !== undefined) return controlledValue;
  return internalValue || defaultValue;
}

/**
 * Determines whether a given tab value is the currently active one.
 *
 * @param activeValue - The active tab value.
 * @param tabValue    - The value of the tab to test.
 * @returns `true` when the tab is active.
 */
export function isTabActive(activeValue: string, tabValue: string): boolean {
  return activeValue === tabValue;
}

/**
 * Derives a deterministic DOM id for a tab button.
 *
 * @param baseId - Auto-generated base identifier for the Tabs instance.
 * @param value  - The tab's value string.
 * @returns A unique element id.
 */
export function getTabId(baseId: string, value: string): string {
  return baseId + '-tab-' + value;
}

/**
 * Derives a deterministic DOM id for a tab panel.
 *
 * @param baseId - Auto-generated base identifier for the Tabs instance.
 * @param value  - The panel's value string.
 * @returns A unique element id.
 */
export function getPanelId(baseId: string, value: string): string {
  return baseId + '-panel-' + value;
}

/**
 * Computes the next tab index given a keyboard event during tab navigation.
 *
 * Supports:
 * - `ArrowRight` / `ArrowLeft` for horizontal orientation
 * - `ArrowDown` / `ArrowUp` for vertical orientation
 * - `Home` (jump to first) and `End` (jump to last)
 *
 * Navigation wraps around from last to first (and vice versa).
 *
 * @param key          - The keyboard event `key` string.
 * @param currentIndex - The index of the currently focused tab within the enabled set.
 * @param totalCount   - The total number of enabled tabs.
 * @param orientation  - The tab strip orientation.
 * @returns The next index to focus, or `null` if the key is not a navigation key.
 */
export function getNextTabIndex(
  key: string,
  currentIndex: number,
  totalCount: number,
  orientation: TabsOrientation,
): number | null {
  if (totalCount === 0) return null;

  if (orientation === 'horizontal') {
    if (key === 'ArrowRight') return (currentIndex + 1) % totalCount;
    if (key === 'ArrowLeft') return (currentIndex - 1 + totalCount) % totalCount;
  } else {
    if (key === 'ArrowDown') return (currentIndex + 1) % totalCount;
    if (key === 'ArrowUp') return (currentIndex - 1 + totalCount) % totalCount;
  }

  if (key === 'Home') return 0;
  if (key === 'End') return totalCount - 1;

  return null;
}

/**
 * Processes a keyboard event against the tab navigation model and returns
 * a navigation result containing the next tab value (if any).
 *
 * @param key          - The keyboard event `key` string.
 * @param currentIndex - The index of the currently focused tab in the enabled list.
 * @param enabledValues - The ordered list of enabled tab values.
 * @param orientation  - The tab strip orientation.
 * @returns A {@link TabNavResult} describing the navigation outcome.
 */
export function handleTabKeyNavigation(
  key: string,
  currentIndex: number,
  enabledValues: string[],
  orientation: TabsOrientation,
): TabNavResult {
  const nextIndex = getNextTabIndex(key, currentIndex, enabledValues.length, orientation);

  if (nextIndex !== null) {
    return {
      nextValue: enabledValues[nextIndex],
      preventDefault: true,
    };
  }

  return { nextValue: null, preventDefault: false };
}
