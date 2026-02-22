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

jest.mock('@/hooks/useGroups', () => ({
  useGroups: () => ({
    groups: [],
    isLoading: false,
    error: null,
    createGroup: jest.fn(),
    updateGroup: jest.fn(),
    deleteGroup: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
    getMembers: jest.fn().mockResolvedValue([]),
    pendingInvites: [],
    sendInvite: jest.fn(),
    acceptInvite: jest.fn(),
    declineInvite: jest.fn(),
    refreshInvites: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock('@/hooks/useTyping', () => ({
  useTyping: () => ({
    typingDisplay: null,
    sendTyping: jest.fn(),
    sendStopTyping: jest.fn(),
  }),
}));

jest.mock('@/hooks/useCall', () => ({
  useCall: () => ({
    activeCall: null,
    startCall: jest.fn(),
    acceptCall: jest.fn(),
    endCall: jest.fn(),
    toggleMute: jest.fn(),
    toggleCamera: jest.fn(),
    switchCamera: jest.fn(),
    videoQuality: 'auto',
    audioQuality: 'auto',
    setVideoQuality: jest.fn(),
    setAudioQuality: jest.fn(),
    callStats: null,
  }),
}));

jest.mock('@/contexts/ActiveConversationContext', () => ({
  useActiveConversation: () => ({
    activeId: null,
    setActiveId: jest.fn(),
    searchPanelRequested: false,
    requestSearchPanel: jest.fn(),
    clearSearchPanelRequest: jest.fn(),
  }),
}));

jest.mock('@/contexts/SettingsDialogContext', () => ({
  useSettingsDialog: () => ({
    openSettings: jest.fn(),
    closeSettings: jest.fn(),
    isOpen: false,
    activeSection: null,
  }),
}));

jest.mock('@/contexts/PluginContext', () => ({
  usePlugins: jest.fn(() => ({
    getSlotComponents: jest.fn(() => []),
    plugins: [],
    installPlugin: jest.fn(),
    enablePlugin: jest.fn(),
    disablePlugin: jest.fn(),
    uninstallPlugin: jest.fn(),
  })),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
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
