/**
 * useFullscreen -- Manages fullscreen state for a single video tile.
 *
 * Tracks which participant DID (if any) should fill the entire grid
 * container. On web, listens for Escape key to exit fullscreen.
 */

import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { dbg } from '@/utils/debug';

const SRC = 'useFullscreen';

export interface FullscreenState {
  /** The DID of the participant in fullscreen, or null */
  fullscreenDid: string | null;
  /** Enter fullscreen for a given participant */
  enterFullscreen: (did: string) => void;
  /** Exit fullscreen mode */
  exitFullscreen: () => void;
}

export function useFullscreen(): FullscreenState {
  const [fullscreenDid, setFullscreenDid] = useState<string | null>(null);

  const enterFullscreen = useCallback((did: string) => {
    setFullscreenDid(did);
  }, []);

  const exitFullscreen = useCallback(() => {
    setFullscreenDid(null);
  }, []);

  // Web: listen for Escape key to exit fullscreen
  useEffect(() => {
    if (Platform.OS !== 'web' || !fullscreenDid) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenDid(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenDid]);

  return { fullscreenDid, enterFullscreen, exitFullscreen };
}
