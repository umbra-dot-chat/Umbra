/**
 * Accordion -- Pure state logic for collapsible content sections.
 *
 * Extracted from the Accordion compound component. Contains zero framework
 * dependencies -- every function is a pure transformation of its arguments.
 *
 * @module logic/accordion
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The expansion mode of the accordion. */
export type AccordionType = 'single' | 'multiple';

/** Configuration for a toggle operation. */
export interface AccordionToggleConfig {
  /** Whether only one item can be open at a time (`single`) or many (`multiple`). */
  type: AccordionType;
  /** Whether all items can be collapsed. When `false` at least one item stays open. */
  collapsible: boolean;
  /** The currently open item value(s). */
  current: string[];
  /** The value of the item being toggled. */
  itemValue: string;
}

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/**
 * Normalises an accordion value prop into a consistent `string[]`.
 *
 * @param value - A single string, array of strings, or `undefined`.
 * @returns An array of currently-open item values.
 */
export function normalizeValue(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

/**
 * Returns whether a specific accordion item is currently open.
 *
 * @param openValues - The array of currently-open item values.
 * @param itemValue  - The value to check.
 * @returns `true` when `itemValue` appears in `openValues`.
 */
export function isItemOpen(openValues: string[], itemValue: string): boolean {
  return openValues.includes(itemValue);
}

/**
 * Computes the next set of open values after toggling an item.
 *
 * Faithfully mirrors the toggle logic from the Accordion React component:
 *
 * - **Single mode**: opening an item closes all others. Closing the last open
 *   item is only allowed when `collapsible` is `true`.
 * - **Multiple mode**: items toggle independently. The last remaining open
 *   item can only be closed when `collapsible` is `true` (or when more than
 *   one item is open).
 *
 * @param config - {@link AccordionToggleConfig} describing the current state.
 * @returns The new array of open item values.
 */
export function toggleAccordion(config: AccordionToggleConfig): string[] {
  const { type, collapsible, current, itemValue } = config;
  const isOpen = current.includes(itemValue);

  if (type === 'single') {
    if (isOpen) {
      return collapsible ? [] : current;
    }
    return [itemValue];
  }

  // multiple
  if (isOpen) {
    return collapsible || current.length > 1
      ? current.filter((v) => v !== itemValue)
      : current;
  }
  return [...current, itemValue];
}

/**
 * Formats the value to pass to an external `onChange` callback after a toggle.
 *
 * - In `single` mode the callback receives the first open value as a `string`
 *   (or `''` when nothing is open).
 * - In `multiple` mode the callback receives the full `string[]`.
 *
 * @param type       - The accordion expansion mode.
 * @param nextValues - The new array of open values produced by {@link toggleAccordion}.
 * @returns The value suitable for the component's `onChange` prop.
 */
export function formatOnChangeValue(
  type: AccordionType,
  nextValues: string[],
): string | string[] {
  return type === 'single' ? (nextValues[0] ?? '') : nextValues;
}
