import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { MsgGroup } from '@/components/chat/MsgGroup';

const mockThemeColors = {
  text: { primary: '#000', secondary: '#666', muted: '#999' },
  accent: { primary: '#00f' },
};

describe('MsgGroup', () => {
  test('renders sender name', () => {
    const { getByText } = render(
      <MsgGroup sender="Sarah Chen" timestamp="10:30 AM" align="incoming" themeColors={mockThemeColors}>
        <Text>Hello</Text>
      </MsgGroup>,
    );
    expect(getByText('Sarah Chen')).toBeTruthy();
  });

  test('renders timestamp', () => {
    const { getByText } = render(
      <MsgGroup sender="You" timestamp="10:35 AM" align="outgoing" themeColors={mockThemeColors}>
        <Text>Hello</Text>
      </MsgGroup>,
    );
    expect(getByText('10:35 AM')).toBeTruthy();
  });

  test('renders children', () => {
    const { getByText } = render(
      <MsgGroup sender="Jake" timestamp="10:38 AM" align="incoming" themeColors={mockThemeColors}>
        <Text>Test message content</Text>
      </MsgGroup>,
    );
    expect(getByText('Test message content')).toBeTruthy();
  });

  test('renders status icon when status is provided', () => {
    const { getByTestId } = render(
      <MsgGroup sender="You" timestamp="10:35 AM" align="outgoing" status="read" themeColors={mockThemeColors}>
        <Text>Hello</Text>
      </MsgGroup>,
    );
    expect(getByTestId('StatusIcon')).toBeTruthy();
  });

  test('does not render status icon when status is absent', () => {
    const { queryByTestId } = render(
      <MsgGroup sender="Sarah" timestamp="10:30 AM" align="incoming" themeColors={mockThemeColors}>
        <Text>Hello</Text>
      </MsgGroup>,
    );
    expect(queryByTestId('StatusIcon')).toBeNull();
  });

  test('renders read receipts when provided', () => {
    const { getByText } = render(
      <MsgGroup sender="You" timestamp="10:35 AM" align="outgoing" themeColors={mockThemeColors} readReceipts={<Text>3 read</Text>}>
        <Text>Hello</Text>
      </MsgGroup>,
    );
    expect(getByText('3 read')).toBeTruthy();
  });

  test('renders avatar for incoming messages', () => {
    const { getByTestId } = render(
      <MsgGroup sender="Sarah" timestamp="10:30 AM" align="incoming" themeColors={mockThemeColors} avatar={<Text testID="avatar">SC</Text>}>
        <Text>Hello</Text>
      </MsgGroup>,
    );
    expect(getByTestId('avatar')).toBeTruthy();
  });
});
