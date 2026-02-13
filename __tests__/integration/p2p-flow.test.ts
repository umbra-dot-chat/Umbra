/**
 * End-to-end P2P flow integration tests.
 *
 * Tests the full pipeline: identity → signaling → friend request → messaging.
 * Uses the UmbraService mock to simulate the WASM backend.
 */

const { UmbraService, ErrorCode, UmbraError } = require('@umbra/service');

describe('P2P End-to-End Flow', () => {
  let svc: any;

  beforeAll(async () => {
    await UmbraService.initialize();
    svc = UmbraService.instance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Full Connection Flow ──────────────────────────────────────────────

  describe('complete connection flow', () => {
    test('Alice creates identity → offer → Bob accepts → handshake', async () => {
      // Step 1: Alice creates identity
      const aliceResult = await svc.createIdentity('Alice');
      expect(aliceResult.identity.displayName).toBe('Alice');
      expect(aliceResult.identity.did).toMatch(/^did:key:/);
      expect(aliceResult.recoveryPhrase.length).toBe(24);

      // Step 2: Alice starts network
      await svc.startNetwork();
      expect(svc.startNetwork).toHaveBeenCalled();

      // Step 3: Alice creates WebRTC offer
      const offerJson = await svc.createOffer();
      const offer = JSON.parse(offerJson);
      expect(offer.sdp_type).toBe('offer');
      expect(offer.ice_candidates.length).toBeGreaterThan(0);

      // Step 4: Bob accepts Alice's offer (generates answer)
      const answerJson = await svc.acceptOffer(offerJson);
      const answer = JSON.parse(answerJson);
      expect(answer.sdp_type).toBe('answer');

      // Step 5: Alice completes handshake with Bob's answer
      const connected = await svc.completeHandshake(answerJson);
      expect(connected).toBe(true);
    });

    test('connection info can be generated and parsed', async () => {
      const info = await svc.getConnectionInfo();
      expect(info.did).toBeDefined();
      expect(info.peerId).toBeDefined();

      const parsed = await svc.parseConnectionInfo(info.did);
      expect(parsed.did).toBe(info.did);
    });
  });

  // ── Friend Request over P2P ───────────────────────────────────────────

  describe('friend request over P2P', () => {
    test('send friend request with message', async () => {
      const request = await svc.sendFriendRequest(
        'did:key:z6MkBob123',
        "Let's be friends!"
      );

      expect(request).toBeDefined();
      expect(request.direction).toBe('outgoing');
      expect(request.toDid).toBe('did:key:z6MkBob123');
      expect(request.status).toBe('pending');
      expect(request.message).toBe("Let's be friends!");
    });

    test('send friend request without message', async () => {
      const request = await svc.sendFriendRequest('did:key:z6MkBob456');

      expect(request).toBeDefined();
      expect(request.direction).toBe('outgoing');
      expect(request.toDid).toBe('did:key:z6MkBob456');
    });

    test('accept friend request returns accepted status', async () => {
      const result = await svc.acceptFriendRequest('req-incoming-1');
      expect(result.requestId).toBe('req-incoming-1');
      expect(result.status).toBe('accepted');
    });

    test('reject friend request resolves', async () => {
      await expect(svc.rejectFriendRequest('req-incoming-2')).resolves.not.toThrow();
    });

    test('get pending requests returns arrays', async () => {
      const incoming = await svc.getIncomingRequests();
      const outgoing = await svc.getOutgoingRequests();

      expect(Array.isArray(incoming)).toBe(true);
      expect(Array.isArray(outgoing)).toBe(true);
    });
  });

  // ── Messaging over P2P ────────────────────────────────────────────────

  describe('messaging over P2P', () => {
    test('send text message returns proper structure', async () => {
      const msg = await svc.sendMessage('conv-alice-bob', 'Hello Bob!');

      expect(msg).toBeDefined();
      expect(msg.conversationId).toBe('conv-alice-bob');
      expect(msg.content.type).toBe('text');
      expect(msg.content.text).toBe('Hello Bob!');
      expect(msg.status).toBe('sent');
      expect(typeof msg.id).toBe('string');
      expect(typeof msg.timestamp).toBe('number');
    });

    test('get messages for conversation returns array', async () => {
      const messages = await svc.getMessages('conv-alice-bob', {
        limit: 50,
        offset: 0,
      });

      expect(Array.isArray(messages)).toBe(true);
    });

    test('mark conversation as read returns count', async () => {
      const count = await svc.markAsRead('conv-alice-bob');
      expect(typeof count).toBe('number');
    });

    test('get conversations returns array', async () => {
      const conversations = await svc.getConversations();
      expect(Array.isArray(conversations)).toBe(true);
    });
  });

  // ── Crypto Operations ─────────────────────────────────────────────────

  describe('crypto operations', () => {
    test('sign returns a 64-byte signature', async () => {
      const signature = await svc.sign();
      expect(signature).toBeInstanceOf(Uint8Array);
      expect(signature.length).toBe(64);
    });

    test('verify returns true for valid signature', async () => {
      const valid = await svc.verify();
      expect(valid).toBe(true);
    });
  });

  // ── Error Handling ────────────────────────────────────────────────────

  describe('error handling', () => {
    test('UmbraError has correct structure', () => {
      const err = new UmbraError(ErrorCode.NoIdentity, 'No identity loaded');
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('UmbraError');
      expect(err.code).toBe(200);
      expect(err.message).toBe('No identity loaded');
      expect(err.recoverable).toBe(false);
    });

    test('recoverable error flag works', () => {
      const err = new UmbraError(ErrorCode.Internal, 'Temporary failure', true);
      expect(err.recoverable).toBe(true);
    });

    test('error codes are defined for all domains', () => {
      // Initialization
      expect(ErrorCode.NotInitialized).toBe(100);
      expect(ErrorCode.AlreadyInitialized).toBe(101);

      // Identity
      expect(ErrorCode.NoIdentity).toBe(200);
      expect(ErrorCode.IdentityExists).toBe(201);
      expect(ErrorCode.InvalidRecoveryPhrase).toBe(202);

      // Friends
      expect(ErrorCode.AlreadyFriends).toBe(600);
      expect(ErrorCode.NotFriends).toBe(601);
      expect(ErrorCode.RequestPending).toBe(602);
      expect(ErrorCode.RequestNotFound).toBe(603);
      expect(ErrorCode.UserBlocked).toBe(604);

      // Conversations
      expect(ErrorCode.ConversationNotFound).toBe(700);

      // Internal
      expect(ErrorCode.Internal).toBe(900);
    });
  });

  // ── Service Lifecycle ─────────────────────────────────────────────────

  describe('service lifecycle', () => {
    test('initialize sets initialized flag', async () => {
      await UmbraService.initialize();
      expect(UmbraService.isInitialized).toBe(true);
    });

    test('shutdown clears initialized flag', async () => {
      await UmbraService.initialize();
      await UmbraService.shutdown();
      expect(UmbraService.isInitialized).toBe(false);
    });

    test('getVersion returns version string', () => {
      const version = UmbraService.getVersion();
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    });

    test('validateRecoveryPhrase validates 24-word phrases', () => {
      const valid24 = Array(24).fill('abandon');
      expect(UmbraService.validateRecoveryPhrase(valid24)).toBe(true);

      const invalid12 = Array(12).fill('abandon');
      expect(UmbraService.validateRecoveryPhrase(invalid12)).toBe(false);
    });

    test('validateRecoveryPhrase accepts space-separated string', () => {
      const phrase = Array(24).fill('abandon').join(' ');
      expect(UmbraService.validateRecoveryPhrase(phrase)).toBe(true);
    });
  });
});
