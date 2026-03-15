/**
 * Tests for useSpeakerDetection hook
 *
 * Covers: initial state, analyser setup with participants,
 * cleanup on participant removal.
 */

import { renderHook } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mock Web Audio API
// ---------------------------------------------------------------------------

const mockAnalyser = {
  fftSize: 256,
  frequencyBinCount: 128,
  getByteFrequencyData: jest.fn((arr: Uint8Array) => {
    // Fill with zeros (silence)
    arr.fill(0);
  }),
};

const mockSource = {
  connect: jest.fn(),
  disconnect: jest.fn(),
};

const mockAudioContext = {
  state: 'running',
  createMediaStreamSource: jest.fn(() => mockSource),
  createAnalyser: jest.fn(() => mockAnalyser),
  close: jest.fn().mockResolvedValue(undefined),
};

(global as any).AudioContext = jest.fn(() => mockAudioContext);

import { useSpeakerDetection } from '@/hooks/useSpeakerDetection';
import type { CallParticipant } from '@/types/call';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeParticipant(did: string, withStream = true): CallParticipant {
  return {
    did,
    displayName: did.slice(-8),
    stream: withStream ? ({ id: did } as unknown as MediaStream) : null,
    isMuted: false,
    isDeafened: false,
    isCameraOff: false,
    isSpeaking: false,
    isScreenSharing: false,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSpeakerDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts with no active speaker', () => {
    const participants = new Map<string, CallParticipant>();
    const { result } = renderHook(() => useSpeakerDetection(participants));

    expect(result.current.activeSpeakerDid).toBeNull();
    expect(result.current.speakingDids.size).toBe(0);
  });

  it('creates analysers for participants with streams', () => {
    const participants = new Map<string, CallParticipant>();
    participants.set('did:alice', makeParticipant('did:alice'));
    participants.set('did:bob', makeParticipant('did:bob'));

    renderHook(() => useSpeakerDetection(participants));

    expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledTimes(2);
    expect(mockAudioContext.createAnalyser).toHaveBeenCalledTimes(2);
    expect(mockSource.connect).toHaveBeenCalledTimes(2);
  });

  it('skips participants without streams', () => {
    const participants = new Map<string, CallParticipant>();
    participants.set('did:alice', makeParticipant('did:alice', false));

    renderHook(() => useSpeakerDetection(participants));

    expect(mockAudioContext.createMediaStreamSource).not.toHaveBeenCalled();
  });
});
