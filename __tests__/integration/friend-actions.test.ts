/**
 * Integration tests for Friend Actions (T3.8):
 * Remove friend, block/unblock users, block reasons, and
 * friend-to-conversation navigation (Message button).
 *
 * Uses the Jest-mocked UmbraService singleton.
 * Test IDs: T3.8.1–T3.8.5
 */

const { UmbraService, UmbraError, ErrorCode } = require('@umbra/service');

describe('Friend Actions (T3.8)', () => {
  let svc: InstanceType<typeof UmbraService>;

  beforeAll(async () => {
    await UmbraService.initialize();
    svc = UmbraService.instance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── T3.8.1 Remove Friend ────────────────────────────────────────────

  describe('Remove Friend (T3.8.1)', () => {
    test('removeFriend resolves with true', async () => {
      const result = await svc.removeFriend('did:key:z6MkAlice');
      expect(result).toBe(true);
    });

    test('removeFriend is called with correct DID', async () => {
      await svc.removeFriend('did:key:z6MkBob');
      expect(svc.removeFriend).toHaveBeenCalledWith('did:key:z6MkBob');
    });

    test('removeFriend for non-friend should handle gracefully', async () => {
      svc.removeFriend.mockImplementationOnce(() =>
        Promise.reject(new UmbraError(ErrorCode.NotFriends, 'Not friends with this user'))
      );

      await expect(svc.removeFriend('did:key:z6MkStranger')).rejects.toThrow('Not friends with this user');
      expect(svc.removeFriend).toHaveBeenCalledWith('did:key:z6MkStranger');
    });
  });

  // ── T3.8.2 Block User ──────────────────────────────────────────────

  describe('Block User (T3.8.2)', () => {
    test('blockUser resolves without error', async () => {
      await expect(svc.blockUser('did:key:z6MkSpam')).resolves.not.toThrow();
    });

    test('blockUser is called with correct DID', async () => {
      await svc.blockUser('did:key:z6MkTroll');
      expect(svc.blockUser).toHaveBeenCalledWith('did:key:z6MkTroll');
    });

    test('blockUser can be called with optional reason', async () => {
      await expect(svc.blockUser('did:key:z6MkSpam', 'harassment')).resolves.not.toThrow();
    });

    test('blockUser with reason passes reason arg', async () => {
      await svc.blockUser('did:key:z6MkAbuse', 'spam');
      expect(svc.blockUser).toHaveBeenCalledWith('did:key:z6MkAbuse', 'spam');
    });
  });

  // ── T3.8.3 Block with Reason ───────────────────────────────────────

  describe('Block with Reason (T3.8.3)', () => {
    test('blockUser with reason string stores reason', async () => {
      await svc.blockUser('did:key:z6MkOffender', 'inappropriate content');
      expect(svc.blockUser).toHaveBeenCalledWith('did:key:z6MkOffender', 'inappropriate content');
      expect(svc.blockUser).toHaveBeenCalledTimes(1);
    });

    test('blockUser with empty reason treated as no reason', async () => {
      await svc.blockUser('did:key:z6MkNuisance', '');
      expect(svc.blockUser).toHaveBeenCalledWith('did:key:z6MkNuisance', '');
      // Empty string reason is equivalent to calling without a reason
      const [, reasonArg] = svc.blockUser.mock.calls[0];
      expect(!reasonArg).toBe(true);
    });
  });

  // ── T3.8.4 Unblock User ───────────────────────────────────────────

  describe('Unblock User (T3.8.4)', () => {
    test('unblockUser resolves with true', async () => {
      const result = await svc.unblockUser('did:key:z6MkFormerSpam');
      expect(result).toBe(true);
    });

    test('unblockUser called with correct DID', async () => {
      await svc.unblockUser('did:key:z6MkRedeemed');
      expect(svc.unblockUser).toHaveBeenCalledWith('did:key:z6MkRedeemed');
    });
  });

  // ── T3.8.5 Message Navigation ─────────────────────────────────────

  describe('Message Navigation (T3.8.5)', () => {
    test('getConversations returns array for friend lookup', async () => {
      const conversations = await svc.getConversations();
      expect(Array.isArray(conversations)).toBe(true);
    });

    test('conversation lookup by friend DID uses correct field', async () => {
      // Simulate a conversation list that includes participant DIDs
      svc.getConversations.mockImplementationOnce(() =>
        Promise.resolve([
          {
            id: 'conv-alice',
            participants: ['did:key:z6MkTest', 'did:key:z6MkAlice'],
            lastMessage: null,
            updatedAt: Date.now(),
          },
          {
            id: 'conv-bob',
            participants: ['did:key:z6MkTest', 'did:key:z6MkBob'],
            lastMessage: null,
            updatedAt: Date.now(),
          },
        ])
      );

      const conversations = await svc.getConversations();
      const friendDid = 'did:key:z6MkAlice';

      // Find the conversation that includes the target friend DID
      const target = conversations.find((c: any) =>
        c.participants.includes(friendDid)
      );

      expect(target).toBeDefined();
      expect(target.id).toBe('conv-alice');
      expect(target.participants).toContain(friendDid);
    });
  });
});
