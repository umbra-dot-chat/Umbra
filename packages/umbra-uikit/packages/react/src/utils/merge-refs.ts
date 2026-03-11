/**
 * @module utils/merge-refs
 * @description Utility to merge multiple React refs into a single callback ref.
 *
 * When building compound or forwarded-ref components it is common to need
 * both an internal ref *and* a forwarded ref attached to the same DOM node.
 * `mergeRefs` combines any number of `RefObject`s and callback refs into
 * one `RefCallback` that updates them all.
 *
 * @example
 * ```tsx
 * import { mergeRefs } from '../utils/merge-refs';
 * import { useRef, forwardRef } from 'react';
 *
 * const FancyInput = forwardRef<HTMLInputElement, {}>((props, forwardedRef) => {
 *   const internalRef = useRef<HTMLInputElement>(null);
 *   return <input ref={mergeRefs(internalRef, forwardedRef)} {...props} />;
 * });
 * ```
 */

import type { Ref, RefCallback, MutableRefObject } from 'react';

/**
 * Merges multiple React refs into a single callback ref.
 *
 * Accepts any combination of:
 * - `React.RefObject` / `React.MutableRefObject`
 * - Callback refs `(instance: T | null) => void`
 * - `undefined` / `null` (silently skipped)
 *
 * The returned ref is a stable callback that sets every provided ref
 * to the same instance.
 *
 * @typeParam T - The type of the DOM element or component instance.
 * @param refs - Any number of refs to merge.
 * @returns A single `RefCallback<T>` that updates all provided refs.
 *
 * @example
 * ```tsx
 * const mergedRef = mergeRefs(ref1, ref2, ref3);
 * <div ref={mergedRef} />
 * ```
 *
 * @example
 * ```tsx
 * // Combining a forwarded ref with a local ref and a third-party lib ref
 * const FancyButton = forwardRef<HTMLButtonElement, ButtonProps>(
 *   (props, forwardedRef) => {
 *     const internalRef = useRef<HTMLButtonElement>(null);
 *     const tooltipRef = useTooltipRef();
 *
 *     return (
 *       <button
 *         ref={mergeRefs(internalRef, forwardedRef, tooltipRef)}
 *         {...props}
 *       />
 *     );
 *   },
 * );
 * ```
 *
 * @example
 * ```tsx
 * // Safely handles undefined refs
 * const optionalRef: React.Ref<HTMLDivElement> | undefined = undefined;
 * <div ref={mergeRefs(myRef, optionalRef)} />
 * ```
 */
export function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined>
): RefCallback<T> {
  return (instance: T | null) => {
    for (const ref of refs) {
      if (ref == null) continue;

      if (typeof ref === 'function') {
        // Callback ref
        ref(instance);
      } else {
        // RefObject — mutate `.current` directly
        (ref as MutableRefObject<T | null>).current = instance;
      }
    }
  };
}
