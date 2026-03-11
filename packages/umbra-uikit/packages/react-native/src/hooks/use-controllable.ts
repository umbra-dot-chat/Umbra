import { useState, useCallback, useRef } from 'react';

export interface UseControllableConfig<T> {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}

export function useControllable<T>(
  config: UseControllableConfig<T>,
): [T, (value: T) => void] {
  const { value, defaultValue, onChange } = config;

  const isControlled = value !== undefined;
  const isControlledRef = useRef(isControlled);

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    if (isControlledRef.current !== isControlled) {
      console.warn(
        '[Wisp] A component is changing from ' +
          (isControlledRef.current ? 'controlled' : 'uncontrolled') +
          ' to ' +
          (isControlled ? 'controlled' : 'uncontrolled') +
          '. This is likely a bug.',
      );
    }
  }

  const [internalValue, setInternalValue] = useState<T>(defaultValue);

  const setValue = useCallback(
    (nextValue: T) => {
      if (!isControlled) setInternalValue(nextValue);
      onChange?.(nextValue);
    },
    [isControlled, onChange],
  );

  return [isControlled ? (value as T) : internalValue, setValue];
}
