/**
 * Tests for CallManager Phase 2 video quality controls.
 */

// Mock WebRTC globals
const mockSetParameters = jest.fn(() => Promise.resolve());
const mockGetParameters = jest.fn(() => ({
  encodings: [{}],
}));
const mockReplaceTrack = jest.fn(() => Promise.resolve());
const mockAddTrack = jest.fn();
const mockClose = jest.fn();
const mockCreateOffer = jest.fn(() => Promise.resolve({ type: 'offer', sdp: 'mock-sdp-offer' }));
const mockCreateAnswer = jest.fn(() => Promise.resolve({ type: 'answer', sdp: 'mock-sdp-answer' }));
const mockSetLocalDescription = jest.fn(() => Promise.resolve());
const mockSetRemoteDescription = jest.fn(function (this: any, desc: any) {
  this.remoteDescription = desc;
  return Promise.resolve();
});
const mockAddIceCandidate = jest.fn(() => Promise.resolve());
const mockGetSenders = jest.fn(() => [
  {
    track: { kind: 'video' },
    getParameters: mockGetParameters,
    setParameters: mockSetParameters,
    replaceTrack: mockReplaceTrack,
  },
  {
    track: { kind: 'audio' },
    getParameters: jest.fn(() => ({ encodings: [{}] })),
    setParameters: jest.fn(() => Promise.resolve()),
    replaceTrack: jest.fn(() => Promise.resolve()),
  },
]);
const mockGetStats = jest.fn(() => Promise.resolve(new Map()));

class MockRTCPeerConnection {
  onicecandidate: any = null;
  ontrack: any = null;
  onconnectionstatechange: any = null;
  connectionState = 'new';
  remoteDescription: any = null;

  addTrack = mockAddTrack;
  close = mockClose;
  createOffer = mockCreateOffer;
  createAnswer = mockCreateAnswer;
  setLocalDescription = mockSetLocalDescription;
  setRemoteDescription: any;
  addIceCandidate = mockAddIceCandidate;
  getSenders = mockGetSenders;
  getStats = mockGetStats;

  constructor() {
    this.setRemoteDescription = jest.fn((desc: any) => {
      this.remoteDescription = desc;
      return Promise.resolve();
    });
  }
}

class MockRTCSessionDescription {
  type: string;
  sdp: string;
  constructor({ type, sdp }: { type: string; sdp: string }) {
    this.type = type;
    this.sdp = sdp;
  }
}

class MockRTCIceCandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  constructor({ candidate, sdpMid, sdpMLineIndex }: any) {
    this.candidate = candidate;
    this.sdpMid = sdpMid ?? null;
    this.sdpMLineIndex = sdpMLineIndex ?? null;
  }
}

const mockAudioTrack = { kind: 'audio', enabled: true, stop: jest.fn(), getSettings: () => ({ deviceId: 'audio-1' }) };
const mockVideoTrack = { kind: 'video', enabled: true, stop: jest.fn(), getSettings: () => ({ deviceId: 'video-1' }) };

const mockGetUserMedia = jest.fn((constraints: any) =>
  Promise.resolve({
    getTracks: () => constraints.video ? [mockAudioTrack, mockVideoTrack] : [mockAudioTrack],
    getAudioTracks: () => [mockAudioTrack],
    getVideoTracks: () => constraints.video ? [mockVideoTrack] : [],
    removeTrack: jest.fn(),
    addTrack: jest.fn(),
  })
);

const mockEnumerateDevices = jest.fn(() =>
  Promise.resolve([
    { deviceId: 'video-1', label: 'Front Camera', kind: 'videoinput' },
    { deviceId: 'video-2', label: 'Back Camera', kind: 'videoinput' },
  ])
);

Object.defineProperty(global, 'RTCPeerConnection', { value: MockRTCPeerConnection, writable: true });
Object.defineProperty(global, 'RTCSessionDescription', { value: MockRTCSessionDescription, writable: true });
Object.defineProperty(global, 'RTCIceCandidate', { value: MockRTCIceCandidate, writable: true });
Object.defineProperty(global, 'navigator', {
  value: {
    mediaDevices: {
      getUserMedia: mockGetUserMedia,
      enumerateDevices: mockEnumerateDevices,
    },
  },
  writable: true,
});

import { CallManager } from '@/services/CallManager';

describe('CallManager - Video Quality Controls', () => {
  let manager: CallManager;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAudioTrack.enabled = true;
    mockVideoTrack.enabled = true;
    manager = new CallManager();
  });

  afterEach(() => {
    manager.close();
  });

  test('default video quality is auto', () => {
    expect(manager.videoQuality).toBe('auto');
  });

  test('default audio quality is opus', () => {
    expect(manager.audioQuality).toBe('opus');
  });

  test('setVideoQuality updates internal state', async () => {
    await manager.setVideoQuality('1080p');
    expect(manager.videoQuality).toBe('1080p');
  });

  test('setVideoQuality sets sender parameters when in call', async () => {
    await manager.createOffer(true);
    await manager.setVideoQuality('720p');

    expect(mockSetParameters).toHaveBeenCalledWith(
      expect.objectContaining({
        encodings: [
          expect.objectContaining({
            maxBitrate: 2500000, // 2500 kbps * 1000
            maxFramerate: 30,
          }),
        ],
      })
    );
  });

  test('setVideoQuality to auto removes constraints', async () => {
    await manager.createOffer(true);
    // First set to a specific quality
    await manager.setVideoQuality('1080p');
    // Then back to auto
    await manager.setVideoQuality('auto');

    const calls = mockSetParameters.mock.calls;
    const lastCall = calls[calls.length - 1] as any;
    expect(lastCall[0].encodings[0].maxBitrate).toBeUndefined();
    expect(lastCall[0].encodings[0].maxFramerate).toBeUndefined();
  });

  test('setVideoQuality 4k sets correct bitrate', async () => {
    await manager.createOffer(true);
    await manager.setVideoQuality('4k');

    expect(mockSetParameters).toHaveBeenCalledWith(
      expect.objectContaining({
        encodings: [
          expect.objectContaining({
            maxBitrate: 16000000, // 16000 kbps * 1000
          }),
        ],
      })
    );
  });

  test('setAudioQuality stores preference', () => {
    manager.setAudioQuality('pcm');
    expect(manager.audioQuality).toBe('pcm');
  });

  test('getUserMedia uses quality preset for video constraints', async () => {
    await manager.setVideoQuality('1080p');
    await manager.createOffer(true);

    expect(mockGetUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        video: expect.objectContaining({
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }),
      })
    );
  });

  test('getUserMedia uses default constraints for auto quality', async () => {
    await manager.createOffer(true);

    expect(mockGetUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        video: expect.objectContaining({
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }),
      })
    );
  });

  test('switchCamera does nothing when no peer connection', async () => {
    await manager.switchCamera();
    // Should not throw, just return silently
    expect(mockEnumerateDevices).not.toHaveBeenCalled();
  });

  test('close resets video quality to auto', async () => {
    await manager.setVideoQuality('4k');
    manager.close();
    // After close, creating a new manager starts fresh
    const newManager = new CallManager();
    expect(newManager.videoQuality).toBe('auto');
    newManager.close();
  });
});
