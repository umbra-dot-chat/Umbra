import React, { useState } from 'react';
import { Radio, RadioGroup, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function RadioDemo() {
  const [value, setValue] = useState('option-1');
  return (
    <RadioGroup value={value} onChange={setValue}>
      <Radio value="option-1" label="Option 1" />
      <Radio value="option-2" label="Option 2" />
      <Radio value="option-3" label="Option 3" />
    </RadioGroup>
  );
}

export const radioEntry: ComponentEntry = {
  slug: 'radio',
  name: 'Radio',
  category: 'primitives',
  subcategory: 'Selection',
  description:
    'Radio button group with vertical/horizontal orientation, descriptions, validation states, and skeleton loading.',
  variantCount: 5,
  keywords: ['radio', 'option', 'select', 'group', 'form'],

  cardPreview: (
    <RadioGroup defaultValue="a" size="sm">
      <Radio value="a" label="Option A" />
      <Radio value="b" label="Option B" />
    </RadioGroup>
  ),

  examples: [
    {
      title: 'Interactive',
      render: <RadioDemo />,
      code: `import { Radio, RadioGroup } from '@wisp-ui/react';

const [value, setValue] = useState('option-1');
<RadioGroup value={value} onChange={setValue}>
  <Radio value="option-1" label="Option 1" />
  <Radio value="option-2" label="Option 2" />
  <Radio value="option-3" label="Option 3" />
</RadioGroup>`,
      rnCode: `import { Radio, RadioGroup } from '@wisp-ui/react-native';

<RadioGroup value="a" onChange={setValue}>
  <Radio value="a" label="Option A" />
  <Radio value="b" label="Option B" />
  <Radio value="c" label="Option C" />
</RadioGroup>`,
    },
    {
      title: 'Orientation',
      render: (
        <VStack gap="lg">
          <VStack gap="xs">
            <Text size="xs" color="tertiary">Vertical (default)</Text>
            <RadioGroup defaultValue="a" orientation="vertical">
              <Radio value="a" label="Alpha" />
              <Radio value="b" label="Beta" />
            </RadioGroup>
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="tertiary">Horizontal</Text>
            <RadioGroup defaultValue="a" orientation="horizontal">
              <Radio value="a" label="Alpha" />
              <Radio value="b" label="Beta" />
              <Radio value="c" label="Gamma" />
            </RadioGroup>
          </VStack>
        </VStack>
      ),
      code: `<RadioGroup orientation="horizontal" defaultValue="a">
  <Radio value="a" label="Alpha" />
  <Radio value="b" label="Beta" />
</RadioGroup>`,
    },
    {
      title: 'With Descriptions',
      render: (
        <RadioGroup defaultValue="free">
          <Radio value="free" label="Free" description="Basic features, 1 project" />
          <Radio value="pro" label="Pro" description="All features, unlimited projects" />
          <Radio value="enterprise" label="Enterprise" description="Custom deployment, SLA" />
        </RadioGroup>
      ),
      code: `<RadioGroup defaultValue="free">
  <Radio value="free" label="Free" description="Basic features" />
  <Radio value="pro" label="Pro" description="All features" />
</RadioGroup>`,
    },
    {
      title: 'States',
      render: (
        <VStack gap="md">
          <RadioGroup defaultValue="a" disabled>
            <Radio value="a" label="Disabled selected" />
            <Radio value="b" label="Disabled" />
          </RadioGroup>
          <RadioGroup defaultValue="a" error>
            <Radio value="a" label="Error state" />
            <Radio value="b" label="Option B" />
          </RadioGroup>
        </VStack>
      ),
      code: `<RadioGroup disabled defaultValue="a">
  <Radio value="a" label="Disabled" />
</RadioGroup>`,
    },
  ],

  props: [
    { name: 'value', type: 'string', description: 'Controlled selected value (RadioGroup).' },
    { name: 'defaultValue', type: 'string', description: 'Default selected value (RadioGroup).' },
    { name: 'onChange', type: '(value: string) => void', description: 'Callback on selection change (RadioGroup).' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Radio button size (RadioGroup).' },
    { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'Layout orientation (RadioGroup).' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state for all radios.' },
    { name: 'error', type: 'boolean', default: 'false', description: 'Error validation state.' },
    { name: 'label', type: 'React.ReactNode', description: 'Label text (Radio).' },
    { name: 'description', type: 'string', description: 'Helper description (Radio).' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton loading.' },
  ],
};
