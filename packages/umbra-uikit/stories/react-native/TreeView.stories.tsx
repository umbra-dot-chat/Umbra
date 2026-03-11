import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TreeView } from '@wisp-ui/react-native';
import type { TreeNode } from '@wisp-ui/react-native';

const meta: Meta<typeof TreeView> = {
  title: 'React Native/Components/Data Display/TreeView',
  component: TreeView,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    selectable: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof TreeView>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

const simpleNodes: TreeNode[] = [
  { id: 'docs', label: 'Documents' },
  { id: 'photos', label: 'Photos' },
  { id: 'music', label: 'Music' },
];

const nestedNodes: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'components',
        label: 'components',
        children: [
          { id: 'button', label: 'Button.tsx' },
          { id: 'input', label: 'Input.tsx' },
          { id: 'card', label: 'Card.tsx' },
        ],
      },
      {
        id: 'hooks',
        label: 'hooks',
        children: [
          { id: 'use-theme', label: 'useTheme.ts' },
          { id: 'use-toggle', label: 'useToggle.ts' },
        ],
      },
      { id: 'index', label: 'index.ts' },
    ],
  },
  {
    id: 'tests',
    label: 'tests',
    children: [
      { id: 'button-test', label: 'Button.test.tsx' },
      { id: 'input-test', label: 'Input.test.tsx' },
    ],
  },
  { id: 'package', label: 'package.json' },
  { id: 'readme', label: 'README.md' },
];

const deepNodes: TreeNode[] = [
  {
    id: 'project',
    label: 'my-project',
    children: [
      {
        id: 'app',
        label: 'app',
        children: [
          {
            id: 'routes',
            label: 'routes',
            children: [
              { id: 'home', label: 'home.tsx' },
              { id: 'about', label: 'about.tsx' },
              { id: 'settings', label: 'settings.tsx' },
            ],
          },
          { id: 'layout', label: 'layout.tsx' },
        ],
      },
      {
        id: 'lib',
        label: 'lib',
        children: [
          { id: 'utils', label: 'utils.ts' },
          { id: 'api', label: 'api.ts' },
        ],
      },
      { id: 'config', label: 'config.ts' },
    ],
  },
];

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    nodes: simpleNodes,
    size: 'md',
    selectable: true,
  },
};

// ---------------------------------------------------------------------------
// 2. NestedTree
// ---------------------------------------------------------------------------

export const NestedTree: Story = {
  name: 'Nested Tree',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <div style={sectionLabel}>File explorer structure</div>
      <TreeView nodes={nestedNodes} size="md" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Expanded
// ---------------------------------------------------------------------------

export const Expanded: Story = {
  name: 'Expanded',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <div style={sectionLabel}>Pre-expanded nodes</div>
      <TreeView
        nodes={nestedNodes}
        size="md"
        defaultExpanded={['src', 'components', 'hooks', 'tests']}
        defaultSelectedId="button"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', gap: 32, maxWidth: 720 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <div style={sectionLabel}>{size}</div>
          <TreeView
            nodes={deepNodes}
            size={size}
            defaultExpanded={['project', 'app', 'routes']}
          />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. WithDisabledNodes
// ---------------------------------------------------------------------------

export const WithDisabledNodes: Story = {
  name: 'With Disabled Nodes',
  render: () => {
    const nodes: TreeNode[] = [
      {
        id: 'enabled-folder',
        label: 'Available',
        children: [
          { id: 'file-a', label: 'report.pdf' },
          { id: 'file-b', label: 'summary.docx' },
        ],
      },
      {
        id: 'disabled-folder',
        label: 'Restricted',
        disabled: true,
        children: [
          { id: 'secret', label: 'secret.key' },
        ],
      },
      { id: 'file-c', label: 'notes.txt' },
      { id: 'file-d', label: 'locked.dat', disabled: true },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
        <div style={sectionLabel}>Disabled nodes</div>
        <TreeView nodes={nodes} size="md" defaultExpanded={['enabled-folder']} />
      </div>
    );
  },
};
