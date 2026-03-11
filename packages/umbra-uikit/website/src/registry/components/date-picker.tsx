import React, { useState } from 'react';
import { DatePicker, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function DatePickerDemo() {
  const [date, setDate] = useState<Date | null>(null);
  return <DatePicker value={date ?? undefined} onChange={(d) => setDate(d)} label="Select date" />;
}

export const datePickerEntry: ComponentEntry = {
  slug: 'date-picker',
  name: 'DatePicker',
  category: 'components',
  subcategory: 'Date & Time',
  description:
    'Input with calendar dropdown for date selection. Supports formatting, min/max, clearable, label, error, and skeleton.',
  variantCount: 3,
  keywords: ['date', 'picker', 'calendar', 'input', 'select'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 200, pointerEvents: 'none' }}>
      <DatePicker placeholder="Pick a date" size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Interactive',
      render: (
        <div style={{ width: '100%', maxWidth: 280 }}>
          <DatePickerDemo />
        </div>
      ),
      code: `import { DatePicker } from '@wisp-ui/react';

const [date, setDate] = useState(null);
<DatePicker value={date} onChange={setDate} label="Select date" />`,
      rnCode: `import { DatePicker } from '@wisp-ui/react-native';

const [date, setDate] = useState(null);
<DatePicker value={date} onChange={setDate} label="Select date" />`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 280 }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <DatePicker key={size} placeholder={size} size={size} />
          ))}
        </VStack>
      ),
      code: `<DatePicker size="sm" />
<DatePicker size="md" />
<DatePicker size="lg" />`,
      rnCode: `import { DatePicker } from '@wisp-ui/react-native';

<DatePicker size="sm" />
<DatePicker size="md" />
<DatePicker size="lg" />`,
    },
  ],

  props: [
    { name: 'value', type: 'Date', description: 'Selected date (controlled).' },
    { name: 'defaultValue', type: 'Date', description: 'Initial date (uncontrolled).' },
    { name: 'onChange', type: '(date: Date | null) => void', description: 'Selection callback.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Input size.' },
    { name: 'placeholder', type: 'string', default: "'Select date'", description: 'Placeholder text.' },
    { name: 'format', type: 'string', default: "'MM/DD/YYYY'", description: 'Date display format.' },
    { name: 'minDate', type: 'Date', description: 'Earliest date.' },
    { name: 'maxDate', type: 'Date', description: 'Latest date.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'label', type: 'string', description: 'Label text.' },
    { name: 'error', type: 'string | boolean', description: 'Error state.' },
    { name: 'clearable', type: 'boolean', default: 'true', description: 'Show clear button.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Skeleton placeholder.' },
  ],
};
