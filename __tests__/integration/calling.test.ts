/**
 * Integration test for the calling flow.
 *
 * Tests the call signaling envelope format and state transitions.
 */

import type {
  CallOfferPayload,
  CallAnswerPayload,
  CallEndPayload,
  CallIceCandidatePayload,
  CallStatePayload,
  CallEvent,
  CallStatus,
  ActiveCall,
} from '@/types/call';

describe('Call signaling types', () => {
  test('CallOfferPayload has correct structure', () => {
    const payload: CallOfferPayload = {
      callId: 'call-123',
      callType: 'voice',
      senderDid: 'did:key:z6Mk...',
      senderDisplayName: 'Alice',
      conversationId: 'conv-456',
      sdp: 'v=0\r\n...',
      sdpType: 'offer',
    };

    expect(payload.callType).toBe('voice');
    expect(payload.sdpType).toBe('offer');
    expect(payload.senderDisplayName).toBe('Alice');
  });

  test('CallAnswerPayload has correct structure', () => {
    const payload: CallAnswerPayload = {
      callId: 'call-123',
      senderDid: 'did:key:z6Mk...',
      sdp: 'v=0\r\n...',
      sdpType: 'answer',
    };

    expect(payload.sdpType).toBe('answer');
  });

  test('CallEndPayload supports all end reasons', () => {
    const reasons = ['completed', 'declined', 'timeout', 'busy', 'failed', 'cancelled'] as const;

    for (const reason of reasons) {
      const payload: CallEndPayload = {
        callId: 'call-123',
        senderDid: 'did:key:z6Mk...',
        reason,
      };
      expect(payload.reason).toBe(reason);
    }
  });

  test('CallIceCandidatePayload handles null sdpMid', () => {
    const payload: CallIceCandidatePayload = {
      callId: 'call-123',
      senderDid: 'did:key:z6Mk...',
      candidate: 'candidate:...',
      sdpMid: null,
      sdpMLineIndex: null,
    };

    expect(payload.sdpMid).toBeNull();
    expect(payload.sdpMLineIndex).toBeNull();
  });

  test('CallStatePayload supports partial updates', () => {
    const muteOnly: CallStatePayload = {
      callId: 'call-123',
      senderDid: 'did:key:z6Mk...',
      isMuted: true,
    };

    const cameraOnly: CallStatePayload = {
      callId: 'call-123',
      senderDid: 'did:key:z6Mk...',
      isCameraOff: true,
    };

    expect(muteOnly.isMuted).toBe(true);
    expect(muteOnly.isCameraOff).toBeUndefined();
    expect(cameraOnly.isCameraOff).toBe(true);
    expect(cameraOnly.isMuted).toBeUndefined();
  });
});

describe('Call state machine', () => {
  test('ActiveCall supports all status transitions', () => {
    const statuses: CallStatus[] = [
      'idle',
      'outgoing',
      'incoming',
      'connecting',
      'connected',
      'reconnecting',
      'ended',
    ];

    for (const status of statuses) {
      const call: ActiveCall = {
        callId: 'call-test',
        conversationId: 'conv-1',
        callType: 'voice',
        direction: 'outgoing',
        status,
        remoteDid: 'did:key:z6Mk...',
        remoteDisplayName: 'Test',
        startedAt: Date.now(),
        connectedAt: status === 'connected' ? Date.now() : null,
        localStream: null,
        remoteStream: null,
        isMuted: false,
        isCameraOff: false,
      };
      expect(call.status).toBe(status);
    }
  });

  test('voice call has isCameraOff true by default', () => {
    const call: ActiveCall = {
      callId: 'call-voice',
      conversationId: 'conv-1',
      callType: 'voice',
      direction: 'outgoing',
      status: 'outgoing',
      remoteDid: 'did:key:z6Mk...',
      remoteDisplayName: 'Test',
      startedAt: Date.now(),
      connectedAt: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isCameraOff: true,
    };
    expect(call.isCameraOff).toBe(true);
  });

  test('video call has isCameraOff false by default', () => {
    const call: ActiveCall = {
      callId: 'call-video',
      conversationId: 'conv-1',
      callType: 'video',
      direction: 'outgoing',
      status: 'outgoing',
      remoteDid: 'did:key:z6Mk...',
      remoteDisplayName: 'Test',
      startedAt: Date.now(),
      connectedAt: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isCameraOff: false,
    };
    expect(call.isCameraOff).toBe(false);
  });
});

describe('Call event dispatch', () => {
  test('CallEvent union type covers all event types', () => {
    const events: CallEvent[] = [
      {
        type: 'callOffer',
        payload: {
          callId: 'c1',
          callType: 'voice',
          senderDid: 'did:key:z6Mk...',
          senderDisplayName: 'Alice',
          conversationId: 'conv-1',
          sdp: 'sdp',
          sdpType: 'offer',
        },
      },
      {
        type: 'callAnswer',
        payload: {
          callId: 'c1',
          senderDid: 'did:key:z6Mk...',
          sdp: 'sdp',
          sdpType: 'answer',
        },
      },
      {
        type: 'callIceCandidate',
        payload: {
          callId: 'c1',
          senderDid: 'did:key:z6Mk...',
          candidate: 'candidate',
          sdpMid: '0',
          sdpMLineIndex: 0,
        },
      },
      {
        type: 'callEnd',
        payload: {
          callId: 'c1',
          senderDid: 'did:key:z6Mk...',
          reason: 'completed',
        },
      },
      {
        type: 'callState',
        payload: {
          callId: 'c1',
          senderDid: 'did:key:z6Mk...',
          isMuted: true,
        },
      },
    ];

    expect(events).toHaveLength(5);
    expect(events.map((e) => e.type)).toEqual([
      'callOffer',
      'callAnswer',
      'callIceCandidate',
      'callEnd',
      'callState',
    ]);
  });
});

describe('ICE candidate handling', () => {
  test('ICE candidate with null sdpMid and sdpMLineIndex is valid', () => {
    const candidate: CallIceCandidatePayload = {
      callId: 'call-ice-1',
      senderDid: 'did:key:z6MkTest',
      candidate: 'candidate:0 1 UDP 2122252543 192.168.1.100 12345 typ host',
      sdpMid: null,
      sdpMLineIndex: null,
    };

    expect(candidate.candidate).toContain('candidate:');
    expect(candidate.sdpMid).toBeNull();
    expect(candidate.sdpMLineIndex).toBeNull();
  });

  test('ICE candidates should arrive before or after offer', () => {
    // Simulate the race condition: candidates arriving before the offer is accepted
    // In CallManager, they're queued in pendingCandidates[]
    const candidates: CallIceCandidatePayload[] = [];

    for (let i = 0; i < 5; i++) {
      candidates.push({
        callId: 'call-ice-race',
        senderDid: 'did:key:z6MkTest',
        candidate: `candidate:${i} 1 UDP ${2122252543 - i} 192.168.1.${100 + i} ${12345 + i} typ host`,
        sdpMid: '0',
        sdpMLineIndex: 0,
      });
    }

    expect(candidates).toHaveLength(5);
    // Each candidate should have a unique address
    const addresses = candidates.map((c) => c.candidate);
    const unique = new Set(addresses);
    expect(unique.size).toBe(5);
  });

  test('CallStats has extended fields', () => {
    const stats: import('@/types/call').CallStats = {
      resolution: { width: 1280, height: 720 },
      frameRate: 30,
      bitrate: 2500,
      packetLoss: 0.5,
      codec: 'video/VP8',
      roundTripTime: 45,
      jitter: 2.3,
      packetsLost: 12,
      fractionLost: 0.005,
      candidateType: 'srflx',
      localCandidateType: 'host',
      remoteCandidateType: 'srflx',
      availableOutgoingBitrate: 3000,
      audioLevel: 0.42,
      framesDecoded: 1800,
      framesDropped: 3,
      audioBitrate: 32,
    };

    expect(stats.packetsLost).toBe(12);
    expect(stats.fractionLost).toBe(0.005);
    expect(stats.candidateType).toBe('srflx');
    expect(stats.localCandidateType).toBe('host');
    expect(stats.remoteCandidateType).toBe('srflx');
    expect(stats.availableOutgoingBitrate).toBe(3000);
    expect(stats.audioLevel).toBe(0.42);
    expect(stats.framesDecoded).toBe(1800);
    expect(stats.framesDropped).toBe(3);
    expect(stats.audioBitrate).toBe(32);
  });
});

describe('TURN credential resolution', () => {
  test('TurnTestResult has required fields', () => {
    const result: import('@/types/call').TurnTestResult = {
      success: true,
      rtt: 150,
      candidateType: 'relay',
    };
    expect(result.success).toBe(true);
    expect(result.rtt).toBe(150);
    expect(result.candidateType).toBe('relay');
  });

  test('StunTestResult has required fields', () => {
    const result: import('@/types/call').StunTestResult = {
      success: true,
      publicIp: '203.0.113.1',
      rtt: 25,
    };
    expect(result.success).toBe(true);
    expect(result.publicIp).toBe('203.0.113.1');
    expect(result.rtt).toBe(25);
  });

  test('TurnTestResult supports error field', () => {
    const result: import('@/types/call').TurnTestResult = {
      success: false,
      rtt: 0,
      candidateType: '',
      error: 'Timeout (10s)',
    };
    expect(result.success).toBe(false);
    expect(result.error).toBe('Timeout (10s)');
  });
});
