import React, { useState } from 'react';
import { Checkbox, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function CheckboxDemo() {
  const [checked, setChecked] = useState(false);
  return <Checkbox checked={checked} onChange={setChecked} label="Accept terms" />;
}

export const checkboxEntry: ComponentEntry = {
  slug: 'checkbox',
  name: 'Checkbox',
  category: 'primitives',
  subcategory: 'Selection',
  description:
    'Checkbox with label, description, indeterminate state, error/warning validation, and skeleton loading.',
  variantCount: 5,
  keywords: ['checkbox', 'check', 'tick', 'boolean', 'form'],

  cardPreview: (
    <VStack gap="xs">
      <Checkbox defaultChecked label="Checked" size="sm" />
      <Checkbox label="Unchecked" size="sm" />
    </VStack>
  ),

  examples: [
    {
      title: 'Interactive',
      render: <CheckboxDemo />,
      code: `import { Checkbox } from '@wisp-ui/react';

const [checked, setChecked] = useState(false);
<Checkbox checked={checked} onChange={setChecked} label="Accept terms" />`,
      rnCode: `import { Checkbox } from '@wisp-ui/react-native';

<Checkbox />
<Checkbox label="Accept terms" />
<Checkbox checked={agreed} onChange={setAgreed} />`,
    },
    {
      title: 'Sizes',
      render: (
        <HStack gap="lg" align="center">
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <Checkbox key={size} defaultChecked size={size} label={size} />
          ))}
        </HStack>
      ),
      code: `<Checkbox size="xs" label="xs" />
<Checkbox size="md" label="md" />
<Checkbox size="xl" label="xl" />`,
    },
    {
      title: 'States',
      render: (
        <VStack gap="sm">
          <Checkbox defaultChecked label="Checked" />
          <Checkbox label="Unchecked" />
          <Checkbox indeterminate label="Indeterminate" />
          <Checkbox disabled label="Disabled" />
          <Checkbox disabled defaultChecked label="Disabled checked" />
        </VStack>
      ),
      code: `<Checkbox indeterminate label="Indeterminate" />
<Checkbox disabled label="Disabled" />`,
    },
    {
      title: 'With Description & Validation',
      render: (
        <VStack gap="md">
          <Checkbox label="Newsletter" description="Receive weekly updates via email." />
          <Checkbox label="Required field" error />
          <Checkbox label="Review needed" warning />
        </VStack>
      ),
      code: `<Checkbox label="Newsletter" description="Weekly updates." />
<Checkbox label="Required" error />`,
    },
  ],

  props: [
    { name: 'checked', type: 'boolean', description: 'Controlled checked state.' },
    { name: 'defaultChecked', type: 'boolean', default: 'false', description: 'Default checked (uncontrolled).' },
    { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Indeterminate (dash) state.' },
    { name: 'onChange', type: '(checked: boolean) => void', description: 'Callback when changed.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Checkbox size.' },
    { name: 'label', type: 'React.ReactNode', description: 'Label text.' },
    { name: 'description', type: 'string', description: 'Helper description text.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'error', type: 'boolean', default: 'false', description: 'Error validation state.' },
    { name: 'warning', type: 'boolean', default: 'false', description: 'Warning validation state.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton loading.' },
  ],
};
