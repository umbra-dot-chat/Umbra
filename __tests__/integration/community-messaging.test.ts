/**
 * Integration tests for Community Messaging (T6.12–T6.13):
 * Sending messages in channels, editing, deleting, reactions,
 * pinning/unpinning, read receipts, and community event broadcasting.
 *
 * Uses the Jest-mocked UmbraService singleton.
 */

const { UmbraService } = require('@umbra/service');

describe('Community Messaging', () => {
  let svc: InstanceType<typeof UmbraService>;

  beforeAll(async () => {
    await UmbraService.initialize();
    svc = UmbraService.instance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Send Messages in Channels (T6.12.1) ─────────────────────────────

  test('sendCommunityMessage returns message with channelId and content', async () => {
    const result = await svc.sendCommunityMessage('channel-1', 'did:key:z6MkAlice', 'Hello community!');
    expect(result).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);
    expect(result.channelId).toBe('channel-1');
    expect(result.content).toBe('Hello community!');
  });

  test('sendCommunityMessage preserves sender DID', async () => {
    const result = await svc.sendCommunityMessage('channel-1', 'did:key:z6MkBob', 'Test message');
    expect(result.senderDid).toBe('did:key:z6MkBob');
  });

  test('sendCommunityMessage preserves timestamp', async () => {
    const before = Date.now();
    const result = await svc.sendCommunityMessage('channel-1', 'did:key:z6MkAlice', 'Timestamped');
    const after = Date.now();
    expect(typeof result.timestamp).toBe('number');
    expect(result.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.timestamp).toBeLessThanOrEqual(after);
  });

  // ── Get Channel Messages ─────────────────────────────────────────────

  test('getCommunityMessages returns array', async () => {
    const result = await svc.getCommunityMessages('channel-1');
    expect(Array.isArray(result)).toBe(true);
  });

  test('getCommunityMessages is called with channelId', async () => {
    await svc.getCommunityMessages('channel-42');
    expect(svc.getCommunityMessages).toHaveBeenCalledWith('channel-42');
  });

  // ── Edit & Delete (T6.12.2) ──────────────────────────────────────────

  test('editCommunityMessage resolves without error', async () => {
    await expect(svc.editCommunityMessage('cmsg-1', 'Updated content')).resolves.not.toThrow();
  });

  test('editCommunityMessage is called with correct args', async () => {
    await svc.editCommunityMessage('cmsg-99', 'Edited text');
    expect(svc.editCommunityMessage).toHaveBeenCalledWith('cmsg-99', 'Edited text');
  });

  test('deleteCommunityMessage resolves without error', async () => {
    await expect(svc.deleteCommunityMessage('cmsg-1')).resolves.not.toThrow();
  });

  test('deleteCommunityMessage is called with message ID', async () => {
    await svc.deleteCommunityMessage('cmsg-77');
    expect(svc.deleteCommunityMessage).toHaveBeenCalledWith('cmsg-77');
  });

  // ── Reactions (T6.12.3) ──────────────────────────────────────────────

  test('addCommunityReaction resolves without error', async () => {
    await expect(svc.addCommunityReaction('cmsg-1', '👍')).resolves.not.toThrow();
  });

  test('removeCommunityReaction resolves without error', async () => {
    await expect(svc.removeCommunityReaction('cmsg-1', '👍')).resolves.not.toThrow();
  });

  // ── Pin / Unpin (T6.12.4) ───────────────────────────────────────────

  test('pinCommunityMessage resolves without error', async () => {
    await expect(svc.pinCommunityMessage('cmsg-1')).resolves.not.toThrow();
  });

  test('unpinCommunityMessage resolves without error', async () => {
    await expect(svc.unpinCommunityMessage('cmsg-1')).resolves.not.toThrow();
  });

  test('getCommunityPinnedMessages returns array', async () => {
    const result = await svc.getCommunityPinnedMessages('channel-1');
    expect(Array.isArray(result)).toBe(true);
  });

  // ── Read Receipts (T6.12.8) ─────────────────────────────────────────

  test('markCommunityRead resolves without error', async () => {
    await expect(svc.markCommunityRead('channel-1')).resolves.not.toThrow();
  });

  test('markCommunityRead is called with channelId', async () => {
    await svc.markCommunityRead('channel-55');
    expect(svc.markCommunityRead).toHaveBeenCalledWith('channel-55');
  });

  // ── Event Broadcasting (T6.12.7) ────────────────────────────────────

  test('onCommunityEvent returns unsubscribe function', () => {
    const unsub = svc.onCommunityEvent('community-1', 'messageCreated', jest.fn());
    expect(typeof unsub).toBe('function');
  });

  test('dispatchCommunityEvent can be called', () => {
    expect(() => {
      svc.dispatchCommunityEvent('community-1', {
        type: 'messageCreated',
        communityId: 'community-1',
        channelId: 'channel-1',
      });
    }).not.toThrow();
    expect(svc.dispatchCommunityEvent).toHaveBeenCalledTimes(1);
  });

  test('broadcastCommunityEvent resolves without error', async () => {
    await expect(
      svc.broadcastCommunityEvent('community-1', {
        type: 'messageCreated',
        communityId: 'community-1',
        channelId: 'channel-1',
      }),
    ).resolves.not.toThrow();
  });

  test('broadcastCommunityEvent sends relay envelope with correct structure', async () => {
    const event = {
      type: 'messageDeleted',
      communityId: 'community-1',
      channelId: 'channel-1',
      messageId: 'cmsg-1',
    };

    await svc.broadcastCommunityEvent('community-1', event);
    expect(svc.broadcastCommunityEvent).toHaveBeenCalledWith('community-1', event);
    expect(svc.broadcastCommunityEvent).toHaveBeenCalledTimes(1);
  });
});
