import React from 'react';
import { DateRangePicker, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const dateRangePickerEntry: ComponentEntry = {
  slug: 'date-range-picker',
  name: 'DateRangePicker',
  category: 'components',
  subcategory: 'Date & Time',
  description:
    'Dual-calendar date range selector with start/end inputs, min/max constraints, sizes, and skeleton loading.',
  variantCount: 3,
  keywords: ['date', 'range', 'picker', 'calendar', 'period', 'between'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 220, pointerEvents: 'none' }}>
      <DateRangePicker placeholder="Select dates" size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <div style={{ width: '100%', maxWidth: 300, paddingBottom: 300 }}>
          <DateRangePicker label="Trip dates" placeholder="Select dates" />
        </div>
      ),
      code: `import { DateRangePicker } from '@wisp-ui/react';

<DateRangePicker label="Trip dates" placeholder="Select dates" />`,
      rnCode: `import { DateRangePicker } from '@wisp-ui/react-native';

<DateRangePicker label="Trip dates" placeholder="Select dates" />`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 300, paddingBottom: 300 }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <DateRangePicker key={size} placeholder={size} size={size} />
          ))}
        </VStack>
      ),
      code: `<DateRangePicker size="sm" />
<DateRangePicker size="md" />
<DateRangePicker size="lg" />`,
      rnCode: `import { DateRangePicker } from '@wisp-ui/react-native';

<DateRangePicker size="sm" />
<DateRangePicker size="md" />
<DateRangePicker size="lg" />`,
    },
  ],

  props: [
    { name: 'value', type: 'DateRange', description: 'Controlled range { start, end }.' },
    { name: 'defaultValue', type: 'DateRange', description: 'Initial range (uncontrolled).' },
    { name: 'onChange', type: '(range: DateRange) => void', description: 'Range change callback.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Input size.' },
    { name: 'placeholder', type: 'string', default: "'Select dates'", description: 'Placeholder text.' },
    { name: 'minDate', type: 'Date', description: 'Earliest date.' },
    { name: 'maxDate', type: 'Date', description: 'Latest date.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'label', type: 'string', description: 'Label text.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Skeleton placeholder.' },
  ],
};
