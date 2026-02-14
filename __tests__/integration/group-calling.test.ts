/**
 * Integration test for the group calling flow.
 *
 * Tests group call signaling envelope formats, event types,
 * payload shapes, serialization, and mock service methods.
 */

import type {
  CallRoomCreatedPayload,
  CallParticipantJoinedPayload,
  CallParticipantLeftPayload,
  CallSignalForwardPayload,
  CallEvent,
} from '@/types/call';

const { UmbraService } = require('@umbra/service');

// ─── Group Call Event Types ──────────────────────────────────────────────────

describe('Group call event types', () => {
  test('callRoomCreated event type is properly defined', () => {
    const event: CallEvent = {
      type: 'callRoomCreated',
      payload: {
        roomId: 'room-abc',
        groupId: 'group-123',
      },
    };

    expect(event.type).toBe('callRoomCreated');
  });

  test('callParticipantJoined event type is properly defined', () => {
    const event: CallEvent = {
      type: 'callParticipantJoined',
      payload: {
        roomId: 'room-abc',
        did: 'did:key:z6MkAlice',
      },
    };

    expect(event.type).toBe('callParticipantJoined');
  });

  test('callParticipantLeft event type is properly defined', () => {
    const event: CallEvent = {
      type: 'callParticipantLeft',
      payload: {
        roomId: 'room-abc',
        did: 'did:key:z6MkBob',
      },
    };

    expect(event.type).toBe('callParticipantLeft');
  });

  test('callSignalForward event type is properly defined', () => {
    const event: CallEvent = {
      type: 'callSignalForward',
      payload: {
        roomId: 'room-abc',
        fromDid: 'did:key:z6MkAlice',
        payload: JSON.stringify({ sdp: 'v=0\r\n...', type: 'offer' }),
      },
    };

    expect(event.type).toBe('callSignalForward');
  });
});

// ─── Group Call Payload Shapes ───────────────────────────────────────────────

describe('Group call payload shapes', () => {
  test('CallRoomCreatedPayload has correct structure', () => {
    const payload: CallRoomCreatedPayload = {
      roomId: 'room-001',
      groupId: 'group-456',
    };

    expect(payload.roomId).toBe('room-001');
    expect(payload.groupId).toBe('group-456');
    expect(Object.keys(payload)).toEqual(['roomId', 'groupId']);
  });

  test('CallParticipantJoinedPayload has correct structure', () => {
    const payload: CallParticipantJoinedPayload = {
      roomId: 'room-001',
      did: 'did:key:z6MkAlice',
    };

    expect(payload.roomId).toBe('room-001');
    expect(payload.did).toBe('did:key:z6MkAlice');
    expect(Object.keys(payload)).toEqual(['roomId', 'did']);
  });

  test('CallParticipantLeftPayload has correct structure', () => {
    const payload: CallParticipantLeftPayload = {
      roomId: 'room-001',
      did: 'did:key:z6MkBob',
    };

    expect(payload.roomId).toBe('room-001');
    expect(payload.did).toBe('did:key:z6MkBob');
    expect(Object.keys(payload)).toEqual(['roomId', 'did']);
  });

  test('CallSignalForwardPayload has correct structure', () => {
    const payload: CallSignalForwardPayload = {
      roomId: 'room-001',
      fromDid: 'did:key:z6MkAlice',
      payload: '{"sdp":"v=0","type":"offer"}',
    };

    expect(payload.roomId).toBe('room-001');
    expect(payload.fromDid).toBe('did:key:z6MkAlice');
    expect(typeof payload.payload).toBe('string');
    expect(Object.keys(payload)).toEqual(['roomId', 'fromDid', 'payload']);
  });
});

// ─── CallEvent Union Includes Group Events ───────────────────────────────────

describe('CallEvent union type includes group call events', () => {
  test('CallEvent array includes all group call event types alongside 1:1 events', () => {
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
      {
        type: 'callRoomCreated',
        payload: {
          roomId: 'room-1',
          groupId: 'group-1',
        },
      },
      {
        type: 'callParticipantJoined',
        payload: {
          roomId: 'room-1',
          did: 'did:key:z6MkAlice',
        },
      },
      {
        type: 'callParticipantLeft',
        payload: {
          roomId: 'room-1',
          did: 'did:key:z6MkBob',
        },
      },
      {
        type: 'callSignalForward',
        payload: {
          roomId: 'room-1',
          fromDid: 'did:key:z6MkAlice',
          payload: '{}',
        },
      },
    ];

    expect(events).toHaveLength(9);

    const groupEventTypes = events
      .map((e) => e.type)
      .filter((t) =>
        ['callRoomCreated', 'callParticipantJoined', 'callParticipantLeft', 'callSignalForward'].includes(t)
      );

    expect(groupEventTypes).toEqual([
      'callRoomCreated',
      'callParticipantJoined',
      'callParticipantLeft',
      'callSignalForward',
    ]);
  });

  test('group call events can be discriminated by type field', () => {
    const event: CallEvent = {
      type: 'callRoomCreated',
      payload: {
        roomId: 'room-abc',
        groupId: 'group-xyz',
      },
    };

    if (event.type === 'callRoomCreated') {
      expect(event.payload.roomId).toBe('room-abc');
      expect(event.payload.groupId).toBe('group-xyz');
    } else {
      fail('Event type discrimination failed');
    }
  });
});

// ─── Group Call Payload Serialization / Deserialization ───────────────────────

describe('Group call payload serialization/deserialization', () => {
  test('CallRoomCreatedPayload survives JSON round-trip', () => {
    const original: CallRoomCreatedPayload = {
      roomId: 'room-ser-1',
      groupId: 'group-ser-1',
    };

    const serialized = JSON.stringify(original);
    const deserialized: CallRoomCreatedPayload = JSON.parse(serialized);

    expect(deserialized).toEqual(original);
    expect(deserialized.roomId).toBe('room-ser-1');
    expect(deserialized.groupId).toBe('group-ser-1');
  });

  test('CallParticipantJoinedPayload survives JSON round-trip', () => {
    const original: CallParticipantJoinedPayload = {
      roomId: 'room-ser-2',
      did: 'did:key:z6MkAlice',
    };

    const serialized = JSON.stringify(original);
    const deserialized: CallParticipantJoinedPayload = JSON.parse(serialized);

    expect(deserialized).toEqual(original);
    expect(deserialized.roomId).toBe('room-ser-2');
    expect(deserialized.did).toBe('did:key:z6MkAlice');
  });

  test('CallParticipantLeftPayload survives JSON round-trip', () => {
    const original: CallParticipantLeftPayload = {
      roomId: 'room-ser-3',
      did: 'did:key:z6MkBob',
    };

    const serialized = JSON.stringify(original);
    const deserialized: CallParticipantLeftPayload = JSON.parse(serialized);

    expect(deserialized).toEqual(original);
    expect(deserialized.roomId).toBe('room-ser-3');
    expect(deserialized.did).toBe('did:key:z6MkBob');
  });

  test('CallSignalForwardPayload survives JSON round-trip', () => {
    const innerPayload = JSON.stringify({
      sdp: 'v=0\r\no=- 12345 2 IN IP4 127.0.0.1',
      type: 'offer',
    });

    const original: CallSignalForwardPayload = {
      roomId: 'room-ser-4',
      fromDid: 'did:key:z6MkCarol',
      payload: innerPayload,
    };

    const serialized = JSON.stringify(original);
    const deserialized: CallSignalForwardPayload = JSON.parse(serialized);

    expect(deserialized).toEqual(original);
    expect(deserialized.roomId).toBe('room-ser-4');
    expect(deserialized.fromDid).toBe('did:key:z6MkCarol');

    // Verify the nested payload can also be parsed
    const nestedParsed = JSON.parse(deserialized.payload);
    expect(nestedParsed.type).toBe('offer');
    expect(nestedParsed.sdp).toContain('v=0');
  });

  test('full group call event survives JSON round-trip', () => {
    const original: CallEvent = {
      type: 'callSignalForward',
      payload: {
        roomId: 'room-full',
        fromDid: 'did:key:z6MkAlice',
        payload: JSON.stringify({ candidate: 'candidate:udp 1234', sdpMid: '0' }),
      },
    };

    const serialized = JSON.stringify(original);
    const deserialized = JSON.parse(serialized) as CallEvent;

    expect(deserialized.type).toBe('callSignalForward');
    expect(deserialized).toEqual(original);
  });
});

// ─── Mock Service Group Call Methods ─────────────────────────────────────────

describe('Mock service has group call methods', () => {
  let svc: ReturnType<typeof UmbraService.instance>;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = UmbraService.instance;
  });

  test('createCallRoom is defined and callable', () => {
    expect(svc.createCallRoom).toBeDefined();
    expect(typeof svc.createCallRoom).toBe('function');

    svc.createCallRoom('group-123');
    expect(svc.createCallRoom).toHaveBeenCalledWith('group-123');
    expect(svc.createCallRoom).toHaveBeenCalledTimes(1);
  });

  test('joinCallRoom is defined and callable', () => {
    expect(svc.joinCallRoom).toBeDefined();
    expect(typeof svc.joinCallRoom).toBe('function');

    svc.joinCallRoom('room-abc');
    expect(svc.joinCallRoom).toHaveBeenCalledWith('room-abc');
    expect(svc.joinCallRoom).toHaveBeenCalledTimes(1);
  });

  test('leaveCallRoom is defined and callable', () => {
    expect(svc.leaveCallRoom).toBeDefined();
    expect(typeof svc.leaveCallRoom).toBe('function');

    svc.leaveCallRoom('room-abc');
    expect(svc.leaveCallRoom).toHaveBeenCalledWith('room-abc');
    expect(svc.leaveCallRoom).toHaveBeenCalledTimes(1);
  });

  test('sendCallRoomSignal is defined and callable', () => {
    expect(svc.sendCallRoomSignal).toBeDefined();
    expect(typeof svc.sendCallRoomSignal).toBe('function');

    const signalPayload = JSON.stringify({ sdp: 'offer-sdp', type: 'offer' });
    svc.sendCallRoomSignal('room-abc', 'did:key:z6MkBob', signalPayload);
    expect(svc.sendCallRoomSignal).toHaveBeenCalledWith('room-abc', 'did:key:z6MkBob', signalPayload);
    expect(svc.sendCallRoomSignal).toHaveBeenCalledTimes(1);
  });

  test('onCallEvent is defined and returns an unsubscribe function', () => {
    expect(svc.onCallEvent).toBeDefined();
    expect(typeof svc.onCallEvent).toBe('function');

    const unsubscribe = svc.onCallEvent(() => {});
    expect(typeof unsubscribe).toBe('function');
  });

  test('group call methods can be called in a typical flow sequence', () => {
    // 1. Create a room for the group
    svc.createCallRoom('group-xyz');

    // 2. Join the room
    svc.joinCallRoom('room-new');

    // 3. Send a signal to a peer in the room
    svc.sendCallRoomSignal('room-new', 'did:key:z6MkPeer', '{"sdp":"offer"}');

    // 4. Leave the room
    svc.leaveCallRoom('room-new');

    expect(svc.createCallRoom).toHaveBeenCalledTimes(1);
    expect(svc.joinCallRoom).toHaveBeenCalledTimes(1);
    expect(svc.sendCallRoomSignal).toHaveBeenCalledTimes(1);
    expect(svc.leaveCallRoom).toHaveBeenCalledTimes(1);
  });
});
