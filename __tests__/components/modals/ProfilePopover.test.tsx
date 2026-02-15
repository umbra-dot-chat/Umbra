import React from 'react';
import { render } from '@testing-library/react-native';
import { ProfilePopover } from '@/components/modals/ProfilePopover';

describe('ProfilePopover', () => {
  test('renders when selectedMember is present', () => {
    const { getAllByTestId } = render(
      <ProfilePopover
        selectedMember={{ id: '1', name: 'Sarah Chen', status: 'online' }}
        anchor={{ x: 100, y: 200 }}
        onClose={jest.fn()}
      />,
    );
    expect(getAllByTestId('UserProfileCard').length).toBeGreaterThan(0);
  });

  test('renders UserProfileCard with member data', () => {
    const { getAllByTestId } = render(
      <ProfilePopover
        selectedMember={{ id: '1', name: 'Sarah Chen', status: 'online' }}
        anchor={{ x: 100, y: 200 }}
        onClose={jest.fn()}
      />,
    );
    expect(getAllByTestId('UserProfileCard').length).toBeGreaterThan(0);
  });

  test('renders nothing when selectedMember is null', () => {
    const { toJSON } = render(
      <ProfilePopover
        selectedMember={null}
        anchor={null}
        onClose={jest.fn()}
      />,
    );
    expect(toJSON()).toBeNull();
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
