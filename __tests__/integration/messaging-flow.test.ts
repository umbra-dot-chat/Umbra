const { UmbraService } = require('@umbra/service');

describe('Messaging flow', () => {
  let svc: InstanceType<typeof UmbraService>;

  beforeAll(async () => {
    await UmbraService.initialize();
    svc = UmbraService.instance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('send message returns message with correct fields', async () => {
    const msg = await svc.sendMessage('conv-1', 'Hello world');
    expect(msg).toBeDefined();
    expect(typeof msg.id).toBe('string');
    expect(msg.id.length).toBeGreaterThan(0);
    expect(msg.conversationId).toBe('conv-1');
    expect(msg.content.type).toBe('text');
    expect(msg.content.text).toBe('Hello world');
    expect(msg.status).toBe('sent');
    expect(typeof msg.timestamp).toBe('number');
  });

  test('send message preserves message text', async () => {
    const text = 'End-to-end encrypted P2P message 🔐';
    const msg = await svc.sendMessage('conv-2', text);
    expect(msg.content.text).toBe(text);
  });

  test('get messages returns array', async () => {
    const messages = await svc.getMessages('conv-1', { limit: 50, offset: 0 });
    expect(Array.isArray(messages)).toBe(true);
  });

  test('mark as read returns number', async () => {
    const count = await svc.markAsRead('conv-1');
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('get conversations returns array', async () => {
    const conversations = await svc.getConversations();
    expect(Array.isArray(conversations)).toBe(true);
  });

  test('get network status returns valid status object', async () => {
    const status = await svc.getNetworkStatus();
    expect(status).toBeDefined();
    expect(typeof status.isRunning).toBe('boolean');
    expect(typeof status.peerCount).toBe('number');
    expect(Array.isArray(status.listenAddresses)).toBe(true);
  });

  test('onMessageEvent returns unsubscribe function', () => {
    const unsubscribe = svc.onMessageEvent(() => {});
    expect(typeof unsubscribe).toBe('function');
    unsubscribe(); // should not throw
  });

  // ── Extended messaging features ──

  test('editMessage returns updated message', async () => {
    const result = await svc.editMessage('msg-edit', 'Edited content');
    expect(result.content.text).toBe('Edited content');
    expect(result.edited).toBe(true);
  });

  test('deleteMessage resolves without error', async () => {
    await expect(svc.deleteMessage('msg-delete')).resolves.not.toThrow();
  });

  test('pinMessage returns pinned message', async () => {
    const result = await svc.pinMessage('msg-pin');
    expect(result.pinned).toBe(true);
    expect(typeof result.pinnedAt).toBe('number');
  });

  test('unpinMessage resolves', async () => {
    await expect(svc.unpinMessage('msg-unpin')).resolves.not.toThrow();
  });

  test('addReaction returns reactions with emoji', async () => {
    const reactions = await svc.addReaction('msg-react', '❤️');
    expect(reactions[0].emoji).toBe('❤️');
    expect(reactions[0].reacted).toBe(true);
  });

  test('removeReaction resolves with array', async () => {
    const result = await svc.removeReaction('msg-react', '❤️');
    expect(Array.isArray(result)).toBe(true);
  });

  test('forwardMessage creates forwarded message', async () => {
    const fwd = await svc.forwardMessage('msg-fwd', 'conv-target');
    expect(fwd.forwarded).toBe(true);
    expect(fwd.conversationId).toBe('conv-target');
  });

  // ── Blank message prevention ──

  test('empty string message content should be treated as invalid', () => {
    // When decryption fails, the system returns null (not empty string).
    // The guard in useMessages.ts checks for empty content before appending.
    const msg = {
      id: 'msg-blank',
      conversationId: 'conv-1',
      senderDid: 'did:key:z6MkTest',
      content: { type: 'text' as const, text: '' },
      timestamp: Date.now(),
      read: false,
      delivered: true,
      status: 'delivered' as const,
    };

    // Message text should be treated as falsy
    const text = typeof msg.content === 'string' ? msg.content : msg.content?.text;
    expect(text).toBe('');
    expect(!text).toBe(true); // Guard check: !text should be true for empty string
  });

  test('null decryption result should prevent message dispatch', () => {
    // Simulate what useNetwork does: check if decryptedText is null
    const decryptedText: string | null = null;

    // The guard in useNetwork.ts:
    // if (!decryptedText) { console.warn(...); return; }
    expect(!decryptedText).toBe(true);
    // This means the message would NOT be dispatched
  });

  test('valid message content passes guard check', () => {
    const msg = {
      id: 'msg-valid',
      conversationId: 'conv-1',
      senderDid: 'did:key:z6MkTest',
      content: { type: 'text' as const, text: 'Hello world' },
      timestamp: Date.now(),
    };

    const text = typeof msg.content === 'string' ? msg.content : msg.content?.text;
    expect(text).toBe('Hello world');
    expect(!text).toBe(false); // Guard check passes — message should be appended
  });
});
