/**
 * @module core/types
 * @description Framework-agnostic type aliases used across the Wisp core package.
 *
 * These replace React-specific types (e.g. `React.CSSProperties`) so that
 * style builders, variant resolvers, and other core utilities can be consumed
 * by any framework adapter without depending on React's type system.
 */

/**
 * A plain CSS style object compatible with inline styles across all frameworks.
 *
 * @remarks
 * This type intentionally uses a loose signature so that both camelCase
 * (`backgroundColor`) and kebab-case (`background-color`) properties are
 * accepted. Framework adapters may narrow this to their own style types
 * (e.g. `React.CSSProperties`, `StyleValue` in Vue) at the adapter boundary.
 *
 * All style builder functions in `@wisp-ui/core/styles` return this type.
 *
 * @example
 * ```ts
 * import type { CSSStyleObject } from '@wisp-ui/core';
 *
 * const style: CSSStyleObject = {
 *   display: 'flex',
 *   gap: 8,
 *   backgroundColor: '#09090B',
 * };
 * ```
 */
export type CSSStyleObject = Record<string, string | number | undefined>;
