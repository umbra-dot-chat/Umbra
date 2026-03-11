import React from 'react';
import { TreeView, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const treeNodes = [
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
        ],
      },
      { id: 'app', label: 'App.tsx' },
      { id: 'main', label: 'main.tsx' },
    ],
  },
  {
    id: 'package',
    label: 'package.json',
  },
];

export const treeViewEntry: ComponentEntry = {
  slug: 'tree-view',
  name: 'TreeView',
  category: 'components',
  subcategory: 'Navigation',
  description:
    'Expandable file-tree style component with nested nodes, icons, selection, controlled/uncontrolled expansion, and skeleton.',
  variantCount: 3,
  keywords: ['tree', 'view', 'file', 'folder', 'hierarchy', 'nested'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 180, pointerEvents: 'none' }}>
      <TreeView nodes={treeNodes} defaultExpanded={['src']} size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <div style={{ width: '100%', maxWidth: 300 }}>
          <TreeView nodes={treeNodes} defaultExpanded={['src', 'components']} />
        </div>
      ),
      code: `import { TreeView } from '@wisp-ui/react';\n\n<TreeView
  nodes={[
    { id: 'src', label: 'src', children: [
      { id: 'button', label: 'Button.tsx' },
    ]},
  ]}
  defaultExpanded={['src']}
/>`,
      rnCode: `import { TreeView } from '@wisp-ui/react-native';

<TreeView
  nodes={[
    { id: 'src', label: 'src', children: [
      { id: 'button', label: 'Button.tsx' },
    ]},
  ]}
  defaultExpanded={['src']}
/>`,
    },
    {
      title: 'Sizes',
      render: (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <VStack key={size} gap="xs">
              <Text size="xs" color="tertiary">{size}</Text>
              <TreeView nodes={treeNodes.slice(0, 1)} defaultExpanded={['src']} size={size} />
            </VStack>
          ))}
        </div>
      ),
      code: `<TreeView nodes={nodes} size="sm" />
<TreeView nodes={nodes} size="md" />
<TreeView nodes={nodes} size="lg" />`,
      rnCode: `import { TreeView } from '@wisp-ui/react-native';

<TreeView nodes={nodes} size="sm" />
<TreeView nodes={nodes} size="md" />
<TreeView nodes={nodes} size="lg" />`,
    },
  ],

  props: [
    { name: 'nodes', type: 'TreeNode[]', required: true, description: 'Root-level tree nodes.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size variant.' },
    { name: 'defaultExpanded', type: 'string[]', description: 'Initially expanded IDs.' },
    { name: 'expanded', type: 'string[]', description: 'Controlled expanded IDs.' },
    { name: 'onToggle', type: '(id: string) => void', description: 'Expand/collapse callback.' },
    { name: 'selectedId', type: 'string', description: 'Controlled selected node.' },
    { name: 'onSelect', type: '(id: string) => void', description: 'Selection callback.' },
    { name: 'selectable', type: 'boolean', default: 'true', description: 'Nodes can be selected.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Skeleton placeholder.' },
  ],
};
