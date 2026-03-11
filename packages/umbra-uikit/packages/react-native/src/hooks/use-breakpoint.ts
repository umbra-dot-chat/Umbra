import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export const breakpoints: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

const orderedBreakpoints: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];

function getCurrentBreakpoint(): Breakpoint {
  const { width } = Dimensions.get('window');
  for (const bp of orderedBreakpoints) {
    if (width >= breakpoints[bp]) return bp;
  }
  return 'xs';
}

/**
 * Returns the current responsive breakpoint based on window width.
 * Uses React Native's Dimensions API with change listener.
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(getCurrentBreakpoint);

  useEffect(() => {
    const handleChange = () => {
      setBreakpoint(getCurrentBreakpoint());
    };

    const subscription = Dimensions.addEventListener('change', handleChange);
    return () => subscription.remove();
  }, []);

  return breakpoint;
}
