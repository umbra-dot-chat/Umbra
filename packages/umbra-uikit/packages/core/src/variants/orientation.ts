/**
 * @module variants/orientation
 * @description Layout orientation variants for Wisp components.
 *
 * An *orientation* controls the primary axis along which child elements are
 * arranged.  Components such as `Stack`, `Divider`, `Tabs`, and `Slider`
 * accept an `orientation` prop to switch between horizontal and vertical
 * layouts.
 */

// ---------------------------------------------------------------------------
// Orientation enum
// ---------------------------------------------------------------------------

/**
 * Tuple of all supported orientation variant names.
 *
 * Use the {@link Orientation} type (derived from this tuple) for prop typing.
 */
export const orientations = ['horizontal', 'vertical'] as const;

/**
 * Union type of all supported orientation variant names.
 *
 * | Orientation    | Layout axis                              |
 * | -------------- | ---------------------------------------- |
 * | `horizontal`   | Children flow along the inline (x) axis  |
 * | `vertical`     | Children flow along the block (y) axis   |
 *
 * @example
 * ```ts
 * interface DividerProps {
 *   orientation?: Orientation; // 'horizontal' | 'vertical'
 * }
 * ```
 */
export type Orientation = (typeof orientations)[number];
