/**
 * Integration test for the main chat page.
 *
 * The previous version imported `@/app/index` which doesn't exist — Expo
 * file-based routing mounts `app/(main)/index.tsx` via the layout. This
 * test verifies the ChatPage (EmptyConversation) component renders correctly
 * when there are no conversations.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import ChatPage from '@/app/(main)/index';
import { HelpProvider } from '@/contexts/HelpContext';

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    isReady: true,
    isLoading: false,
    error: null,
    service: null,
    version: '0.1.0-test',
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    identity: { did: 'did:key:z6MkTest', displayName: 'Test' },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    pin: null,
    hasPin: false,
    isPinVerified: false,
    setPin: jest.fn(),
    verifyPin: jest.fn(),
    lockApp: jest.fn(),
  }),
}));

jest.mock('@/hooks/useConversations', () => ({
  useConversations: () => ({
    conversations: [],
    isLoading: false,
    error: null,
    refresh: jest.fn(),
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

jest.mock('@/hooks/useMessages', () => ({
  useMessages: () => ({
    messages: [],
    isLoading: false,
    error: null,
    hasMore: false,
    loadMore: jest.fn(),
    sendMessage: jest.fn(),
    markAsRead: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock('@/hooks/useHoverMessage', () => ({
  useHoverMessage: () => ({
    hoveredMessage: null,
    handleHoverIn: jest.fn(),
    handleHoverOut: jest.fn(),
  }),
}));

jest.mock('@/hooks/useRightPanel', () => ({
  useRightPanel: () => ({
    rightPanel: null,
    visiblePanel: null,
    panelWidth: { setValue: jest.fn() },
    togglePanel: jest.fn(),
  }),
}));

jest.mock('@/contexts/ProfilePopoverContext', () => ({
  useProfilePopoverContext: () => ({
    showProfile: jest.fn(),
    selectedMember: null,
    popoverAnchor: null,
    closeProfile: jest.fn(),
  }),
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <HelpProvider>{children}</HelpProvider>
);

describe('ChatPage', () => {
  test('renders empty conversation state when no conversations exist', () => {
    const { getByText } = render(<ChatPage />, { wrapper: Wrapper });
    expect(getByText('Welcome to Umbra')).toBeTruthy();
  });

  test('shows P2P messaging description', () => {
    const { getByText } = render(<ChatPage />, { wrapper: Wrapper });
    expect(
      getByText(/end-to-end encrypted/i)
    ).toBeTruthy();
  });
});
