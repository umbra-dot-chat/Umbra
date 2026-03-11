import { useEffect } from 'react';
import { useTheme } from '@wisp-ui/react';

interface ThemePersistenceProps {
  storageKey: string;
}

/**
 * Headless component that persists the current theme mode to localStorage
 * whenever it changes. Renders nothing.
 */
export function ThemePersistence({ storageKey }: ThemePersistenceProps) {
  const { mode } = useTheme();

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, mode);
    } catch {
      // localStorage unavailable
    }
  }, [mode, storageKey]);

  return null;
}
