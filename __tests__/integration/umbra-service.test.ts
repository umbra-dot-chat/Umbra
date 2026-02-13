const { UmbraService, ErrorCode, UmbraError } = require('@umbra/service');

describe('UmbraService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Static methods ──────────────────────────────────────────────────────

  test('initialize resolves without error', async () => {
    await expect(UmbraService.initialize()).resolves.not.toThrow();
  });

  test('getVersion returns expected version string', () => {
    const version = UmbraService.getVersion();
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });

  test('instance returns a service object', () => {
    const svc = UmbraService.instance;
    expect(svc).toBeDefined();
    expect(svc).not.toBeNull();
  });

  test('isInitialized tracks initialization state', async () => {
    await UmbraService.initialize();
    expect(UmbraService.isInitialized).toBe(true);
  });

  // ── Identity methods ────────────────────────────────────────────────────

  test('createIdentity returns identity with DID and recovery phrase', async () => {
    const svc = UmbraService.instance;
    const result = await svc.createIdentity('TestUser');
    expect(result).toBeDefined();
    expect(result.identity.did).toMatch(/^did:key:/);
    expect(result.identity.displayName).toBe('TestUser');
    expect(Array.isArray(result.recoveryPhrase)).toBe(true);
    expect(result.recoveryPhrase.length).toBe(24);
  });

  test('loadIdentity returns identity', async () => {
    const svc = UmbraService.instance;
    const identity = await svc.loadIdentity();
    expect(identity).toBeDefined();
    expect(identity.did).toMatch(/^did:key:/);
    expect(typeof identity.displayName).toBe('string');
  });

  // ── Friends methods ─────────────────────────────────────────────────────

  test('getFriends returns array', async () => {
    const svc = UmbraService.instance;
    const friends = await svc.getFriends();
    expect(Array.isArray(friends)).toBe(true);
  });

  test('sendFriendRequest returns request object', async () => {
    const svc = UmbraService.instance;
    const request = await svc.sendFriendRequest('did:key:z6MkAlice', 'Hey');
    expect(request).toBeDefined();
    expect(request.toDid).toBe('did:key:z6MkAlice');
    expect(request.status).toBe('pending');
  });

  test('getIncomingRequests returns array', async () => {
    const svc = UmbraService.instance;
    const incoming = await svc.getIncomingRequests();
    expect(Array.isArray(incoming)).toBe(true);
  });

  test('getOutgoingRequests returns array', async () => {
    const svc = UmbraService.instance;
    const outgoing = await svc.getOutgoingRequests();
    expect(Array.isArray(outgoing)).toBe(true);
  });

  // ── Conversation / messaging methods ────────────────────────────────────

  test('getConversations returns array', async () => {
    const svc = UmbraService.instance;
    const conversations = await svc.getConversations();
    expect(Array.isArray(conversations)).toBe(true);
  });

  test('sendMessage returns a message object', async () => {
    const svc = UmbraService.instance;
    const msg = await svc.sendMessage('conv-1', 'Hello');
    expect(msg).toBeDefined();
    expect(msg.conversationId).toBe('conv-1');
    expect(msg.content.type).toBe('text');
    expect(msg.content.text).toBe('Hello');
    expect(msg.status).toBe('sent');
  });

  test('getMessages returns array', async () => {
    const svc = UmbraService.instance;
    const messages = await svc.getMessages('conv-1', { limit: 50, offset: 0 });
    expect(Array.isArray(messages)).toBe(true);
  });

  // ── Network status ──────────────────────────────────────────────────────

  test('getNetworkStatus returns status object', async () => {
    const svc = UmbraService.instance;
    const status = await svc.getNetworkStatus();
    expect(status).toBeDefined();
    expect(typeof status.isRunning).toBe('boolean');
    expect(typeof status.peerCount).toBe('number');
    expect(Array.isArray(status.listenAddresses)).toBe(true);
  });

  // ── Event subscriptions ─────────────────────────────────────────────────

  test('onMessageEvent returns unsubscribe function', () => {
    const svc = UmbraService.instance;
    const unsubscribe = svc.onMessageEvent(() => {});
    expect(typeof unsubscribe).toBe('function');
  });

  test('onFriendEvent returns unsubscribe function', () => {
    const svc = UmbraService.instance;
    const unsubscribe = svc.onFriendEvent(() => {});
    expect(typeof unsubscribe).toBe('function');
  });

  test('onDiscoveryEvent returns unsubscribe function', () => {
    const svc = UmbraService.instance;
    const unsubscribe = svc.onDiscoveryEvent(() => {});
    expect(typeof unsubscribe).toBe('function');
  });

  // ── Error types ─────────────────────────────────────────────────────────

  test('ErrorCode enum has expected values', () => {
    expect(ErrorCode.NotInitialized).toBe(100);
    expect(ErrorCode.NoIdentity).toBe(200);
    expect(ErrorCode.AlreadyFriends).toBe(600);
    expect(ErrorCode.ConversationNotFound).toBe(700);
    expect(ErrorCode.Internal).toBe(900);
  });

  test('UmbraError extends Error', () => {
    const err = new UmbraError(ErrorCode.Internal, 'test');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('UmbraError');
    expect(err.code).toBe(ErrorCode.Internal);
  });
});
