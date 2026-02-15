import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChatSidebar } from '@/components/sidebar/ChatSidebar';

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

/** Test fixture — shaped like the sidebar prop, not the old mock CONVERSATIONS. */
const TEST_CONVERSATIONS = [
  { id: '1', name: 'Alice', last: 'Hey there!', time: '2m', unread: 1, online: true },
  { id: '2', name: 'Bob',   last: 'See you later', time: '10m', unread: 0 },
  { id: '3', name: 'Carol', last: 'Done', time: '1h', unread: 3 },
];

describe('ChatSidebar', () => {
  const defaultProps = {
    search: '',
    onSearchChange: jest.fn(),
    conversations: TEST_CONVERSATIONS,
    activeId: '1',
    onSelectConversation: jest.fn(),
    onOpenSettings: jest.fn(),
    onFriendsPress: jest.fn(),
  };

  test('renders without crashing', () => {
    const { toJSON } = render(<ChatSidebar {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  test('renders search input', () => {
    const { getByTestId } = render(<ChatSidebar {...defaultProps} />);
    expect(getByTestId('SearchInput')).toBeTruthy();
  });

  test('renders settings button', () => {
    const { getByLabelText } = render(<ChatSidebar {...defaultProps} />);
    expect(getByLabelText('Settings')).toBeTruthy();
  });

  test('settings button calls onOpenSettings', () => {
    const onOpenSettings = jest.fn();
    const { getByLabelText } = render(
      <ChatSidebar {...defaultProps} onOpenSettings={onOpenSettings} />,
    );
    fireEvent.press(getByLabelText('Settings'));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  test('renders conversation list items', () => {
    const { getAllByTestId } = render(<ChatSidebar {...defaultProps} />);
    const items = getAllByTestId('ConversationListItem');
    expect(items.length).toBe(TEST_CONVERSATIONS.length);
  });

  test('renders with filtered conversations', () => {
    const filtered = TEST_CONVERSATIONS.filter((c) => c.name === 'Alice');
    const { getAllByTestId } = render(
      <ChatSidebar {...defaultProps} conversations={filtered} />,
    );
    const items = getAllByTestId('ConversationListItem');
    expect(items.length).toBe(filtered.length);
  });
});
