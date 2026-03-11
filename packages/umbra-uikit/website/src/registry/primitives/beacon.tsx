import React from 'react';
import { Beacon, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const beaconEntry: ComponentEntry = {
  slug: 'beacon',
  name: 'Beacon',
  category: 'primitives',
  subcategory: 'Status & Feedback',
  description:
    'Pulsing icon button that opens a popover with help content. Supports pulse/static states, configurable placement, size and colour variants.',
  variantCount: 4,
  keywords: ['beacon', 'help', 'info', 'pulse', 'tooltip', 'hint', 'guide', 'cta'],

  cardPreview: (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', pointerEvents: 'none' }}>
      <Beacon variant="info" size="md" pulsing>
        <Text>Help content</Text>
      </Beacon>
      <Beacon variant="success" size="sm" pulsing={false}>
        <Text>Static beacon</Text>
      </Beacon>
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Beacon variant="info">
            <div style={{ maxWidth: 220 }}>
              <Text weight="semibold">Getting Started</Text>
              <Text color="secondary" style={{ marginTop: 4 }}>
                Click here to begin the onboarding tour and learn about key features.
              </Text>
            </div>
          </Beacon>
        </div>
      ),
      code: `import { Beacon, Text } from '@wisp-ui/react';

<Beacon variant="info">
  <div style={{ maxWidth: 220 }}>
    <Text weight="semibold">Getting Started</Text>
    <Text color="secondary">
      Click here to begin the onboarding tour.
    </Text>
  </div>
</Beacon>`,
    },
    {
      title: 'Variants',
      render: (
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Beacon variant="default" size="md">
            <Text>Default variant</Text>
          </Beacon>
          <Beacon variant="info" size="md">
            <Text>Info variant</Text>
          </Beacon>
          <Beacon variant="success" size="md">
            <Text>Success variant</Text>
          </Beacon>
          <Beacon variant="warning" size="md">
            <Text>Warning variant</Text>
          </Beacon>
        </div>
      ),
      code: `<Beacon variant="default">…</Beacon>
<Beacon variant="info">…</Beacon>
<Beacon variant="success">…</Beacon>
<Beacon variant="warning">…</Beacon>`,
    },
    {
      title: 'Sizes',
      render: (
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Beacon variant="info" size="sm">
            <Text>Small beacon</Text>
          </Beacon>
          <Beacon variant="info" size="md">
            <Text>Medium beacon</Text>
          </Beacon>
          <Beacon variant="info" size="lg">
            <Text>Large beacon</Text>
          </Beacon>
        </div>
      ),
      code: `<Beacon size="sm">…</Beacon>
<Beacon size="md">…</Beacon>
<Beacon size="lg">…</Beacon>`,
    },
    {
      title: 'Static (no pulse)',
      render: (
        <Beacon variant="info" pulsing={false}>
          <Text>This beacon does not pulse.</Text>
        </Beacon>
      ),
      code: `<Beacon variant="info" pulsing={false}>
  <Text>This beacon does not pulse.</Text>
</Beacon>`,
    },
  ],

  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Popover content shown on click.' },
    { name: 'icon', type: 'React.ComponentType', description: 'Custom icon component. Defaults to Info.' },
    { name: 'pulsing', type: 'boolean', default: 'true', description: 'Animate the beacon with a pulse effect.' },
    { name: 'placement', type: "'top' | 'right' | 'bottom' | 'left'", default: "'bottom'", description: 'Popover placement side.' },
    { name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", description: 'Popover alignment.' },
    { name: 'offset', type: 'number', default: '8', description: 'Pixel offset from the beacon.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Beacon button size.' },
    { name: 'variant', type: "'default' | 'info' | 'success' | 'warning'", default: "'info'", description: 'Colour variant.' },
    { name: 'open', type: 'boolean', description: 'Controlled open state.' },
    { name: 'onOpenChange', type: '(open: boolean) => void', description: 'Open state change callback.' },
  ],
};
