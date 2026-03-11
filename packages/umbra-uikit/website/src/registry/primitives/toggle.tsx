import React, { useState } from 'react';
import { Toggle, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function ToggleDemo() {
  const [on, setOn] = useState(false);
  return <Toggle checked={on} onChange={setOn} label="Notifications" />;
}

export const toggleEntry: ComponentEntry = {
  slug: 'toggle',
  name: 'Toggle',
  category: 'primitives',
  subcategory: 'Selection',
  description:
    'Switch toggle with 5 sizes, slim variant, custom handle icons, label, and skeleton loading.',
  variantCount: 5,
  keywords: ['toggle', 'switch', 'on', 'off', 'boolean'],

  cardPreview: (
    <HStack gap="md" align="center">
      <Toggle defaultChecked size="md" />
      <Toggle size="sm" />
    </HStack>
  ),

  examples: [
    {
      title: 'Interactive',
      render: <ToggleDemo />,
      code: `import { Toggle } from '@wisp-ui/react';

const [on, setOn] = useState(false);
<Toggle checked={on} onChange={setOn} label="Notifications" />`,
      rnCode: `import { Toggle } from '@wisp-ui/react-native';

<Toggle />
<Toggle defaultChecked />
<Toggle checked={value} onChange={setValue} />`,
    },
    {
      title: 'Sizes',
      render: (
        <HStack gap="lg" align="center">
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <VStack key={size} gap="xs" align="center">
              <Toggle defaultChecked size={size} />
              <Text size="xs" color="tertiary">{size}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `<Toggle size="xs" />
<Toggle size="md" />
<Toggle size="xl" />`,
    },
    {
      title: 'Slim Variant',
      render: (
        <HStack gap="lg" align="center">
          <Toggle defaultChecked slim label="Regular" />
          <Toggle slim label="Slim off" />
        </HStack>
      ),
      code: `<Toggle slim defaultChecked label="Slim toggle" />`,
    },
    {
      title: 'States',
      render: (
        <VStack gap="md">
          <Toggle defaultChecked label="Enabled (on)" />
          <Toggle label="Enabled (off)" />
          <Toggle disabled defaultChecked label="Disabled (on)" />
          <Toggle disabled label="Disabled (off)" />
        </VStack>
      ),
      code: `<Toggle disabled defaultChecked label="Disabled (on)" />
<Toggle disabled label="Disabled (off)" />`,
    },
  ],

  props: [
    { name: 'checked', type: 'boolean', description: 'Controlled checked state.' },
    { name: 'defaultChecked', type: 'boolean', default: 'false', description: 'Default checked (uncontrolled).' },
    { name: 'onChange', type: '(checked: boolean) => void', description: 'Callback when toggled.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Toggle size.' },
    { name: 'slim', type: 'boolean', default: 'false', description: 'Slim track variant.' },
    { name: 'label', type: 'string', description: 'Label text.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton loading.' },
  ],
};
