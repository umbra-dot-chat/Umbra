/**
 * Tests for the VoiceCallPanel component — full voice channel panel
 * shown in the main content area when connected to a voice channel.
 *
 * VoiceCallPanel wraps the Wisp GroupCallPanel, mapping VoiceChannelContext
 * state into the unified call panel API.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockToggleMute = jest.fn();
const mockToggleDeafen = jest.fn();
const mockLeaveVoiceChannel = jest.fn();

let mockVoiceContext: any = {
  activeChannelId: 'voice-1',
  activeCommunityId: 'c1',
  roomId: 'room-1',
  participants: ['did:key:me', 'did:key:alice'],
  isMuted: false,
  isDeafened: false,
  isConnecting: false,
  joinVoiceChannel: jest.fn(),
  leaveVoiceChannel: mockLeaveVoiceChannel,
  toggleMute: mockToggleMute,
  toggleDeafen: mockToggleDeafen,
  voiceParticipants: new Map([
    ['voice-1', new Set(['did:key:me', 'did:key:alice', 'did:key:bob'])],
  ]),
  activeChannelName: 'Lounge',
  speakingDids: new Set<string>(),
};

jest.mock('@/contexts/VoiceChannelContext', () => ({
  useVoiceChannel: () => mockVoiceContext,
}));

// Mock the Wisp GroupCallPanel — renders a testable proxy that exercises
// the same props the real component receives.
let capturedProps: any = null;
jest.mock('@coexist/wisp-react-native', () => {
  const { View, Text, Pressable } = require('react-native');
  return {
    GroupCallPanel: (props: any) => {
      capturedProps = props;
      return (
        <View testID="group-call-panel">
          {/* Header with group name */}
          <Text>{props.groupName}</Text>
          <Text>{props.isConnecting ? 'Connecting...' : `${props.participants.length} connected`}</Text>

          {/* Participant names */}
          {props.participants.map((p: any) => (
            <View key={p.did} testID={`participant-${p.did}`}>
              <Text>{p.displayName}</Text>
            </View>
          ))}

          {/* Control buttons */}
          <Pressable
            onPress={props.onToggleMute}
            accessibilityLabel={props.isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            <Text>{props.isMuted ? 'Unmute' : 'Mute'}</Text>
          </Pressable>

          {props.onToggleDeafen && (
            <Pressable
              onPress={props.onToggleDeafen}
              accessibilityLabel={props.isDeafened ? 'Undeafen' : 'Deafen'}
            >
              <Text>{props.isDeafened ? 'Undeafen' : 'Deafen'}</Text>
            </Pressable>
          )}

          <Pressable
            onPress={props.onEndCall}
            accessibilityLabel="End call"
          >
            <Text>Disconnect</Text>
          </Pressable>
        </View>
      );
    },
  };
});

jest.mock('@coexist/wisp-core/types/GroupCallPanel.types', () => ({}));

import { VoiceCallPanel } from '@/components/community/voice/VoiceCallPanel';
import type { CommunityMember } from '@umbra/service';

const MEMBERS: CommunityMember[] = [
  { communityId: 'c1', memberDid: 'did:key:alice', nickname: 'Alice', joinedAt: 1 },
  { communityId: 'c1', memberDid: 'did:key:bob', nickname: 'Bob', joinedAt: 2 },
  { communityId: 'c1', memberDid: 'did:key:me', nickname: 'MyNick', joinedAt: 0 },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VoiceCallPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedProps = null;
    mockVoiceContext = {
      activeChannelId: 'voice-1',
      activeCommunityId: 'c1',
      roomId: 'room-1',
      participants: ['did:key:me', 'did:key:alice'],
      isMuted: false,
      isDeafened: false,
      isConnecting: false,
      joinVoiceChannel: jest.fn(),
      leaveVoiceChannel: mockLeaveVoiceChannel,
      toggleMute: mockToggleMute,
      toggleDeafen: mockToggleDeafen,
      voiceParticipants: new Map([
        ['voice-1', new Set(['did:key:me', 'did:key:alice', 'did:key:bob'])],
      ]),
      activeChannelName: 'Lounge',
      speakingDids: new Set<string>(),
    };
  });

  test('renders channel name in header', () => {
    const { getByText } = render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    expect(getByText('Lounge')).toBeTruthy();
  });

  test('shows participant count', () => {
    const { getByText } = render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    expect(getByText('3 connected')).toBeTruthy();
  });

  test('shows participant names', () => {
    const { getByText } = render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
        myDisplayName="Me"
      />,
    );
    expect(getByText('Me')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });

  test('mute button calls toggleMute', () => {
    const { getByLabelText } = render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    fireEvent.press(getByLabelText('Mute microphone'));
    expect(mockToggleMute).toHaveBeenCalledTimes(1);
  });

  test('deafen button calls toggleDeafen', () => {
    const { getByLabelText } = render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    fireEvent.press(getByLabelText('Deafen'));
    expect(mockToggleDeafen).toHaveBeenCalledTimes(1);
  });

  test('disconnect button calls leaveVoiceChannel', () => {
    const { getByLabelText } = render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    fireEvent.press(getByLabelText('End call'));
    expect(mockLeaveVoiceChannel).toHaveBeenCalledTimes(1);
  });

  test('shows "Connecting..." when isConnecting is true', () => {
    mockVoiceContext.isConnecting = true;
    const { getByText } = render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    expect(getByText('Connecting...')).toBeTruthy();
  });

  test('shows muted state with correct button label', () => {
    mockVoiceContext.isMuted = true;
    const { getByLabelText } = render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    expect(getByLabelText('Unmute microphone')).toBeTruthy();
  });

  test('shows deafened state with correct button label', () => {
    mockVoiceContext.isDeafened = true;
    const { getByLabelText } = render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    expect(getByLabelText('Undeafen')).toBeTruthy();
  });

  test('uses myDisplayName for self participant', () => {
    const { getByText } = render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
        myDisplayName="CustomName"
      />,
    );
    expect(getByText('CustomName')).toBeTruthy();
  });

  test('falls back to nickname when myDisplayName is not provided', () => {
    const { getByText } = render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    expect(getByText('MyNick')).toBeTruthy();
  });

  // ── New tests for GroupCallPanel integration ────────────────────────────

  test('passes callType="audio" to GroupCallPanel', () => {
    render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    expect(capturedProps.callType).toBe('audio');
  });

  test('passes layout="voice" to GroupCallPanel', () => {
    render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    expect(capturedProps.layout).toBe('voice');
  });

  test('maps speaking state to participants', () => {
    mockVoiceContext.speakingDids = new Set(['did:key:alice']);
    render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    const aliceParticipant = capturedProps.participants.find(
      (p: any) => p.did === 'did:key:alice',
    );
    expect(aliceParticipant.isSpeaking).toBe(true);

    const bobParticipant = capturedProps.participants.find(
      (p: any) => p.did === 'did:key:bob',
    );
    expect(bobParticipant.isSpeaking).toBe(false);
  });

  test('maps muted/deafened state to self participant', () => {
    mockVoiceContext.isMuted = true;
    mockVoiceContext.isDeafened = true;
    render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    const meParticipant = capturedProps.participants.find(
      (p: any) => p.did === 'did:key:me',
    );
    expect(meParticipant.isMuted).toBe(true);
    expect(meParticipant.isDeafened).toBe(true);

    // Other participants should not show as muted/deafened
    const aliceParticipant = capturedProps.participants.find(
      (p: any) => p.did === 'did:key:alice',
    );
    expect(aliceParticipant.isMuted).toBe(false);
    expect(aliceParticipant.isDeafened).toBe(false);
  });

  test('all participants have isCameraOff=true (voice-only)', () => {
    render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    for (const p of capturedProps.participants) {
      expect(p.isCameraOff).toBe(true);
      expect(p.stream).toBeNull();
    }
  });

  test('passes isConnecting to GroupCallPanel', () => {
    mockVoiceContext.isConnecting = true;
    render(
      <VoiceCallPanel
        channelName="Lounge"
        members={MEMBERS}
        myDid="did:key:me"
      />,
    );
    expect(capturedProps.isConnecting).toBe(true);
  });
});
