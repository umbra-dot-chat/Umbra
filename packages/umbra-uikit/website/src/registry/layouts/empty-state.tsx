import React from 'react';
import { EmptyState, VStack, Button, Text } from '@wisp-ui/react';
import { Inbox, Search } from 'lucide-react';
import type { ComponentEntry } from '../types';

export const emptyStateEntry: ComponentEntry = {
  slug: 'empty-state',
  name: 'EmptyState',
  category: 'layouts',
  subcategory: 'Forms & States',
  description:
    'Placeholder for empty views with icon, title, description, and optional action button. 3 size presets.',
  variantCount: 3,
  keywords: ['empty', 'state', 'placeholder', 'no-data', 'blank'],

  cardPreview: (
    <EmptyState
      icon={<Inbox size={24} />}
      title="No items"
      size="sm"
    />
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <EmptyState
          icon={<Inbox size={48} />}
          title="No messages"
          description="Your inbox is empty. New messages will appear here."
          action={<Button size="sm">Compose</Button>}
        />
      ),
      code: `import { EmptyState } from '@wisp-ui/react';

<EmptyState
  icon={<Inbox size={48} />}
  title="No messages"
  description="Your inbox is empty."
  action={<Button>Compose</Button>}
/>`,
      rnCode: `import { EmptyState } from '@wisp-ui/react-native';

<EmptyState
  icon={<Inbox size={48} />}
  title="No messages"
  description="Your inbox is empty."
  action={<Button>Compose</Button>}
/>`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="lg" align="center">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <EmptyState
              key={size}
              icon={<Search size={size === 'sm' ? 24 : size === 'md' ? 36 : 48} />}
              title={`${size} empty state`}
              description="No results found."
              size={size}
            />
          ))}
        </VStack>
      ),
      code: `<EmptyState size="sm" title="Small" icon={<Search />} />
<EmptyState size="md" title="Medium" icon={<Search />} />
<EmptyState size="lg" title="Large" icon={<Search />} />`,
      rnCode: `<EmptyState size="sm" title="Small" icon={<Search />} />
<EmptyState size="md" title="Medium" icon={<Search />} />
<EmptyState size="lg" title="Large" icon={<Search />} />`,
    },
  ],

  props: [
    { name: 'icon', type: 'React.ReactNode', description: 'Icon above title.' },
    { name: 'title', type: 'string', required: true, description: 'Primary message.' },
    { name: 'description', type: 'string', description: 'Supporting text.' },
    { name: 'action', type: 'React.ReactNode', description: 'Action element (e.g. Button).' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset.' },
  ],
};
