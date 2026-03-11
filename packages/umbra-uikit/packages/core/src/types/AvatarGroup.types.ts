import type React from 'react';
import type { AvatarSize } from './Avatar.types';

/**
 * Props accepted by the {@link AvatarGroup} component.
 *
 * @remarks
 * Extends the native `HTMLDivElement` attributes so any standard `div` prop
 * (e.g. `data-*`, event handlers) is also accepted.
 */
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum number of avatars to display before showing the "+N" overflow indicator. */
  max?: number;
  /** Size preset applied to every avatar in the group. @default 'md' */
  size?: AvatarSize;
  /** Overlap spacing in pixels (negative margin between avatars). @default 8 */
  spacing?: number;
  /**
   * When `true`, passes `onSurface` to each child Avatar for dark / raised surfaces.
   * @default false
   */
  onSurface?: boolean;
  /** Avatar elements to render in the group. */
  children: React.ReactNode;
}
