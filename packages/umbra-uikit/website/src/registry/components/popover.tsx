import React from 'react';
import { Popover, PopoverTrigger, PopoverContent, Button, Text, VStack, useThemeColors } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function PopoverPreview() {
  const colors = useThemeColors();
  return (
    <div style={{ width: '100%', maxWidth: 200, position: 'relative', paddingTop: 48 }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', backgroundColor: colors.background.canvas, borderRadius: 8, padding: '8px 16px', border: `1px solid ${colors.border.subtle}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <Text size="xs">Popover content</Text>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Text size="xs" color="secondary">▲ Trigger</Text>
      </div>
    </div>
  );
}

export const popoverEntry: ComponentEntry = {
  slug: 'popover',
  name: 'Popover',
  category: 'components',
  subcategory: 'Overlays & Modals',
  description:
    'Floating panel anchored to a trigger with placement, alignment, offset, and controlled/uncontrolled modes.',
  variantCount: 4,
  keywords: ['popover', 'popup', 'floating', 'panel', 'dropdown'],

  cardPreview: <PopoverPreview />,

  examples: [
    {
      title: 'Basic',
      render: (
        <Popover>
          <PopoverTrigger>
            <Button variant="secondary" size="sm">Open Popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <VStack gap="sm" style={{ padding: 12, maxWidth: 200 }}>
              <Text weight="medium">Popover Title</Text>
              <Text size="xs" color="secondary">This is a popover panel with content inside.</Text>
            </VStack>
          </PopoverContent>
        </Popover>
      ),
      code: `import { Popover, PopoverTrigger, PopoverContent } from '@wisp-ui/react';\n\n<Popover>
  <PopoverTrigger>
    <Button>Open Popover</Button>
  </PopoverTrigger>
  <PopoverContent>
    <Text>Popover content</Text>
  </PopoverContent>
</Popover>`,
      rnCode: `import { Popover, PopoverTrigger, PopoverContent, Button, Text } from '@wisp-ui/react-native';

<Popover>
  <PopoverTrigger>
    <Button>Open Popover</Button>
  </PopoverTrigger>
  <PopoverContent>
    <Text>Popover content</Text>
  </PopoverContent>
</Popover>`,
    },
    {
      title: 'Placement',
      render: (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {(['top', 'bottom', 'left', 'right'] as const).map((p) => (
            <Popover key={p} placement={p}>
              <PopoverTrigger>
                <Button variant="secondary" size="sm">{p}</Button>
              </PopoverTrigger>
              <PopoverContent>
                <div style={{ padding: 12 }}>
                  <Text size="xs">Placed {p}</Text>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      ),
      code: `<Popover placement="top">…</Popover>
<Popover placement="bottom">…</Popover>
<Popover placement="left">…</Popover>
<Popover placement="right">…</Popover>`,
      rnCode: `<Popover placement="top">…</Popover>
<Popover placement="bottom">…</Popover>
<Popover placement="left">…</Popover>
<Popover placement="right">…</Popover>`,
    },
  ],

  props: [
    { name: 'open', type: 'boolean', description: 'Controlled open state.' },
    { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Initial open (uncontrolled).' },
    { name: 'onOpenChange', type: '(open: boolean) => void', description: 'Open state callback.' },
    { name: 'placement', type: "'top' | 'right' | 'bottom' | 'left'", default: "'bottom'", description: 'Placement side.' },
    { name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", description: 'Cross-axis alignment.' },
    { name: 'offset', type: 'number', default: '8', description: 'Distance from trigger.' },
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Trigger + Content children.' },
  ],
};
