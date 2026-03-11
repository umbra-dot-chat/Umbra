import React, { useState } from 'react';
import { MessageSearch } from '@wisp-ui/react';
import type { SearchResult, SearchFilter } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const sampleResults: SearchResult[] = [
  {
    id: '1',
    sender: 'Alice Chen',
    content: 'Hey, has anyone looked into the new API documentation? I think we need to update our endpoints.',
    timestamp: 'Today at 2:15 PM',
    channelName: 'general',
  },
  {
    id: '2',
    sender: 'Bob Smith',
    content: 'I just pushed the updated docs. The new API supports pagination and filtering now.',
    timestamp: 'Today at 1:42 PM',
    channelName: 'dev-team',
  },
  {
    id: '3',
    sender: 'Carol White',
    content: 'Can we schedule a meeting to discuss the API changes? I have some concerns about backwards compatibility.',
    timestamp: 'Yesterday at 4:30 PM',
    channelName: 'general',
  },
];

const sampleFilters: SearchFilter[] = [
  { type: 'from', value: 'Alice Chen' },
  { type: 'in', value: '#general' },
];

function InteractiveExample() {
  const [query, setQuery] = useState('API');

  return (
    <MessageSearch
      query={query}
      onQueryChange={setQuery}
      results={query.trim().length > 0 ? sampleResults : []}
      totalResults={query.trim().length > 0 ? 24 : undefined}
      onResultClick={() => {}}
      onClose={() => {}}
      style={{ width: 360, maxHeight: 480 }}
    />
  );
}

export const messageSearchEntry: ComponentEntry = {
  slug: 'message-search',
  name: 'MessageSearch',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'Search panel with query input, filter pills, and a scrollable list of message result previews.',
  variantCount: 5,
  keywords: ['search', 'message', 'filter', 'find', 'query', 'results'],

  cardPreview: (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <MessageSearch
        query="hello"
        onQueryChange={() => {}}
        results={[
          {
            id: '1',
            sender: 'Alice',
            content: 'Hello everyone! Welcome to the channel.',
            timestamp: '2:15 PM',
            channelName: 'general',
          },
        ]}
        totalResults={8}
        style={{ width: 300, maxHeight: 240 }}
      />
    </div>
  ),

  examples: [
    {
      title: 'Interactive',
      render: <InteractiveExample />,
      code: `import { MessageSearch } from '@wisp-ui/react';

const [query, setQuery] = useState('');

<MessageSearch
  query={query}
  onQueryChange={setQuery}
  results={searchResults}
  totalResults={24}
  onResultClick={(r) => navigateToMessage(r.id)}
  onClose={() => setSearchOpen(false)}
/>`,
    },
    {
      title: 'With Filters',
      render: (
        <MessageSearch
          query="API"
          onQueryChange={() => {}}
          results={sampleResults}
          filters={sampleFilters}
          onFilterRemove={() => {}}
          onResultClick={() => {}}
          onClose={() => {}}
          style={{ width: 360, maxHeight: 480 }}
        />
      ),
      code: `<MessageSearch
  query="API"
  onQueryChange={setQuery}
  results={searchResults}
  filters={[
    { type: 'from', value: 'Alice Chen' },
    { type: 'in', value: '#general' },
  ]}
  onFilterRemove={(f) => removeFilter(f)}
  onResultClick={(r) => navigateToMessage(r.id)}
  onClose={() => setSearchOpen(false)}
/>`,
    },
    {
      title: 'With Results',
      render: (
        <MessageSearch
          query="documentation"
          onQueryChange={() => {}}
          results={sampleResults}
          totalResults={3}
          onResultClick={() => {}}
          style={{ width: 360, maxHeight: 480 }}
        />
      ),
      code: `<MessageSearch
  query="documentation"
  onQueryChange={setQuery}
  results={results}
  totalResults={3}
  onResultClick={(r) => navigateToMessage(r.id)}
/>`,
    },
    {
      title: 'Empty State',
      render: (
        <MessageSearch
          query="xyznonexistent"
          onQueryChange={() => {}}
          results={[]}
          onClose={() => {}}
          style={{ width: 360, maxHeight: 320 }}
        />
      ),
      code: `<MessageSearch
  query="xyznonexistent"
  onQueryChange={setQuery}
  results={[]}
  onClose={() => setSearchOpen(false)}
/>`,
    },
    {
      title: 'Loading',
      render: (
        <MessageSearch
          query="searching..."
          onQueryChange={() => {}}
          results={[]}
          loading
          onClose={() => {}}
          style={{ width: 360, maxHeight: 320 }}
        />
      ),
      code: `<MessageSearch
  query="searching..."
  onQueryChange={setQuery}
  results={[]}
  loading
  onClose={() => setSearchOpen(false)}
/>`,
    },
  ],

  props: [
    { name: 'query', type: 'string', required: true, description: 'Current search query string.' },
    { name: 'onQueryChange', type: '(query: string) => void', required: true, description: 'Called when the search query changes.' },
    { name: 'results', type: 'SearchResult[]', required: true, description: 'Search results to display.' },
    { name: 'filters', type: 'SearchFilter[]', description: 'Active filter pills.' },
    { name: 'onFilterRemove', type: '(filter: SearchFilter) => void', description: 'Called when a filter pill is removed.' },
    { name: 'onResultClick', type: '(result: SearchResult) => void', description: 'Called when a result is clicked.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Whether search is in progress.' },
    { name: 'totalResults', type: 'number', description: 'Total result count (may differ from results.length if paginated).' },
    { name: 'placeholder', type: 'string', default: "'Search messages...'", description: 'Placeholder text for the search input.' },
    { name: 'onClose', type: '() => void', description: 'Called when the close button is clicked.' },
  ],
};
