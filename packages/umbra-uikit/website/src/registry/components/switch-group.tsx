import React from 'react';
import { SwitchGroup, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const notifOptions = [
  { value: 'email', label: 'Email', description: 'Get notified via email.' },
  { value: 'push', label: 'Push', description: 'Browser push notifications.' },
  { value: 'sms', label: 'SMS', description: 'Text message alerts.' },
];

export const switchGroupEntry: ComponentEntry = {
  slug: 'switch-group',
  name: 'SwitchGroup',
  category: 'components',
  subcategory: 'Selection & Input',
  description:
    'Group of toggle switches for multi-select with label, descriptions, error state, and horizontal/vertical layout.',
  variantCount: 2,
  keywords: ['switch', 'group', 'toggle', 'multi', 'settings'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 200, pointerEvents: 'none' }}>
      <SwitchGroup
        options={[
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ]}
        defaultValue={['a']}
      />
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <SwitchGroup
            label="Notifications"
            description="Choose how you want to be notified."
            options={notifOptions}
            defaultValue={['email']}
          />
        </div>
      ),
      code: `import { SwitchGroup } from '@wisp-ui/react';\n\n<SwitchGroup
  label="Notifications"
  options={[
    { value: 'email', label: 'Email', description: 'Get notified via email.' },
    { value: 'push', label: 'Push' },
  ]}
  defaultValue={['email']}
/>`,
      rnCode: `import { SwitchGroup } from '@wisp-ui/react-native';

<SwitchGroup
  label="Notifications"
  options={[
    { value: 'email', label: 'Email', description: 'Get notified via email.' },
    { value: 'push', label: 'Push' },
  ]}
  defaultValue={['email']}
/>`,
    },
    {
      title: 'Error State',
      render: (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <SwitchGroup
            label="Preferences"
            options={notifOptions}
            error="Select at least one option."
          />
        </div>
      ),
      code: `<SwitchGroup
  label="Preferences"
  options={options}
  error="Select at least one option."
/>`,
      rnCode: `import { SwitchGroup } from '@wisp-ui/react-native';

<SwitchGroup
  label="Preferences"
  options={options}
  error="Select at least one option."
/>`,
    },
  ],

  props: [
    { name: 'options', type: 'SwitchGroupOption[]', required: true, description: 'Array of toggle options.' },
    { name: 'value', type: 'string[]', description: 'Controlled selected values.' },
    { name: 'defaultValue', type: 'string[]', default: '[]', description: 'Initial values (uncontrolled).' },
    { name: 'onChange', type: '(value: string[]) => void', description: 'Selection callback.' },
    { name: 'label', type: 'string', description: 'Group label.' },
    { name: 'description', type: 'string', description: 'Group description.' },
    { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'Layout direction.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable all options.' },
    { name: 'error', type: 'string', description: 'Error message.' },
  ],
};
