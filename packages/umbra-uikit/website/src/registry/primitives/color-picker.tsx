import React, { useState } from 'react';
import { ColorPicker, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function ColorPickerDemo() {
  const [color, setColor] = useState('#3B82F6');
  return <ColorPicker value={color} onChange={setColor} label="Brand color" />;
}

export const colorPickerEntry: ComponentEntry = {
  slug: 'color-picker',
  name: 'ColorPicker',
  category: 'primitives',
  subcategory: 'Inputs',
  description:
    'Color picker with hue/saturation area, preset swatches, hex input, 3 sizes, and skeleton loading.',
  variantCount: 3,
  keywords: ['color', 'picker', 'hex', 'swatch', 'palette', 'hue'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 200, pointerEvents: 'none' }}>
      <ColorPicker defaultValue="#3B82F6" size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Interactive',
      render: (
        <div style={{ width: '100%', maxWidth: 260 }}>
          <ColorPickerDemo />
        </div>
      ),
      code: `import { ColorPicker } from '@wisp-ui/react';

const [color, setColor] = useState('#3B82F6');
<ColorPicker value={color} onChange={setColor} label="Brand color" />`,
    },
    {
      title: 'Sizes',
      render: (
        <HStack gap="lg" align="start" style={{ flexWrap: 'wrap' }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <VStack key={size} gap="xs">
              <Text size="xs" color="tertiary">{size}</Text>
              <ColorPicker defaultValue="#22C55E" size={size} />
            </VStack>
          ))}
        </HStack>
      ),
      code: `<ColorPicker size="sm" defaultValue="#22C55E" />
<ColorPicker size="md" defaultValue="#22C55E" />
<ColorPicker size="lg" defaultValue="#22C55E" />`,
    },
    {
      title: 'Custom Presets',
      render: (
        <div style={{ width: '100%', maxWidth: 260 }}>
          <ColorPicker
            defaultValue="#EF4444"
            presets={['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899']}
            label="Theme color"
          />
        </div>
      ),
      code: `<ColorPicker
  presets={['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6']}
  label="Theme color"
/>`,
    },
    {
      title: 'Without Input',
      render: (
        <div style={{ width: '100%', maxWidth: 260 }}>
          <ColorPicker defaultValue="#8B5CF6" showInput={false} />
        </div>
      ),
      code: `<ColorPicker showInput={false} defaultValue="#8B5CF6" />`,
    },
  ],

  rnCode: `import { ColorPicker } from '@wisp-ui/react-native';

// Controlled
const [color, setColor] = useState('#3B82F6');
<ColorPicker value={color} onChange={setColor} label="Brand color" />

// Uncontrolled
<ColorPicker defaultValue="#22C55E" size="sm" />`,

  props: [
    { name: 'value', type: 'string', description: 'Controlled hex color value.' },
    { name: 'defaultValue', type: 'string', default: "'#000000'", description: 'Default color (uncontrolled).' },
    { name: 'onChange', type: '(color: string) => void', description: 'Callback on color change.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Picker size.' },
    { name: 'presets', type: 'string[]', description: 'Preset color swatch palette.' },
    { name: 'showInput', type: 'boolean', default: 'true', description: 'Show hex input field.' },
    { name: 'label', type: 'string', description: 'Label text.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton loading.' },
  ],
};
