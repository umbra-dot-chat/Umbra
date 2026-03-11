import React, { useState } from 'react';
import { Stepper, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function StepperDemo() {
  const [value, setValue] = useState(3);
  return <Stepper value={value} onChange={setValue} min={0} max={10} />;
}

export const stepperEntry: ComponentEntry = {
  slug: 'stepper',
  name: 'Stepper',
  category: 'primitives',
  subcategory: 'Media & Display',
  description:
    'Numeric stepper with plus/minus buttons, min/max constraints, custom step increment, and skeleton loading.',
  variantCount: 3,
  keywords: ['stepper', 'counter', 'increment', 'decrement', 'quantity'],

  cardPreview: (
    <div style={{ pointerEvents: 'none' }}>
      <Stepper defaultValue={3} size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Interactive',
      render: <StepperDemo />,
      code: `import { Stepper } from '@wisp-ui/react';

const [value, setValue] = useState(3);
<Stepper value={value} onChange={setValue} min={0} max={10} />`,
      rnCode: `import { Stepper } from '@wisp-ui/react-native';

<Stepper value={3} min={0} max={10} />
<Stepper size="lg" label="Quantity" />`,
    },
    {
      title: 'Sizes',
      render: (
        <HStack gap="lg" align="center">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <VStack key={size} gap="xs" align="center">
              <Stepper defaultValue={5} size={size} />
              <Text size="xs" color="tertiary">{size}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `<Stepper size="sm" defaultValue={5} />
<Stepper size="md" defaultValue={5} />
<Stepper size="lg" defaultValue={5} />`,
    },
    {
      title: 'With Constraints',
      render: (
        <VStack gap="md">
          <Stepper defaultValue={0} min={0} max={5} step={1} />
          <Stepper defaultValue={0} step={10} />
        </VStack>
      ),
      code: `<Stepper min={0} max={5} step={1} />
<Stepper step={10} />`,
    },
    {
      title: 'States',
      render: (
        <HStack gap="md" align="center">
          <Stepper defaultValue={3} disabled />
          <Stepper defaultValue={3} readOnly />
        </HStack>
      ),
      code: `<Stepper disabled defaultValue={3} />
<Stepper readOnly defaultValue={3} />`,
    },
  ],

  props: [
    { name: 'value', type: 'number', description: 'Controlled value.' },
    { name: 'defaultValue', type: 'number', default: '0', description: 'Default value (uncontrolled).' },
    { name: 'onChange', type: '(value: number) => void', description: 'Callback on value change.' },
    { name: 'min', type: 'number', description: 'Minimum value.' },
    { name: 'max', type: 'number', description: 'Maximum value.' },
    { name: 'step', type: 'number', default: '1', description: 'Increment step.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Stepper size.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'readOnly', type: 'boolean', default: 'false', description: 'Read-only mode.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton loading.' },
  ],
};
