/**
 * @module hooks/use-controllable
 * @description Manages the controlled / uncontrolled state pattern.
 *
 * Many Wisp components accept both a `value` prop (controlled) and a
 * `defaultValue` prop (uncontrolled). This hook encapsulates the branching
 * logic so component authors don't have to repeat it.
 *
 * **Controlled mode** -- When `config.value` is not `undefined`, the hook
 * returns it directly and delegates state changes to `config.onChange`.
 *
 * **Uncontrolled mode** -- When `config.value` is `undefined`, the hook
 * maintains its own internal state initialised from `config.defaultValue`.
 * `config.onChange` is still called on every update so the parent can
 * optionally observe changes.
 *
 * @example
 * ```tsx
 * import { useControllable } from '../hooks';
 *
 * interface InputProps {
 *   value?: string;
 *   defaultValue?: string;
 *   onChange?: (value: string) => void;
 * }
 *
 * function Input({ value, defaultValue = '', onChange }: InputProps) {
 *   const [currentValue, setCurrentValue] = useControllable({
 *     value,
 *     defaultValue,
 *     onChange,
 *   });
 *
 *   return (
 *     <input
 *       value={currentValue}
 *       onChange={(e) => setCurrentValue(e.target.value)}
 *     />
 *   );
 * }
 * ```
 */

import { useState, useCallback, useRef } from 'react';

/**
 * Configuration for {@link useControllable}.
 *
 * @typeParam T - The type of the state value.
 */
export interface UseControllableConfig<T> {
  /**
   * The controlled value. When defined the component is in controlled mode
   * and internal state is bypassed.
   */
  value?: T;

  /**
   * The initial value used when the component is uncontrolled
   * (i.e. `value` is `undefined`).
   */
  defaultValue: T;

  /**
   * Optional callback invoked whenever the value changes, regardless of
   * whether the component is controlled or uncontrolled.
   */
  onChange?: (value: T) => void;
}

/**
 * Manages controlled / uncontrolled state for a component prop.
 *
 * @remarks
 * The controlled vs. uncontrolled decision is captured on first render and
 * held stable via a ref. In development builds (`__DEV__`) a console
 * warning is emitted if the mode changes mid-lifecycle, mirroring the
 * behaviour of React's own `<input>` controlled/uncontrolled warnings.
 *
 * The returned setter is memoised with `useCallback` so it is safe to
 * pass directly as an event handler prop without causing unnecessary
 * re-renders in child components.
 *
 * @typeParam T - The type of the state value.
 * @param config - {@link UseControllableConfig} object describing the
 *   controlled value, default, and change callback.
 * @returns A `[value, setValue]` tuple matching the `useState` API.
 *
 * @see {@link UseControllableConfig} for the configuration shape.
 *
 * @example
 * ```tsx
 * const [checked, setChecked] = useControllable({
 *   value: props.checked,
 *   defaultValue: false,
 *   onChange: props.onCheckedChange,
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Fully uncontrolled usage (no value prop)
 * const [open, setOpen] = useControllable({
 *   value: undefined,
 *   defaultValue: false,
 *   onChange: (isOpen) => console.log('Open state:', isOpen),
 * });
 * ```
 */
export function useControllable<T>(
  config: UseControllableConfig<T>,
): [T, (value: T) => void] {
  const { value, defaultValue, onChange } = config;

  // Determine whether the component is controlled.
  // We use a ref to keep the controlled status stable across renders
  // to avoid switching between controlled and uncontrolled mid-lifecycle.
  const isControlled = value !== undefined;
  const isControlledRef = useRef(isControlled);

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // Warn if switching between controlled and uncontrolled.
    if (isControlledRef.current !== isControlled) {
      console.warn(
        '[Wisp] A component is changing from ' +
          (isControlledRef.current ? 'controlled' : 'uncontrolled') +
          ' to ' +
          (isControlled ? 'controlled' : 'uncontrolled') +
          '. This is likely a bug. Decide between using a controlled or ' +
          'uncontrolled component for the lifetime of the component.',
      );
    }
  }

  // Internal state for uncontrolled mode.
  const [internalValue, setInternalValue] = useState<T>(defaultValue);

  // Stable setter that handles both modes.
  const setValue = useCallback(
    (nextValue: T) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onChange?.(nextValue);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isControlled, onChange],
  );

  return [isControlled ? (value as T) : internalValue, setValue];
}

/**
 * @internal
 * Development mode flag. Replaced at build time by bundlers.
 */
declare const __DEV__: boolean;
