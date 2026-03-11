/**
 * @module types/FormatToolbar
 * @description Type definitions for the FormatToolbar component.
 */

/** Available formatting actions. */
export const formatActions = [
  'bold',
  'italic',
  'strikethrough',
  'code',
  'codeBlock',
  'quote',
  'orderedList',
  'unorderedList',
  'link',
] as const;

export type FormatAction = (typeof formatActions)[number];

/**
 * Props for the FormatToolbar component.
 *
 * @remarks
 * Renders a horizontal toolbar with formatting action buttons.
 * Designed to sit above or inside a message input, providing
 * rich text formatting options similar to Slack and Discord.
 */
export interface FormatToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Called when a format action button is clicked. */
  onAction: (action: FormatAction) => void;

  /** Set of currently active formatting states (e.g. bold is on). */
  activeFormats?: Set<FormatAction>;

  /** Actions to show. Defaults to all actions. */
  visibleActions?: FormatAction[];

  /** Actions to disable. */
  disabledActions?: Set<FormatAction>;

  /** Size of the toolbar buttons. @default 'md' */
  size?: 'sm' | 'md';

  /** Whether the toolbar is disabled. @default false */
  disabled?: boolean;
}
