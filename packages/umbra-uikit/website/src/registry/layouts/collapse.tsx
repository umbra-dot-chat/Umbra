import React, { useState } from 'react';
import { Collapse, Text, VStack, Box, Button } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';
import { DemoBox } from '../../shared/DemoBox';

function CollapseDemo() {
  const [open, setOpen] = useState(false);
  return (
    <VStack gap="sm" style={{ width: '100%', maxWidth: 300 }}>
      <Button size="sm" variant="secondary" onClick={() => setOpen(!open)}>
        {open ? 'Collapse' : 'Expand'}
      </Button>
      <Collapse open={open}>
        <DemoBox p="md" radius="sm" intensity="subtle">
          <Text color="secondary">This content collapses and expands with animation.</Text>
        </DemoBox>
      </Collapse>
    </VStack>
  );
}

export const collapseEntry: ComponentEntry = {
  slug: 'collapse',
  name: 'Collapse',
  category: 'layouts',
  subcategory: 'Content Containers',
  description:
    'Animated height transition for show/hide content. Configurable duration presets, custom easing, and optional unmount on close.',
  variantCount: 4,
  keywords: ['collapse', 'expand', 'accordion', 'animate', 'height', 'transition'],

  cardPreview: (
    <VStack gap="xs" style={{ width: '100%', maxWidth: 200 }}>
      <DemoBox p="sm" radius="sm">
        <Text weight="medium">Header</Text>
      </DemoBox>
      <DemoBox p="sm" radius="sm" intensity="subtle">
        <Text color="secondary">Collapsed content…</Text>
      </DemoBox>
    </VStack>
  ),

  examples: [
    {
      title: 'Interactive',
      render: <CollapseDemo />,
      code: `import { Collapse } from '@wisp-ui/react';

const [open, setOpen] = useState(false);
<Button onClick={() => setOpen(!open)}>Toggle</Button>
<Collapse open={open}>
  <Box p="md">Collapsible content</Box>
</Collapse>`,
      rnCode: `import { Collapse } from '@wisp-ui/react-native';

const [open, setOpen] = useState(false);
<Button onPress={() => setOpen(!open)}>Toggle</Button>
<Collapse open={open}>
  <Box p="md">Collapsible content</Box>
</Collapse>`,
    },
  ],

  props: [
    { name: 'open', type: 'boolean', default: 'false', description: 'Expanded state.' },
    { name: 'duration', type: "'instant' | 'fast' | 'normal' | 'slow'", default: "'normal'", description: 'Animation duration preset.' },
    { name: 'durationMs', type: 'number', description: 'Custom duration in ms.' },
    { name: 'easing', type: 'string', default: "'cubic-bezier(0.4, 0, 0.2, 1)'", description: 'CSS easing function.' },
    { name: 'unmountOnClose', type: 'boolean', default: 'false', description: 'Unmount children when collapsed.' },
    { name: 'onTransitionEnd', type: '() => void', description: 'Called when transition ends.' },
  ],
};
