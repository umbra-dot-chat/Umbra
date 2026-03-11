/**
 * Select -- Pure state logic for single-value dropdown selectors.
 *
 * Extracted from the Select React component. Contains zero framework
 * dependencies -- every function is a pure transformation of its arguments.
 *
 * @module logic/select
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single option in the select dropdown. */
export interface SelectOption {
  /** The option's unique value. */
  value: string;
  /** Display label shown to the user. */
  label: string;
  /** Whether this option is disabled. */
  disabled?: boolean;
}

/** The current state of the select component. */
export interface SelectState {
  /** Whether the dropdown is open. */
  isOpen: boolean;
  /** The currently selected value, or `undefined` if nothing is selected. */
  selectedValue: string | undefined;
  /** The index of the keyboard-highlighted option (`-1` = none). */
  highlightedIndex: number;
}

/** Result of a keyboard navigation action inside the select. */
export interface SelectKeyResult {
  /** The new open state of the dropdown. */
  isOpen: boolean;
  /** The new highlighted index. */
  highlightedIndex: number;
  /** The value that was selected (if a selection occurred), or `null`. */
  selectedValue: string | null;
  /** Whether the default browser behaviour should be prevented. */
  preventDefault: boolean;
  /** Whether focus should return to the trigger. */
  shouldFocusTrigger: boolean;
}

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/**
 * Resolves the effective selected value from controlled/uncontrolled inputs.
 *
 * @param controlledValue - The externally controlled value (may be `undefined`).
 * @param internalValue   - The current internal (uncontrolled) value.
 * @returns The effective selected value.
 */
export function resolveSelectedValue(
  controlledValue: string | undefined,
  internalValue: string | undefined,
): string | undefined {
  return controlledValue !== undefined ? controlledValue : internalValue;
}

/**
 * Toggles the open state of the select dropdown.
 *
 * @param currentOpen - The current open state.
 * @returns A partial state update with the new open flag and a reset highlight.
 */
export function toggleSelect(currentOpen: boolean): Pick<SelectState, 'isOpen' | 'highlightedIndex'> {
  return {
    isOpen: !currentOpen,
    highlightedIndex: -1,
  };
}

/**
 * Finds the currently selected option from the options list.
 *
 * @param options       - The full list of select options.
 * @param selectedValue - The currently selected value.
 * @returns The matching option, or `undefined`.
 */
export function findSelectedOption(
  options: SelectOption[],
  selectedValue: string | undefined,
): SelectOption | undefined {
  return options.find((opt) => opt.value === selectedValue);
}

/**
 * Computes the indices of all enabled (non-disabled) options.
 *
 * @param options - The full list of select options.
 * @returns An array of `{ index, value }` pairs for enabled options.
 */
export function getEnabledOptions(
  options: SelectOption[],
): Array<{ index: number; value: string }> {
  return options
    .map((opt, i) => ({ index: i, value: opt.value, disabled: opt.disabled }))
    .filter((entry) => !entry.disabled)
    .map(({ index, value }) => ({ index, value }));
}

/**
 * Processes a keyboard event against the select state and returns the
 * resulting navigation / selection / open state.
 *
 * Handles:
 * - `ArrowDown`, `Enter`, `Space` when closed -- opens the dropdown.
 * - `ArrowDown` / `ArrowUp` when open -- cycles through enabled options.
 * - `Enter` / `Space` when open -- selects the highlighted option.
 * - `Escape` -- closes the dropdown and returns focus to the trigger.
 *
 * @param key              - The keyboard event `key` string.
 * @param state            - The current {@link SelectState}.
 * @param options          - The full list of options.
 * @returns A {@link SelectKeyResult} describing the next state.
 */
export function handleSelectKeyNavigation(
  key: string,
  state: SelectState,
  options: SelectOption[],
): SelectKeyResult {
  const base: SelectKeyResult = {
    isOpen: state.isOpen,
    highlightedIndex: state.highlightedIndex,
    selectedValue: null,
    preventDefault: false,
    shouldFocusTrigger: false,
  };

  // When closed, certain keys open the dropdown
  if (!state.isOpen) {
    if (key === 'ArrowDown' || key === 'Enter' || key === ' ') {
      return {
        ...base,
        isOpen: true,
        highlightedIndex: 0,
        preventDefault: true,
      };
    }
    return base;
  }

  // Dropdown is open
  const enabled = getEnabledOptions(options);

  switch (key) {
    case 'ArrowDown': {
      const currentPos = enabled.findIndex(
        ({ index }) => index === state.highlightedIndex,
      );
      const next =
        currentPos < enabled.length - 1
          ? enabled[currentPos + 1].index
          : enabled[0].index;
      return { ...base, highlightedIndex: next, preventDefault: true };
    }
    case 'ArrowUp': {
      const currentPos = enabled.findIndex(
        ({ index }) => index === state.highlightedIndex,
      );
      const prev =
        currentPos > 0
          ? enabled[currentPos - 1].index
          : enabled[enabled.length - 1].index;
      return { ...base, highlightedIndex: prev, preventDefault: true };
    }
    case 'Enter':
    case ' ': {
      if (
        state.highlightedIndex >= 0 &&
        !options[state.highlightedIndex]?.disabled
      ) {
        return {
          ...base,
          isOpen: false,
          selectedValue: options[state.highlightedIndex].value,
          preventDefault: true,
          shouldFocusTrigger: true,
        };
      }
      return { ...base, preventDefault: true };
    }
    case 'Escape': {
      return {
        ...base,
        isOpen: false,
        preventDefault: true,
        shouldFocusTrigger: true,
      };
    }
    default:
      return base;
  }
}

/**
 * Determines whether an outside click should close the select dropdown.
 *
 * @param clickInsideTrigger  - Whether the click landed inside the trigger.
 * @param clickInsideDropdown - Whether the click landed inside the dropdown.
 * @returns `true` when the dropdown should close.
 */
export function shouldCloseSelectOnOutsideClick(
  clickInsideTrigger: boolean,
  clickInsideDropdown: boolean,
): boolean {
  return !clickInsideTrigger && !clickInsideDropdown;
}
