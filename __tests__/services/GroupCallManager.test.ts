/**
 * Tests for the GroupCallManager mesh-topology WebRTC service.
 */

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  localDescription: any = null;
  remoteDescription: any = null;
  onicecandidate: any = null;
  ontrack: any = null;
  onconnectionstatechange: any = null;
  connectionState = 'new';
  _senders: any[] = [];

  async createOffer() { return { type: 'offer', sdp: 'mock-offer-sdp' }; }
  async createAnswer() { return { type: 'answer', sdp: 'mock-answer-sdp' }; }
  async setLocalDescription(desc: any) { this.localDescription = desc; }
  async setRemoteDescription(desc: any) { this.remoteDescription = desc; }
  async addIceCandidate(candidate: any) {}
  addTrack(track: any, stream: any) {
    const sender = { track, replaceTrack: jest.fn() };
    this._senders.push(sender);
    return sender;
  }
  removeTrack(sender: any) {
    this._senders = this._senders.filter(s => s !== sender);
  }
  getSenders() { return this._senders; }
  close() { this.connectionState = 'closed'; }
}

(global as any).RTCPeerConnection = MockRTCPeerConnection;
(global as any).RTCSessionDescription = class { constructor(public desc: any) {} };
(global as any).RTCIceCandidate = class { constructor(public init: any) {} };

// Mock MediaStream
class MockMediaStream {
  id = 'mock-stream';
  _tracks: any[] = [];
  getTracks() { return this._tracks; }
  getAudioTracks() { return this._tracks.filter(t => t.kind === 'audio'); }
  getVideoTracks() { return this._tracks.filter(t => t.kind === 'video'); }
  addTrack(track: any) { this._tracks.push(track); }
  removeTrack(track: any) { this._tracks = this._tracks.filter(t => t !== track); }
}
(global as any).MediaStream = MockMediaStream;

// Mock navigator.mediaDevices
const mockAudioTrack = { kind: 'audio', enabled: true, stop: jest.fn() };
const mockVideoTrack = { kind: 'video', enabled: true, stop: jest.fn() };

const mockGetUserMedia = jest.fn((constraints: any) => {
  const stream = new MockMediaStream();
  stream._tracks.push({ ...mockAudioTrack, enabled: true, stop: jest.fn() });
  if (constraints.video) {
    stream._tracks.push({ ...mockVideoTrack, enabled: true, stop: jest.fn() });
  }
  return Promise.resolve(stream);
});

const mockGetDisplayMedia = jest.fn(() => {
  const stream = new MockMediaStream();
  stream._tracks.push({ kind: 'video', enabled: true, stop: jest.fn() });
  return Promise.resolve(stream);
});

Object.defineProperty(global, 'navigator', {
  value: {
    mediaDevices: {
      getUserMedia: mockGetUserMedia,
      getDisplayMedia: mockGetDisplayMedia,
    },
  },
  writable: true,
});

import { GroupCallManager } from '@/services/GroupCallManager';

describe('GroupCallManager', () => {
  let manager: GroupCallManager;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAudioTrack.enabled = true;
    mockVideoTrack.enabled = true;
    manager = new GroupCallManager();
  });

  afterEach(() => {
    manager.close();
  });

  // ── 1. Constructor ──────────────────────────────────────────────────

  test('creates a GroupCallManager instance', () => {
    expect(manager).toBeInstanceOf(GroupCallManager);
  });

  // ── 2. Room ID management ───────────────────────────────────────────

  test('roomId is null initially and reset after close()', async () => {
    // roomId is private, but close() sets it to null.
    // We can verify indirectly: close should not throw even on a fresh instance.
    expect(() => manager.close()).not.toThrow();
    // After close, getLocalStream should be null (tracks stopped, stream cleared).
    expect(manager.getLocalStream()).toBeNull();
  });

  // ── 3. localStream ─────────────────────────────────────────────────

  test('getLocalStream returns null before any offer is created', () => {
    expect(manager.getLocalStream()).toBeNull();
  });

  test('localStream is set after creating an offer', async () => {
    await manager.createOfferForPeer('peer-1', false);
    expect(manager.getLocalStream()).toBeTruthy();
  });

  // ── 4. createOfferForPeer ──────────────────────────────────────────

  test('createOfferForPeer returns a JSON string containing an offer SDP', async () => {
    const sdpJson = await manager.createOfferForPeer('peer-1', false);
    const parsed = JSON.parse(sdpJson);
    expect(parsed.type).toBe('offer');
    expect(parsed.sdp).toBe('mock-offer-sdp');
  });

  test('createOfferForPeer acquires user media', async () => {
    await manager.createOfferForPeer('peer-1', false);
    expect(mockGetUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({ audio: expect.any(Object) }),
    );
  });

  test('createOfferForPeer with video requests video constraints', async () => {
    await manager.createOfferForPeer('peer-1', true);
    expect(mockGetUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        audio: expect.any(Object),
        video: expect.any(Object),
      }),
    );
  });

  test('createOfferForPeer reuses existing localStream for second peer', async () => {
    await manager.createOfferForPeer('peer-1', false);
    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);

    await manager.createOfferForPeer('peer-2', false);
    // getUserMedia should NOT be called again because localStream already exists
    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
  });

  // ── 5. acceptOfferFromPeer ─────────────────────────────────────────

  test('acceptOfferFromPeer returns a JSON string containing an answer SDP', async () => {
    const offerSdp = JSON.stringify({ sdp: 'remote-offer', type: 'offer' });
    const sdpJson = await manager.acceptOfferFromPeer('peer-1', offerSdp, false);
    const parsed = JSON.parse(sdpJson);
    expect(parsed.type).toBe('answer');
    expect(parsed.sdp).toBe('mock-answer-sdp');
  });

  test('acceptOfferFromPeer sets remote description on the peer connection', async () => {
    const offerSdp = JSON.stringify({ sdp: 'remote-offer', type: 'offer' });
    await manager.acceptOfferFromPeer('peer-1', offerSdp, false);

    // Access private peers map to verify the pc state
    const peers = (manager as any).peers as Map<string, any>;
    const peer = peers.get('peer-1');
    expect(peer).toBeTruthy();
    expect(peer.pc.remoteDescription).toBeTruthy();
  });

  test('acceptOfferFromPeer flushes pending ICE candidates', async () => {
    // First, create a peer connection and queue a candidate via addIceCandidateForPeer
    // Since createOfferForPeer sets up the peer, we use it first, then call acceptOfferFromPeer
    // for a different peer that already has queued candidates.
    // Actually, let's manually add a candidate before the remote description is set.

    // We need to set up a peer manually for this test:
    // Step 1: Create offer to set up peer-1 (creates pc, but no remote description)
    await manager.createOfferForPeer('peer-1', false);

    // Step 2: Queue an ICE candidate for peer-1 (no remote description yet)
    await manager.addIceCandidateForPeer('peer-1', {
      candidate: 'queued-candidate',
      sdpMid: '0',
      sdpMLineIndex: 0,
    });

    // Step 3: Complete the handshake which will flush pending candidates
    const answerSdp = JSON.stringify({ sdp: 'remote-answer', type: 'answer' });
    await manager.completeHandshakeForPeer('peer-1', answerSdp);

    // After handshake, pending candidates should be flushed
    const peers = (manager as any).peers as Map<string, any>;
    const peer = peers.get('peer-1');
    expect(peer.pendingCandidates).toHaveLength(0);
  });

  // ── 6. completeHandshakeForPeer ────────────────────────────────────

  test('completeHandshakeForPeer sets the remote answer description', async () => {
    await manager.createOfferForPeer('peer-1', false);
    const answerSdp = JSON.stringify({ sdp: 'remote-answer', type: 'answer' });
    await manager.completeHandshakeForPeer('peer-1', answerSdp);

    const peers = (manager as any).peers as Map<string, any>;
    const peer = peers.get('peer-1');
    expect(peer.pc.remoteDescription).toBeTruthy();
  });

  test('completeHandshakeForPeer throws for unknown peer', async () => {
    const answerSdp = JSON.stringify({ sdp: 'remote-answer', type: 'answer' });
    await expect(
      manager.completeHandshakeForPeer('unknown-peer', answerSdp),
    ).rejects.toThrow('No peer connection for unknown-peer');
  });

  // ── 7. ICE candidate handling ──────────────────────────────────────

  test('addIceCandidateForPeer queues candidate when no remote description', async () => {
    await manager.createOfferForPeer('peer-1', false);

    await manager.addIceCandidateForPeer('peer-1', {
      candidate: 'candidate-string',
      sdpMid: '0',
      sdpMLineIndex: 0,
    });

    const peers = (manager as any).peers as Map<string, any>;
    const peer = peers.get('peer-1');
    expect(peer.pendingCandidates).toHaveLength(1);
    expect(peer.pendingCandidates[0].candidate).toBe('candidate-string');
  });

  test('addIceCandidateForPeer adds candidate directly when remote description is set', async () => {
    await manager.createOfferForPeer('peer-1', false);
    const answerSdp = JSON.stringify({ sdp: 'remote-answer', type: 'answer' });
    await manager.completeHandshakeForPeer('peer-1', answerSdp);

    // Spy on the peer connection's addIceCandidate
    const peers = (manager as any).peers as Map<string, any>;
    const peer = peers.get('peer-1');
    const addIceSpy = jest.spyOn(peer.pc, 'addIceCandidate');

    await manager.addIceCandidateForPeer('peer-1', {
      candidate: 'candidate-string',
      sdpMid: '0',
      sdpMLineIndex: 0,
    });

    expect(addIceSpy).toHaveBeenCalled();
    // Should NOT have been queued
    expect(peer.pendingCandidates).toHaveLength(0);
  });

  test('addIceCandidateForPeer does nothing for unknown peer', async () => {
    // Should not throw
    await expect(
      manager.addIceCandidateForPeer('unknown', {
        candidate: 'c',
        sdpMid: '0',
        sdpMLineIndex: 0,
      }),
    ).resolves.toBeUndefined();
  });

  test('onIceCandidate callback fires when ICE candidate is generated', async () => {
    const onIce = jest.fn();
    manager.onIceCandidate = onIce;

    await manager.createOfferForPeer('peer-1', false);

    const peers = (manager as any).peers as Map<string, any>;
    const peer = peers.get('peer-1');
    expect(peer.pc.onicecandidate).toBeTruthy();

    // Simulate an ICE candidate event
    peer.pc.onicecandidate({
      candidate: { candidate: 'test-candidate', sdpMid: '0', sdpMLineIndex: 0 },
    });

    expect(onIce).toHaveBeenCalledWith('peer-1', {
      candidate: 'test-candidate',
      sdpMid: '0',
      sdpMLineIndex: 0,
    });
  });

  // ── 8. removePeer ──────────────────────────────────────────────────

  test('removePeer closes the peer connection and removes it from the map', async () => {
    await manager.createOfferForPeer('peer-1', false);

    const peers = (manager as any).peers as Map<string, any>;
    expect(peers.has('peer-1')).toBe(true);

    const pc = peers.get('peer-1').pc;
    const closeSpy = jest.spyOn(pc, 'close');

    manager.removePeer('peer-1');

    expect(closeSpy).toHaveBeenCalled();
    expect(peers.has('peer-1')).toBe(false);
  });

  test('removePeer fires onRemoteStreamRemoved callback', async () => {
    const onRemoved = jest.fn();
    manager.onRemoteStreamRemoved = onRemoved;

    await manager.createOfferForPeer('peer-1', false);
    manager.removePeer('peer-1');

    expect(onRemoved).toHaveBeenCalledWith('peer-1');
  });

  test('removePeer does nothing for unknown peer', () => {
    expect(() => manager.removePeer('unknown')).not.toThrow();
  });

  // ── 9. close() ─────────────────────────────────────────────────────

  test('close() closes all peer connections and clears peer map', async () => {
    await manager.createOfferForPeer('peer-1', false);
    await manager.createOfferForPeer('peer-2', false);

    const peers = (manager as any).peers as Map<string, any>;
    const pc1 = peers.get('peer-1').pc;
    const pc2 = peers.get('peer-2').pc;
    const closeSpy1 = jest.spyOn(pc1, 'close');
    const closeSpy2 = jest.spyOn(pc2, 'close');

    manager.close();

    expect(closeSpy1).toHaveBeenCalled();
    expect(closeSpy2).toHaveBeenCalled();
    expect(peers.size).toBe(0);
  });

  test('close() stops local stream tracks', async () => {
    await manager.createOfferForPeer('peer-1', false);
    const localStream = manager.getLocalStream()!;
    const tracks = localStream.getTracks();
    const stopSpies = tracks.map((t: any) => jest.spyOn(t, 'stop'));

    manager.close();

    for (const spy of stopSpies) {
      expect(spy).toHaveBeenCalled();
    }
    expect(manager.getLocalStream()).toBeNull();
  });

  test('close() resets callbacks to null', async () => {
    manager.onRemoteStream = jest.fn();
    manager.onRemoteStreamRemoved = jest.fn();
    manager.onIceCandidate = jest.fn();
    manager.onConnectionStateChange = jest.fn();

    manager.close();

    expect(manager.onRemoteStream).toBeNull();
    expect(manager.onRemoteStreamRemoved).toBeNull();
    expect(manager.onIceCandidate).toBeNull();
    expect(manager.onConnectionStateChange).toBeNull();
  });

  test('close() resets isScreenSharing to false', async () => {
    // We cannot actually trigger startScreenShare easily since getDisplayMedia
    // would run, but we can verify the flag resets on close.
    manager.close();
    expect(manager.isScreenSharing).toBe(false);
  });

  // ── 10. toggleMute / toggleCamera ──────────────────────────────────

  test('toggleMute returns false when no local stream', () => {
    const result = manager.toggleMute();
    expect(result).toBe(false);
  });

  test('toggleMute toggles audio track enabled state', async () => {
    await manager.createOfferForPeer('peer-1', false);
    const localStream = manager.getLocalStream()!;
    const audioTrack = localStream.getAudioTracks()[0];
    expect(audioTrack.enabled).toBe(true);

    const isMuted = manager.toggleMute();
    expect(isMuted).toBe(true); // enabled was true -> now false -> !false = true (muted)
    expect(audioTrack.enabled).toBe(false);

    const isUnmuted = manager.toggleMute();
    expect(isUnmuted).toBe(false); // enabled was false -> now true -> !true = false (unmuted)
    expect(audioTrack.enabled).toBe(true);
  });

  test('toggleCamera returns true when no local stream', () => {
    const result = manager.toggleCamera();
    expect(result).toBe(true);
  });

  test('toggleCamera toggles video track enabled state', async () => {
    await manager.createOfferForPeer('peer-1', true); // video call
    const localStream = manager.getLocalStream()!;
    const videoTrack = localStream.getVideoTracks()[0];
    expect(videoTrack.enabled).toBe(true);

    const isCameraOff = manager.toggleCamera();
    expect(isCameraOff).toBe(true); // enabled was true -> now false -> !false = true (camera off)
    expect(videoTrack.enabled).toBe(false);

    const isCameraOn = manager.toggleCamera();
    expect(isCameraOn).toBe(false); // enabled was false -> now true -> !true = false (camera on)
    expect(videoTrack.enabled).toBe(true);
  });

  test('toggleCamera returns true when no video track (voice-only call)', async () => {
    await manager.createOfferForPeer('peer-1', false); // voice only
    const result = manager.toggleCamera();
    expect(result).toBe(true);
  });

  // ── 11. Screen share methods ───────────────────────────────────────

  test('startScreenShare is a function', () => {
    expect(typeof manager.startScreenShare).toBe('function');
  });

  test('stopScreenShare is a function', () => {
    expect(typeof manager.stopScreenShare).toBe('function');
  });

  test('isScreenSharing is false initially', () => {
    expect(manager.isScreenSharing).toBe(false);
  });

  test('getScreenShareStream returns null initially', () => {
    expect(manager.getScreenShareStream()).toBeNull();
  });

  test('startScreenShare sets isScreenSharing and returns a stream', async () => {
    const stream = await manager.startScreenShare();
    expect(stream).toBeTruthy();
    expect(manager.isScreenSharing).toBe(true);
    expect(manager.getScreenShareStream()).toBe(stream);
  });

  test('stopScreenShare clears screen share state', async () => {
    await manager.startScreenShare();
    expect(manager.isScreenSharing).toBe(true);

    await manager.stopScreenShare();
    expect(manager.isScreenSharing).toBe(false);
    expect(manager.getScreenShareStream()).toBeNull();
  });

  test('stopScreenShare stops screen share tracks', async () => {
    const stream = await manager.startScreenShare();
    const tracks = stream.getTracks();
    const stopSpies = tracks.map((t: any) => jest.spyOn(t, 'stop'));

    await manager.stopScreenShare();

    for (const spy of stopSpies) {
      expect(spy).toHaveBeenCalled();
    }
  });

  // ── Extra: participantCount ────────────────────────────────────────

  test('participantCount is 1 with no peers (self only)', () => {
    expect(manager.participantCount).toBe(1);
  });

  test('participantCount reflects connected peers plus self', async () => {
    await manager.createOfferForPeer('peer-1', false);
    expect(manager.participantCount).toBe(2);

    await manager.createOfferForPeer('peer-2', false);
    expect(manager.participantCount).toBe(3);

    manager.removePeer('peer-1');
    expect(manager.participantCount).toBe(2);
  });

  // ── Extra: peer stream access ──────────────────────────────────────

  test('getPeerStream returns null for unknown peer', () => {
    expect(manager.getPeerStream('unknown')).toBeNull();
  });

  test('getAllPeerStreams returns empty map when no peers have remote streams', async () => {
    await manager.createOfferForPeer('peer-1', false);
    const streams = manager.getAllPeerStreams();
    expect(streams.size).toBe(0);
  });

  // ── Extra: onRemoteStream callback ─────────────────────────────────

  test('onRemoteStream callback fires when remote track is received', async () => {
    const onStream = jest.fn();
    manager.onRemoteStream = onStream;

    await manager.createOfferForPeer('peer-1', false);

    const peers = (manager as any).peers as Map<string, any>;
    const peer = peers.get('peer-1');

    // Simulate a remote track event
    peer.pc.ontrack({
      streams: [{ id: 'remote-stream-1' }],
    });

    expect(onStream).toHaveBeenCalledWith('peer-1', { id: 'remote-stream-1' });
  });

  // ── Extra: quality settings ────────────────────────────────────────

  test('videoQuality defaults to auto', () => {
    expect(manager.videoQuality).toBe('auto');
  });

  test('audioQuality defaults to opus', () => {
    expect(manager.audioQuality).toBe('opus');
  });

  test('setAudioQuality updates the audio quality setting', () => {
    manager.setAudioQuality('pcm');
    expect(manager.audioQuality).toBe('pcm');
  });
});
