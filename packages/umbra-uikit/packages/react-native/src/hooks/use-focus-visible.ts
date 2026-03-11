/**
 * Simplified focus-visible hook for React Native.
 *
 * On native platforms keyboard tab-focus navigation doesn't exist in the
 * same way as on the web. This hook always returns isFocusVisible: false
 * and an empty focusProps object, matching the web hook's interface.
 */

export interface UseFocusVisibleReturn {
  isFocusVisible: boolean;
  focusProps: Record<string, never>;
}

export function useFocusVisible(): UseFocusVisibleReturn {
  return {
    isFocusVisible: false,
    focusProps: {},
  };
}
