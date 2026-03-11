import React from 'react';
import { Input, VStack, HStack } from '@wisp-ui/react';
import { Search, Mail, Eye, AlertCircle } from 'lucide-react';
import type { ComponentEntry } from '../types';

export const inputEntry: ComponentEntry = {
  slug: 'input',
  name: 'Input',
  category: 'primitives',
  subcategory: 'Inputs',
  description:
    'Text input field with label, hint, error/warning states, leading and trailing icons, and skeleton loading.',
  variantCount: 5,
  keywords: ['input', 'text', 'field', 'form', 'search'],

  cardPreview: (
    <VStack gap="sm" style={{ width: '100%', maxWidth: 260 }}>
      <Input size="md" placeholder="Enter your email…" icon={Mail as any} />
    </VStack>
  ),

  examples: [
    {
      title: 'Sizes',
      render: (
        <VStack gap="sm" style={{ width: '100%', maxWidth: 320 }}>
          <Input size="xs" placeholder="Extra small" />
          <Input size="sm" placeholder="Small" />
          <Input size="md" placeholder="Medium" />
          <Input size="lg" placeholder="Large" />
          <Input size="xl" placeholder="Extra large" />
        </VStack>
      ),
      code: `import { Input } from '@wisp-ui/react';

<Input size="xs" placeholder="Extra small" />
<Input size="sm" placeholder="Small" />
<Input size="md" placeholder="Medium" />
<Input size="lg" placeholder="Large" />
<Input size="xl" placeholder="Extra large" />`,
      rnCode: `import { Input } from '@wisp-ui/react-native';

<Input placeholder="Enter text..." />
<Input label="Email" placeholder="you@example.com" />
<Input label="Password" hint="Min 8 characters" />`,
    },
    {
      title: 'With Label and Hint',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 320 }}>
          <Input label="Email" hint="We'll never share your email." placeholder="you@example.com" icon={Mail as any} />
        </VStack>
      ),
      code: `<Input
  label="Email"
  hint="We'll never share your email."
  placeholder="you@example.com"
  icon={Mail as any}
/>`,
    },
    {
      title: 'Error and Warning States',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 320 }}>
          <Input label="Email" error="Invalid email address" placeholder="you@example.com" />
          <Input label="Username" warning="Username is already taken" placeholder="johndoe" />
        </VStack>
      ),
      code: `<Input label="Email" error="Invalid email address" placeholder="you@example.com" />
<Input label="Username" warning="Username is already taken" placeholder="johndoe" />`,
    },
    {
      title: 'With Icons',
      render: (
        <VStack gap="sm" style={{ width: '100%', maxWidth: 320 }}>
          <Input placeholder="Search…" icon={Search as any} />
          <Input placeholder="Password" trailingIcon={Eye as any} />
        </VStack>
      ),
      code: `<Input placeholder="Search…" icon={Search as any} />
<Input placeholder="Password" trailingIcon={Eye as any} />`,
    },
  ],

  props: [
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Size preset controlling height, padding, and font.' },
    { name: 'label', type: 'string', description: 'Label text rendered above the input.' },
    { name: 'hint', type: 'string', description: 'Hint text below the input (overridden by error/warning).' },
    { name: 'error', type: 'string | boolean', description: 'Error state. String shows message, boolean shows red border only.' },
    { name: 'warning', type: 'string | boolean', description: 'Warning state. Error takes precedence if both are set.' },
    { name: 'icon', type: 'LucideIcon', description: 'Leading icon component (e.g. Search from lucide-react).' },
    { name: 'trailingIcon', type: 'LucideIcon', description: 'Trailing icon component.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretches input to 100% width.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Renders a loading placeholder.' },
  ],
};
