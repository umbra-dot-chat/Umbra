import React from 'react';
import { render } from '@testing-library/react-native';
import { ChatInput } from '@/components/chat/ChatInput';

jest.mock('@/hooks/useFriends', () => ({
  useFriends: () => ({
    friends: [
      { did: 'did:key:z6MkAlice', displayName: 'Alice', online: true },
      { did: 'did:key:z6MkBob', displayName: 'Bob', online: false },
    ],
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

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    isReady: true,
    isLoading: false,
    error: null,
    service: null,
    version: '0.1.0-test',
  }),
}));

describe('ChatInput', () => {
  const defaultProps = {
    message: '',
    onMessageChange: jest.fn(),
    emojiOpen: false,
    onToggleEmoji: jest.fn(),
    replyingTo: null,
    onClearReply: jest.fn(),
    onSubmit: jest.fn(),
  };

  test('renders without crashing', () => {
    const { toJSON } = render(<ChatInput {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  test('renders MessageInput component', () => {
    const { getByTestId } = render(<ChatInput {...defaultProps} />);
    expect(getByTestId('MessageInput')).toBeTruthy();
  });

  test('renders emoji picker when emojiOpen is true', () => {
    const { getByTestId } = render(
      <ChatInput {...defaultProps} emojiOpen={true} />,
    );
    expect(getByTestId('EmojiPicker')).toBeTruthy();
  });

  test('does not render emoji picker when emojiOpen is false', () => {
    const { queryByTestId } = render(
      <ChatInput {...defaultProps} emojiOpen={false} />,
    );
    expect(queryByTestId('EmojiPicker')).toBeNull();
  });

  // ── Edit mode tests ──

  test('renders in edit mode without crashing', () => {
    const { getByTestId } = render(
      <ChatInput
        {...defaultProps}
        editing={{ messageId: 'msg-1', text: 'Original text' }}
        onCancelEdit={jest.fn()}
      />,
    );
    expect(getByTestId('MessageInput')).toBeTruthy();
  });

  test('renders normally without editing prop', () => {
    const { getByTestId } = render(
      <ChatInput {...defaultProps} editing={null} />,
    );
    expect(getByTestId('MessageInput')).toBeTruthy();
  });

  test('renders with cancel edit callback', () => {
    const onCancelEdit = jest.fn();
    const { toJSON } = render(
      <ChatInput
        {...defaultProps}
        editing={{ messageId: 'msg-1', text: 'Edit me' }}
        onCancelEdit={onCancelEdit}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
