import React from 'react';
import { Text, VStack, Box, useThemeColors } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';
import { DemoBox } from '../../shared/DemoBox';

function OverlayBackdropExample() {
  const colors = useThemeColors();
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {(['dim', 'blur', 'transparent'] as const).map((v) => (
        <Box key={v} style={{ width: 120, height: 80, position: 'relative', borderRadius: 8, overflow: 'hidden', backgroundColor: colors.border.subtle }}>
          <Text style={{ padding: 8 }}>Content</Text>
          <Box style={{ position: 'absolute', inset: 0, backgroundColor: v === 'dim' ? 'rgba(0,0,0,0.5)' : v === 'blur' ? 'rgba(0,0,0,0.3)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: v === 'blur' ? 'blur(4px)' : 'none' }}>
            <Text weight="medium">{v}</Text>
          </Box>
        </Box>
      ))}
    </div>
  );
}

export const overlayEntry: ComponentEntry = {
  slug: 'overlay',
  name: 'Overlay',
  category: 'layouts',
  subcategory: 'Scrolling & Positioning',
  description:
    'Full-screen backdrop layer with dim, blur, or transparent modes. Supports scroll locking, escape-to-close, and portal rendering.',
  variantCount: 3,
  keywords: ['overlay', 'backdrop', 'modal', 'dim', 'blur'],

  cardPreview: (
    <Box style={{ width: '100%', maxWidth: 200, height: 80, position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
      <Box style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white' }}>Overlay</Text>
      </Box>
    </Box>
  ),

  examples: [
    {
      title: 'Backdrop Variants',
      render: <OverlayBackdropExample />,
      code: `import { Overlay } from '@wisp-ui/react';

<Overlay open backdrop="dim">Content</Overlay>
<Overlay open backdrop="blur">Content</Overlay>
<Overlay open backdrop="transparent">Content</Overlay>`,
      rnCode: `import { Overlay } from '@wisp-ui/react-native';

<Overlay open backdrop="dim">Content</Overlay>
<Overlay open backdrop="blur">Content</Overlay>
<Overlay open backdrop="transparent">Content</Overlay>`,
    },
  ],

  props: [
    { name: 'open', type: 'boolean', default: 'false', description: 'Visibility state.' },
    { name: 'backdrop', type: "'dim' | 'blur' | 'transparent'", default: "'dim'", description: 'Backdrop style.' },
    { name: 'zIndex', type: 'ZIndexKey', default: "'overlay'", description: 'Z-index layer.' },
    { name: 'lockScroll', type: 'boolean', default: 'true', description: 'Lock body scroll when open.' },
    { name: 'center', type: 'boolean', default: 'true', description: 'Center children in overlay.' },
    { name: 'onBackdropClick', type: '() => void', description: 'Callback on backdrop click.' },
    { name: 'closeOnEscape', type: 'boolean', default: 'true', description: 'Escape triggers onBackdropClick.' },
    { name: 'portalContainer', type: 'HTMLElement', description: 'Custom portal container.' },
  ],
};
