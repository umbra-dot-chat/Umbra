import React from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, Button, Text, VStack, useThemeColors } from '@wisp-ui/react';
import { Copy, Trash2, Edit, MoreHorizontal } from 'lucide-react';
import type { ComponentEntry } from '../types';

function DropdownMenuPreview() {
  const colors = useThemeColors();
  return (
    <div style={{ width: '100%', maxWidth: 200 }}>
      <div style={{ borderRadius: 8, border: `1px solid ${colors.border.subtle}`, backgroundColor: colors.background.canvas, overflow: 'hidden', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Edit size={13} style={{ color: colors.text.secondary }} />
          <span style={{ color: colors.text.primary }}>Edit</span>
        </div>
        <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Copy size={13} style={{ color: colors.text.secondary }} />
          <span style={{ color: colors.text.primary }}>Copy</span>
        </div>
        <div style={{ height: 1, backgroundColor: colors.border.subtle, margin: '2px 0' }} />
        <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trash2 size={13} style={{ color: colors.status.danger }} />
          <span style={{ color: colors.status.danger }}>Delete</span>
        </div>
      </div>
    </div>
  );
}

export const dropdownMenuEntry: ComponentEntry = {
  slug: 'dropdown-menu',
  name: 'DropdownMenu',
  category: 'components',
  subcategory: 'Overlays & Modals',
  description:
    'Context menu with items, separators, icons, keyboard shortcuts, danger actions, and alignment options.',
  variantCount: 1,
  keywords: ['dropdown', 'menu', 'context', 'actions', 'right-click'],

  cardPreview: <DropdownMenuPreview />,

  examples: [
    {
      title: 'Basic',
      render: (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="secondary" size="sm" iconLeft={<MoreHorizontal size={16} />}>Actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem icon={<Edit size={14} />} shortcut="⌘E">Edit</DropdownMenuItem>
            <DropdownMenuItem icon={<Copy size={14} />} shortcut="⌘C">Copy</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem icon={<Trash2 size={14} />} danger>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      code: `import { DropdownMenu } from '@wisp-ui/react';

<DropdownMenu>
  <DropdownMenuTrigger>
    <Button variant="secondary">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem icon={<Edit />} shortcut="⌘E">Edit</DropdownMenuItem>
    <DropdownMenuItem icon={<Copy />} shortcut="⌘C">Copy</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem icon={<Trash2 />} danger>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
      rnCode: `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, Button } from '@wisp-ui/react-native';
import { Edit, Copy, Trash2 } from 'lucide-react-native';

<DropdownMenu>
  <DropdownMenuTrigger>
    <Button variant="secondary">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem icon={<Edit />}>Edit</DropdownMenuItem>
    <DropdownMenuItem icon={<Copy />}>Copy</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem icon={<Trash2 />} danger>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
    },
  ],

  props: [
    { name: 'open', type: 'boolean', description: 'Controlled open state.' },
    { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Initial open (uncontrolled).' },
    { name: 'onOpenChange', type: '(open: boolean) => void', description: 'Open state callback.' },
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Trigger + Content children.' },
  ],
};
