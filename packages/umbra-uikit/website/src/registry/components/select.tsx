import React from 'react';
import { Select, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const fruitOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'mango', label: 'Mango' },
  { value: 'orange', label: 'Orange' },
];

export const selectEntry: ComponentEntry = {
  slug: 'select',
  name: 'Select',
  category: 'components',
  subcategory: 'Selection & Input',
  description:
    'Dropdown select with search filtering, option descriptions, icons, error states, and skeleton loading.',
  variantCount: 2,
  keywords: ['select', 'dropdown', 'picker', 'option', 'choice'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 200, pointerEvents: 'none' }}>
      <Select options={fruitOptions} placeholder="Pick a fruit" size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <div style={{ width: '100%', maxWidth: 280 }}>
          <Select options={fruitOptions} placeholder="Select a fruit" />
        </div>
      ),
      code: `import { Select } from '@wisp-ui/react';\n\n<Select
  options={[
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
  ]}
  placeholder="Select a fruit"
/>`,
      rnCode: `import { Select } from '@wisp-ui/react-native';

<Select
  options={[
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
  ]}
  placeholder="Select a fruit"
/>`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 280 }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Select key={size} options={fruitOptions} placeholder={size} size={size} />
          ))}
        </VStack>
      ),
      code: `<Select size="sm" options={options} />
<Select size="md" options={options} />
<Select size="lg" options={options} />`,
      rnCode: `import { Select } from '@wisp-ui/react-native';

<Select size="sm" options={options} />
<Select size="md" options={options} />
<Select size="lg" options={options} />`,
    },
    {
      title: 'With Label & Error',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 280 }}>
          <Select options={fruitOptions} label="Fruit" hint="Choose your favorite." />
          <Select options={fruitOptions} label="Required" error="This field is required." />
        </VStack>
      ),
      code: `<Select label="Fruit" hint="Choose your favorite." options={options} />
<Select label="Required" error="This field is required." options={options} />`,
      rnCode: `import { Select } from '@wisp-ui/react-native';

<Select label="Fruit" hint="Choose your favorite." options={options} />
<Select label="Required" error="This field is required." options={options} />`,
    },
  ],

  props: [
    { name: 'options', type: 'SelectOption[]', required: true, description: 'Array of option objects.' },
    { name: 'value', type: 'string', description: 'Controlled selected value.' },
    { name: 'defaultValue', type: 'string', description: 'Initial value (uncontrolled).' },
    { name: 'onChange', type: '(value: string) => void', description: 'Selection callback.' },
    { name: 'placeholder', type: 'string', default: "'Select...'", description: 'Placeholder text.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Visual size.' },
    { name: 'label', type: 'string', description: 'Label text above trigger.' },
    { name: 'hint', type: 'string', description: 'Hint text below trigger.' },
    { name: 'error', type: 'string | boolean', description: 'Error state/message.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretch to container width.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Skeleton placeholder.' },
  ],
};
