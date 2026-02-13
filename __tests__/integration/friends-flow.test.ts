const { UmbraService } = require('@umbra/service');

describe('Friends flow', () => {
  let svc: InstanceType<typeof UmbraService>;

  beforeAll(async () => {
    await UmbraService.initialize();
    svc = UmbraService.instance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('send friend request returns request with pending status', async () => {
    const request = await svc.sendFriendRequest('did:key:z6MkAlice', 'Hi!');
    expect(request).toBeDefined();
    expect(request.toDid).toBe('did:key:z6MkAlice');
    expect(request.direction).toBe('outgoing');
    expect(request.status).toBe('pending');
    expect(typeof request.id).toBe('string');
    expect(request.id.length).toBeGreaterThan(0);
  });

  test('send friend request includes optional message', async () => {
    const request = await svc.sendFriendRequest('did:key:z6MkBob', 'Let us chat!');
    expect(request.message).toBe('Let us chat!');
  });

  test('accept friend request returns accepted status', async () => {
    const result = await svc.acceptFriendRequest('req-1');
    expect(result).toBeDefined();
    expect(result.requestId).toBe('req-1');
    expect(result.status).toBe('accepted');
  });

  test('reject friend request resolves', async () => {
    await expect(svc.rejectFriendRequest('req-2')).resolves.not.toThrow();
  });

  test('getFriends returns array', async () => {
    const friends = await svc.getFriends();
    expect(Array.isArray(friends)).toBe(true);
  });

  test('getIncomingRequests returns array', async () => {
    const incoming = await svc.getIncomingRequests();
    expect(Array.isArray(incoming)).toBe(true);
  });

  test('getOutgoingRequests returns array', async () => {
    const outgoing = await svc.getOutgoingRequests();
    expect(Array.isArray(outgoing)).toBe(true);
  });

  test('remove friend returns boolean', async () => {
    const result = await svc.removeFriend('did:key:z6MkAlice');
    expect(typeof result).toBe('boolean');
  });

  test('block and unblock user', async () => {
    await expect(svc.blockUser('did:key:z6MkSpam', 'spam')).resolves.not.toThrow();
    const unblocked = await svc.unblockUser('did:key:z6MkSpam');
    expect(typeof unblocked).toBe('boolean');
  });

  // ── New tests for incoming friend requests ──

  test('sendFriendRequest returns request with correct toDid', async () => {
    const request = await svc.sendFriendRequest('did:key:z6MkCharlie', 'Hey!');
    expect(request.toDid).toBe('did:key:z6MkCharlie');
    expect(request.direction).toBe('outgoing');
    expect(request.message).toBe('Hey!');
  });

  test('acceptFriendRequest returns accepted result', async () => {
    const result = await svc.acceptFriendRequest('req-incoming-1');
    expect(result.status).toBe('accepted');
    expect(result.requestId).toBe('req-incoming-1');
  });

  test('getIncomingRequests and getOutgoingRequests return arrays', async () => {
    const incoming = await svc.getIncomingRequests();
    const outgoing = await svc.getOutgoingRequests();
    expect(Array.isArray(incoming)).toBe(true);
    expect(Array.isArray(outgoing)).toBe(true);
  });
});
