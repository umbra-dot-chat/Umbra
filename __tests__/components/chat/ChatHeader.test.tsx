import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChatHeader } from '@/components/chat/ChatHeader';

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

  test('shows online status for online users', () => {
    const { getByText } = render(
      <ChatHeader
        active={{ name: 'Sarah Chen', online: true }}
        rightPanel={null}
        togglePanel={mockTogglePanel}
        onShowProfile={mockShowProfile}
      />,
    );
    expect(getByText('Online')).toBeTruthy();
  });

  test('does not show online status for group chats', () => {
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
