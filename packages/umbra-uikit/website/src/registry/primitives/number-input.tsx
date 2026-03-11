import React, { useState } from 'react';
import { NumberInput, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function NumberInputDemo() {
  const [value, setValue] = useState(5);
  return <NumberInput value={value} onChange={setValue} label="Quantity" min={0} max={100} />;
}

export const numberInputEntry: ComponentEntry = {
  slug: 'number-input',
  name: 'NumberInput',
  category: 'primitives',
  subcategory: 'Inputs',
  description:
    'Numeric input with increment/decrement buttons, min/max constraints, custom step, label, and validation.',
  variantCount: 3,
  keywords: ['number', 'input', 'numeric', 'stepper', 'counter', 'quantity'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 160, pointerEvents: 'none' }}>
      <NumberInput defaultValue={5} size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Interactive',
      render: (
        <div style={{ width: '100%', maxWidth: 200 }}>
          <NumberInputDemo />
        </div>
      ),
      code: `import { NumberInput } from '@wisp-ui/react';

const [value, setValue] = useState(5);
<NumberInput value={value} onChange={setValue} label="Quantity" min={0} max={100} />`,
      rnCode: `import { NumberInput } from '@wisp-ui/react-native';

<NumberInput value={5} min={0} max={10} />
<NumberInput label="Quantity" size="lg" />`,
    },
    {
      title: 'Sizes',
      render: (
        <HStack gap="md" align="end">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <NumberInput key={size} defaultValue={10} size={size} placeholder={size} />
          ))}
        </HStack>
      ),
      code: `<NumberInput size="sm" defaultValue={10} />
<NumberInput size="md" defaultValue={10} />
<NumberInput size="lg" defaultValue={10} />`,
    },
    {
      title: 'With Constraints',
      render: (
        <VStack gap="md" style={{ maxWidth: 200 }}>
          <NumberInput defaultValue={0} min={0} max={10} step={1} label="0–10 range" />
          <NumberInput defaultValue={0} step={5} label="Step by 5" />
        </VStack>
      ),
      code: `<NumberInput min={0} max={10} step={1} label="0–10" />
<NumberInput step={5} label="Step by 5" />`,
    },
    {
      title: 'States',
      render: (
        <VStack gap="md" style={{ maxWidth: 200 }}>
          <NumberInput defaultValue={5} disabled label="Disabled" />
          <NumberInput defaultValue={5} error label="Error" />
        </VStack>
      ),
      code: `<NumberInput disabled label="Disabled" />
<NumberInput error label="Error" />`,
    },
  ],

  props: [
    { name: 'value', type: 'number', description: 'Controlled value.' },
    { name: 'defaultValue', type: 'number', default: '0', description: 'Default value (uncontrolled).' },
    { name: 'onChange', type: '(value: number) => void', description: 'Callback on value change.' },
    { name: 'min', type: 'number', description: 'Minimum allowed value.' },
    { name: 'max', type: 'number', description: 'Maximum allowed value.' },
    { name: 'step', type: 'number', default: '1', description: 'Increment/decrement step.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Input size.' },
    { name: 'label', type: 'string', description: 'Label text.' },
    { name: 'hint', type: 'string', description: 'Hint text.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'error', type: 'boolean', default: 'false', description: 'Error validation state.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Full container width.' },
  ],
};
