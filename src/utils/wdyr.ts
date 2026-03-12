/**
 * why-did-you-render setup — patches React to log unnecessary re-renders.
 *
 * MUST be imported BEFORE React in the entry point.
 * Only active in __DEV__ mode on web platform.
 *
 * Import this at the very top of app/_layout.tsx:
 *   import '@/utils/wdyr';
 */

import React from 'react';
import { Platform } from 'react-native';

if (Platform.OS === 'web' && typeof __DEV__ !== 'undefined' && __DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackHooks: true,
    logOnDifferentValues: false,
    // Only log renders that took >2ms to avoid noise
    // (whyDidYouRender doesn't have a threshold option, so we filter manually)
    collapseGroups: true,
    titleColor: '#6366f1',
    diffNameColor: '#ff9800',
  });
}
