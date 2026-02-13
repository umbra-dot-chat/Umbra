import React from 'react';
import { MessageSearch } from '@coexist/wisp-react-native/src/components/message-search';

export interface SearchPanelProps {
  query: string;
  onQueryChange: (q: string) => void;
  onClose: () => void;
}

export function SearchPanel({ query, onQueryChange, onClose }: SearchPanelProps) {
  // TODO: Implement real message search via UmbraService
  // For now, return empty results — search will be wired in Phase 5
  return (
    <MessageSearch
      query={query}
      onQueryChange={onQueryChange}
      results={[]}
      onClose={onClose}
      onResultClick={() => {}}
    />
  );
}
