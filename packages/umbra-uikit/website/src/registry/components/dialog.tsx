import React, { useState } from 'react';
import { Dialog, Button, Text, VStack, HStack, useThemeColors } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>Open Dialog</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm Action"
        description="Are you sure you want to proceed? This action cannot be undone."
        footer={
          <HStack gap="sm" justify="end">
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => setOpen(false)}>Confirm</Button>
          </HStack>
        }
      />
    </>
  );
}

function DialogPreview() {
  const colors = useThemeColors();
  return (
    <div style={{ width: '100%', maxWidth: 200, borderRadius: 8, border: `1px solid ${colors.accent.dividerRaised}`, backgroundColor: colors.background.raised, padding: 12, overflow: 'hidden' }}>
      <VStack gap="xs">
        <span style={{ fontSize: 13, fontWeight: 500, color: colors.text.onRaised }}>Dialog Title</span>
        <span style={{ fontSize: 12, color: colors.text.onRaisedSecondary }}>Are you sure?</span>
        <HStack gap="xs" justify="end" style={{ marginTop: 8 }}>
          <div style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${colors.accent.dividerRaised}`, fontSize: 11, color: colors.text.onRaisedSecondary }}>Cancel</div>
          <div style={{ padding: '3px 8px', borderRadius: 4, backgroundColor: colors.accent.highlightRaised, fontSize: 11, color: colors.text.onRaised }}>Confirm</div>
        </HStack>
      </VStack>
    </div>
  );
}

export const dialogEntry: ComponentEntry = {
  slug: 'dialog',
  name: 'Dialog',
  category: 'components',
  subcategory: 'Overlays & Modals',
  description:
    'Modal dialog with title, description, body, footer, close button, overlay click/escape handling, and size presets.',
  variantCount: 3,
  keywords: ['dialog', 'modal', 'alert', 'confirm', 'popup'],

  cardPreview: <DialogPreview />,

  examples: [
    {
      title: 'Interactive',
      render: <DialogDemo />,
      code: `import { Dialog } from '@wisp-ui/react';

const [open, setOpen] = useState(false);
<Button onClick={() => setOpen(true)}>Open</Button>
<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Confirm Action"
  description="Are you sure?"
  footer={<Button onClick={() => setOpen(false)}>Confirm</Button>}
/>`,
      rnCode: `import { Dialog, Button } from '@wisp-ui/react-native';

const [open, setOpen] = useState(false);
<Button onPress={() => setOpen(true)}>Open</Button>
<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Confirm Action"
  description="Are you sure?"
  footer={<Button onPress={() => setOpen(false)}>Confirm</Button>}
/>`,
    },
  ],

  props: [
    { name: 'open', type: 'boolean', required: true, description: 'Dialog visibility.' },
    { name: 'onClose', type: '() => void', required: true, description: 'Close callback.' },
    { name: 'title', type: 'string', required: true, description: 'Header title.' },
    { name: 'description', type: 'string', description: 'Description below title.' },
    { name: 'icon', type: 'React.ReactNode', description: 'Icon above title.' },
    { name: 'children', type: 'React.ReactNode', description: 'Body content.' },
    { name: 'footer', type: 'React.ReactNode', description: 'Footer actions.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Width preset.' },
    { name: 'closeOnOverlayClick', type: 'boolean', default: 'true', description: 'Close on backdrop click.' },
    { name: 'closeOnEscape', type: 'boolean', default: 'true', description: 'Close on Escape key.' },
    { name: 'showCloseButton', type: 'boolean', default: 'true', description: 'Show X button.' },
  ],
};
