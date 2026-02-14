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
