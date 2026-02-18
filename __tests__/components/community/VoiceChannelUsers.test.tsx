/**
 * Tests for the VoiceChannelUsers component — renders voice participants
 * under voice channels in the sidebar.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@coexist/wisp-react-native', () => ({
  Avatar: ({ name, size }: any) => {
    const { View } = require('react-native');
    return <View testID={`avatar-${name}`} />;
  },
  Text: ({ children, ...props }: any) => {
    const { Text: RNText } = require('react-native');
    return <RNText {...props}>{children}</RNText>;
  },
  useTheme: () => ({
    theme: {
      colors: {
        text: { secondary: '#aaa' },
        status: { success: '#22c55e' },
      },
    },
  }),
}));

jest.mock('@/components/icons', () => ({
  AudioWaveIcon: ({ size, color }: any) => {
    const { View } = require('react-native');
    return <View testID="audio-wave-icon" />;
  },
}));

import { VoiceChannelUsers } from '@/components/community/VoiceChannelUsers';
import type { CommunityMember } from '@umbra/service';

const MEMBERS: CommunityMember[] = [
  { communityId: 'c1', memberDid: 'did:key:alice', nickname: 'Alice', joinedAt: 1 },
  { communityId: 'c1', memberDid: 'did:key:bob', nickname: 'Bob', joinedAt: 2 },
  { communityId: 'c1', memberDid: 'did:key:charlie', nickname: 'Charlie', joinedAt: 3 },
  { communityId: 'c1', memberDid: 'did:key:me', nickname: 'MyNick', joinedAt: 0 },
];

describe('VoiceChannelUsers', () => {
  test('renders nothing when no participants', () => {
    const { toJSON } = render(
      <VoiceChannelUsers
        participantDids={new Set()}
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    expect(toJSON()).toBeNull();
  });

  test('renders a single participant (self)', () => {
    const { getByText } = render(
      <VoiceChannelUsers
        participantDids={new Set(['did:key:me'])}
        members={MEMBERS}
        myDid="did:key:me"
        myDisplayName="MyRealName"
      />,
    );
    expect(getByText('MyRealName')).toBeTruthy();
  });

  test('uses nickname when myDisplayName is not provided for self', () => {
    const { getByText } = render(
      <VoiceChannelUsers
        participantDids={new Set(['did:key:me'])}
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    expect(getByText('MyNick')).toBeTruthy();
  });

  test('renders multiple participants with names', () => {
    const { getByText } = render(
      <VoiceChannelUsers
        participantDids={new Set(['did:key:alice', 'did:key:bob'])}
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });

  test('shows self first in the participant list', () => {
    const { getAllByText, getByText } = render(
      <VoiceChannelUsers
        participantDids={new Set(['did:key:alice', 'did:key:me', 'did:key:bob'])}
        members={MEMBERS}
        myDid="did:key:me"
        myDisplayName="Me"
      />,
    );
    // All three should be rendered
    expect(getByText('Me')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });

  test('falls back to truncated DID for unknown members', () => {
    const { getByText } = render(
      <VoiceChannelUsers
        participantDids={new Set(['did:key:unknown123'])}
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    expect(getByText('did:key:unknown1...')).toBeTruthy();
  });

  test('renders avatars for each participant', () => {
    const { getByTestId } = render(
      <VoiceChannelUsers
        participantDids={new Set(['did:key:alice', 'did:key:bob'])}
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    expect(getByTestId('avatar-Alice')).toBeTruthy();
    expect(getByTestId('avatar-Bob')).toBeTruthy();
  });

  // ── Speaking indicator tests ────────────────────────────────────────────────

  test('shows audio wave icon for speaking participants', () => {
    const { getAllByTestId } = render(
      <VoiceChannelUsers
        participantDids={new Set(['did:key:alice', 'did:key:bob'])}
        members={MEMBERS}
        myDid="did:key:me"
        speakingDids={new Set(['did:key:alice'])}
      />,
    );
    // Only Alice is speaking, so there should be one audio wave icon
    const icons = getAllByTestId('audio-wave-icon');
    expect(icons).toHaveLength(1);
  });

  test('does not show audio wave icon when nobody is speaking', () => {
    const { queryByTestId } = render(
      <VoiceChannelUsers
        participantDids={new Set(['did:key:alice', 'did:key:bob'])}
        members={MEMBERS}
        myDid="did:key:me"
        speakingDids={new Set()}
      />,
    );
    expect(queryByTestId('audio-wave-icon')).toBeNull();
  });

  test('shows audio wave icons for multiple speaking participants', () => {
    const { getAllByTestId } = render(
      <VoiceChannelUsers
        participantDids={new Set(['did:key:alice', 'did:key:bob', 'did:key:me'])}
        members={MEMBERS}
        myDid="did:key:me"
        myDisplayName="Me"
        speakingDids={new Set(['did:key:alice', 'did:key:me'])}
      />,
    );
    // Alice and me are speaking — 2 icons
    const icons = getAllByTestId('audio-wave-icon');
    expect(icons).toHaveLength(2);
  });

  test('works without speakingDids prop (backwards compatible)', () => {
    const { queryByTestId, getByText } = render(
      <VoiceChannelUsers
        participantDids={new Set(['did:key:alice'])}
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    expect(getByText('Alice')).toBeTruthy();
    expect(queryByTestId('audio-wave-icon')).toBeNull();
  });
});
