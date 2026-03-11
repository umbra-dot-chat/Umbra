import React from 'react';
import { FormField, Input, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const formFieldEntry: ComponentEntry = {
  slug: 'form-field',
  name: 'FormField',
  category: 'layouts',
  subcategory: 'Forms & States',
  description:
    'Wraps form controls with label, description, error message, and required indicator. Supports vertical/horizontal orientation.',
  variantCount: 2,
  keywords: ['form', 'field', 'label', 'error', 'validation', 'input'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 200 }}>
      <FormField label="Email" size="sm">
        <Input placeholder="you@example.com" size="sm" />
      </FormField>
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <VStack gap="lg" style={{ width: '100%', maxWidth: 320 }}>
          <FormField label="Username" description="Choose a unique username.">
            <Input placeholder="johndoe" />
          </FormField>
          <FormField label="Email" required>
            <Input placeholder="you@example.com" />
          </FormField>
        </VStack>
      ),
      code: `import { FormField, Input } from '@wisp-ui/react';

<FormField label="Username" description="Choose a unique username.">
  <Input placeholder="johndoe" />
</FormField>
<FormField label="Email" required>
  <Input placeholder="you@example.com" />
</FormField>`,
      rnCode: `import { FormField } from '@wisp-ui/react-native';
import { Input } from '@wisp-ui/react-native';

<FormField label="Username" description="Choose a unique username.">
  <Input placeholder="johndoe" />
</FormField>
<FormField label="Email" required>
  <Input placeholder="you@example.com" />
</FormField>`,
    },
    {
      title: 'Error State',
      render: (
        <FormField label="Password" error="Password must be at least 8 characters." style={{ maxWidth: 320 }}>
          <Input type="password" placeholder="••••••••" />
        </FormField>
      ),
      code: `<FormField label="Password" error="Must be at least 8 characters.">
  <Input type="password" />
</FormField>`,
      rnCode: `<FormField label="Password" error="Must be at least 8 characters.">
  <Input type="password" />
</FormField>`,
    },
    {
      title: 'Horizontal',
      render: (
        <FormField label="Name" orientation="horizontal" labelWidth={100} style={{ maxWidth: 400 }}>
          <Input placeholder="Jane Doe" />
        </FormField>
      ),
      code: `<FormField label="Name" orientation="horizontal" labelWidth={100}>
  <Input placeholder="Jane Doe" />
</FormField>`,
      rnCode: `<FormField label="Name" orientation="horizontal" labelWidth={100}>
  <Input placeholder="Jane Doe" />
</FormField>`,
    },
  ],

  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Form control element.' },
    { name: 'label', type: 'React.ReactNode', description: 'Label text.' },
    { name: 'description', type: 'string', description: 'Helper text below control.' },
    { name: 'error', type: 'string', description: 'Error message (replaces description).' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Show required * indicator.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable field visually.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset.' },
    { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'Label layout.' },
    { name: 'labelWidth', type: 'string | number', default: '120', description: 'Label width in horizontal mode.' },
  ],
};
