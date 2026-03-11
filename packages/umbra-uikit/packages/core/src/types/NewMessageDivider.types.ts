import type React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link NewMessageDivider} component.
 *
 * @remarks
 * A horizontal divider that marks the boundary between read and unread
 * messages in a chat conversation. Renders a colored line with a small
 * centered label (e.g. "New").
 *
 * Extends the native `<div>` element attributes and renders with
 * `role="separator"`.
 */
export interface NewMessageDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Label text displayed in the center of the divider.
   * @default 'New'
   */
  label?: string;

  /**
   * Optional color override for the line and label text.
   * Defaults to the theme's `status.danger` color (red).
   */
  color?: string;
}
