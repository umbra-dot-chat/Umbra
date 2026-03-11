import React from 'react';
import { Combobox, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const languageOptions = [
  { value: 'js', label: 'JavaScript' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'py', label: 'Python' },
  { value: 'rs', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'rb', label: 'Ruby' },
];

export const comboboxEntry: ComponentEntry = {
  slug: 'combobox',
  name: 'Combobox',
  category: 'components',
  subcategory: 'Selection & Input',
  description:
    'Searchable dropdown with type-ahead filtering, custom empty state, icons, and descriptions per option.',
  variantCount: 2,
  keywords: ['combobox', 'autocomplete', 'search', 'typeahead', 'filter'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 200, pointerEvents: 'none' }}>
      <Combobox options={languageOptions} placeholder="Search…" size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <div style={{ width: '100%', maxWidth: 280 }}>
          <Combobox options={languageOptions} placeholder="Search languages…" />
        </div>
      ),
      code: `import { Combobox } from '@wisp-ui/react';\n\n<Combobox
  options={[
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
  ]}
  placeholder="Search languages…"
/>`,
      rnCode: `import { Combobox } from '@wisp-ui/react-native';

<Combobox
  options={[
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
  ]}
  placeholder="Search languages…"
/>`,
    },
    {
      title: 'With Label & Error',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 280 }}>
          <Combobox options={languageOptions} label="Language" hint="Type to filter." />
          <Combobox options={languageOptions} label="Required" error="Please select a language." />
        </VStack>
      ),
      code: `<Combobox label="Language" hint="Type to filter." options={options} />
<Combobox label="Required" error="Please select." options={options} />`,
      rnCode: `import { Combobox } from '@wisp-ui/react-native';

<Combobox label="Language" hint="Type to filter." options={options} />
<Combobox label="Required" error="Please select." options={options} />`,
    },
  ],

  props: [
    { name: 'options', type: 'ComboboxOption[]', required: true, description: 'Array of option objects.' },
    { name: 'value', type: 'string', description: 'Controlled selected value.' },
    { name: 'defaultValue', type: 'string', description: 'Initial value (uncontrolled).' },
    { name: 'onChange', type: '(value: string) => void', description: 'Selection callback.' },
    { name: 'placeholder', type: 'string', description: 'Placeholder text in input.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Visual size.' },
    { name: 'label', type: 'string', description: 'Label above trigger.' },
    { name: 'hint', type: 'string', description: 'Hint below trigger.' },
    { name: 'error', type: 'string | boolean', description: 'Error state/message.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'emptyMessage', type: 'string', default: "'No results found'", description: 'Message when no matches.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Skeleton placeholder.' },
  ],
};
