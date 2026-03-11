import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TreeView } from '@wisp-ui/react';
import type { TreeNode } from '@wisp-ui/react';
import { Folder, File, FileText, FileCode, Settings, Image } from 'lucide-react';

const meta: Meta<typeof TreeView> = {
  title: 'React/Components/Data Display/TreeView',
  component: TreeView,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TreeView>;

// ---------------------------------------------------------------------------
// Shared tree data
// ---------------------------------------------------------------------------

const fileSystemNodes: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'components',
        label: 'components',
        children: [
          { id: 'button-tsx', label: 'Button.tsx' },
          { id: 'input-tsx', label: 'Input.tsx' },
          { id: 'select-tsx', label: 'Select.tsx' },
        ],
      },
      {
        id: 'utils',
        label: 'utils',
        children: [
          { id: 'helpers-ts', label: 'helpers.ts' },
          { id: 'format-ts', label: 'format.ts' },
        ],
      },
      { id: 'index-ts', label: 'index.ts' },
      { id: 'app-tsx', label: 'App.tsx' },
    ],
  },
  {
    id: 'public',
    label: 'public',
    children: [
      { id: 'favicon', label: 'favicon.ico' },
      { id: 'index-html', label: 'index.html' },
    ],
  },
  { id: 'package-json', label: 'package.json' },
  { id: 'tsconfig', label: 'tsconfig.json' },
];

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => (
    <TreeView
      nodes={fileSystemNodes}
      defaultExpanded={['src']}
      style={{ maxWidth: 320 }}
    />
  ),
};

// ---------------------------------------------------------------------------
// WithIcons
// ---------------------------------------------------------------------------

const iconNodes: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    icon: Folder,
    children: [
      {
        id: 'components',
        label: 'components',
        icon: Folder,
        children: [
          { id: 'button-tsx', label: 'Button.tsx', icon: FileCode },
          { id: 'input-tsx', label: 'Input.tsx', icon: FileCode },
        ],
      },
      {
        id: 'assets',
        label: 'assets',
        icon: Folder,
        children: [
          { id: 'logo-png', label: 'logo.png', icon: Image },
          { id: 'banner-png', label: 'banner.png', icon: Image },
        ],
      },
      { id: 'index-ts', label: 'index.ts', icon: FileCode },
    ],
  },
  { id: 'readme', label: 'README.md', icon: FileText },
  { id: 'package-json', label: 'package.json', icon: File },
  { id: 'config', label: 'settings.json', icon: Settings },
];

export const WithIcons: Story = {
  name: 'With Icons',
  render: () => (
    <TreeView
      nodes={iconNodes}
      defaultExpanded={['src', 'components']}
      style={{ maxWidth: 320 }}
    />
  ),
};

// ---------------------------------------------------------------------------
// Selectable
// ---------------------------------------------------------------------------

export const Selectable: Story = {
  name: 'Selectable',
  render: () => {
    const SelectableDemo = () => {
      const [selectedId, setSelectedId] = useState<string | undefined>('index-ts');

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
          <span style={{ fontSize: 13, color: '#888' }}>
            Selected: {selectedId ?? 'none'}
          </span>
          <TreeView
            nodes={fileSystemNodes}
            defaultExpanded={['src', 'components']}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      );
    };

    return <SelectableDemo />;
  },
};

// ---------------------------------------------------------------------------
// DefaultExpanded
// ---------------------------------------------------------------------------

export const DefaultExpanded: Story = {
  name: 'Default Expanded',
  render: () => (
    <TreeView
      nodes={fileSystemNodes}
      defaultExpanded={['src', 'components', 'utils', 'public']}
      style={{ maxWidth: 320 }}
    />
  ),
};

// ---------------------------------------------------------------------------
// AllSizes
// ---------------------------------------------------------------------------

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', gap: 48 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            {size}
          </span>
          <TreeView
            size={size}
            nodes={fileSystemNodes}
            defaultExpanded={['src']}
            style={{ width: 240 }}
          />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

const disabledNodes: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      { id: 'active-file', label: 'active.ts' },
      { id: 'locked-file', label: 'locked.ts', disabled: true },
      {
        id: 'locked-folder',
        label: 'restricted',
        disabled: true,
        children: [
          { id: 'secret', label: 'secret.ts' },
        ],
      },
      { id: 'another-file', label: 'another.ts' },
    ],
  },
];

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <TreeView
      nodes={disabledNodes}
      defaultExpanded={['src']}
      style={{ maxWidth: 320 }}
    />
  ),
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <TreeView
      nodes={[]}
      skeleton
      style={{ maxWidth: 320 }}
    />
  ),
};
