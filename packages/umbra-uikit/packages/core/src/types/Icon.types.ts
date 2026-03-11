/**
 * Type definitions for the Wisp Icon primitive.
 *
 * @remarks
 * Re-exports shared size and color tokens under Icon-specific aliases
 * and defines the {@link IconProps} interface consumed by the
 * {@link Icon} component.
 *
 * @module primitives/icon
 */

import type React from 'react';
import type { SemanticColor, ComponentSize } from '../tokens/shared';

/** Available semantic color names re-exported for Icon consumers. */
export { semanticColors as iconColors, componentSizes as iconSizes } from '../tokens/shared';

/** Semantic color union aliased for Icon usage. */
export type { SemanticColor as IconColor, ComponentSize as IconSize } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Icon size → pixel map
// ---------------------------------------------------------------------------

/**
 * Maps component sizes to actual icon pixel dimensions.
 * Aligns with Text's icon sizes for consistent pairing.
 */
export const iconSizeMap: Record<ComponentSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Icon} component.
 *
 * @remarks
 * Extends standard `HTMLSpanElement` attributes (with `color` omitted to
 * avoid conflict with the semantic color prop). A bare minimum usage only
 * requires the `icon` prop; all other props have sensible defaults.
 */
export interface IconProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'> {
  /**
   * The Lucide React icon component to render.
   * Pass the component itself — NOT a JSX element.
   *
   * @example
   * ```tsx
   * import { Search } from 'lucide-react';
   * <Icon icon={Search} />
   * ```
   */
  icon: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number | string; className?: string; style?: React.CSSProperties }>;

  /** Icon size. @default 'md' */
  size?: ComponentSize;

  /**
   * Semantic color variant. Maps to theme-aware colors.
   * Pass a raw hex string to override entirely.
   * Defaults to 'currentColor' (inherits from parent text).
   * @default 'currentColor'
   */
  color?: SemanticColor | 'currentColor' | (string & {});

  /** Lucide stroke width. @default 2 */
  strokeWidth?: number;

  /** Show a skeleton shimmer placeholder instead of the icon. */
  skeleton?: boolean;

  /** Accessible label for the icon. If not set, icon is decorative (aria-hidden). */
  label?: string;
}
