/**
 * @module variants
 * @description Barrel export for the Wisp variant system.
 *
 * Re-exports every variant definition, type, and helper used to configure
 * the visual and semantic properties of Wisp components.
 *
 * @example
 * ```ts
 * import {
 *   type Appearance,
 *   type Size,
 *   type Shape,
 *   type Intent,
 *   type Orientation,
 *   appearances,
 *   sizes,
 *   shapes,
 *   intents,
 *   orientations,
 *   getAppearanceColors,
 *   sizeConfig,
 *   shapeConfig,
 * } from '@wisp/variants';
 * ```
 */

// Appearance ---------------------------------------------------------------
export { appearances, getAppearanceColors } from './appearance';
export type { Appearance, AppearanceColorSet } from './appearance';

// Size ---------------------------------------------------------------------
export { sizes, sizeConfig } from './size';
export type { Size, SizeDimensions } from './size';

// Shape --------------------------------------------------------------------
export { shapes, shapeConfig } from './shape';
export type { Shape } from './shape';

// Intent -------------------------------------------------------------------
export { intents } from './intent';
export type { Intent } from './intent';

// Orientation --------------------------------------------------------------
export { orientations } from './orientation';
export type { Orientation } from './orientation';
