import React from 'react';
import { TextArea, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const textareaEntry: ComponentEntry = {
  slug: 'textarea',
  name: 'TextArea',
  category: 'primitives',
  subcategory: 'Inputs',
  description:
    'Multi-line text input with label, hint, validation states, resize control, and skeleton loading.',
  variantCount: 5,
  keywords: ['textarea', 'multiline', 'input', 'text', 'form'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 240, pointerEvents: 'none' }}>
      <TextArea placeholder="Write something…" size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <TextArea placeholder="Enter your message…" />
          <TextArea label="Bio" hint="Max 200 characters" placeholder="Tell us about yourself…" />
        </VStack>
      ),
      code: `import { TextArea } from '@wisp-ui/react';

<TextArea placeholder="Enter your message…" />
<TextArea label="Bio" hint="Max 200 characters" />`,
      rnCode: `import { TextArea } from '@wisp-ui/react-native';

<TextArea label="Message" placeholder="Type here..." />
<TextArea size="lg" hint="Max 500 characters" />`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <TextArea key={size} size={size} placeholder={`Size: ${size}`} />
          ))}
        </VStack>
      ),
      code: `<TextArea size="sm" placeholder="Small" />
<TextArea size="md" placeholder="Medium" />
<TextArea size="lg" placeholder="Large" />`,
    },
    {
      title: 'Validation',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <TextArea label="Description" error="This field is required" placeholder="Enter description…" />
          <TextArea label="Notes" warning="Content may be too long" placeholder="Optional notes…" />
        </VStack>
      ),
      code: `<TextArea error="This field is required" />
<TextArea warning="Content may be too long" />`,
    },
    {
      title: 'Resize Options',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <TextArea resize="none" placeholder="No resize" />
          <TextArea resize="vertical" placeholder="Vertical only (default)" />
          <TextArea resize="both" placeholder="Both directions" />
        </VStack>
      ),
      code: `<TextArea resize="none" />
<TextArea resize="vertical" />
<TextArea resize="both" />`,
    },
  ],

  props: [
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Input size.' },
    { name: 'label', type: 'string', description: 'Label text above the textarea.' },
    { name: 'hint', type: 'string', description: 'Hint text below the textarea.' },
    { name: 'error', type: 'string | boolean', description: 'Error message or validation state.' },
    { name: 'warning', type: 'string | boolean', description: 'Warning message or state.' },
    { name: 'resize', type: "'none' | 'vertical' | 'horizontal' | 'both'", default: "'vertical'", description: 'Resize behavior.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Expand to full container width.' },
    { name: 'disabled', type: 'boolean', description: 'Disabled state.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton loading.' },
  ],
};
