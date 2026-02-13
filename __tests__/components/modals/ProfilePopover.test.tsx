import React from 'react';
import { render } from '@testing-library/react-native';
import { ProfilePopover } from '@/components/modals/ProfilePopover';

describe('ProfilePopover', () => {
  test('renders when selectedMember is present', () => {
    const { getByTestId } = render(
      <ProfilePopover
        selectedMember={{ id: '1', name: 'Sarah Chen', status: 'online' }}
        anchor={{ x: 100, y: 200 }}
        onClose={jest.fn()}
      />,
    );
    expect(getByTestId('AnchoredPopover')).toBeTruthy();
  });

  test('renders UserProfileCard with member data', () => {
    const { getByTestId } = render(
      <ProfilePopover
        selectedMember={{ id: '1', name: 'Sarah Chen', status: 'online' }}
        anchor={{ x: 100, y: 200 }}
        onClose={jest.fn()}
      />,
    );
    expect(getByTestId('UserProfileCard')).toBeTruthy();
  });

  test('renders when selectedMember is null', () => {
    const { getByTestId } = render(
      <ProfilePopover
        selectedMember={null}
        anchor={null}
        onClose={jest.fn()}
      />,
    );
    expect(getByTestId('AnchoredPopover')).toBeTruthy();
  });

  test('does not render UserProfileCard when member is null', () => {
    const { queryByTestId } = render(
      <ProfilePopover
        selectedMember={null}
        anchor={null}
        onClose={jest.fn()}
      />,
    );
    expect(queryByTestId('UserProfileCard')).toBeNull();
  });
});
