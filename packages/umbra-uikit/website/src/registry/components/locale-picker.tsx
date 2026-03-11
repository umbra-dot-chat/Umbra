import React from 'react';
import { LocalePicker, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const localePickerEntry: ComponentEntry = {
  slug: 'locale-picker',
  name: 'LocalePicker',
  category: 'components',
  subcategory: 'Date & Time',
  description:
    'Language/locale selector with searchable dropdown, region grouping, native labels, and skeleton loading.',
  variantCount: 3,
  keywords: ['locale', 'language', 'picker', 'i18n', 'internationalization'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 200, pointerEvents: 'none' }}>
      <LocalePicker defaultValue="en-US" size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <div style={{ width: '100%', maxWidth: 280 }}>
          <LocalePicker label="Language" defaultValue="en-US" />
        </div>
      ),
      code: `import { LocalePicker } from '@wisp-ui/react';\n\n<LocalePicker label="Language" defaultValue="en-US" />`,
      rnCode: `import { LocalePicker } from '@wisp-ui/react-native';

<LocalePicker label="Language" defaultValue="en-US" />`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 280 }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <LocalePicker key={size} placeholder={size} size={size} />
          ))}
        </VStack>
      ),
      code: `<LocalePicker size="sm" />
<LocalePicker size="md" />
<LocalePicker size="lg" />`,
      rnCode: `import { LocalePicker } from '@wisp-ui/react-native';

<LocalePicker size="sm" />
<LocalePicker size="md" />
<LocalePicker size="lg" />`,
    },
  ],

  props: [
    { name: 'value', type: 'string', description: 'Controlled locale code.' },
    { name: 'defaultValue', type: 'string', description: 'Initial locale (uncontrolled).' },
    { name: 'onChange', type: '(code: string) => void', description: 'Selection callback.' },
    { name: 'options', type: 'LocaleOption[]', description: 'Custom locale options.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Input size.' },
    { name: 'placeholder', type: 'string', default: "'Select language'", description: 'Placeholder text.' },
    { name: 'searchable', type: 'boolean', default: 'true', description: 'Show search input.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'label', type: 'string', description: 'Label text.' },
    { name: 'groupByRegion', type: 'boolean', default: 'true', description: 'Group by region.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Skeleton placeholder.' },
  ],
};
