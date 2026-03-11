/**
 * Badge primitive -- public API surface.
 *
 * @remarks
 * Re-exports the {@link Badge} component, its prop/type definitions, and
 * size/variant/shape token arrays.
 *
 * @module primitives/badge
 */

export { Badge } from './Badge';
export type { BadgeProps, BadgeSize, BadgeVariant, BadgeShape, BadgeSizeConfig } from '@coexist/wisp-core/types/Badge.types';
export { badgeSizes, badgeSizeMap, badgeVariants, badgeShapes } from '@coexist/wisp-core/types/Badge.types';
