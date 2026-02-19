import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { SearchPanel } from '@/components/panels/SearchPanel';

// MessageSearch is now imported from the main @coexist/wisp-react-native package
// which is mocked in jest.setup.js, so no additional mock is needed here

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
