/**
 * Controllable -- Pure state logic for the controlled/uncontrolled pattern.
 *
 * Extracted from the `useControllable` React hook. Contains zero framework
 * dependencies -- every function is a pure transformation of its arguments.
 *
 * @module logic/controllable
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Configuration describing how a controllable value is provided. */
export interface ControllableConfig<T> {
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
}

/** The resolved state of a controllable value. */
export interface ControllableResolved<T> {
  /** Whether the value is externally controlled. */
  isControlled: boolean;
  /** The effective current value. */
  currentValue: T;
}

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/**
 * Determines whether a component is in controlled mode.
 *
 * @param controlledValue - The externally provided value (may be `undefined`).
 * @returns `true` when the component should use the external value.
 */
export function isControlled<T>(controlledValue: T | undefined): boolean {
  return controlledValue !== undefined;
}

/**
 * Resolves the effective current value from controlled and uncontrolled inputs.
 *
 * @param config        - The controllable configuration.
 * @param internalValue - The current internal (uncontrolled) state.
 * @returns A {@link ControllableResolved} object with the effective value.
 */
export function resolveControllable<T>(
  config: ControllableConfig<T>,
  internalValue: T,
): ControllableResolved<T> {
  const controlled = config.value !== undefined;
  return {
    isControlled: controlled,
    currentValue: controlled ? (config.value as T) : internalValue,
  };
}

/**
 * Computes what should happen when a new value is set on a controllable.
 *
 * In controlled mode the internal state should **not** be updated (only the
 * `onChange` callback is fired). In uncontrolled mode both the internal
 * state and the callback are updated.
 *
 * @param controlledValue - The externally provided value.
 * @param nextValue       - The new value being set.
 * @returns An object describing the side effects to perform.
 */
export function getControllableUpdate<T>(
  controlledValue: T | undefined,
  nextValue: T,
): {
  /** Whether the internal state should be updated. */
  shouldUpdateInternal: boolean;
  /** The value to pass to the `onChange` callback. */
  onChangeValue: T;
} {
  return {
    shouldUpdateInternal: controlledValue === undefined,
    onChangeValue: nextValue,
  };
}

/**
 * Detects a controlled/uncontrolled mode switch, which is typically a bug.
 *
 * @param wasControlled - Whether the component was controlled on initial render.
 * @param isNowControlled - Whether the component is currently controlled.
 * @returns `true` when the mode has flipped (a likely bug).
 */
export function detectModeSwitch(
  wasControlled: boolean,
  isNowControlled: boolean,
): boolean {
  return wasControlled !== isNowControlled;
}

/**
 * Builds the warning message emitted when a controlled/uncontrolled mode
 * switch is detected.
 *
 * @param wasControlled - Whether the component was initially controlled.
 * @returns A human-readable warning string.
 */
export function buildModeSwitchWarning(wasControlled: boolean): string {
  return (
    '[Wisp] A component is changing from ' +
    (wasControlled ? 'controlled' : 'uncontrolled') +
    ' to ' +
    (wasControlled ? 'uncontrolled' : 'controlled') +
    '. This is likely a bug. Decide between using a controlled or ' +
    'uncontrolled component for the lifetime of the component.'
  );
}
