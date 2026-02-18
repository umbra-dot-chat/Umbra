/**
 * Tests for VoiceChannelContext — voice channel state management.
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { View, Text } from 'react-native';

// ── Mock dependencies ──────────────────────────────────────────────────────

const mockService = {
  onCallEvent: jest.fn(() => jest.fn()),
  onCommunityEvent: jest.fn(() => jest.fn()),
  createCallRoom: jest.fn(),
  joinCallRoom: jest.fn(),
  leaveCallRoom: jest.fn(),
  sendCallRoomSignal: jest.fn(),
  getChannel: jest.fn((id: string) => Promise.resolve({ id, name: 'Lounge', channelType: 'voice' })),
  broadcastCommunityEvent: jest.fn(() => Promise.resolve()),
  dispatchCommunityEvent: jest.fn(),
  getRelayWs: jest.fn(() => null),
};

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({ service: mockService }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    identity: { did: 'did:key:testuser', displayName: 'TestUser' },
  }),
}));

// Mock GroupCallManager
const mockToggleMute = jest.fn(() => true);
const mockGetUserMedia = jest.fn(() => Promise.resolve());
const mockClose = jest.fn();
const mockCreateOfferForPeer = jest.fn(() => Promise.resolve('offer-sdp'));
const mockAcceptOfferFromPeer = jest.fn(() => Promise.resolve('answer-sdp'));
const mockCompleteHandshakeForPeer = jest.fn(() => Promise.resolve());
const mockAddIceCandidateForPeer = jest.fn(() => Promise.resolve());
const mockRemovePeer = jest.fn();

jest.mock('@/services/GroupCallManager', () => ({
  GroupCallManager: jest.fn().mockImplementation(() => ({
    getUserMedia: mockGetUserMedia,
    toggleMute: mockToggleMute,
    close: mockClose,
    createOfferForPeer: mockCreateOfferForPeer,
    acceptOfferFromPeer: mockAcceptOfferFromPeer,
    completeHandshakeForPeer: mockCompleteHandshakeForPeer,
    addIceCandidateForPeer: mockAddIceCandidateForPeer,
    removePeer: mockRemovePeer,
    onIceCandidate: null,
    onRemoteStream: null,
    onRemoteStreamRemoved: null,
    onConnectionStateChange: null,
  })),
}));

import { VoiceChannelProvider, useVoiceChannel } from '@/contexts/VoiceChannelContext';

// ── Test helper component ──────────────────────────────────────────────────

function TestConsumer({ onValue }: { onValue: (value: ReturnType<typeof useVoiceChannel>) => void }) {
  const ctx = useVoiceChannel();
  React.useEffect(() => {
    onValue(ctx);
  });
  return (
    <View>
      <Text testID="activeChannelId">{ctx.activeChannelId ?? 'none'}</Text>
      <Text testID="isMuted">{ctx.isMuted ? 'muted' : 'unmuted'}</Text>
      <Text testID="isDeafened">{ctx.isDeafened ? 'deafened' : 'undeafened'}</Text>
      <Text testID="isConnecting">{ctx.isConnecting ? 'connecting' : 'idle'}</Text>
      <Text testID="participantCount">{ctx.participants.length}</Text>
    </View>
  );
}

function renderWithProvider(onValue: (value: ReturnType<typeof useVoiceChannel>) => void) {
  return render(
    <VoiceChannelProvider>
      <TestConsumer onValue={onValue} />
    </VoiceChannelProvider>,
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('VoiceChannelContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToggleMute.mockReturnValue(true);
  });

  test('provides default state with no active channel', () => {
    let value: any;
    renderWithProvider((v) => { value = v; });

    expect(value.activeChannelId).toBeNull();
    expect(value.activeCommunityId).toBeNull();
    expect(value.roomId).toBeNull();
    expect(value.participants).toEqual([]);
    expect(value.isMuted).toBe(false);
    expect(value.isDeafened).toBe(false);
    expect(value.isConnecting).toBe(false);
  });

  test('joinVoiceChannel sets activeChannelId and activeCommunityId', async () => {
    let value: any;
    renderWithProvider((v) => { value = v; });

    await act(async () => {
      await value.joinVoiceChannel('community-1', 'channel-voice-1');
    });

    expect(value.activeChannelId).toBe('channel-voice-1');
    expect(value.activeCommunityId).toBe('community-1');
  });

  test('joinVoiceChannel calls createCallRoom with channel ID', async () => {
    let value: any;
    renderWithProvider((v) => { value = v; });

    await act(async () => {
      await value.joinVoiceChannel('community-1', 'channel-voice-1');
    });

    expect(mockService.createCallRoom).toHaveBeenCalledWith('channel-voice-1');
  });

  test('joinVoiceChannel initializes GroupCallManager with audio', async () => {
    let value: any;
    renderWithProvider((v) => { value = v; });

    await act(async () => {
      await value.joinVoiceChannel('community-1', 'channel-voice-1');
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith(false); // audio only
  });

  test('joinVoiceChannel broadcasts voiceChannelJoined event', async () => {
    let value: any;
    renderWithProvider((v) => { value = v; });

    await act(async () => {
      await value.joinVoiceChannel('community-1', 'channel-voice-1');
    });

    expect(mockService.dispatchCommunityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'voiceChannelJoined',
        communityId: 'community-1',
        channelId: 'channel-voice-1',
        memberDid: 'did:key:testuser',
      }),
    );
  });

  test('leaveVoiceChannel resets state', async () => {
    let value: any;
    renderWithProvider((v) => { value = v; });

    // Join first
    await act(async () => {
      await value.joinVoiceChannel('community-1', 'channel-voice-1');
    });

    expect(value.activeChannelId).toBe('channel-voice-1');

    // Leave
    act(() => {
      value.leaveVoiceChannel();
    });

    expect(value.activeChannelId).toBeNull();
    expect(value.activeCommunityId).toBeNull();
    expect(value.participants).toEqual([]);
    expect(value.isMuted).toBe(false);
    expect(value.isDeafened).toBe(false);
  });

  test('leaveVoiceChannel closes GroupCallManager', async () => {
    let value: any;
    renderWithProvider((v) => { value = v; });

    await act(async () => {
      await value.joinVoiceChannel('community-1', 'channel-voice-1');
    });

    act(() => {
      value.leaveVoiceChannel();
    });

    expect(mockClose).toHaveBeenCalled();
  });

  test('leaveVoiceChannel broadcasts voiceChannelLeft event', async () => {
    let value: any;
    renderWithProvider((v) => { value = v; });

    await act(async () => {
      await value.joinVoiceChannel('community-1', 'channel-voice-1');
    });

    mockService.dispatchCommunityEvent.mockClear();

    act(() => {
      value.leaveVoiceChannel();
    });

    expect(mockService.dispatchCommunityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'voiceChannelLeft',
        communityId: 'community-1',
        channelId: 'channel-voice-1',
        memberDid: 'did:key:testuser',
      }),
    );
  });

  test('toggleMute calls GroupCallManager.toggleMute', async () => {
    let value: any;
    renderWithProvider((v) => { value = v; });

    await act(async () => {
      await value.joinVoiceChannel('community-1', 'channel-voice-1');
    });

    act(() => {
      value.toggleMute();
    });

    expect(mockToggleMute).toHaveBeenCalled();
    expect(value.isMuted).toBe(true);
  });

  test('toggleDeafen sets isDeafened and auto-mutes', async () => {
    let value: any;
    renderWithProvider((v) => { value = v; });

    await act(async () => {
      await value.joinVoiceChannel('community-1', 'channel-voice-1');
    });

    act(() => {
      value.toggleDeafen();
    });

    expect(value.isDeafened).toBe(true);
    expect(value.isMuted).toBe(true);
  });

  test('joining a new channel while already in one leaves the old channel first', async () => {
    let value: any;
    renderWithProvider((v) => { value = v; });

    // Join first channel
    await act(async () => {
      await value.joinVoiceChannel('community-1', 'channel-1');
    });

    expect(value.activeChannelId).toBe('channel-1');
    expect(mockClose).not.toHaveBeenCalled();

    // Join second channel — should leave first
    await act(async () => {
      await value.joinVoiceChannel('community-1', 'channel-2');
    });

    expect(value.activeChannelId).toBe('channel-2');
    // GroupCallManager.close should have been called for the first channel
    expect(mockClose).toHaveBeenCalled();
  });

  test('subscribes to call events on mount', () => {
    renderWithProvider(() => {});
    expect(mockService.onCallEvent).toHaveBeenCalled();
  });

  test('subscribes to community events on mount', () => {
    renderWithProvider(() => {});
    expect(mockService.onCommunityEvent).toHaveBeenCalled();
  });

  test('joinVoiceChannel resets mute/deafen state', async () => {
    let value: any;
    renderWithProvider((v) => { value = v; });

    // Join and mute
    await act(async () => {
      await value.joinVoiceChannel('community-1', 'channel-1');
    });

    act(() => {
      value.toggleMute();
    });

    expect(value.isMuted).toBe(true);

    // Leave
    act(() => {
      value.leaveVoiceChannel();
    });

    // Join again — should be unmuted
    await act(async () => {
      await value.joinVoiceChannel('community-1', 'channel-2');
    });

    expect(value.isMuted).toBe(false);
    expect(value.isDeafened).toBe(false);
  });

  test('joinVoiceChannel handles getUserMedia failure gracefully', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('No microphone'));

    let value: any;
    renderWithProvider((v) => { value = v; });

    await act(async () => {
      await value.joinVoiceChannel('community-1', 'channel-1');
    });

    // Should reset state on failure
    expect(value.activeChannelId).toBeNull();
    expect(value.activeCommunityId).toBeNull();
    expect(value.isConnecting).toBe(false);
  });

  test('useVoiceChannel throws when used outside provider', () => {
    // Use a custom error boundary to catch the error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      function Bare() {
        useVoiceChannel();
        return null;
      }
      render(<Bare />);
    }).toThrow('useVoiceChannel must be used within a VoiceChannelProvider');

    spy.mockRestore();
  });
});
