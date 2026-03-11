import React, { useState } from 'react';
import { Slider, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function SliderDemo() {
  const [value, setValue] = useState(50);
  return <Slider value={value} onChange={setValue} label="Volume" showValue />;
}

export const sliderEntry: ComponentEntry = {
  slug: 'slider',
  name: 'Slider',
  category: 'primitives',
  subcategory: 'Inputs',
  description:
    'Range slider with 5 sizes, label, value display, custom step, and skeleton loading.',
  variantCount: 5,
  keywords: ['slider', 'range', 'value', 'input', 'draggable'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 200, pointerEvents: 'none' }}>
      <Slider defaultValue={60} size="md" />
    </div>
  ),

  examples: [
    {
      title: 'Interactive',
      render: (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <SliderDemo />
        </div>
      ),
      code: `import { Slider } from '@wisp-ui/react';

const [value, setValue] = useState(50);
<Slider value={value} onChange={setValue} label="Volume" showValue />`,
      rnCode: `import { Slider } from '@wisp-ui/react-native';

<Slider defaultValue={50} />
<Slider value={volume} onChange={setVolume} />`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="lg" style={{ width: '100%', maxWidth: 400 }}>
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <HStack key={size} gap="md" align="center">
              <Text size="xs" color="tertiary" style={{ width: 20 }}>{size}</Text>
              <Slider defaultValue={50} size={size} style={{ flex: 1 }} />
            </HStack>
          ))}
        </VStack>
      ),
      code: `<Slider size="xs" defaultValue={50} />
<Slider size="md" defaultValue={50} />
<Slider size="xl" defaultValue={50} />`,
    },
    {
      title: 'Custom Range & Step',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <Slider defaultValue={25} min={0} max={100} step={25} label="Quarter steps" showValue />
          <Slider defaultValue={5} min={1} max={10} step={1} label="1–10 scale" showValue />
        </VStack>
      ),
      code: `<Slider min={0} max={100} step={25} label="Quarter steps" showValue />
<Slider min={1} max={10} step={1} label="1–10" showValue />`,
    },
    {
      title: 'States',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <Slider defaultValue={40} label="Normal" />
          <Slider defaultValue={40} disabled label="Disabled" />
        </VStack>
      ),
      code: `<Slider defaultValue={40} disabled label="Disabled" />`,
    },
  ],

  props: [
    { name: 'value', type: 'number', description: 'Controlled value.' },
    { name: 'defaultValue', type: 'number', default: '0', description: 'Default value (uncontrolled).' },
    { name: 'onChange', type: '(value: number) => void', description: 'Callback on value change.' },
    { name: 'onChangeEnd', type: '(value: number) => void', description: 'Callback when drag ends.' },
    { name: 'min', type: 'number', default: '0', description: 'Minimum value.' },
    { name: 'max', type: 'number', default: '100', description: 'Maximum value.' },
    { name: 'step', type: 'number', default: '1', description: 'Step increment.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Slider size.' },
    { name: 'label', type: 'string', description: 'Label text.' },
    { name: 'showValue', type: 'boolean', default: 'false', description: 'Display current value.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton loading.' },
  ],
};
