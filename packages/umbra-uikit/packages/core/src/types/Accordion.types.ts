/**
 * Type definitions for the Wisp Accordion primitive.
 *
 * @module primitives/accordion/types
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Accordion Type
// ---------------------------------------------------------------------------

/**
 * Controls whether one or many items can be open simultaneously.
 *
 * - `'single'`   -- at most one item open at a time.
 * - `'multiple'` -- any number of items may be open.
 */
export type AccordionType = 'single' | 'multiple';

// ---------------------------------------------------------------------------
// Component Props
// ---------------------------------------------------------------------------

/** Props for the root {@link Accordion} compound component. */
export interface AccordionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /**
   * Expansion mode -- `"single"` allows one item, `"multiple"` allows many.
   * @default 'single'
   */
  type?: AccordionType;

  /** Controlled open value(s). A string for single mode, `string[]` for multiple. */
  value?: string | string[];

  /** Initial open value(s) for uncontrolled usage. */
  defaultValue?: string | string[];

  /** Callback fired whenever the set of open items changes. */
  onChange?: (value: string | string[]) => void;

  /**
   * Whether all items can be collapsed (none open).
   * @default true
   */
  collapsible?: boolean;
}

/** Props for the {@link AccordionItem} wrapper. */
export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Unique identifier for this accordion section. */
  value: string;

  /**
   * Whether this item is disabled (cannot be toggled).
   * @default false
   */
  disabled?: boolean;
}

/** Props for the {@link AccordionTrigger} button. */
export interface AccordionTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  /** Label content rendered inside the trigger button. */
  children: React.ReactNode;

  /** Custom icon element shown instead of the default chevron. */
  icon?: React.ReactNode;
}

/** Props for the {@link AccordionContent} collapsible panel. */
export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content rendered inside the collapsible region. */
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Context Values
// ---------------------------------------------------------------------------

/** Internal context shared by the root {@link Accordion} with its descendants. */
export interface AccordionContextValue {
  /** Array of currently-open item values. */
  openValues: string[];

  /** Toggles the open state of the item with the given value. */
  toggle: (value: string) => void;

  /** Active expansion mode. */
  type: AccordionType;

  /** Whether all items are allowed to be collapsed simultaneously. */
  collapsible: boolean;
}

/** Internal context shared by an {@link AccordionItem} with its trigger and content. */
export interface AccordionItemContextValue {
  /** The unique value identifying this item. */
  value: string;

  /** Whether this item is currently expanded. */
  isOpen: boolean;

  /** Whether this item is disabled. */
  disabled: boolean;
}
