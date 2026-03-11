import React, { useState } from 'react';
import { Calendar, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function CalendarDemo() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return <Calendar value={date} onChange={setDate} />;
}

export const calendarEntry: ComponentEntry = {
  slug: 'calendar',
  name: 'Calendar',
  category: 'components',
  subcategory: 'Date & Time',
  description:
    'Month calendar with date selection, min/max constraints, disabled dates, locale support, and 3 size presets.',
  variantCount: 3,
  keywords: ['calendar', 'date', 'month', 'picker', 'schedule'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 220, pointerEvents: 'none' }}>
      <Calendar size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Interactive',
      render: (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <CalendarDemo />
        </div>
      ),
      code: `import { Calendar } from '@wisp-ui/react';\n\nconst [date, setDate] = useState(new Date());
<Calendar value={date} onChange={setDate} />`,
      rnCode: `import { Calendar } from '@wisp-ui/react-native';

const [date, setDate] = useState(new Date());
<Calendar value={date} onChange={setDate} />`,
    },
    {
      title: 'Sizes',
      render: (
        <HStack gap="lg" align="start" style={{ flexWrap: 'wrap' }}>
          {(['sm', 'md'] as const).map((size) => (
            <VStack key={size} gap="xs">
              <Text size="xs" color="tertiary">{size}</Text>
              <Calendar size={size} />
            </VStack>
          ))}
        </HStack>
      ),
      code: `<Calendar size="sm" />
<Calendar size="md" />
<Calendar size="lg" />`,
      rnCode: `import { Calendar } from '@wisp-ui/react-native';

<Calendar size="sm" />
<Calendar size="md" />
<Calendar size="lg" />`,
    },
  ],

  props: [
    { name: 'value', type: 'Date', description: 'Selected date (controlled).' },
    { name: 'defaultValue', type: 'Date', description: 'Initial date (uncontrolled).' },
    { name: 'onChange', type: '(date: Date) => void', description: 'Date selection callback.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Calendar size.' },
    { name: 'minDate', type: 'Date', description: 'Earliest selectable date.' },
    { name: 'maxDate', type: 'Date', description: 'Latest selectable date.' },
    { name: 'disabledDates', type: 'Date[]', description: 'Specific disabled dates.' },
    { name: 'locale', type: 'string', default: "'en-US'", description: 'BCP-47 locale.' },
    { name: 'weekStartsOn', type: '0 | 1', default: '0', description: 'Week start (0=Sun, 1=Mon).' },
    { name: 'showOutsideDays', type: 'boolean', default: 'true', description: 'Show adjacent month days.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Skeleton placeholder.' },
  ],
};
