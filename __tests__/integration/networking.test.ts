/**
 * Integration tests for the P2P networking layer.
 *
 * Tests the signaling flow (WebRTC offer/answer), network lifecycle,
 * and connection info exchange through the UmbraService mock.
 */

const { UmbraService } = require('@umbra/service');

describe('Networking Integration', () => {
  let svc: any;

  beforeAll(async () => {
    await UmbraService.initialize();
    svc = UmbraService.instance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Network Lifecycle ──────────────────────────────────────────────────

  describe('network lifecycle', () => {
    test('startNetwork resolves without error', async () => {
      await expect(svc.startNetwork()).resolves.not.toThrow();
      expect(svc.startNetwork).toHaveBeenCalledTimes(1);
    });

    test('stopNetwork resolves without error', async () => {
      await expect(svc.stopNetwork()).resolves.not.toThrow();
      expect(svc.stopNetwork).toHaveBeenCalledTimes(1);
    });

    test('getNetworkStatus returns expected shape', async () => {
      const status = await svc.getNetworkStatus();
      expect(status).toBeDefined();
      expect(typeof status.isRunning).toBe('boolean');
      expect(typeof status.peerCount).toBe('number');
      expect(Array.isArray(status.listenAddresses)).toBe(true);
    });

    test('network status reflects stopped state by default', async () => {
      const status = await svc.getNetworkStatus();
      expect(status.isRunning).toBe(false);
      expect(status.peerCount).toBe(0);
      expect(status.listenAddresses).toEqual([]);
    });

    test('network can be started and stopped in sequence', async () => {
      await svc.startNetwork();
      await svc.stopNetwork();
      await svc.startNetwork();

      expect(svc.startNetwork).toHaveBeenCalledTimes(2);
      expect(svc.stopNetwork).toHaveBeenCalledTimes(1);
    });
  });

  // ── WebRTC Signaling Flow ──────────────────────────────────────────────

  describe('WebRTC signaling', () => {
    test('createOffer returns valid JSON with SDP offer', async () => {
      const offerJson = await svc.createOffer();
      expect(typeof offerJson).toBe('string');

      const offer = JSON.parse(offerJson);
      expect(offer.sdp).toBeDefined();
      expect(offer.sdp_type).toBe('offer');
      expect(Array.isArray(offer.ice_candidates)).toBe(true);
      expect(offer.ice_candidates.length).toBeGreaterThan(0);
    });

    test('acceptOffer takes offer JSON and returns answer JSON', async () => {
      const offerJson = await svc.createOffer();
      const answerJson = await svc.acceptOffer(offerJson);

      expect(typeof answerJson).toBe('string');

      const answer = JSON.parse(answerJson);
      expect(answer.sdp).toBeDefined();
      expect(answer.sdp_type).toBe('answer');
      expect(Array.isArray(answer.ice_candidates)).toBe(true);
    });

    test('completeHandshake resolves with success', async () => {
      const offerJson = await svc.createOffer();
      const answerJson = await svc.acceptOffer(offerJson);

      const result = await svc.completeHandshake(answerJson);
      expect(result).toBe(true);
    });

    test('completeAnswerer resolves with success', async () => {
      const result = await svc.completeAnswerer();
      expect(result).toBe(true);
    });

    test('full signaling flow: offer → accept → handshake', async () => {
      // Step 1: Alice creates offer
      const offerJson = await svc.createOffer();
      expect(svc.createOffer).toHaveBeenCalledTimes(1);

      // Step 2: Bob accepts offer and generates answer
      const answerJson = await svc.acceptOffer(offerJson);
      expect(svc.acceptOffer).toHaveBeenCalledWith(offerJson);

      // Step 3: Alice completes handshake with Bob's answer
      const result = await svc.completeHandshake(answerJson);
      expect(result).toBe(true);
      expect(svc.completeHandshake).toHaveBeenCalledWith(answerJson);
    });

    test('ICE candidates have expected structure', async () => {
      const offerJson = await svc.createOffer();
      const offer = JSON.parse(offerJson);

      const candidate = offer.ice_candidates[0];
      expect(typeof candidate.candidate).toBe('string');
      expect(candidate.sdp_mid).toBeDefined();
      expect(candidate.sdp_m_line_index).toBeDefined();
    });
  });

  // ── Connection Info ────────────────────────────────────────────────────

  describe('connection info', () => {
    test('getConnectionInfo returns valid connection info', async () => {
      const info = await svc.getConnectionInfo();
      expect(info).toBeDefined();
      expect(info.did).toMatch(/^did:key:/);
      expect(info.peerId).toBeDefined();
      expect(Array.isArray(info.addresses)).toBe(true);
    });

    test('parseConnectionInfo accepts a string and returns parsed info', async () => {
      const info = await svc.parseConnectionInfo('did:key:z6MkAlice');
      expect(info).toBeDefined();
      expect(info.did).toBe('did:key:z6MkAlice');
    });

    test('connection info round-trip: get → stringify → parse', async () => {
      const original = await svc.getConnectionInfo();
      const infoStr = JSON.stringify(original);
      const parsed = JSON.parse(infoStr);

      expect(parsed.did).toBe(original.did);
      expect(parsed.peerId).toBe(original.peerId);
    });
  });

  // ── Connection + Friend Request Flow ───────────────────────────────────

  describe('connection + friend request flow', () => {
    test('after signaling, can send friend request', async () => {
      // Simulate signaling
      const offerJson = await svc.createOffer();
      const answerJson = await svc.acceptOffer(offerJson);
      await svc.completeHandshake(answerJson);

      // Now send a friend request
      const request = await svc.sendFriendRequest('did:key:z6MkBob', 'Hello Bob!');
      expect(request.direction).toBe('outgoing');
      expect(request.toDid).toBe('did:key:z6MkBob');
      expect(request.status).toBe('pending');
    });

    test('after signaling, can send message to conversation', async () => {
      // Simulate signaling
      await svc.createOffer();
      await svc.completeHandshake('{}');

      // Send a message
      const msg = await svc.sendMessage('conv-1', 'Hello over P2P!');
      expect(msg.conversationId).toBe('conv-1');
      expect(msg.content.text).toBe('Hello over P2P!');
      expect(msg.status).toBe('sent');
    });
  });
});

describe('Networking Event Subscriptions', () => {
  let svc: any;

  beforeAll(async () => {
    await UmbraService.initialize();
    svc = UmbraService.instance;
  });

  test('onDiscoveryEvent returns unsubscribe function', () => {
    const callback = jest.fn();
    const unsubscribe = svc.onDiscoveryEvent(callback);
    expect(typeof unsubscribe).toBe('function');
  });

  test('onMessageEvent returns unsubscribe function', () => {
    const callback = jest.fn();
    const unsubscribe = svc.onMessageEvent(callback);
    expect(typeof unsubscribe).toBe('function');
  });

  test('onFriendEvent returns unsubscribe function', () => {
    const callback = jest.fn();
    const unsubscribe = svc.onFriendEvent(callback);
    expect(typeof unsubscribe).toBe('function');
  });
});
