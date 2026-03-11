import React from 'react';
import { PinInput, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const pinInputEntry: ComponentEntry = {
  slug: 'pin-input',
  name: 'PinInput',
  category: 'primitives',
  subcategory: 'Inputs',
  description:
    'One-time code input with configurable length, number/text types, mask mode, auto-focus, validation, and skeleton loading.',
  variantCount: 5,
  keywords: ['pin', 'otp', 'code', 'verification', 'input'],

  cardPreview: (
    <div style={{ pointerEvents: 'none' }}>
      <PinInput length={4} size="sm" defaultValue="1234" />
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <VStack gap="md">
          <PinInput length={6} label="Enter verification code" hint="Check your email" />
          <PinInput length={4} label="4-digit PIN" />
        </VStack>
      ),
      code: `import { PinInput } from '@wisp-ui/react';

<PinInput length={6} label="Verification code" hint="Check your email" />
<PinInput length={4} label="4-digit PIN" />`,
      rnCode: `import { PinInput } from '@wisp-ui/react-native';

<PinInput length={4} />
<PinInput length={6} size="lg" />`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <HStack key={size} gap="md" align="center">
              <Text size="xs" color="tertiary" style={{ width: 20 }}>{size}</Text>
              <PinInput length={4} size={size} />
            </HStack>
          ))}
        </VStack>
      ),
      code: `<PinInput length={4} size="sm" />
<PinInput length={4} size="md" />
<PinInput length={4} size="lg" />`,
    },
    {
      title: 'Masked & Text Type',
      render: (
        <VStack gap="md">
          <PinInput length={6} mask label="Masked PIN" />
          <PinInput length={4} type="text" label="Text input" placeholder="—" />
        </VStack>
      ),
      code: `<PinInput length={6} mask label="Masked PIN" />
<PinInput length={4} type="text" label="Text code" />`,
    },
    {
      title: 'Validation',
      render: (
        <VStack gap="md">
          <PinInput length={4} error="Invalid code" />
          <PinInput length={4} warning="Code expires soon" />
        </VStack>
      ),
      code: `<PinInput error="Invalid code" />
<PinInput warning="Code expires soon" />`,
    },
  ],

  props: [
    { name: 'length', type: 'number', default: '6', description: 'Number of input cells.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Cell size.' },
    { name: 'type', type: "'number' | 'text'", default: "'number'", description: 'Input type filter.' },
    { name: 'value', type: 'string', description: 'Controlled value.' },
    { name: 'defaultValue', type: 'string', description: 'Default value (uncontrolled).' },
    { name: 'onChange', type: '(value: string) => void', description: 'Callback on value change.' },
    { name: 'onComplete', type: '(value: string) => void', description: 'Callback when all cells filled.' },
    { name: 'mask', type: 'boolean', default: 'false', description: 'Mask input like a password.' },
    { name: 'label', type: 'string', description: 'Label text.' },
    { name: 'hint', type: 'string', description: 'Hint text.' },
    { name: 'error', type: 'string | boolean', description: 'Error message or state.' },
    { name: 'warning', type: 'string | boolean', description: 'Warning message or state.' },
    { name: 'autoFocus', type: 'boolean', default: 'false', description: 'Auto-focus first cell.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton loading.' },
  ],
};
