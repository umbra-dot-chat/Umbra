/**
 * Integration tests for community sync protocol.
 *
 * Tests the broadcastCommunityEvent function and the relay envelope
 * handling for community events.
 */

// Mock the WASM module before importing community module
jest.mock('@umbra/wasm', () => ({
  getWasm: jest.fn(() => ({
    umbra_wasm_community_member_list: jest.fn((communityId) =>
      JSON.stringify([
        { id: 'm1', community_id: communityId, member_did: 'did:key:z6MkAlice', nickname: 'Alice', joined_at: 1000 },
        { id: 'm2', community_id: communityId, member_did: 'did:key:z6MkBob', nickname: 'Bob', joined_at: 1000 },
        { id: 'm3', community_id: communityId, member_did: 'did:key:z6MkCharlie', nickname: 'Charlie', joined_at: 1000 },
      ])
    ),
  })),
  initUmbraWasm: jest.fn(() => Promise.resolve({})),
  isWasmReady: jest.fn(() => true),
  eventBridge: { connect: jest.fn(), onAll: jest.fn(), clear: jest.fn() },
}));

import type { CommunityEvent, CommunityEventPayload, RelayEnvelope } from '../../packages/umbra-service/src/types';
import { broadcastCommunityEvent } from '../../packages/umbra-service/src/community';

describe('Community Sync — broadcastCommunityEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends relay messages to all members except the sender', async () => {
    const mockWs = {
      readyState: WebSocket.OPEN,
      send: jest.fn(),
    } as unknown as WebSocket;

    const event: CommunityEvent = {
      type: 'channelCreated',
      communityId: 'community-1',
      channelId: 'channel-1',
    };

    await broadcastCommunityEvent('community-1', event, 'did:key:z6MkAlice', mockWs);

    // Should send to Bob and Charlie (not Alice = sender)
    expect(mockWs.send).toHaveBeenCalledTimes(2);

    // Verify first message goes to Bob
    const firstCall = JSON.parse((mockWs.send as jest.Mock).mock.calls[0][0]);
    expect(firstCall.type).toBe('send');
    expect(firstCall.to_did).toBe('did:key:z6MkBob');

    // Verify second message goes to Charlie
    const secondCall = JSON.parse((mockWs.send as jest.Mock).mock.calls[1][0]);
    expect(secondCall.type).toBe('send');
    expect(secondCall.to_did).toBe('did:key:z6MkCharlie');
  });

  it('constructs a correct community_event envelope', async () => {
    const mockWs = {
      readyState: WebSocket.OPEN,
      send: jest.fn(),
    } as unknown as WebSocket;

    const event: CommunityEvent = {
      type: 'spaceDeleted',
      communityId: 'community-1',
      spaceId: 'space-1',
    };

    await broadcastCommunityEvent('community-1', event, 'did:key:z6MkAlice', mockWs);

    // Parse the envelope from the first message
    const relayMsg = JSON.parse((mockWs.send as jest.Mock).mock.calls[0][0]);
    const envelope = JSON.parse(relayMsg.payload) as RelayEnvelope;

    expect(envelope.envelope).toBe('community_event');
    expect(envelope.version).toBe(1);

    const payload = envelope.payload as CommunityEventPayload;
    expect(payload.communityId).toBe('community-1');
    expect(payload.senderDid).toBe('did:key:z6MkAlice');
    expect(payload.event).toEqual(event);
    expect(typeof payload.timestamp).toBe('number');
  });

  it('is a no-op when relay WS is null', async () => {
    const event: CommunityEvent = {
      type: 'channelCreated',
      communityId: 'community-1',
      channelId: 'channel-1',
    };

    // Should not throw
    await broadcastCommunityEvent('community-1', event, 'did:key:z6MkAlice', null);
  });

  it('is a no-op when relay WS is not OPEN', async () => {
    const mockWs = {
      readyState: WebSocket.CLOSING,
      send: jest.fn(),
    } as unknown as WebSocket;

    const event: CommunityEvent = {
      type: 'channelCreated',
      communityId: 'community-1',
      channelId: 'channel-1',
    };

    await broadcastCommunityEvent('community-1', event, 'did:key:z6MkAlice', mockWs);

    expect(mockWs.send).not.toHaveBeenCalled();
  });

  it('does not send to the sender themselves', async () => {
    const mockWs = {
      readyState: WebSocket.OPEN,
      send: jest.fn(),
    } as unknown as WebSocket;

    const event: CommunityEvent = {
      type: 'memberJoined',
      communityId: 'community-1',
      memberDid: 'did:key:z6MkNewMember',
    };

    await broadcastCommunityEvent('community-1', event, 'did:key:z6MkBob', mockWs);

    // Should send to Alice and Charlie only (not Bob)
    expect(mockWs.send).toHaveBeenCalledTimes(2);
    const dids = (mockWs.send as jest.Mock).mock.calls.map((call: any) => JSON.parse(call[0]).to_did);
    expect(dids).toContain('did:key:z6MkAlice');
    expect(dids).toContain('did:key:z6MkCharlie');
    expect(dids).not.toContain('did:key:z6MkBob');
  });
});

describe('Community Sync — Relay Envelope Handling', () => {
  it('community_event envelope can be parsed and contains correct structure', () => {
    const event: CommunityEvent = {
      type: 'categoryCreated',
      communityId: 'community-1',
      categoryId: 'cat-1',
    };

    const envelope: RelayEnvelope = {
      envelope: 'community_event',
      version: 1,
      payload: {
        communityId: 'community-1',
        event,
        senderDid: 'did:key:z6MkAlice',
        timestamp: Date.now(),
      },
    };

    const serialized = JSON.stringify(envelope);
    const parsed = JSON.parse(serialized) as RelayEnvelope;

    expect(parsed.envelope).toBe('community_event');
    expect(parsed.version).toBe(1);

    const payload = parsed.payload as CommunityEventPayload;
    expect(payload.event.type).toBe('categoryCreated');
    expect(payload.communityId).toBe('community-1');
    expect(payload.senderDid).toBe('did:key:z6MkAlice');
  });

  it('voice channel events can be synced', () => {
    const event: CommunityEvent = {
      type: 'voiceChannelJoined',
      communityId: 'community-1',
      channelId: 'voice-1',
      memberDid: 'did:key:z6MkAlice',
    };

    const envelope: RelayEnvelope = {
      envelope: 'community_event',
      version: 1,
      payload: {
        communityId: 'community-1',
        event,
        senderDid: 'did:key:z6MkAlice',
        timestamp: Date.now(),
      },
    };

    const serialized = JSON.stringify(envelope);
    const parsed = JSON.parse(serialized) as RelayEnvelope;
    const payload = parsed.payload as CommunityEventPayload;

    expect(payload.event.type).toBe('voiceChannelJoined');
    if (payload.event.type === 'voiceChannelJoined') {
      expect(payload.event.channelId).toBe('voice-1');
      expect(payload.event.memberDid).toBe('did:key:z6MkAlice');
    }
  });
});
