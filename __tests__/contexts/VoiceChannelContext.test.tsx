/**
 * VoiceChannelContext — Unit Tests
 *
 * Tests for voice channel state management:
 *   - Initial idle state
 *   - Mute/deafen toggles
 *   - Provider requirement
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/services/GroupCallManager', () => ({
  GroupCallManager: jest.fn().mockImplementation(() => ({
    getUserMedia: jest.fn().mockResolvedValue(undefined),
    getLocalStream: jest.fn(() => null),
    close: jest.fn(),
    toggleMute: jest.fn(() => true),
    createOfferForPeer: jest.fn().mockResolvedValue('mock-offer'),
    acceptOfferFromPeer: jest.fn().mockResolvedValue('mock-answer'),
    completeHandshakeForPeer: jest.fn().mockResolvedValue(undefined),
    addIceCandidateForPeer: jest.fn().mockResolvedValue(undefined),
    removePeer: jest.fn(),
    getAllAudioLevels: jest.fn(() => new Map()),
    setupPeerAudioAnalysis: jest.fn(),
    onIceCandidate: null,
    onRemoteStream: null,
    onRemoteStreamRemoved: null,
    onConnectionStateChange: null,
  })),
}));

jest.mock('@/services/VoiceStreamBridge', () => ({
  VoiceStreamBridge: {
    setLocalStream: jest.fn(),
    setActive: jest.fn(),
    clear: jest.fn(),
    setPeerStream: jest.fn(),
    removePeerStream: jest.fn(),
    setSignalSender: jest.fn(),
    emitSignal: jest.fn(),
    getLocalStream: jest.fn(),
  },
}));

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    service: {
      onCallEvent: jest.fn(() => jest.fn()),
      onCommunityEvent: jest.fn(() => jest.fn()),
      createCallRoom: jest.fn(),
      joinCallRoom: jest.fn(),
      leaveCallRoom: jest.fn(),
      sendCallRoomSignal: jest.fn(),
      getChannel: jest.fn().mockResolvedValue({ name: 'general' }),
      broadcastCommunityEvent: jest.fn().mockResolvedValue(undefined),
      dispatchCommunityEvent: jest.fn(),
      getRelayWs: jest.fn(() => null),
    },
    isReady: true,
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    identity: { did: 'did:key:z6MkVoiceUser', displayName: 'VoiceUser' },
    isAuthenticated: true,
  }),
}));

jest.mock('@/contexts/SoundContext', () => ({
  useSound: () => ({
    playSound: jest.fn(),
    masterVolume: 0.8,
    muted: false,
    preferencesLoaded: true,
  }),
}));

import {
  VoiceChannelProvider,
  useVoiceChannel,
} from '@/contexts/VoiceChannelContext';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <VoiceChannelProvider>{children}</VoiceChannelProvider>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VoiceChannelContext — Initial state', () => {
  it('activeChannelId starts as null', () => {
    const { result } = renderHook(() => useVoiceChannel(), { wrapper });
    expect(result.current.activeChannelId).toBeNull();
  });

  it('activeCommunityId starts as null', () => {
    const { result } = renderHook(() => useVoiceChannel(), { wrapper });
    expect(result.current.activeCommunityId).toBeNull();
  });

  it('roomId starts as null', () => {
    const { result } = renderHook(() => useVoiceChannel(), { wrapper });
    expect(result.current.roomId).toBeNull();
  });

  it('participants starts as empty array', () => {
    const { result } = renderHook(() => useVoiceChannel(), { wrapper });
    expect(result.current.participants).toEqual([]);
  });

  it('isMuted starts as false', () => {
    const { result } = renderHook(() => useVoiceChannel(), { wrapper });
    expect(result.current.isMuted).toBe(false);
  });

  it('isDeafened starts as false', () => {
    const { result } = renderHook(() => useVoiceChannel(), { wrapper });
    expect(result.current.isDeafened).toBe(false);
  });

  it('isConnecting starts as false', () => {
    const { result } = renderHook(() => useVoiceChannel(), { wrapper });
    expect(result.current.isConnecting).toBe(false);
  });

  it('voiceParticipants starts as empty Map', () => {
    const { result } = renderHook(() => useVoiceChannel(), { wrapper });
    expect(result.current.voiceParticipants.size).toBe(0);
  });

  it('speakingDids starts as empty Set', () => {
    const { result } = renderHook(() => useVoiceChannel(), { wrapper });
    expect(result.current.speakingDids.size).toBe(0);
  });

  it('activeChannelName starts as null', () => {
    const { result } = renderHook(() => useVoiceChannel(), { wrapper });
    expect(result.current.activeChannelName).toBeNull();
  });
});

describe('VoiceChannelContext — Provider requirement', () => {
  it('useVoiceChannel throws when used outside VoiceChannelProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useVoiceChannel());
    }).toThrow('useVoiceChannel must be used within a VoiceChannelProvider');
    spy.mockRestore();
  });
});
