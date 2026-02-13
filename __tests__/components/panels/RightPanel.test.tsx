import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { RightPanel } from '@/components/panels/RightPanel';

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

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    isReady: true,
    isLoading: false,
    error: null,
    service: null,
    version: '0.1.0-test',
  }),
}));

describe('RightPanel', () => {
  const defaultProps = {
    panelWidth: new Animated.Value(280),
    visiblePanel: null as any,
    togglePanel: jest.fn(),
    onMemberClick: jest.fn(),
    searchQuery: '',
    onSearchQueryChange: jest.fn(),
    threadParent: null,
    threadReplies: [],
  };

  test('renders without crashing when no panel visible', () => {
    const { toJSON } = render(<RightPanel {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  test('renders MemberList when visiblePanel is members', () => {
    const { getByTestId } = render(
      <RightPanel {...defaultProps} visiblePanel="members" />,
    );
    expect(getByTestId('MemberList')).toBeTruthy();
  });

  test('renders PinnedMessages when visiblePanel is pins', () => {
    const { getByTestId } = render(
      <RightPanel {...defaultProps} visiblePanel="pins" />,
    );
    expect(getByTestId('PinnedMessages')).toBeTruthy();
  });

  test('renders MessageSearch when visiblePanel is search', () => {
    const { getByTestId } = render(
      <RightPanel {...defaultProps} visiblePanel="search" />,
    );
    expect(getByTestId('MessageSearch')).toBeTruthy();
  });

  test('does not render MemberList when panel is pins', () => {
    const { queryByTestId } = render(
      <RightPanel {...defaultProps} visiblePanel="pins" />,
    );
    expect(queryByTestId('MemberList')).toBeNull();
  });

  test('does not render any panel component when visiblePanel is null', () => {
    const { queryByTestId } = render(
      <RightPanel {...defaultProps} visiblePanel={null} />,
    );
    expect(queryByTestId('MemberList')).toBeNull();
    expect(queryByTestId('PinnedMessages')).toBeNull();
    expect(queryByTestId('MessageSearch')).toBeNull();
  });

  // ── Extended panel tests ──

  test('renders PinnedMessages with real pinned message data', () => {
    const pinnedMessages = [
      { id: 'pin-1', sender: 'Alice', content: 'Pinned msg', timestamp: '10:30 AM' },
    ];
    const { getByTestId } = render(
      <RightPanel
        {...defaultProps}
        visiblePanel="pins"
        pinnedMessages={pinnedMessages}
        onUnpinMessage={jest.fn()}
      />,
    );
    expect(getByTestId('PinnedMessages')).toBeTruthy();
  });

  test('renders ThreadPanel when thread is open', () => {
    const threadParent = {
      id: 'msg-parent',
      sender: 'Alice',
      content: 'Parent message',
      timestamp: '10:30 AM',
    };
    const threadReplies = [
      { id: 'reply-1', sender: 'You', content: 'Reply text', timestamp: '10:35 AM', isOwn: true },
    ];
    const { getByTestId } = render(
      <RightPanel
        {...defaultProps}
        visiblePanel="thread"
        threadParent={threadParent}
        threadReplies={threadReplies}
        onThreadReply={jest.fn()}
      />,
    );
    expect(getByTestId('ThreadPanel')).toBeTruthy();
  });

  test('does not render ThreadPanel when threadParent is null', () => {
    const { queryByTestId } = render(
      <RightPanel
        {...defaultProps}
        visiblePanel="thread"
        threadParent={null}
        threadReplies={[]}
      />,
    );
    expect(queryByTestId('ThreadPanel')).toBeNull();
  });
});
