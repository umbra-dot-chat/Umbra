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
    // IMPORTANT: trackAllPureComponents was disabled because it deep-compares
    // ALL props on every React.memo component render. With 50+ messages in
    // ChatArea, each creating HoverBubble + ChatBubble + Avatar + Text, wdyr
    // does hundreds of deep comparisons per render cycle — enough to exhaust
    // V8's GC budget and crash the tab.
    // Enable per-component with: ComponentName.whyDidYouRender = true;
    trackAllPureComponents: false,
    trackHooks: false,
    logOnDifferentValues: false,
    collapseGroups: true,
    titleColor: '#6366f1',
    diffNameColor: '#ff9800',
  });
}
