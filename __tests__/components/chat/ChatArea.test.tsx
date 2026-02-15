import React from 'react';
import { render } from '@testing-library/react-native';
import { ChatArea } from '@/components/chat/ChatArea';
import type { Message } from '@umbra/service';

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

describe('ChatArea', () => {
  const sampleMessages: Message[] = [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderDid: 'did:key:z6MkFriend',
      content: { type: 'text', text: 'Hey, how are you?' },
      timestamp: Date.now() - 60000,
      read: true,
      delivered: true,
      status: 'read',
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      senderDid: 'did:key:z6MkMe',
      content: { type: 'text', text: 'Doing great, thanks!' },
      timestamp: Date.now() - 30000,
      read: true,
      delivered: true,
      status: 'read',
    },
    {
      id: 'msg-3',
      conversationId: 'conv-1',
      senderDid: 'did:key:z6MkFriend',
      content: { type: 'text', text: 'Want to grab lunch later?' },
      timestamp: Date.now(),
      read: false,
      delivered: true,
      status: 'delivered',
    },
  ];

  const defaultProps = {
    messages: sampleMessages,
    myDid: 'did:key:z6MkMe',
    friendNames: { 'did:key:z6MkFriend': 'Alice' } as Record<string, string>,
    hoveredMessage: null,
    onHoverIn: jest.fn(),
    onHoverOut: jest.fn(),
    onReplyTo: jest.fn(),
    onOpenThread: jest.fn(),
    onShowProfile: jest.fn(),
  };

  test('renders without crashing', () => {
    const { toJSON } = render(<ChatArea {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  test('shows loading state when isLoading is true', () => {
    const { getByText } = render(<ChatArea {...defaultProps} isLoading />);
    expect(getByText('Loading messages...')).toBeTruthy();
  });

  test('shows empty state when messages is empty', () => {
    const { getByText } = render(
      <ChatArea {...defaultProps} messages={[]} />,
    );
    expect(getByText('No messages yet')).toBeTruthy();
  });

  test('renders message bubbles when messages exist', () => {
    const { getAllByTestId } = render(<ChatArea {...defaultProps} />);
    const bubbles = getAllByTestId('ChatBubble');
    expect(bubbles.length).toBeGreaterThan(0);
  });

  test('renders sender names', () => {
    const { getAllByText } = render(<ChatArea {...defaultProps} />);
    // Friend messages should show "Alice" (from friendNames map)
    expect(getAllByText('Alice').length).toBeGreaterThan(0);
    // Own messages should show "You"
    expect(getAllByText('You').length).toBeGreaterThan(0);
  });

  test('renders date divider', () => {
    const { getByText } = render(<ChatArea {...defaultProps} />);
    expect(getByText('Today')).toBeTruthy();
  });

  test('renders typing indicator when typingUser is set', () => {
    const { getByTestId } = render(
      <ChatArea {...defaultProps} typingUser="Alice" />,
    );
    expect(getByTestId('TypingIndicator')).toBeTruthy();
  });

  // ── Extended feature rendering tests ──

  test('renders deleted message as [Message deleted]', () => {
    const deletedMessages: Message[] = [
      {
        id: 'msg-del',
        conversationId: 'conv-1',
        senderDid: 'did:key:z6MkFriend',
        content: { type: 'text', text: 'Original text' },
        timestamp: Date.now(),
        read: true,
        delivered: true,
        status: 'read',
        deleted: true,
      },
    ];
    const { getByTestId } = render(
      <ChatArea {...defaultProps} messages={deletedMessages} />,
    );
    // The deleted text is rendered as children of the mock ChatBubble View
    const bubble = getByTestId('ChatBubble');
    expect(bubble).toBeTruthy();
    // The ChatBubble mock passes children through — verify the text child
    expect(bubble.props.children).toContain('[Message deleted]');
  });

  test('renders with reaction props on ChatBubble', () => {
    const messagesWithReactions: Message[] = [
      {
        id: 'msg-react',
        conversationId: 'conv-1',
        senderDid: 'did:key:z6MkFriend',
        content: { type: 'text', text: 'Great!' },
        timestamp: Date.now(),
        read: true,
        delivered: true,
        status: 'read',
        reactions: [{ emoji: '👍', count: 2, users: ['did:key:z6MkMe', 'did:key:z6MkFriend'], reacted: true }],
      },
    ];
    const { getByTestId } = render(
      <ChatArea {...defaultProps} messages={messagesWithReactions} onToggleReaction={jest.fn()} />,
    );
    expect(getByTestId('ChatBubble')).toBeTruthy();
  });

  test('renders with replyTo context on ChatBubble', () => {
    const messagesWithReply: Message[] = [
      {
        id: 'msg-reply',
        conversationId: 'conv-1',
        senderDid: 'did:key:z6MkFriend',
        content: { type: 'text', text: 'Reply here' },
        timestamp: Date.now(),
        read: true,
        delivered: true,
        status: 'read',
        replyTo: { messageId: 'msg-1', senderDid: 'did:key:z6MkMe', text: 'Original msg' },
      },
    ];
    const { getByTestId } = render(
      <ChatArea {...defaultProps} messages={messagesWithReply} />,
    );
    expect(getByTestId('ChatBubble')).toBeTruthy();
  });

  test('renders edited message', () => {
    const editedMessages: Message[] = [
      {
        id: 'msg-edited',
        conversationId: 'conv-1',
        senderDid: 'did:key:z6MkMe',
        content: { type: 'text', text: 'Edited text' },
        timestamp: Date.now(),
        read: true,
        delivered: true,
        status: 'read',
        edited: true,
      },
    ];
    const { getByTestId } = render(
      <ChatArea {...defaultProps} messages={editedMessages} />,
    );
    expect(getByTestId('ChatBubble')).toBeTruthy();
  });

  test('renders forwarded message', () => {
    const forwardedMessages: Message[] = [
      {
        id: 'msg-fwd',
        conversationId: 'conv-1',
        senderDid: 'did:key:z6MkFriend',
        content: { type: 'text', text: 'Forwarded text' },
        timestamp: Date.now(),
        read: true,
        delivered: true,
        status: 'read',
        forwarded: true,
      },
    ];
    const { getByTestId } = render(
      <ChatArea {...defaultProps} messages={forwardedMessages} />,
    );
    expect(getByTestId('ChatBubble')).toBeTruthy();
  });

  test('passes extended handler props without crashing', () => {
    const { toJSON } = render(
      <ChatArea
        {...defaultProps}
        onToggleReaction={jest.fn()}
        onEditMessage={jest.fn()}
        onDeleteMessage={jest.fn()}
        onPinMessage={jest.fn()}
        onForwardMessage={jest.fn()}
        onCopyMessage={jest.fn()}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
