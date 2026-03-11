import React from 'react';
import { CopyButton, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const copyButtonEntry: ComponentEntry = {
  slug: 'copy-button',
  name: 'CopyButton',
  category: 'components',
  subcategory: 'Social',
  description:
    'One-click clipboard copy button with copied confirmation state, configurable duration, label, and 3 variants.',
  variantCount: 3,
  keywords: ['copy', 'button', 'clipboard', 'paste', 'snippet'],

  cardPreview: (
    <HStack gap="sm" style={{ pointerEvents: 'none' }}>
      <CopyButton value="Hello world" size="sm" />
      <CopyButton value="Hello world" size="sm" label="Copy" />
    </HStack>
  ),

  examples: [
    {
      title: 'Variants',
      render: (
        <HStack gap="md">
          <CopyButton value="npm install @wisp-ui/react" variant="outline" label="Copy" />
          <CopyButton value="npm install @wisp-ui/react" variant="ghost" label="Copy" />
          <CopyButton value="npm install @wisp-ui/react" variant="minimal" />
        </HStack>
      ),
      code: `import { CopyButton } from '@wisp-ui/react';

<CopyButton value="npm install @wisp-ui/react" variant="outline" label="Copy" />
<CopyButton value="npm install @wisp-ui/react" variant="ghost" label="Copy" />
<CopyButton value="npm install @wisp-ui/react" variant="minimal" />`,
      rnCode: `import { CopyButton } from '@wisp-ui/react-native';

<CopyButton value="npm install @wisp-ui/react-native" variant="outline" label="Copy" />
<CopyButton value="npm install @wisp-ui/react-native" variant="ghost" label="Copy" />
<CopyButton value="npm install @wisp-ui/react-native" variant="minimal" />`,
    },
    {
      title: 'Sizes',
      render: (
        <HStack gap="md" align="center">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <CopyButton key={size} value="copied!" size={size} label={size} />
          ))}
        </HStack>
      ),
      code: `<CopyButton size="sm" value="text" label="sm" />
<CopyButton size="md" value="text" label="md" />
<CopyButton size="lg" value="text" label="lg" />`,
      rnCode: `import { CopyButton } from '@wisp-ui/react-native';

<CopyButton size="sm" value="text" label="sm" />
<CopyButton size="md" value="text" label="md" />
<CopyButton size="lg" value="text" label="lg" />`,
    },
  ],

  props: [
    { name: 'value', type: 'string', required: true, description: 'String to copy.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Button size.' },
    { name: 'label', type: 'string', description: 'Optional text label.' },
    { name: 'variant', type: "'outline' | 'ghost' | 'minimal'", default: "'outline'", description: 'Visual variant.' },
    { name: 'copiedLabel', type: 'string', default: "'Copied!'", description: 'Copied state text.' },
    { name: 'copiedDuration', type: 'number', default: '2000', description: 'Copied state duration (ms).' },
    { name: 'onCopy', type: '(value: string) => void', description: 'Copy callback.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Skeleton placeholder.' },
  ],
};
