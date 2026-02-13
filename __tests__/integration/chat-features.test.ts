/**
 * Integration tests for extended chat features:
 * edit, delete, pin/unpin, reactions, forward, thread replies.
 *
 * Uses the Jest-mocked UmbraService singleton.
 */

const { UmbraService } = require('@umbra/service');

describe('Chat features', () => {
  let svc: InstanceType<typeof UmbraService>;

  beforeAll(async () => {
    await UmbraService.initialize();
    svc = UmbraService.instance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Edit ──────────────────────────────────────────────────────────────

  test('editMessage returns updated message with edited flag', async () => {
    const result = await svc.editMessage('msg-1', 'Updated text');
    expect(result).toBeDefined();
    expect(result.id).toBe('msg-1');
    expect(result.content.text).toBe('Updated text');
    expect(result.edited).toBe(true);
    expect(typeof result.editedAt).toBe('number');
  });

  test('editMessage calls service with correct args', async () => {
    await svc.editMessage('msg-42', 'new content');
    expect(svc.editMessage).toHaveBeenCalledWith('msg-42', 'new content');
  });

  // ── Delete ────────────────────────────────────────────────────────────

  test('deleteMessage resolves without error', async () => {
    await expect(svc.deleteMessage('msg-1')).resolves.not.toThrow();
  });

  test('deleteMessage calls service with message id', async () => {
    await svc.deleteMessage('msg-99');
    expect(svc.deleteMessage).toHaveBeenCalledWith('msg-99');
  });

  // ── Pin / Unpin ───────────────────────────────────────────────────────

  test('pinMessage returns message with pinned flag', async () => {
    const result = await svc.pinMessage('msg-1');
    expect(result).toBeDefined();
    expect(result.pinned).toBe(true);
    expect(typeof result.pinnedAt).toBe('number');
  });

  test('unpinMessage resolves without error', async () => {
    await expect(svc.unpinMessage('msg-1')).resolves.not.toThrow();
  });

  test('getPinnedMessages returns array', async () => {
    const result = await svc.getPinnedMessages('conv-1');
    expect(Array.isArray(result)).toBe(true);
  });

  // ── Reactions ─────────────────────────────────────────────────────────

  test('addReaction returns reaction array with correct emoji', async () => {
    const reactions = await svc.addReaction('msg-1', '👍');
    expect(Array.isArray(reactions)).toBe(true);
    expect(reactions.length).toBeGreaterThan(0);
    expect(reactions[0].emoji).toBe('👍');
    expect(reactions[0].count).toBe(1);
    expect(reactions[0].reacted).toBe(true);
  });

  test('removeReaction returns array', async () => {
    const reactions = await svc.removeReaction('msg-1', '👍');
    expect(Array.isArray(reactions)).toBe(true);
  });

  // ── Forward ───────────────────────────────────────────────────────────

  test('forwardMessage returns new message with forwarded flag', async () => {
    const result = await svc.forwardMessage('msg-1', 'conv-2');
    expect(result).toBeDefined();
    expect(result.conversationId).toBe('conv-2');
    expect(result.forwarded).toBe(true);
    expect(typeof result.id).toBe('string');
  });

  // ── Threads ───────────────────────────────────────────────────────────

  test('getThreadReplies returns array', async () => {
    const replies = await svc.getThreadReplies('msg-parent');
    expect(Array.isArray(replies)).toBe(true);
  });

  test('sendThreadReply returns message object', async () => {
    const reply = await svc.sendThreadReply('msg-parent', 'Thread reply text');
    expect(reply).toBeDefined();
    expect(reply.content.text).toBe('Thread reply text');
    expect(typeof reply.id).toBe('string');
  });
});
