import { type Scenario, type ScenarioContext, registerSuite, sleep, pollUntil } from '../scenarios.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Send a friend request from A to B and wait until both sides see each other. */
async function befriend(ctx: ScenarioContext, aIdx: number, bIdx: number): Promise<void> {
  const a = ctx.bots[aIdx];
  const b = ctx.bots[bIdx];
  a.sendFriendRequest(b.identity.did);
  const ok = await pollUntil(() => a.friendCount >= 1 && b.friendCount >= 1, 10000);
  if (!ok) throw new Error(`Befriend timed out between bot ${aIdx} and bot ${bIdx}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenarios
// ─────────────────────────────────────────────────────────────────────────────

const reactionsHappyPath: Scenario = {
  name: 'reactions-happy-path',
  description: 'A sends a message, B reacts with thumbs-up, A sees the reaction',
  botCount: 2,
  timeout: 30000,
  tags: ['smoke', 'critical'],
  steps: [
    {
      name: 'Befriend A and B',
      action: async (ctx) => { await befriend(ctx, 0, 1); },
    },
    {
      name: 'A sends a message to B',
      action: async (ctx) => {
        const a = ctx.bots[0];
        const b = ctx.bots[1];
        const messageId = a.sendMessage(b.identity.did, 'Hello from A!');
        ctx.state.set('messageId', messageId);
      },
    },
    {
      name: 'B adds a thumbs-up reaction',
      action: async (ctx) => {
        await sleep(1000);
        const b = ctx.bots[1];
        const a = ctx.bots[0];
        const messageId = ctx.state.get('messageId');
        b.addReaction(messageId, a.identity.did, '\u{1F44D}');
      },
    },
    {
      name: 'A sees the reaction on the message',
      action: async () => {},
      validate: (ctx) => {
        const a = ctx.bots[0];
        const messageId = ctx.state.get('messageId');
        const reactions = a.getReactionsForMessage(messageId);
        return reactions.length >= 1 && reactions.some((r) => r.emoji === '\u{1F44D}');
      },
      timeout: 10000,
    },
  ],
};

const reactionsMultipleEmoji: Scenario = {
  name: 'reactions-multiple-emoji',
  description: 'B adds three different emoji reactions to a single message from A',
  botCount: 2,
  timeout: 30000,
  steps: [
    {
      name: 'Befriend A and B',
      action: async (ctx) => { await befriend(ctx, 0, 1); },
    },
    {
      name: 'A sends a message to B',
      action: async (ctx) => {
        const a = ctx.bots[0];
        const b = ctx.bots[1];
        const messageId = a.sendMessage(b.identity.did, 'React to this!');
        ctx.state.set('messageId', messageId);
      },
    },
    {
      name: 'B adds three emoji reactions',
      action: async (ctx) => {
        await sleep(1000);
        const b = ctx.bots[1];
        const a = ctx.bots[0];
        const messageId = ctx.state.get('messageId');
        b.addReaction(messageId, a.identity.did, '\u{1F44D}');
        await sleep(200);
        b.addReaction(messageId, a.identity.did, '\u{2764}\u{FE0F}');
        await sleep(200);
        b.addReaction(messageId, a.identity.did, '\u{1F525}');
      },
    },
    {
      name: 'A sees all 3 reactions on the message',
      action: async () => {},
      validate: (ctx) => {
        const a = ctx.bots[0];
        const messageId = ctx.state.get('messageId');
        return a.getReactionsForMessage(messageId).length >= 3;
      },
      timeout: 10000,
    },
  ],
};

const reactionsMultiUser: Scenario = {
  name: 'reactions-multi-user',
  description: 'Both B and C react to the same message from A',
  botCount: 3,
  timeout: 30000,
  tags: ['smoke'],
  steps: [
    {
      name: 'A befriends B',
      action: async (ctx) => { await befriend(ctx, 0, 1); },
    },
    {
      name: 'A befriends C',
      action: async (ctx) => {
        const a = ctx.bots[0];
        const c = ctx.bots[2];
        a.sendFriendRequest(c.identity.did);
        const ok = await pollUntil(() => a.friendCount >= 2 && c.friendCount >= 1, 10000);
        if (!ok) throw new Error('Befriend A-C timed out');
      },
    },
    {
      name: 'A sends a message',
      action: async (ctx) => {
        const a = ctx.bots[0];
        const b = ctx.bots[1];
        // Send to B (we will also need C to know the messageId; reactions are
        // keyed on messageId regardless of who holds the message).
        const messageId = a.sendMessage(b.identity.did, 'Multi-user reaction test');
        ctx.state.set('messageId', messageId);
        // Also send the same text to C so the messageId envelope reaches C's relay.
        // Alternatively, B and C react independently referencing the same messageId.
      },
    },
    {
      name: 'B reacts with thumbs-up',
      action: async (ctx) => {
        await sleep(1000);
        const b = ctx.bots[1];
        const a = ctx.bots[0];
        const messageId = ctx.state.get('messageId');
        b.addReaction(messageId, a.identity.did, '\u{1F44D}');
      },
    },
    {
      name: 'C reacts with thumbs-up',
      action: async (ctx) => {
        const c = ctx.bots[2];
        const a = ctx.bots[0];
        const messageId = ctx.state.get('messageId');
        c.addReaction(messageId, a.identity.did, '\u{1F44D}');
      },
    },
    {
      name: 'A sees 2 reactions from different senders',
      action: async () => {},
      validate: (ctx) => {
        const a = ctx.bots[0];
        const b = ctx.bots[1];
        const c = ctx.bots[2];
        const messageId = ctx.state.get('messageId');
        const reactions = a.getReactionsForMessage(messageId);
        if (reactions.length < 2) return false;
        const senders = new Set(reactions.map((r) => r.senderDid));
        return senders.has(b.identity.did) && senders.has(c.identity.did);
      },
      timeout: 10000,
    },
  ],
};

const reactionsAddRemove: Scenario = {
  name: 'reactions-add-remove',
  description: 'B adds then removes a reaction; A ends up with no reactions on the message',
  botCount: 2,
  timeout: 30000,
  tags: ['critical'],
  steps: [
    {
      name: 'Befriend A and B',
      action: async (ctx) => { await befriend(ctx, 0, 1); },
    },
    {
      name: 'A sends a message to B',
      action: async (ctx) => {
        const a = ctx.bots[0];
        const b = ctx.bots[1];
        const messageId = a.sendMessage(b.identity.did, 'Add then remove');
        ctx.state.set('messageId', messageId);
      },
    },
    {
      name: 'B adds a thumbs-up reaction',
      action: async (ctx) => {
        await sleep(1000);
        const b = ctx.bots[1];
        const a = ctx.bots[0];
        const messageId = ctx.state.get('messageId');
        b.addReaction(messageId, a.identity.did, '\u{1F44D}');
      },
    },
    {
      name: 'Wait for A to receive the reaction',
      action: async () => {},
      validate: (ctx) => {
        const a = ctx.bots[0];
        const messageId = ctx.state.get('messageId');
        return a.getReactionsForMessage(messageId).length >= 1;
      },
      timeout: 10000,
    },
    {
      name: 'B removes the thumbs-up reaction',
      action: async (ctx) => {
        await sleep(1000);
        const b = ctx.bots[1];
        const a = ctx.bots[0];
        const messageId = ctx.state.get('messageId');
        b.removeReaction(messageId, a.identity.did, '\u{1F44D}');
      },
    },
    {
      name: 'A sees no reactions on the message',
      action: async () => {},
      validate: (ctx) => {
        const a = ctx.bots[0];
        const messageId = ctx.state.get('messageId');
        return a.getReactionsForMessage(messageId).length === 0;
      },
      timeout: 10000,
    },
  ],
};

const reactionsRemoveNonexistent: Scenario = {
  name: 'reactions-remove-nonexistent',
  description: 'B removes a reaction that was never added; bot should not crash',
  botCount: 2,
  timeout: 20000,
  steps: [
    {
      name: 'Befriend A and B',
      action: async (ctx) => { await befriend(ctx, 0, 1); },
    },
    {
      name: 'A sends a message to B',
      action: async (ctx) => {
        const a = ctx.bots[0];
        const b = ctx.bots[1];
        const messageId = a.sendMessage(b.identity.did, 'No reactions here');
        ctx.state.set('messageId', messageId);
      },
    },
    {
      name: 'B removes a non-existent thumbs-up reaction',
      action: async (ctx) => {
        await sleep(1000);
        const b = ctx.bots[1];
        const a = ctx.bots[0];
        const messageId = ctx.state.get('messageId');
        b.removeReaction(messageId, a.identity.did, '\u{1F44D}');
      },
    },
    {
      name: 'Both bots are still running',
      action: async () => {},
      validate: (ctx) => {
        return ctx.bots[0].isRunning && ctx.bots[1].isRunning;
      },
      timeout: 5000,
    },
  ],
};

const reactionsDuplicateAdd: Scenario = {
  name: 'reactions-duplicate-add',
  description: 'B adds the same reaction twice; validate no crash and reactions are present',
  botCount: 2,
  timeout: 30000,
  steps: [
    {
      name: 'Befriend A and B',
      action: async (ctx) => { await befriend(ctx, 0, 1); },
    },
    {
      name: 'A sends a message to B',
      action: async (ctx) => {
        const a = ctx.bots[0];
        const b = ctx.bots[1];
        const messageId = a.sendMessage(b.identity.did, 'Double reaction test');
        ctx.state.set('messageId', messageId);
      },
    },
    {
      name: 'B adds thumbs-up twice',
      action: async (ctx) => {
        await sleep(1000);
        const b = ctx.bots[1];
        const a = ctx.bots[0];
        const messageId = ctx.state.get('messageId');
        b.addReaction(messageId, a.identity.did, '\u{1F44D}');
        await sleep(500);
        b.addReaction(messageId, a.identity.did, '\u{1F44D}');
      },
    },
    {
      name: 'A sees at least one reaction and no crash occurs',
      action: async () => {},
      validate: (ctx) => {
        const a = ctx.bots[0];
        const messageId = ctx.state.get('messageId');
        // Depending on dedup behavior the count may be 1 or 2; either is acceptable.
        return a.getReactionsForMessage(messageId).length >= 1 && a.isRunning && ctx.bots[1].isRunning;
      },
      timeout: 10000,
    },
  ],
};

const reactionsOnThreadReply: Scenario = {
  name: 'reactions-on-thread-reply',
  description: 'A reacts to B\'s thread reply; B sees the reaction on their reply',
  botCount: 2,
  timeout: 30000,
  steps: [
    {
      name: 'Befriend A and B',
      action: async (ctx) => { await befriend(ctx, 0, 1); },
    },
    {
      name: 'A sends a root message to B',
      action: async (ctx) => {
        const a = ctx.bots[0];
        const b = ctx.bots[1];
        const messageId = a.sendMessage(b.identity.did, 'Root message for thread');
        ctx.state.set('rootMessageId', messageId);
      },
    },
    {
      name: 'B replies in thread',
      action: async (ctx) => {
        await sleep(1000);
        const b = ctx.bots[1];
        const a = ctx.bots[0];
        const rootId = ctx.state.get('rootMessageId');
        const replyId = b.sendThreadReply(rootId, a.identity.did, 'Thread reply from B');
        ctx.state.set('replyMessageId', replyId);
      },
    },
    {
      name: 'A adds a fire reaction to B\'s thread reply',
      action: async (ctx) => {
        await sleep(1000);
        const a = ctx.bots[0];
        const b = ctx.bots[1];
        const replyId = ctx.state.get('replyMessageId');
        a.addReaction(replyId, b.identity.did, '\u{1F525}');
      },
    },
    {
      name: 'B sees the reaction on their thread reply',
      action: async () => {},
      validate: (ctx) => {
        const b = ctx.bots[1];
        const replyId = ctx.state.get('replyMessageId');
        const reactions = b.getReactionsForMessage(replyId);
        return reactions.length >= 1 && reactions.some((r) => r.emoji === '\u{1F525}');
      },
      timeout: 10000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Register
// ─────────────────────────────────────────────────────────────────────────────

registerSuite({
  name: 'reactions',
  description: 'Reaction scenarios',
  scenarios: [
    reactionsHappyPath,
    reactionsMultipleEmoji,
    reactionsMultiUser,
    reactionsAddRemove,
    reactionsRemoveNonexistent,
    reactionsDuplicateAdd,
    reactionsOnThreadReply,
  ],
});
