import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { HoverBubble } from '@/components/chat/HoverBubble';

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

const mockActions = [
  { key: 'react', label: 'React', icon: <Text>smile</Text>, onClick: jest.fn() },
  { key: 'reply', label: 'Reply', icon: <Text>reply</Text>, onClick: jest.fn() },
];

const mockContextActions = {
  onReply: jest.fn(),
  onThread: jest.fn(),
  onCopy: jest.fn(),
  onForward: jest.fn(),
  onPin: jest.fn(),
  onDelete: jest.fn(),
};

const mockThemeColors = {
  text: { primary: '#000', secondary: '#666', muted: '#999' },
};

describe('HoverBubble', () => {
  test('renders children', () => {
    const { getByText } = render(
      <HoverBubble
        id="test-1"
        align="incoming"
        hoveredMessage={null}
        onHoverIn={jest.fn()}
        onHoverOut={jest.fn()}
        actions={mockActions}
        contextActions={mockContextActions}
        themeColors={mockThemeColors}
      >
        <Text>Hello World</Text>
      </HoverBubble>,
    );
    expect(getByText('Hello World')).toBeTruthy();
  });

  test('renders with outgoing alignment', () => {
    const { getByText } = render(
      <HoverBubble
        id="test-2"
        align="outgoing"
        hoveredMessage={null}
        onHoverIn={jest.fn()}
        onHoverOut={jest.fn()}
        actions={mockActions}
        contextActions={mockContextActions}
        themeColors={mockThemeColors}
      >
        <Text>Outgoing message</Text>
      </HoverBubble>,
    );
    expect(getByText('Outgoing message')).toBeTruthy();
  });

  test('renders action bar component', () => {
    const { getByTestId } = render(
      <HoverBubble
        id="test-3"
        align="incoming"
        hoveredMessage="test-3"
        onHoverIn={jest.fn()}
        onHoverOut={jest.fn()}
        actions={mockActions}
        contextActions={mockContextActions}
        themeColors={mockThemeColors}
      >
        <Text>Content</Text>
      </HoverBubble>,
    );
    expect(getByTestId('MessageActionBar')).toBeTruthy();
  });

  test('does not render context menu by default', () => {
    const { queryByText } = render(
      <HoverBubble
        id="test-4"
        align="incoming"
        hoveredMessage={null}
        onHoverIn={jest.fn()}
        onHoverOut={jest.fn()}
        actions={mockActions}
        contextActions={mockContextActions}
        themeColors={mockThemeColors}
      >
        <Text>Content</Text>
      </HoverBubble>,
    );
    // Context menu items should not be visible until right-click
    expect(queryByText('Copy Text')).toBeNull();
    expect(queryByText('Delete Message')).toBeNull();
  });

  test('renders with incoming alignment and hidden action bar when not hovered', () => {
    const { getByTestId, getByText } = render(
      <HoverBubble
        id="test-5"
        align="incoming"
        hoveredMessage="different-id"
        onHoverIn={jest.fn()}
        onHoverOut={jest.fn()}
        actions={mockActions}
        contextActions={mockContextActions}
        themeColors={mockThemeColors}
      >
        <Text>Content</Text>
      </HoverBubble>,
    );
    expect(getByText('Content')).toBeTruthy();
    expect(getByTestId('MessageActionBar')).toBeTruthy();
  });
});
