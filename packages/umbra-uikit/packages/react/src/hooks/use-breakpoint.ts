/**
 * @module hooks/use-breakpoint
 * @description Returns the current responsive breakpoint using `matchMedia`.
 *
 * Listens to `window.matchMedia` change events for each breakpoint threshold
 * and returns the name of the largest breakpoint that currently matches.
 * This is more efficient than listening to the `resize` event because the
 * browser only fires callbacks when a boundary is actually crossed.
 *
 * The breakpoint scale follows a mobile-first convention:
 *
 * | Name  | Min width |
 * | ----- | --------- |
 * | `xs`  | 0 px      |
 * | `sm`  | 640 px    |
 * | `md`  | 768 px    |
 * | `lg`  | 1024 px   |
 * | `xl`  | 1280 px   |
 * | `2xl` | 1536 px   |
 *
 * @example
 * ```tsx
 * import { useBreakpoint } from '../hooks';
 *
 * function Layout() {
 *   const bp = useBreakpoint();
 *   const isMobile = bp === 'xs' || bp === 'sm';
 *
 *   return isMobile ? <MobileNav /> : <DesktopNav />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Responsive grid columns
 * function Grid() {
 *   const bp = useBreakpoint();
 *   const columns = { xs: 1, sm: 1, md: 2, lg: 3, xl: 4, '2xl': 4 }[bp];
 *   return <div style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }} />;
 * }
 * ```
 */

import { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Breakpoint definitions
// ---------------------------------------------------------------------------

/**
 * Named breakpoint identifiers, ordered from smallest to largest.
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Breakpoint min-width thresholds in pixels.
 *
 * These follow a Tailwind-like convention and can be imported independently
 * for use outside of React components.
 *
 * @example
 * ```ts
 * import { breakpoints } from '../hooks/use-breakpoint';
 * console.log(breakpoints.md); // 768
 * ```
 */
export const breakpoints: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * @internal
 * Ordered list of breakpoints from largest to smallest for matching.
 */
const orderedBreakpoints: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * @internal
 * Determines the current breakpoint based on `window.innerWidth`.
 * Returns `'xs'` when running in SSR or when no breakpoint matches.
 */
function getCurrentBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'xs';

  const width = window.innerWidth;
  for (const bp of orderedBreakpoints) {
    if (width >= breakpoints[bp]) return bp;
  }
  return 'xs';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns the name of the current responsive breakpoint.
 *
 * Uses `window.matchMedia` for efficient, event-driven updates rather than
 * polling `window.innerWidth` on every resize.
 *
 * Falls back to `'xs'` during server-side rendering.
 *
 * @returns The current breakpoint name.
 *
 * @example
 * ```tsx
 * const bp = useBreakpoint(); // 'sm' | 'md' | 'lg' | ...
 * const isMobile = bp === 'xs' || bp === 'sm';
 * ```
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(getCurrentBreakpoint);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    // Create media query lists for each breakpoint (excluding 'xs' which is 0).
    const mediaQueries = orderedBreakpoints
      .filter((bp) => breakpoints[bp] > 0)
      .map((bp) => ({
        name: bp,
        mql: window.matchMedia(`(min-width: ${breakpoints[bp]}px)`),
      }));

    /**
     * Handler that re-evaluates the current breakpoint when any
     * media query boundary is crossed.
     */
    const handleChange = () => {
      setBreakpoint(getCurrentBreakpoint());
    };

    // Attach listeners.
    for (const { mql } of mediaQueries) {
      mql.addEventListener('change', handleChange);
    }

    // Sync once in case the window was resized between SSR and hydration.
    handleChange();

    return () => {
      for (const { mql } of mediaQueries) {
        mql.removeEventListener('change', handleChange);
      }
    };
  }, []);

  return breakpoint;
}
