import React from 'react';
import { Banner, VStack, Button, Text } from '@wisp-ui/react';
import { Info, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ComponentEntry } from '../types';

export const bannerEntry: ComponentEntry = {
  slug: 'banner',
  name: 'Banner',
  category: 'components',
  subcategory: 'Feedback & Guidance',
  description:
    'Full-width notification banner with 5 semantic variants, optional title, icon, action slot, and dismissible state.',
  variantCount: 5,
  keywords: ['banner', 'notification', 'announcement', 'alert', 'bar'],

  cardPreview: (
    <VStack gap="xs" style={{ width: '100%', maxWidth: 220 }}>
      <Banner variant="info" icon={Info as any}>
        <Text size="xs">New update available.</Text>
      </Banner>
    </VStack>
  ),

  examples: [
    {
      title: 'Variants',
      render: (
        <VStack gap="sm" style={{ width: '100%', maxWidth: 500 }}>
          <Banner variant="default">Default banner message.</Banner>
          <Banner variant="info" icon={Info as any}>Info: Check out the new features.</Banner>
          <Banner variant="success" icon={CheckCircle as any}>Success: Changes saved.</Banner>
          <Banner variant="warning" icon={AlertTriangle as any}>Warning: Disk space low.</Banner>
          <Banner variant="danger">Error: Something went wrong.</Banner>
        </VStack>
      ),
      code: `import { Banner } from '@wisp-ui/react';\n\n<Banner variant="info" icon={Info as any}>Info message</Banner>
<Banner variant="success" icon={CheckCircle as any}>Success</Banner>
<Banner variant="warning" icon={AlertTriangle as any}>Warning</Banner>
<Banner variant="danger">Error</Banner>`,
      rnCode: `import { Banner } from '@wisp-ui/react-native';
import { Info, CheckCircle, AlertTriangle } from 'lucide-react-native';

<Banner variant="info" icon={Info}>Info message</Banner>
<Banner variant="success" icon={CheckCircle}>Success</Banner>
<Banner variant="warning" icon={AlertTriangle}>Warning</Banner>
<Banner variant="danger">Error</Banner>`,
    },
    {
      title: 'With Action & Dismissible',
      render: (
        <VStack gap="sm" style={{ width: '100%', maxWidth: 500 }}>
          <Banner variant="info" icon={Info as any} action={<Button size="sm" variant="secondary">Update</Button>}>
            A new version is available.
          </Banner>
          <Banner variant="warning" icon={AlertTriangle as any} dismissible>
            This banner can be dismissed.
          </Banner>
        </VStack>
      ),
      code: `<Banner variant="info" action={<Button size="sm">Update</Button>}>
  New version available.
</Banner>
<Banner variant="warning" dismissible>
  Dismissible banner.
</Banner>`,
      rnCode: `import { Banner, Button } from '@wisp-ui/react-native';

<Banner variant="info" action={<Button size="sm">Update</Button>}>
  New version available.
</Banner>
<Banner variant="warning" dismissible>
  Dismissible banner.
</Banner>`,
    },
  ],

  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Banner message content.' },
    { name: 'title', type: 'string', description: 'Optional title.' },
    { name: 'variant', type: "'default' | 'info' | 'success' | 'warning' | 'danger'", default: "'default'", description: 'Semantic variant.' },
    { name: 'icon', type: 'React.ComponentType', description: 'Leading icon component.' },
    { name: 'action', type: 'React.ReactNode', description: 'Right-side action element.' },
    { name: 'dismissible', type: 'boolean', default: 'false', description: 'Show dismiss button.' },
    { name: 'onDismiss', type: '() => void', description: 'Dismiss callback.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Full-width, no border-radius.' },
  ],
};
