import React from 'react';
import { Toast, VStack, Button } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const toastEntry: ComponentEntry = {
  slug: 'toast',
  name: 'Toast',
  category: 'primitives',
  subcategory: 'Status & Feedback',
  description:
    'Notification toast with 5 semantic variants, solid/glass surfaces, optional icon, action button, and dismissible state.',
  variantCount: 5,
  keywords: ['toast', 'notification', 'snackbar', 'message', 'alert'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 280, pointerEvents: 'none' }}>
      <Toast title="Changes saved" variant="success" onDismiss={() => {}} />
    </div>
  ),

  examples: [
    {
      title: 'Variants',
      render: (
        <VStack gap="sm" style={{ width: '100%', maxWidth: 400 }}>
          {([
            { v: 'default' as const, t: 'Default toast' },
            { v: 'success' as const, t: 'Changes saved' },
            { v: 'warning' as const, t: 'Connection unstable' },
            { v: 'danger' as const, t: 'Upload failed' },
            { v: 'info' as const, t: 'New update available' },
          ]).map(({ v, t }) => (
            <Toast key={v} variant={v} title={t} onDismiss={() => {}} />
          ))}
        </VStack>
      ),
      code: `import { Toast } from '@wisp-ui/react';

<Toast variant="default" title="Default toast" />
<Toast variant="success" title="Changes saved" />
<Toast variant="warning" title="Connection unstable" />
<Toast variant="danger" title="Upload failed" />
<Toast variant="info" title="New update available" />`,
      rnCode: `import { Toast } from '@wisp-ui/react-native';

<Toast variant="success" title="Saved" />
<Toast variant="danger" title="Error" description="Something went wrong" />`,
    },
    {
      title: 'With Description',
      render: (
        <VStack gap="sm" style={{ width: '100%', maxWidth: 400 }}>
          <Toast
            variant="success"
            title="File uploaded"
            description="report.pdf was uploaded successfully."
            onDismiss={() => {}}
          />
        </VStack>
      ),
      code: `<Toast
  variant="success"
  title="File uploaded"
  description="report.pdf was uploaded successfully."
  onDismiss={() => {}}
/>`,
    },
    {
      title: 'With Action',
      render: (
        <VStack gap="sm" style={{ width: '100%', maxWidth: 400 }}>
          <Toast
            variant="danger"
            title="Message deleted"
            description="The message was moved to trash."
            action={<Button size="sm" variant="secondary">Undo</Button>}
            onDismiss={() => {}}
          />
        </VStack>
      ),
      code: `<Toast
  variant="danger"
  title="Message deleted"
  action={<Button size="sm">Undo</Button>}
  onDismiss={() => {}}
/>`,
    },
  ],

  props: [
    { name: 'title', type: 'string', required: true, description: 'Primary notification text.' },
    { name: 'variant', type: "'default' | 'success' | 'warning' | 'danger' | 'info'", default: "'default'", description: 'Semantic color variant.' },
    { name: 'surface', type: "'solid' | 'glass'", default: "'solid'", description: 'Surface rendering style.' },
    { name: 'description', type: 'string', description: 'Secondary description text.' },
    { name: 'icon', type: 'React.ReactNode', description: 'Leading icon element.' },
    { name: 'action', type: 'React.ReactNode', description: 'Action element (e.g., Undo button).' },
    { name: 'onDismiss', type: '() => void', description: 'Callback when dismiss button is clicked.' },
    { name: 'dismissible', type: 'boolean', default: 'true', description: 'Show dismiss button.' },
  ],
};
