/**
 * @module hooks/use-focus-visible
 * @description Detects whether focus should be visually indicated.
 *
 * Keyboard users rely on visible focus rings for navigation, but mouse and
 * touch users generally find them distracting. This hook tracks the most
 * recent input modality (keyboard vs pointer) via global event listeners
 * and returns `isFocusVisible: true` only when focus originated from the
 * keyboard.
 *
 * Returns a `focusProps` object that should be spread onto the target element
 * to track focus/blur events.
 *
 * @example
 * ```tsx
 * import { useFocusVisible } from '../hooks';
 *
 * function Button({ children }: { children: React.ReactNode }) {
 *   const { isFocusVisible, focusProps } = useFocusVisible();
 *
 *   return (
 *     <button
 *       {...focusProps}
 *       style={{
 *         outline: isFocusVisible ? '2px solid #A78BFA' : 'none',
 *       }}
 *     >
 *       {children}
 *     </button>
 *   );
 * }
 * ```
 */

import { useState, useCallback, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Global modality tracking
// ---------------------------------------------------------------------------

/**
 * @internal
 * Tracks the most recent input modality across the entire page.
 * `true` means the last interaction was via keyboard.
 */
let isKeyboardModality = false;

/**
 * @internal
 * Whether the global listeners have been registered.
 */
let hasGlobalListeners = false;

/**
 * @internal
 * Set of callbacks to notify when modality changes.
 */
const subscribers = new Set<() => void>();

/**
 * @internal
 * Installs global `keydown` and `pointerdown` listeners (once) to track
 * whether the user is navigating via keyboard or pointer.
 */
function ensureGlobalListeners(): void {
  if (hasGlobalListeners || typeof window === 'undefined') return;
  hasGlobalListeners = true;

  /**
   * Mark keyboard modality on key events.
   * Only Tab and arrow keys indicate keyboard navigation intent.
   */
  window.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (
        e.key === 'Tab' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        isKeyboardModality = true;
        subscribers.forEach((cb) => cb());
      }
    },
    true, // capture phase
  );

  /** Mark pointer modality on mouse / touch interaction. */
  window.addEventListener(
    'pointerdown',
    () => {
      isKeyboardModality = false;
      subscribers.forEach((cb) => cb());
    },
    true, // capture phase
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Return type for {@link useFocusVisible}.
 */
export interface UseFocusVisibleReturn {
  /**
   * `true` when the element is focused AND the focus originated from
   * keyboard navigation. Use this to conditionally apply focus-ring styles.
   */
  isFocusVisible: boolean;

  /**
   * Props to spread on the target element to track focus and blur.
   *
   * @example
   * ```tsx
   * <button {...focusProps}>Click me</button>
   * ```
   */
  focusProps: {
    /** Handler for the `onFocus` event. */
    onFocus: (e: React.FocusEvent) => void;
    /** Handler for the `onBlur` event. */
    onBlur: () => void;
  };
}

/**
 * Detects if focus should be visible (keyboard navigation vs mouse click).
 *
 * Installs lightweight global listeners to track the last input modality and
 * exposes per-element focus/blur handlers. The returned `isFocusVisible`
 * flag is `true` only when:
 *
 * 1. The element is currently focused, **and**
 * 2. The most recent user interaction was via the keyboard.
 *
 * @returns An object with `isFocusVisible` and `focusProps`.
 *
 * @example
 * ```tsx
 * const { isFocusVisible, focusProps } = useFocusVisible();
 *
 * <div
 *   tabIndex={0}
 *   {...focusProps}
 *   className={isFocusVisible ? 'focus-ring' : ''}
 * />
 * ```
 */
export function useFocusVisible(): UseFocusVisibleReturn {
  const [isFocused, setIsFocused] = useState(false);
  const [, forceUpdate] = useState(0);

  // Register global listeners on mount.
  useEffect(() => {
    ensureGlobalListeners();

    // Subscribe to modality changes so that if the user switches from
    // pointer to keyboard (or vice-versa) while the element is focused,
    // the component re-renders.
    const callback = () => forceUpdate((n) => n + 1);
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  }, []);

  const onFocus = useCallback((_e: React.FocusEvent) => {
    setIsFocused(true);
  }, []);

  const onBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return {
    isFocusVisible: isFocused && isKeyboardModality,
    focusProps: { onFocus, onBlur },
  };
}
