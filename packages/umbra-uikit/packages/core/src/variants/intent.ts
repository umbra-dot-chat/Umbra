/**
 * @module variants/intent
 * @description Semantic intent variants for Wisp components.
 *
 * An *intent* communicates the **purpose** or **outcome** of an action to
 * the user through colour coding (e.g. a red "danger" button for destructive
 * operations).  Unlike {@link Appearance}, which controls the overall visual
 * treatment (filled, ghost, outlined), intent is purely semantic and maps
 * directly to the theme's status color group.
 *
 * Components that surface both `appearance` and `intent` props can combine
 * them freely -- for example a `ghost` appearance with a `danger` intent
 * renders transparent with red text.
 */

// ---------------------------------------------------------------------------
// Intent enum
// ---------------------------------------------------------------------------

/**
 * Tuple of all supported intent variant names.
 *
 * Use the {@link Intent} type (derived from this tuple) for prop typing.
 */
export const intents = [
  'neutral',
  'success',
  'warning',
  'danger',
  'info',
] as const;

/**
 * Union type of all supported intent variant names.
 *
 * | Intent    | Semantic meaning                        |
 * | --------- | --------------------------------------- |
 * | `neutral` | No special connotation (default)        |
 * | `success` | Positive outcome / confirmation         |
 * | `warning` | Cautionary / requires attention          |
 * | `danger`  | Destructive / irreversible action        |
 * | `info`    | Informational / supplementary context    |
 *
 * @example
 * ```ts
 * interface AlertProps {
 *   intent?: Intent; // 'neutral' | 'success' | 'warning' | 'danger' | 'info'
 * }
 * ```
 */
export type Intent = (typeof intents)[number];
