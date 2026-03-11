import React from 'react';
import { Alert, VStack, Button } from '@wisp-ui/react';
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { ComponentEntry } from '../types';

export const alertEntry: ComponentEntry = {
  slug: 'alert',
  name: 'Alert',
  category: 'primitives',
  subcategory: 'Status & Feedback',
  description:
    'Contextual alert banner with 5 semantic variants, title, description, icon, and optional action element.',
  variantCount: 5,
  keywords: ['alert', 'banner', 'notification', 'message', 'info', 'warning', 'error'],

  cardPreview: (
    <VStack gap="xs" style={{ width: '100%', maxWidth: 280 }}>
      <Alert variant="info" title="Heads up" description="New version available." />
    </VStack>
  ),

  examples: [
    {
      title: 'Variants',
      render: (
        <VStack gap="sm" style={{ width: '100%', maxWidth: 500 }}>
          {([
            { v: 'default' as const, t: 'Default', d: 'A neutral informational message.' },
            { v: 'info' as const, t: 'Info', d: 'Here is some helpful information.' },
            { v: 'success' as const, t: 'Success', d: 'Your changes have been saved.' },
            { v: 'warning' as const, t: 'Warning', d: 'Please review before continuing.' },
            { v: 'danger' as const, t: 'Error', d: 'Something went wrong. Please try again.' },
          ]).map(({ v, t, d }) => (
            <Alert key={v} variant={v} title={t} description={d} />
          ))}
        </VStack>
      ),
      code: `import { Alert } from '@wisp-ui/react';

<Alert variant="default" title="Default" description="Neutral message." />
<Alert variant="info" title="Info" description="Helpful information." />
<Alert variant="success" title="Success" description="Changes saved." />
<Alert variant="warning" title="Warning" description="Review needed." />
<Alert variant="danger" title="Error" description="Something went wrong." />`,
      rnCode: `import { Alert } from '@wisp-ui/react-native';

<Alert variant="success" title="Saved" description="Changes saved." />
<Alert variant="danger" description="Something went wrong." />`,
    },
    {
      title: 'With Icon',
      render: (
        <VStack gap="sm" style={{ width: '100%', maxWidth: 500 }}>
          <Alert variant="info" title="Update available" description="A new version is ready to install." icon={<Info size={18} />} />
          <Alert variant="success" title="Deployed" description="Your app is live." icon={<CheckCircle size={18} />} />
        </VStack>
      ),
      code: `<Alert variant="info" title="Update" description="New version available." icon={<Info />} />
<Alert variant="success" title="Deployed" icon={<CheckCircle />} />`,
    },
    {
      title: 'With Action',
      render: (
        <VStack gap="sm" style={{ width: '100%', maxWidth: 500 }}>
          <Alert
            variant="warning"
            title="Unsaved changes"
            description="You have unsaved changes that will be lost."
            action={<Button size="sm" variant="secondary">Save now</Button>}
          />
        </VStack>
      ),
      code: `<Alert
  variant="warning"
  title="Unsaved changes"
  description="You have unsaved changes."
  action={<Button size="sm">Save now</Button>}
/>`,
    },
  ],

  props: [
    { name: 'variant', type: "'default' | 'info' | 'success' | 'warning' | 'danger'", default: "'default'", description: 'Semantic color variant.' },
    { name: 'title', type: 'string', description: 'Bold title text.' },
    { name: 'description', type: 'string', description: 'Body description text.' },
    { name: 'icon', type: 'React.ReactNode', description: 'Leading icon element.' },
    { name: 'action', type: 'React.ReactNode', description: 'Trailing action element (e.g., Button).' },
    { name: 'children', type: 'React.ReactNode', description: 'Fallback content when description is omitted.' },
  ],
};
