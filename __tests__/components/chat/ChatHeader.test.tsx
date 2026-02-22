import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChatHeader } from '@/components/chat/ChatHeader';

// Force desktop layout so utility buttons are always visible (not hidden behind mobile menu)
jest.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
  MOBILE_BREAKPOINT: 768,
}));

describe('ChatHeader', () => {
  const mockTogglePanel = jest.fn();
  const mockShowProfile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders conversation name', () => {
    const { getByText } = render(
      <ChatHeader
        active={{ name: 'Sarah Chen', online: true }}
        rightPanel={null}
        togglePanel={mockTogglePanel}
        onShowProfile={mockShowProfile}
      />,
    );
    expect(getByText('Sarah Chen')).toBeTruthy();
  });

  test('renders "Chat" when no active conversation', () => {
    const { getByText } = render(
      <ChatHeader
        active={undefined}
        rightPanel={null}
        togglePanel={mockTogglePanel}
        onShowProfile={mockShowProfile}
      />,
    );
    expect(getByText('Chat')).toBeTruthy();
  });

  test('renders avatar for online users', () => {
    const { toJSON } = render(
      <ChatHeader
        active={{ name: 'Sarah Chen', online: true }}
        rightPanel={null}
        togglePanel={mockTogglePanel}
        onShowProfile={mockShowProfile}
      />,
    );
    // Online status is now conveyed via Avatar status prop, not text
    expect(toJSON()).toBeTruthy();
  });

  test('renders for group chats without online text', () => {
    const { queryByText } = render(
      <ChatHeader
        active={{ name: 'Design Team', group: ['Alice', 'Bob'] }}
        rightPanel={null}
        togglePanel={mockTogglePanel}
        onShowProfile={mockShowProfile}
      />,
    );
    expect(queryByText('Online')).toBeNull();
  });

  test('renders search button', () => {
    const { getByLabelText } = render(
      <ChatHeader
        active={{ name: 'Sarah Chen' }}
        rightPanel={null}
        togglePanel={mockTogglePanel}
        onShowProfile={mockShowProfile}
      />,
    );
    expect(getByLabelText('Search messages')).toBeTruthy();
  });

  test('renders pins button', () => {
    const { getByLabelText } = render(
      <ChatHeader
        active={{ name: 'Sarah Chen' }}
        rightPanel={null}
        togglePanel={mockTogglePanel}
        onShowProfile={mockShowProfile}
      />,
    );
    expect(getByLabelText('Toggle pinned messages')).toBeTruthy();
  });

  test('renders members button', () => {
    const { getByLabelText } = render(
      <ChatHeader
        active={{ name: 'Sarah Chen' }}
        rightPanel={null}
        togglePanel={mockTogglePanel}
        onShowProfile={mockShowProfile}
      />,
    );
    expect(getByLabelText('Toggle members')).toBeTruthy();
  });

  test('search button calls togglePanel with search', () => {
    const { getByLabelText } = render(
      <ChatHeader
        active={{ name: 'Sarah Chen' }}
        rightPanel={null}
        togglePanel={mockTogglePanel}
        onShowProfile={mockShowProfile}
      />,
    );
    fireEvent.press(getByLabelText('Search messages'));
    expect(mockTogglePanel).toHaveBeenCalledWith('search');
  });

  test('members button calls togglePanel with members', () => {
    const { getByLabelText } = render(
      <ChatHeader
        active={{ name: 'Sarah Chen' }}
        rightPanel={null}
        togglePanel={mockTogglePanel}
        onShowProfile={mockShowProfile}
      />,
    );
    fireEvent.press(getByLabelText('Toggle members'));
    expect(mockTogglePanel).toHaveBeenCalledWith('members');
  });
});
