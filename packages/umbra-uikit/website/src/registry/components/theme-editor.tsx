import React from 'react';
import { ThemeEditor, Text, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const themeEditorEntry: ComponentEntry = {
  slug: 'theme-editor',
  name: 'ThemeEditor',
  category: 'components',
  subcategory: 'Utilities',
  description:
    'Live theme customization panel with controls for every configurable token — colors, spacing, typography, and border radii. Changes propagate instantly to all components via context.',
  variantCount: 4,
  keywords: [
    'theme',
    'editor',
    'settings',
    'customize',
    'tokens',
    'colors',
    'spacing',
    'typography',
    'radii',
    'live',
    'preview',
  ],

  cardPreview: (
    <VStack gap="xs" style={{ width: '100%', maxWidth: 260, alignItems: 'center' }}>
      <Text weight="semibold">Theme Editor</Text>
      <Text size="xs" color="secondary">
        Colors · Spacing · Typography · Radii
      </Text>
    </VStack>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <ThemeEditor style={{ width: '100%', maxWidth: 500 }} />
      ),
      code: `import { ThemeEditor } from '@wisp-ui/react';

<ThemeEditor />`,
      rnCode: `import { ThemeEditor } from '@wisp-ui/react-native';

<ThemeEditor />`,
    },
    {
      title: 'Without Mode Toggle',
      render: (
        <ThemeEditor
          showModeToggle={false}
          style={{ width: '100%', maxWidth: 500 }}
        />
      ),
      code: `<ThemeEditor showModeToggle={false} />`,
      rnCode: `<ThemeEditor showModeToggle={false} />`,
    },
    {
      title: 'Custom Max Height',
      render: (
        <ThemeEditor
          maxHeight={300}
          style={{ width: '100%', maxWidth: 500 }}
        />
      ),
      code: `<ThemeEditor maxHeight={300} />`,
      rnCode: `<ThemeEditor maxHeight={300} />`,
    },
    {
      title: 'Spacing Tab Default',
      render: (
        <ThemeEditor
          defaultTab="spacing"
          style={{ width: '100%', maxWidth: 500 }}
        />
      ),
      code: `<ThemeEditor defaultTab="spacing" />`,
      rnCode: `<ThemeEditor defaultTab="spacing" />`,
    },
  ],

  props: [
    {
      name: 'defaultTab',
      type: "'colors' | 'spacing' | 'typography' | 'radii'",
      default: "'colors'",
      description: 'Initially active tab when uncontrolled.',
    },
    {
      name: 'activeTab',
      type: "'colors' | 'spacing' | 'typography' | 'radii'",
      description: 'Controlled active tab.',
    },
    {
      name: 'onTabChange',
      type: '(tab: ThemeEditorTab) => void',
      description: 'Callback fired when the active tab changes.',
    },
    {
      name: 'showModeToggle',
      type: 'boolean',
      default: 'true',
      description: 'Whether to show the dark/light mode toggle.',
    },
    {
      name: 'showReset',
      type: 'boolean',
      default: 'true',
      description: 'Whether to show the reset-to-defaults button.',
    },
    {
      name: 'maxHeight',
      type: 'number | string',
      default: '480',
      description: 'Maximum height for the scrollable content area.',
    },
  ],
};
