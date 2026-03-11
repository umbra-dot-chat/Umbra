import React from 'react';
import { CheckboxGroup, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const roleOptions = [
  { value: 'admin', label: 'Admin', description: 'Full access to all resources.' },
  { value: 'editor', label: 'Editor', description: 'Can edit content.' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access.' },
];

export const checkboxGroupEntry: ComponentEntry = {
  slug: 'checkbox-group',
  name: 'CheckboxGroup',
  category: 'components',
  subcategory: 'Selection & Input',
  description:
    'Group of checkboxes for multi-select with label, descriptions, error state, and horizontal/vertical layout.',
  variantCount: 2,
  keywords: ['checkbox', 'group', 'multi', 'select', 'check'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 200, pointerEvents: 'none' }}>
      <CheckboxGroup
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
          <CheckboxGroup
            label="Roles"
            description="Assign user roles."
            options={roleOptions}
            defaultValue={['viewer']}
          />
        </div>
      ),
      code: `import { CheckboxGroup } from '@wisp-ui/react';\n\n<CheckboxGroup
  label="Roles"
  options={[
    { value: 'admin', label: 'Admin', description: 'Full access.' },
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Viewer' },
  ]}
  defaultValue={['viewer']}
/>`,
      rnCode: `import { CheckboxGroup } from '@wisp-ui/react-native';

<CheckboxGroup
  label="Roles"
  options={[
    { value: 'admin', label: 'Admin', description: 'Full access.' },
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Viewer' },
  ]}
  defaultValue={['viewer']}
/>`,
    },
    {
      title: 'Horizontal',
      render: (
        <CheckboxGroup
          label="Features"
          options={[
            { value: 'dark', label: 'Dark mode' },
            { value: 'notif', label: 'Notifications' },
            { value: 'auto', label: 'Auto-save' },
          ]}
          orientation="horizontal"
          defaultValue={['dark', 'auto']}
        />
      ),
      code: `<CheckboxGroup orientation="horizontal" options={options} />`,
      rnCode: `import { CheckboxGroup } from '@wisp-ui/react-native';

<CheckboxGroup orientation="horizontal" options={options} />`,
    },
  ],

  props: [
    { name: 'options', type: 'SwitchGroupOption[]', required: true, description: 'Array of checkbox options.' },
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
