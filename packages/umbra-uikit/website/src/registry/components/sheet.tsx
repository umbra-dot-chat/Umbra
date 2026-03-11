import React, { useState } from 'react';
import { Sheet, Button, Text, VStack, HStack, useThemeColors } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function SheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>Open Sheet</Button>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <VStack gap="md" style={{ padding: 24 }}>
          <Text size="lg" weight="bold">Sheet Content</Text>
          <Text color="secondary">This is a bottom sheet panel that slides up from the bottom of the screen.</Text>
          <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>Close</Button>
        </VStack>
      </Sheet>
    </>
  );
}

function SheetPreview() {
  const colors = useThemeColors();
  return (
    <div style={{ width: '100%', maxWidth: 200, height: 80, position: 'relative', borderRadius: 8, overflow: 'hidden', backgroundColor: colors.accent.highlight }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, backgroundColor: colors.background.canvas, borderTop: `1px solid ${colors.border.subtle}`, borderRadius: '8px 8px 0 0', padding: '8px 12px' }}>
        <div style={{ width: 32, height: 3, backgroundColor: colors.border.subtle, borderRadius: 2, margin: '0 auto 6px' }} />
        <Text size="xs" color="secondary">Sheet content</Text>
      </div>
    </div>
  );
}

export const sheetEntry: ComponentEntry = {
  slug: 'sheet',
  name: 'Sheet',
  category: 'components',
  subcategory: 'Overlays & Modals',
  description:
    'Bottom sheet that slides up with size presets (sm–full), overlay backdrop, escape-to-close, and glass variant.',
  variantCount: 4,
  keywords: ['sheet', 'bottom', 'drawer', 'panel', 'slide'],

  cardPreview: <SheetPreview />,

  examples: [
    {
      title: 'Interactive',
      render: <SheetDemo />,
      code: `import { Sheet } from '@wisp-ui/react';\n\nconst [open, setOpen] = useState(false);
<Button onClick={() => setOpen(true)}>Open</Button>
<Sheet open={open} onClose={() => setOpen(false)}>
  <Text>Sheet content</Text>
</Sheet>`,
      rnCode: `import { Sheet, Button, Text } from '@wisp-ui/react-native';

const [open, setOpen] = useState(false);
<Button onPress={() => setOpen(true)}>Open</Button>
<Sheet open={open} onClose={() => setOpen(false)}>
  <Text>Sheet content</Text>
</Sheet>`,
    },
  ],

  props: [
    { name: 'open', type: 'boolean', required: true, description: 'Sheet visibility.' },
    { name: 'onClose', type: '() => void', required: true, description: 'Close callback.' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'full'", default: "'md'", description: 'Max height preset.' },
    { name: 'variant', type: "'solid' | 'glass'", default: "'solid'", description: 'Surface variant.' },
    { name: 'overlay', type: 'boolean', default: 'true', description: 'Show backdrop.' },
    { name: 'closeOnOverlayClick', type: 'boolean', default: 'true', description: 'Close on backdrop click.' },
    { name: 'closeOnEscape', type: 'boolean', default: 'true', description: 'Close on Escape key.' },
    { name: 'children', type: 'React.ReactNode', description: 'Sheet content.' },
  ],
};
