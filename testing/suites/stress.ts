/**
 * Stress Test Suite — 5 scenarios covering high-load and concurrency behavior.
 *
 * Covers: message burst, concurrent friendships, full mesh messaging,
 * large group delivery, and concurrent calls.
 */

import {
  type Scenario,
  type ScenarioContext,
  registerSuite,
  sleep,
  pollUntil,
} from '../scenarios.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Standard "befriend two bots" step — A sends request to B, poll until mutual. */
function befriendStep(aIndex: number, bIndex: number, timeout = 10_000) {
  return {
    name: `Befriend bot ${aIndex} and bot ${bIndex}`,
    action: async (ctx: ScenarioContext) => {
      const a = ctx.bots[aIndex];
      const b = ctx.bots[bIndex];
      a.sendFriendRequest(b.identity.did);
      await sleep(500);
    },
    validate: (ctx: ScenarioContext) => {
      return ctx.bots[aIndex].friendCount >= 1 && ctx.bots[bIndex].friendCount >= 1;
    },
    timeout,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. stress-message-burst
// ─────────────────────────────────────────────────────────────────────────────

const stressMessageBurst: Scenario = {
  name: 'stress-message-burst',
  description: 'A sends 200 messages as fast as possible to B and all are received.',
  botCount: 2,
  timeout: 120_000,
  tags: ['stress'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'A sends 200 messages as fast as possible',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        for (let i = 0; i < 200; i++) {
          a.sendMessage(b.identity.did, `burst-${i}`);
        }
        await sleep(200);
      },
      timeout: 30_000,
    },
    {
      name: 'Validate B received all 200 messages',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        return b.messageTracker.totalCount >= 200;
      },
      timeout: 90_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. stress-concurrent-friendships
// ─────────────────────────────────────────────────────────────────────────────

const stressConcurrentFriendships: Scenario = {
  name: 'stress-concurrent-friendships',
  description: '8 bots form all 28 possible friendship pairs concurrently. Every bot ends up with 7 friends.',
  botCount: 8,
  timeout: 120_000,
  tags: ['stress', 'slow'],
  steps: [
    {
      name: 'All bots send friend requests to form 28 pairs',
      action: async (ctx: ScenarioContext) => {
        const bots = ctx.bots;
        // Bot 0 sends to 1-7, bot 1 sends to 2-7, etc.
        for (let i = 0; i < bots.length; i++) {
          for (let j = i + 1; j < bots.length; j++) {
            bots[i].sendFriendRequest(bots[j].identity.did);
          }
          await sleep(200);
        }
        await sleep(500);
      },
      timeout: 30_000,
    },
    {
      name: 'Validate every bot has at least 7 friends',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        return ctx.bots.every((bot) => bot.friendCount >= 7);
      },
      timeout: 60_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. stress-full-mesh
// ─────────────────────────────────────────────────────────────────────────────

const stressFullMesh: Scenario = {
  name: 'stress-full-mesh',
  description: '6 bots form a full mesh (15 pairs), then each sends a message to every friend (30 total). Each bot receives 5 messages.',
  botCount: 6,
  timeout: 120_000,
  tags: ['stress', 'slow'],
  steps: [
    {
      name: 'All 6 bots befriend each other (15 pairs)',
      action: async (ctx: ScenarioContext) => {
        const bots = ctx.bots;
        for (let i = 0; i < bots.length; i++) {
          for (let j = i + 1; j < bots.length; j++) {
            bots[i].sendFriendRequest(bots[j].identity.did);
          }
          await sleep(200);
        }
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        return ctx.bots.every((bot) => bot.friendCount >= 5);
      },
      timeout: 45_000,
    },
    {
      name: 'Each bot sends a message to every friend (30 messages total)',
      action: async (ctx: ScenarioContext) => {
        const bots = ctx.bots;
        for (let i = 0; i < bots.length; i++) {
          const friends = bots[i].friendList;
          for (const friend of friends) {
            bots[i].sendMessage(friend.did, `mesh-from-${i}`);
          }
        }
        await sleep(500);
      },
      timeout: 30_000,
    },
    {
      name: 'Validate each bot received exactly 5 messages',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        return ctx.bots.every((bot) => {
          const received = bot.messageTracker.getAllReceived();
          return received.length >= 5;
        });
      },
      timeout: 45_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. stress-large-group
// ─────────────────────────────────────────────────────────────────────────────

const stressLargeGroup: Scenario = {
  name: 'stress-large-group',
  description: 'Bot 0 befriends 9 others, creates a group with all, sends a message, and all 9 receive it.',
  botCount: 10,
  timeout: 120_000,
  tags: ['stress', 'slow'],
  steps: [
    {
      name: 'Bot 0 befriends bots 1-9',
      action: async (ctx: ScenarioContext) => {
        const admin = ctx.bots[0];
        for (let i = 1; i < ctx.bots.length; i++) {
          admin.sendFriendRequest(ctx.bots[i].identity.did);
          await sleep(300);
        }
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        return ctx.bots[0].friendCount >= 9;
      },
      timeout: 45_000,
    },
    {
      name: 'Bot 0 creates a group and invites all friends',
      action: async (ctx: ScenarioContext) => {
        const admin = ctx.bots[0];
        const groupId = admin.createGroupAndInviteAll('Stress Test Group');
        ctx.state.set('groupId', groupId);
        await sleep(1000);
      },
      timeout: 15_000,
    },
    {
      name: 'Wait for all bots to join the group',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        // All non-admin bots should have joined the group
        return ctx.bots.slice(1).every((bot) => bot.groupCount >= 1);
      },
      timeout: 30_000,
    },
    {
      name: 'Bot 0 sends a group message',
      action: async (ctx: ScenarioContext) => {
        const admin = ctx.bots[0];
        const groupId = ctx.state.get('groupId') as string;
        admin.sendGroupMessage(groupId, 'Hello large group!');
        await sleep(500);
      },
      timeout: 10_000,
    },
    {
      name: 'Validate all 9 other bots received the group message',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        return ctx.bots.slice(1).every((bot) => {
          const received = bot.messageTracker.getAllReceived();
          return received.some((m) => m.content === 'Hello large group!');
        });
      },
      timeout: 30_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. stress-concurrent-calls
// ─────────────────────────────────────────────────────────────────────────────

const stressConcurrentCalls: Scenario = {
  name: 'stress-concurrent-calls',
  description: 'Two pairs of bots (A-B, C-D) establish simultaneous calls, hold for 5s, then end cleanly.',
  botCount: 4,
  timeout: 60_000,
  tags: ['stress'],
  steps: [
    {
      name: 'Befriend A-B and C-D',
      action: async (ctx: ScenarioContext) => {
        const [a, b, c, d] = ctx.bots;
        a.sendFriendRequest(b.identity.did);
        c.sendFriendRequest(d.identity.did);
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        const [a, b, c, d] = ctx.bots;
        return a.friendCount >= 1 && b.friendCount >= 1 &&
               c.friendCount >= 1 && d.friendCount >= 1;
      },
      timeout: 15_000,
    },
    {
      name: 'A calls B and C calls D simultaneously',
      action: async (ctx: ScenarioContext) => {
        const [a, , c] = ctx.bots;
        const [, b, , d] = ctx.bots;
        // Start both calls in parallel
        await Promise.all([
          a.startCall(b.identity.did, 'voice'),
          c.startCall(d.identity.did, 'voice'),
        ]);
        await sleep(500);
      },
      timeout: 15_000,
    },
    {
      name: 'Wait for both calls to be connected',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, , c] = ctx.bots;
        const aConnected = a.currentCall?.status === 'connected';
        const cConnected = c.currentCall?.status === 'connected';
        return aConnected && cConnected;
      },
      timeout: 20_000,
    },
    {
      name: 'Hold both calls for 5 seconds then end',
      action: async (ctx: ScenarioContext) => {
        await sleep(5000);
        const [a, , c] = ctx.bots;
        a.endCall('completed');
        c.endCall('completed');
        await sleep(500);
      },
      timeout: 10_000,
    },
    {
      name: 'Validate all calls ended cleanly',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        return ctx.bots.every((bot) => bot.currentCall === null);
      },
      timeout: 5_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Register suite
// ─────────────────────────────────────────────────────────────────────────────

registerSuite({
  name: 'stress',
  description: 'Stress and load test scenarios',
  scenarios: [
    stressMessageBurst,
    stressConcurrentFriendships,
    stressFullMesh,
    stressLargeGroup,
    stressConcurrentCalls,
  ],
});
