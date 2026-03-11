/**
 * @module animation/use-text-scramble
 * @description Hook that animates text by "decoding" it from random characters.
 *
 * Characters resolve from a random symbol set to their final values one by one,
 * creating a cryptographic decryption / hacker terminal aesthetic.
 *
 * Ported from the Umbra marketing site's useTextScramble implementation.
 */

import { useState, useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHARS = '!@#$%^&*0123456789ABCDEFabcdef<>{}[]|/\\~';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TextScrambleOptions {
  /**
   * Delay in milliseconds before the scramble starts.
   * @default 0
   */
  delay?: number;
  /**
   * Interval in milliseconds between each scramble tick.
   * @default 30
   */
  speed?: number;
  /**
   * Number of scramble ticks before each character resolves.
   * Higher = longer scramble per character.
   * @default 3
   */
  scrambleCycles?: number;
  /**
   * Whether the scramble animation is enabled.
   * When false, `display` immediately matches `target`.
   * @default true
   */
  enabled?: boolean;
}

export interface TextScrambleResult {
  /** The current display string (partially scrambled or fully resolved). */
  display: string;
  /** Whether the scramble animation has completed. */
  isComplete: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTextScramble(
  target: string,
  options?: TextScrambleOptions,
): TextScrambleResult {
  const {
    delay = 0,
    speed = 30,
    scrambleCycles = 3,
    enabled = true,
  } = options ?? {};

  const [display, setDisplay] = useState(enabled ? '' : target);
  const [isComplete, setIsComplete] = useState(!enabled);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setDisplay(target);
      setIsComplete(true);
      return;
    }

    // Reset state when target changes
    setIsComplete(false);
    let resolved = 0;
    let cycle = 0;

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        cycle++;

        // Resolve one more character every `scrambleCycles` ticks
        if (cycle % scrambleCycles === 0 && resolved < target.length) {
          resolved++;
        }

        // Build the display string
        let text = '';
        for (let i = 0; i < target.length; i++) {
          if (i < resolved) {
            text += target[i];
          } else if (target[i] === ' ') {
            text += ' ';
          } else {
            text += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }
        setDisplay(text);

        // Complete
        if (resolved >= target.length) {
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
          setDisplay(target);
          setIsComplete(true);
        }
      }, speed);
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [target, delay, speed, scrambleCycles, enabled]);

  return { display, isComplete };
}
