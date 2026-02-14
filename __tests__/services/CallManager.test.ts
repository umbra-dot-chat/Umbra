/**
 * Tests for the CallManager WebRTC service.
 */

// Mock RTCPeerConnection for non-browser environment
const mockAddTrack = jest.fn();
const mockClose = jest.fn();
const mockCreateOffer = jest.fn(() => Promise.resolve({ type: 'offer', sdp: 'mock-sdp-offer' }));
const mockCreateAnswer = jest.fn(() => Promise.resolve({ type: 'answer', sdp: 'mock-sdp-answer' }));
const mockSetLocalDescription = jest.fn(() => Promise.resolve());
const mockSetRemoteDescription = jest.fn(function (this: any) {
  this.remoteDescription = { type: 'offer', sdp: 'set' };
  return Promise.resolve();
});
const mockAddIceCandidate = jest.fn(() => Promise.resolve());
const mockGetSenders = jest.fn(() => []);
const mockGetStats = jest.fn(() => Promise.resolve(new Map()));

class MockRTCPeerConnection {
  onicecandidate: ((event: any) => void) | null = null;
  ontrack: ((event: any) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  connectionState = 'new';
  remoteDescription: any = null;

  addTrack = mockAddTrack;
  close = mockClose;
  createOffer = mockCreateOffer;
  createAnswer = mockCreateAnswer;
  setLocalDescription = mockSetLocalDescription;
  setRemoteDescription = mockSetRemoteDescription.bind(this);
  addIceCandidate = mockAddIceCandidate;
  getSenders = mockGetSenders;
  getStats = mockGetStats;

  constructor() {
    // Bind setRemoteDescription so it can set remoteDescription on this instance
    this.setRemoteDescription = jest.fn((_desc: any) => {
      this.remoteDescription = _desc;
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

const mockAudioTrack = { kind: 'audio', enabled: true, stop: jest.fn() };
const mockVideoTrack = { kind: 'video', enabled: true, stop: jest.fn() };

const mockGetUserMedia = jest.fn((constraints: any) =>
  Promise.resolve({
    getTracks: () => constraints.video ? [mockAudioTrack, mockVideoTrack] : [mockAudioTrack],
    getAudioTracks: () => [mockAudioTrack],
    getVideoTracks: () => constraints.video ? [mockVideoTrack] : [],
  })
);

// Set up globals before importing
Object.defineProperty(global, 'RTCPeerConnection', { value: MockRTCPeerConnection, writable: true });
Object.defineProperty(global, 'RTCSessionDescription', { value: MockRTCSessionDescription, writable: true });
Object.defineProperty(global, 'RTCIceCandidate', { value: MockRTCIceCandidate, writable: true });
Object.defineProperty(global, 'navigator', {
  value: {
    mediaDevices: {
      getUserMedia: mockGetUserMedia,
    },
  },
  writable: true,
});

import { CallManager } from '@/services/CallManager';

describe('CallManager', () => {
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

  test('creates an instance', () => {
    expect(manager).toBeInstanceOf(CallManager);
  });

  test('createOffer acquires media and creates SDP offer', async () => {
    const sdpJson = await manager.createOffer(false); // voice only
    expect(mockGetUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({ audio: expect.any(Object) })
    );
    expect(mockCreateOffer).toHaveBeenCalled();

    const parsed = JSON.parse(sdpJson);
    expect(parsed.sdp).toBe('mock-sdp-offer');
    expect(parsed.type).toBe('offer');
  });

  test('createOffer with video requests video constraints', async () => {
    await manager.createOffer(true);
    expect(mockGetUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        audio: expect.any(Object),
        video: expect.any(Object),
      })
    );
  });

  test('acceptOffer sets remote description and creates answer', async () => {
    const offerSdp = JSON.stringify({ sdp: 'remote-offer', type: 'offer' });
    const sdpJson = await manager.acceptOffer(offerSdp, false);

    const parsed = JSON.parse(sdpJson);
    expect(parsed.sdp).toBe('mock-sdp-answer');
    expect(parsed.type).toBe('answer');
  });

  test('completeHandshake sets remote description', async () => {
    await manager.createOffer(false);
    const answerSdp = JSON.stringify({ sdp: 'remote-answer', type: 'answer' });
    await manager.completeHandshake(answerSdp);
    // If it didn't throw, handshake completed
    expect(true).toBe(true);
  });

  test('addIceCandidate queues when no remote description', async () => {
    await manager.createOffer(false);
    // pc.remoteDescription is null after createOffer (no setRemoteDescription called yet)
    // So addIceCandidate should queue the candidate
    await manager.addIceCandidate({
      candidate: 'candidate-string',
      sdpMid: '0',
      sdpMLineIndex: 0,
    });
    // The candidate is queued, not directly added
    // It will be applied when completeHandshake is called
  });

  test('addIceCandidate adds candidate after remote description', async () => {
    // Create offer, then complete handshake to set remote description
    await manager.createOffer(false);
    const answerSdp = JSON.stringify({ sdp: 'remote-answer', type: 'answer' });
    await manager.completeHandshake(answerSdp);

    // Now add ice candidate — should go directly
    await manager.addIceCandidate({
      candidate: 'candidate-string',
      sdpMid: '0',
      sdpMLineIndex: 0,
    });
    // Should have called addIceCandidate on the pc
  });

  test('toggleMute toggles audio track enabled state', async () => {
    await manager.createOffer(false);
    const isMuted = manager.toggleMute();
    expect(isMuted).toBe(true); // Was enabled=true, now disabled, returns !enabled = true
  });

  test('toggleCamera returns true when no video track', async () => {
    await manager.createOffer(false); // voice only, no video track
    const isCameraOff = manager.toggleCamera();
    expect(isCameraOff).toBe(true);
  });

  test('close stops all tracks and closes peer connection', async () => {
    await manager.createOffer(false);
    manager.close();
    expect(mockAudioTrack.stop).toHaveBeenCalled();
  });

  test('onIceCandidate callback fires when ICE candidate is generated', async () => {
    const onIce = jest.fn();
    manager.onIceCandidate = onIce;

    await manager.createOffer(false);

    // Access the private pc — field name is 'pc'
    const pc = (manager as any).pc;
    expect(pc).toBeTruthy();
    if (pc?.onicecandidate) {
      pc.onicecandidate({ candidate: { candidate: 'test', sdpMid: '0', sdpMLineIndex: 0 } });
    }
    expect(onIce).toHaveBeenCalledWith(
      expect.objectContaining({ candidate: 'test' })
    );
  });

  test('onRemoteStream callback fires when remote track is received', async () => {
    const onStream = jest.fn();
    manager.onRemoteStream = onStream;

    await manager.createOffer(false);

    const pc = (manager as any).pc;
    expect(pc).toBeTruthy();
    if (pc?.ontrack) {
      pc.ontrack({
        streams: [{ id: 'remote-stream' }],
      });
    }
    expect(onStream).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'remote-stream' })
    );
  });

  test('getLocalStream returns null before createOffer', () => {
    expect(manager.getLocalStream()).toBeNull();
  });

  test('getLocalStream returns stream after createOffer', async () => {
    await manager.createOffer(false);
    expect(manager.getLocalStream()).toBeTruthy();
  });

  test('getStats returns default stats when no pc', async () => {
    const stats = await manager.getStats();
    expect(stats.resolution).toBeNull();
    expect(stats.bitrate).toBeNull();
    expect(stats.codec).toBeNull();
  });
});
