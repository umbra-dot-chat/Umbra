import React from 'react';
import { Button, HStack, VStack } from '@wisp-ui/react';
import { Mail, ArrowRight, Download, Trash2 } from 'lucide-react';
import type { ComponentEntry } from '../types';

export const buttonEntry: ComponentEntry = {
  slug: 'button',
  name: 'Button',
  category: 'primitives',
  subcategory: 'Buttons & Actions',
  description:
    'Trigger actions and submit forms. Supports multiple variants, sizes, shapes, icons, loading states, and full-width layout.',
  variantCount: 16,
  keywords: ['button', 'action', 'submit', 'cta', 'click'],

  cardPreview: (
    <HStack gap="sm" align="center">
      <Button variant="primary" size="md">Primary</Button>
      <Button variant="secondary" size="md">Secondary</Button>
      <Button variant="tertiary" size="md">Tertiary</Button>
    </HStack>
  ),

  examples: [
    {
      title: 'Variants',
      render: (
        <HStack gap="sm" align="center" style={{ flexWrap: 'wrap' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="success">Success</Button>
          <Button variant="brand">Brand</Button>
        </HStack>
      ),
      code: `import { Button } from '@wisp-ui/react';

<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="tertiary">Tertiary</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="success">Success</Button>
<Button variant="brand">Brand</Button>`,
      rnCode: `import { Button } from '@wisp-ui/react-native';

<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="tertiary">Tertiary</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="success">Success</Button>`,
    },
    {
      title: 'Sizes',
      render: (
        <HStack gap="sm" align="center">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </HStack>
      ),
      code: `<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>`,
      rnCode: `import { Button } from '@wisp-ui/react-native';

<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>`,
    },
    {
      title: 'With Icons',
      render: (
        <HStack gap="sm" align="center">
          <Button iconLeft={<Mail size={16} />}>Email</Button>
          <Button iconRight={<ArrowRight size={16} />}>Continue</Button>
          <Button iconLeft={<Download size={16} />} iconRight={<ArrowRight size={16} />}>
            Download
          </Button>
        </HStack>
      ),
      code: `<Button iconLeft={<Mail size={16} />}>Email</Button>
<Button iconRight={<ArrowRight size={16} />}>Continue</Button>
<Button iconLeft={<Download size={16} />} iconRight={<ArrowRight size={16} />}>
  Download
</Button>`,
    },
    {
      title: 'Shapes',
      render: (
        <HStack gap="sm" align="center">
          <Button shape="rounded">Rounded</Button>
          <Button shape="pill">Pill</Button>
          <Button shape="square" iconLeft={<Trash2 size={16} />} />
        </HStack>
      ),
      code: `<Button shape="rounded">Rounded</Button>
<Button shape="pill">Pill</Button>
<Button shape="square" iconLeft={<Trash2 size={16} />} />`,
    },
    {
      title: 'States',
      render: (
        <HStack gap="sm" align="center">
          <Button disabled>Disabled</Button>
          <Button isLoading>Loading</Button>
          <Button pulse>Pulse</Button>
        </HStack>
      ),
      code: `<Button disabled>Disabled</Button>
<Button isLoading>Loading</Button>
<Button pulse>Pulse</Button>`,
      rnCode: `import { Button } from '@wisp-ui/react-native';

<Button disabled>Disabled</Button>
<Button isLoading>Loading</Button>`,
    },
  ],

  props: [
    { name: 'variant', type: "'primary' | 'secondary' | 'tertiary' | 'destructive' | 'success' | 'brand' | ...", default: "'primary'", description: 'Visual variant controlling colors and contrast.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Size preset controlling height, padding, and font size.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Border-radius shape.' },
    { name: 'iconLeft', type: 'React.ReactNode', description: 'Icon rendered before the label text.' },
    { name: 'iconRight', type: 'React.ReactNode', description: 'Icon rendered after the label text.' },
    { name: 'isLoading', type: 'boolean', default: 'false', description: 'Shows a spinner and disables interaction.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the button.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretches the button to 100% width.' },
    { name: 'onSurface', type: 'boolean', default: 'false', description: 'Adapts secondary/tertiary variants for dark surfaces.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Renders a loading placeholder skeleton.' },
    { name: 'pulse', type: 'boolean', default: 'false', description: 'Adds an outward pulse animation.' },
    { name: 'children', type: 'React.ReactNode', description: 'Button label content.' },
  ],
};
