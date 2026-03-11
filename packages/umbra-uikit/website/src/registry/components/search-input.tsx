import React, { useState } from 'react';
import { SearchInput, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const searchInputEntry: ComponentEntry = {
  slug: 'search-input',
  name: 'SearchInput',
  category: 'components',
  subcategory: 'Selection & Input',
  description:
    'Specialized search field with built-in search icon, clear button, loading state, and optional debounced search callback.',
  variantCount: 1,
  keywords: ['search', 'input', 'find', 'filter', 'query'],

  cardPreview: (
    <HStack gap="sm">
      <SearchInput size="md" placeholder="Search…" style={{ width: 220 }} />
    </HStack>
  ),

  examples: [
    {
      title: 'Sizes',
      render: (
        <VStack gap="md" style={{ maxWidth: 300 }}>
          <SearchInput size="xs" placeholder="Extra small" />
          <SearchInput size="sm" placeholder="Small" />
          <SearchInput size="md" placeholder="Medium" />
          <SearchInput size="lg" placeholder="Large" />
          <SearchInput size="xl" placeholder="Extra large" />
        </VStack>
      ),
      code: `import { SearchInput } from '@wisp-ui/react';

<SearchInput size="xs" placeholder="Extra small" />
<SearchInput size="md" placeholder="Medium" />
<SearchInput size="xl" placeholder="Extra large" />`,
      rnCode: `// Not yet available in React Native`,
    },
    {
      title: 'Loading',
      render: (
        <SearchInput size="md" loading defaultValue="Searching..." style={{ maxWidth: 300 }} />
      ),
      code: `<SearchInput loading defaultValue="Searching..." />`,
      rnCode: `// Not yet available in React Native`,
    },
    {
      title: 'With Clear',
      render: (
        <SearchInput size="md" defaultValue="wisp components" style={{ maxWidth: 300 }} />
      ),
      code: `<SearchInput defaultValue="wisp components" onClear={() => {}} />`,
      rnCode: `// Not yet available in React Native`,
    },
    {
      title: 'Disabled',
      render: (
        <SearchInput size="md" disabled placeholder="Disabled" style={{ maxWidth: 300 }} />
      ),
      code: `<SearchInput disabled placeholder="Disabled" />`,
      rnCode: `// Not yet available in React Native`,
    },
    {
      title: 'Full Width',
      render: (
        <SearchInput size="md" fullWidth placeholder="Full width search…" />
      ),
      code: `<SearchInput fullWidth placeholder="Full width search…" />`,
      rnCode: `// Not yet available in React Native`,
    },
  ],

  props: [
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Input size token.' },
    { name: 'onSearch', type: '(value: string) => void', description: 'Fires on Enter or after debounce.' },
    { name: 'onClear', type: '() => void', description: 'Fires when the clear button is clicked.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Shows a loading spinner.' },
    { name: 'debounceMs', type: 'number', default: '0', description: 'Debounce delay in ms.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretches to container width.' },
    { name: 'placeholder', type: 'string', default: "'Search…'", description: 'Placeholder text.' },
  ],
};
