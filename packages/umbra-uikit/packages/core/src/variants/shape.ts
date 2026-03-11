/**
 * @module variants/shape
 * @description Shape (border-radius) variants for Wisp components.
 *
 * A *shape* controls the corner rounding of an element.  Five presets are
 * provided, ranging from fully square corners to fully circular / pill
 * edges.  Components that accept a `shape` prop should look up the
 * corresponding radius value from {@link shapeConfig}.
 */

// ---------------------------------------------------------------------------
// Shape enum
// ---------------------------------------------------------------------------

/**
 * Tuple of all supported shape variant names.
 *
 * Use the {@link Shape} type (derived from this tuple) for prop typing.
 */
export const shapes = ['square', 'soft', 'rounded', 'pill', 'circle'] as const;

/**
 * Union type of all supported shape variant names.
 *
 * @example
 * ```ts
 * interface CardProps {
 *   shape?: Shape; // 'square' | 'soft' | 'rounded' | 'pill' | 'circle'
 * }
 * ```
 */
export type Shape = (typeof shapes)[number];

// ---------------------------------------------------------------------------
// Shape configuration map
// ---------------------------------------------------------------------------

/**
 * Lookup table mapping every {@link Shape} step to a border-radius value
 * (in logical pixels).
 *
 * | Shape     | Radius | Visual                           |
 * | --------- | ------ | -------------------------------- |
 * | `square`  | 0      | Sharp 90-degree corners          |
 * | `soft`    | 4      | Subtle rounding                  |
 * | `rounded` | 8      | Default rounding for cards/btns  |
 * | `pill`    | 9999   | Fully rounded horizontal edges   |
 * | `circle`  | 9999   | Fully rounded (square aspect)    |
 *
 * @remarks
 * `pill` and `circle` both use `9999` because browsers / RN clamp the
 * effective radius to half the element's smallest dimension.  The semantic
 * distinction exists so that components can adjust aspect-ratio or padding
 * when `circle` is requested (e.g. icon-only buttons become square).
 *
 * @example
 * ```ts
 * const radius = shapeConfig['rounded']; // 8
 * ```
 */
export const shapeConfig: Record<Shape, number> = {
  /** 0 px -- sharp corners with no rounding. */
  square: 0,

  /** 4 px -- subtle, barely perceptible rounding. */
  soft: 4,

  /** 8 px -- the default rounding for cards, buttons, and inputs. */
  rounded: 8,

  /** 9999 px -- fully rounded pill shape (horizontal elements). */
  pill: 9999,

  /** 9999 px -- fully rounded circle shape (square aspect elements). */
  circle: 9999,
};
