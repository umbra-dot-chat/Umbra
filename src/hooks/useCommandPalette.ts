import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { dbg } from '@/utils/debug';

const SRC = 'useCommandPalette';

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const openPalette = useCallback(() => {
    if (__DEV__) dbg.debug('lifecycle', 'command palette opened', undefined, SRC);
    setOpen(true);
  }, []);
  const closePalette = useCallback(() => setOpen(false), []);

  return { open, setOpen, openPalette, closePalette };
}
