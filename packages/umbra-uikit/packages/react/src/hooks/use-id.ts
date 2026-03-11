/**
 * @module hooks/use-id
 * @description Generates a unique, stable ID for accessibility attributes.
 *
 * Uses React 18's `useId` when available for SSR-safe ID generation.
 * Falls back to a simple monotonically increasing counter for older
 * React versions (the counter is not SSR-safe but works for client-only apps).
 *
 * Generated IDs follow the pattern `{prefix}-{unique}` and are guaranteed
 * to be stable across re-renders of the same component instance.
 *
 * @example
 * ```tsx
 * import { useId } from '../hooks';
 *
 * function LabelledInput({ label }: { label: string }) {
 *   const id = useId('wisp-input');
 *
 *   return (
 *     <>
 *       <label htmlFor={id}>{label}</label>
 *       <input id={id} />
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Accessibility: linking a description to a control
 * function DescribedCheckbox() {
 *   const descId = useId('wisp-desc');
 *
 *   return (
 *     <>
 *       <input type="checkbox" aria-describedby={descId} />
 *       <p id={descId}>Receive marketing emails</p>
 *     </>
 *   );
 * }
 * ```
 */

import * as React from 'react';

// ---------------------------------------------------------------------------
// Fallback counter (pre-React 18)
// ---------------------------------------------------------------------------

/**
 * @internal
 * Monotonically increasing counter used when `React.useId` is unavailable.
 */
let idCounter = 0;

/**
 * @internal
 * A hook that returns a stable unique string. Uses a `useRef`-based counter
 * as a fallback for React versions that don't provide `useId`.
 */
function useFallbackId(): string {
  const ref = React.useRef<string | null>(null);
  if (ref.current === null) {
    ref.current = String(++idCounter);
  }
  return ref.current;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Generates a unique, deterministic ID suitable for `id`, `htmlFor`,
 * `aria-labelledby`, `aria-describedby`, and other DOM attributes that
 * require matching identifiers.
 *
 * @param prefix - Optional string prepended to the generated ID.
 *   Defaults to `'wisp'`.
 * @returns A stable unique ID string (e.g. `'wisp-input-:r1:'` or `'wisp-input-3'`).
 *
 * @example
 * ```tsx
 * const id = useId('wisp-input');
 * // React 18+: 'wisp-input-:r1:'
 * // Fallback:  'wisp-input-1'
 * ```
 */
export function useId(prefix: string = 'wisp'): string {
  // Prefer React 18's built-in useId for SSR hydration safety.
  const reactUseId = (React as Record<string, unknown>).useId as
    | (() => string)
    | undefined;

  // We can't conditionally call hooks, but we can conditionally decide which
  // value to use. Both hooks are always called (React rules).
  const react18Id = reactUseId ? reactUseId() : undefined;
  const fallbackId = useFallbackId();

  const uniquePart = react18Id ?? fallbackId;

  return `${prefix}-${uniquePart}`;
}
