import React from 'react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  Card,
  Text,
  VStack,
} from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

// Inline SVG helpers for icons (to avoid extra imports)
const EditIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const CopyIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const TrashIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

function ContextMenuDemo() {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card variant="outlined" padding="lg" radius="lg" style={{ textAlign: 'center', cursor: 'default', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <VStack gap="xs" align="center">
            <Text weight="semibold">Right-click here</Text>
            <Text size="xs" color="secondary">to open the context menu</Text>
          </VStack>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem icon={<EditIcon />} shortcut="⌘E">
          Edit
        </ContextMenuItem>
        <ContextMenuItem icon={<CopyIcon />} shortcut="⌘C">
          Copy
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem icon={<TrashIcon />} destructive shortcut="⌘⌫">
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const contextMenuEntry: ComponentEntry = {
  slug: 'context-menu',
  name: 'ContextMenu',
  category: 'components',
  subcategory: 'Overlays & Modals',
  description:
    'Right-click context menu with items, separators, icons, keyboard shortcuts, and destructive actions. Portal-rendered with click-outside and Escape dismissal.',
  variantCount: 1,
  keywords: ['context', 'menu', 'right-click', 'contextmenu', 'dropdown'],

  cardPreview: (
    <Card variant="outlined" padding="md" radius="md" style={{ textAlign: 'center' }}>
      <VStack gap="2xs">
        <Text size="xs" weight="semibold">ContextMenu</Text>
        <Text size="xs" color="secondary">Right-click trigger</Text>
      </VStack>
    </Card>
  ),

  examples: [
    {
      title: 'Default',
      render: <ContextMenuDemo />,
      code: `import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@wisp-ui/react';

<ContextMenu>
  <ContextMenuTrigger>
    <div>Right-click here</div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem icon={<Edit />} shortcut="⌘E">Edit</ContextMenuItem>
    <ContextMenuItem icon={<Copy />} shortcut="⌘C">Copy</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem destructive shortcut="⌘⌫">Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
      rnCode: `// Not yet available in React Native`,
    },
  ],

  props: [
    { name: 'onSelect', type: '() => void', description: 'Callback when a ContextMenuItem is selected.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the menu item.' },
    { name: 'destructive', type: 'boolean', default: 'false', description: 'Styles the item in danger/red.' },
    { name: 'icon', type: 'React.ReactNode', description: 'Icon rendered before the label.' },
    { name: 'shortcut', type: 'string', description: 'Keyboard shortcut hint on the right.' },
  ],
};
