import React from 'react';
import { Toolbar, ToolbarGroup, ToolbarSeparator, Button, Text, VStack, HStack } from '@wisp-ui/react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import type { ComponentEntry } from '../types';

export const toolbarEntry: ComponentEntry = {
  slug: 'toolbar',
  name: 'Toolbar',
  category: 'components',
  subcategory: 'Navigation',
  description:
    'Horizontal toolbar with groups, separators, and 3 variants (elevated, transparent, pill). Sizes control height and spacing.',
  variantCount: 3,
  keywords: ['toolbar', 'actions', 'buttons', 'format', 'bar'],

  cardPreview: (
    <div style={{ pointerEvents: 'none' }}>
      <Toolbar size="sm" variant="elevated">
        <ToolbarGroup>
          <Button size="sm" variant="tertiary" iconLeft={<Bold size={14} />} />
          <Button size="sm" variant="tertiary" iconLeft={<Italic size={14} />} />
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup>
          <Button size="sm" variant="tertiary" iconLeft={<AlignLeft size={14} />} />
        </ToolbarGroup>
      </Toolbar>
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <Toolbar>
          <ToolbarGroup>
            <Button size="sm" variant="tertiary" iconLeft={<Bold size={16} />} />
            <Button size="sm" variant="tertiary" iconLeft={<Italic size={16} />} />
            <Button size="sm" variant="tertiary" iconLeft={<Underline size={16} />} />
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup>
            <Button size="sm" variant="tertiary" iconLeft={<AlignLeft size={16} />} />
            <Button size="sm" variant="tertiary" iconLeft={<AlignCenter size={16} />} />
            <Button size="sm" variant="tertiary" iconLeft={<AlignRight size={16} />} />
          </ToolbarGroup>
        </Toolbar>
      ),
      code: `import { Toolbar, ToolbarGroup, ToolbarSeparator } from '@wisp-ui/react';\n\n<Toolbar>
  <ToolbarGroup>
    <Button variant="tertiary" iconLeft={<Bold />} />
    <Button variant="tertiary" iconLeft={<Italic />} />
  </ToolbarGroup>
  <ToolbarSeparator />
  <ToolbarGroup>
    <Button variant="tertiary" iconLeft={<AlignLeft />} />
  </ToolbarGroup>
</Toolbar>`,
      rnCode: `import { Toolbar, ToolbarGroup, ToolbarSeparator, Button } from '@wisp-ui/react-native';
import { Bold, Italic, AlignLeft } from 'lucide-react-native';

<Toolbar>
  <ToolbarGroup>
    <Button variant="tertiary" iconLeft={<Bold />} />
    <Button variant="tertiary" iconLeft={<Italic />} />
  </ToolbarGroup>
  <ToolbarSeparator />
  <ToolbarGroup>
    <Button variant="tertiary" iconLeft={<AlignLeft />} />
  </ToolbarGroup>
</Toolbar>`,
    },
    {
      title: 'Variants',
      render: (
        <VStack gap="md">
          {(['elevated', 'transparent', 'pill'] as const).map((v) => (
            <VStack key={v} gap="xs">
              <Text size="xs" color="tertiary">{v}</Text>
              <Toolbar variant={v} size="sm">
                <ToolbarGroup>
                  <Button size="sm" variant="tertiary" iconLeft={<Bold size={14} />} />
                  <Button size="sm" variant="tertiary" iconLeft={<Italic size={14} />} />
                </ToolbarGroup>
              </Toolbar>
            </VStack>
          ))}
        </VStack>
      ),
      code: `<Toolbar variant="elevated">…</Toolbar>
<Toolbar variant="transparent">…</Toolbar>
<Toolbar variant="pill">…</Toolbar>`,
      rnCode: `import { Toolbar } from '@wisp-ui/react-native';

<Toolbar variant="elevated">…</Toolbar>
<Toolbar variant="transparent">…</Toolbar>
<Toolbar variant="pill">…</Toolbar>`,
    },
  ],

  props: [
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height and spacing preset.' },
    { name: 'variant', type: "'elevated' | 'transparent' | 'pill'", default: "'elevated'", description: 'Visual variant.' },
    { name: 'children', type: 'React.ReactNode', description: 'Groups and separators.' },
  ],
};
