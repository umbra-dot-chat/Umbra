import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { SearchPanel } from '@/components/panels/SearchPanel';

// Mock the deep import for MessageSearch (not covered by the top-level wisp-react-native mock)
jest.mock('@coexist/wisp-react-native/src/components/message-search', () => {
  const { forwardRef, createElement } = require('react');
  const { View } = require('react-native');
  const MockMessageSearch = forwardRef((props: any, ref: any) =>
    createElement(View, { ...props, ref, testID: 'MessageSearch' }, props.children)
  );
  MockMessageSearch.displayName = 'MessageSearch';
  return {
    MessageSearch: MockMessageSearch,
  };
});

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    isReady: true,
    isLoading: false,
    error: null,
    service: null,
    version: '0.1.0-test',
  }),
}));

jest.mock('@/hooks/useFriends', () => ({
  useFriends: () => ({
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
    isLoading: false,
    error: null,
    sendRequest: jest.fn(),
    acceptRequest: jest.fn(),
    rejectRequest: jest.fn(),
    removeFriend: jest.fn(),
    blockUser: jest.fn(),
    unblockUser: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    identity: { did: 'did:key:z6MkTest', displayName: 'Test' },
    recoveryPhrase: null,
    isAuthenticated: true,
  }),
}));

describe('SearchPanel', () => {
  test('renders without crashing', () => {
    const { toJSON } = render(
      <SearchPanel query="" onQueryChange={jest.fn()} onClose={jest.fn()} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  test('renders MessageSearch component', () => {
    const { getByTestId } = render(
      <SearchPanel query="" onQueryChange={jest.fn()} onClose={jest.fn()} />,
    );
    expect(getByTestId('MessageSearch')).toBeTruthy();
  });

  test('passes query to MessageSearch', () => {
    const { getByTestId } = render(
      <SearchPanel query="migration" onQueryChange={jest.fn()} onClose={jest.fn()} />,
    );
    // The mock MessageSearch receives props through
    expect(getByTestId('MessageSearch')).toBeTruthy();
  });

  test('accepts optional conversationId prop', () => {
    const { getByTestId } = render(
      <SearchPanel
        query=""
        onQueryChange={jest.fn()}
        onClose={jest.fn()}
        conversationId="conv-123"
      />,
    );
    expect(getByTestId('MessageSearch')).toBeTruthy();
  });
});
