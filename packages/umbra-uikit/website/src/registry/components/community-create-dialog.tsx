import React, { useState } from 'react';
import { CommunityCreateDialog, Button, VStack, Text, useThemeColors } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function CommunityCreateDialogDemo() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  return (
    <VStack gap="sm">
      <Button size="sm" onClick={() => setOpen(true)}>Create Community</Button>
      <CommunityCreateDialog
        open={open}
        onClose={() => { setOpen(false); setError(undefined); }}
        onSubmit={(data) => {
          setOpen(false);
          setError(undefined);
        }}
        error={error}
      />
    </VStack>
  );
}

function CommunityCreateDialogErrorDemo() {
  const [open, setOpen] = useState(false);

  return (
    <VStack gap="sm">
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>Show with Error</Button>
      <CommunityCreateDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={() => {}}
        error="A community with that name already exists."
      />
    </VStack>
  );
}

function CommunityCreateDialogPreview() {
  const colors = useThemeColors();
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: 12,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 160,
          borderRadius: 8,
          border: `1px solid ${colors.border.subtle}`,
          backgroundColor: colors.background.surface,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: colors.text.primary }}>
          Create Community
        </div>
        <div style={{ height: 6, borderRadius: 3, backgroundColor: colors.border.subtle, width: '100%' }} />
        <div style={{ height: 6, borderRadius: 3, backgroundColor: colors.border.subtle, width: '70%' }} />
        <div
          style={{
            alignSelf: 'flex-end',
            fontSize: 9,
            padding: '2px 8px',
            borderRadius: 4,
            backgroundColor: colors.accent.primary,
            color: '#fff',
            fontWeight: 500,
          }}
        >
          Create
        </div>
      </div>
    </div>
  );
}

export const communityCreateDialogEntry: ComponentEntry = {
  slug: 'community-create-dialog',
  name: 'CommunityCreateDialog',
  category: 'components',
  subcategory: 'Community',
  description:
    'Modal dialog for creating a new community with name, description, and optional icon upload.',
  variantCount: 3,
  keywords: ['community', 'create', 'dialog', 'modal', 'form', 'new'],

  cardPreview: <CommunityCreateDialogPreview />,

  examples: [
    {
      title: 'Interactive',
      render: <CommunityCreateDialogDemo />,
      code: `import { CommunityCreateDialog } from '@wisp-ui/react';

const [open, setOpen] = useState(false);

<CommunityCreateDialog
  open={open}
  onClose={() => setOpen(false)}
  onSubmit={(data) => createCommunity(data)}
/>`,
    },
    {
      title: 'With Error',
      render: <CommunityCreateDialogErrorDemo />,
      code: `<CommunityCreateDialog
  open={open}
  onClose={() => setOpen(false)}
  onSubmit={handleSubmit}
  error="A community with that name already exists."
/>`,
    },
  ],

  props: [
    { name: 'open', type: 'boolean', required: true, description: 'Whether the dialog is open.' },
    { name: 'onClose', type: '() => void', required: true, description: 'Called when the dialog should close.' },
    { name: 'onSubmit', type: '(data: CommunityCreateData) => void', description: 'Called with form data on submission.' },
    { name: 'submitting', type: 'boolean', default: 'false', description: 'Whether submission is in progress.' },
    { name: 'error', type: 'string', description: 'Error message to display.' },
    { name: 'title', type: 'string', default: "'Create Community'", description: 'Dialog title.' },
    { name: 'maxNameLength', type: 'number', default: '100', description: 'Max name length.' },
    { name: 'maxDescriptionLength', type: 'number', default: '1000', description: 'Max description length.' },
  ],
};
