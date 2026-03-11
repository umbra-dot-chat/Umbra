import React from 'react';
import { TimePicker, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const timePickerEntry: ComponentEntry = {
  slug: 'time-picker',
  name: 'TimePicker',
  category: 'components',
  subcategory: 'Date & Time',
  description:
    'Time selection input with 12h/24h format, minute step intervals, label, error state, and size presets.',
  variantCount: 2,
  keywords: ['time', 'picker', 'clock', 'hour', 'minute'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 200, pointerEvents: 'none' }}>
      <TimePicker placeholder="Pick time" size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 280 }}>
          <TimePicker label="Meeting time" placeholder="Select time" />
          <TimePicker label="24-hour" format="24h" defaultValue="14:30" />
        </VStack>
      ),
      code: `import { TimePicker } from '@wisp-ui/react';\n\n<TimePicker label="Meeting time" />
<TimePicker label="24-hour" format="24h" />`,
      rnCode: `import { TimePicker } from '@wisp-ui/react-native';

<TimePicker label="Meeting time" />
<TimePicker label="24-hour" format="24h" />`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 280 }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <TimePicker key={size} placeholder={size} size={size} />
          ))}
        </VStack>
      ),
      code: `<TimePicker size="sm" />
<TimePicker size="md" />
<TimePicker size="lg" />`,
      rnCode: `import { TimePicker } from '@wisp-ui/react-native';

<TimePicker size="sm" />
<TimePicker size="md" />
<TimePicker size="lg" />`,
    },
  ],

  props: [
    { name: 'value', type: 'string', description: 'Controlled time (HH:MM format).' },
    { name: 'defaultValue', type: 'string', description: 'Initial time (uncontrolled).' },
    { name: 'onChange', type: '(time: string) => void', description: 'Time change callback.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Input size.' },
    { name: 'format', type: "'12h' | '24h'", default: "'12h'", description: 'Display format.' },
    { name: 'minuteStep', type: 'number', default: '1', description: 'Minute interval.' },
    { name: 'placeholder', type: 'string', default: "'Select time'", description: 'Placeholder text.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'label', type: 'string', description: 'Label text.' },
    { name: 'error', type: 'string | boolean', description: 'Error state.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Skeleton placeholder.' },
  ],
};
