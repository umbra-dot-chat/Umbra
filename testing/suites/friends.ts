/**
 * Friends Test Suite — 8 scenarios covering friend request lifecycle.
 *
 * Covers: happy path, rejection, simultaneous requests (Bug #8),
 * duplicate prevention, offline request/response delivery,
 * rapid-fire deduplication, and three-way friendships.
 */

import {
  type Scenario,
  type ScenarioContext,
  registerSuite,
  sleep,
  pollUntil,
} from '../scenarios.js';

// ─────────────────────────────────────────────────────────────────────────────
// Scenarios
// ─────────────────────────────────────────────────────────────────────────────

const friendsHappyPath: Scenario = {
  name: 'friends-happy-path',
  description: 'A sends a friend request to B (auto-accept enabled). Both should end up as friends.',
  botCount: 2,
  timeout: 30_000,
  tags: ['smoke', 'critical'],
  steps: [
    {
      name: 'A sends friend request to B',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        botA.sendFriendRequest(botB.identity.did);
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const [botA, botB] = ctx.bots;
        const aHasB = botA.friendList.some((f) => f.did === botB.identity.did);
        const bHasA = botB.friendList.some((f) => f.did === botA.identity.did);
        return botA.friendCount >= 1 && botB.friendCount >= 1 && aHasB && bHasA;
      },
      timeout: 15_000,
    },
  ],
};

const friendsRejection: Scenario = {
  name: 'friends-rejection',
  description: 'A sends a friend request to B, who has auto-accept disabled. B rejects the request.',
  botCount: 2,
  timeout: 30_000,
  tags: ['critical'],
  steps: [
    {
      name: 'Disable B auto-accept and A sends friend request',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        // Monkey-patch B's config to disable auto-accept before the request arrives
        (botB as any).config.autoAcceptFriends = false;

        botA.sendFriendRequest(botB.identity.did);
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const botB = ctx.bots[1];
        // B should have a pending incoming request
        const incoming = botB.pendingRequestList.filter((r) => r.direction === 'incoming');
        return incoming.length >= 1;
      },
      timeout: 10_000,
    },
    {
      name: 'B rejects the friend request',
      action: async (ctx: ScenarioContext) => {
        const botB = ctx.bots[1];
        const incoming = botB.pendingRequestList.filter((r) => r.direction === 'incoming');
        if (incoming.length === 0) throw new Error('No incoming request found on B');

        const requestId = incoming[0].id;
        ctx.state.set('rejectedRequestId', requestId);
        botB.rejectFriendRequest(requestId);
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const [botA, botB] = ctx.bots;
        // Neither bot should have the other as a friend
        const aHasB = botA.friendList.some((f) => f.did === botB.identity.did);
        const bHasA = botB.friendList.some((f) => f.did === botA.identity.did);
        return !aHasB && !bHasA;
      },
      timeout: 10_000,
    },
  ],
};

const friendsSimultaneous: Scenario = {
  name: 'friends-simultaneous',
  description: 'Both bots send friend requests to each other simultaneously (Bug #8 race condition). Both should become friends.',
  botCount: 2,
  timeout: 30_000,
  tags: ['critical', 'bug'],
  steps: [
    {
      name: 'A and B send friend requests to each other simultaneously',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        // Fire both requests without awaiting in between
        botA.sendFriendRequest(botB.identity.did);
        botB.sendFriendRequest(botA.identity.did);
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const [botA, botB] = ctx.bots;
        return botA.friendCount >= 1 && botB.friendCount >= 1;
      },
      timeout: 15_000,
    },
  ],
};

const friendsAlreadyFriends: Scenario = {
  name: 'friends-already-friends',
  description: 'A and B become friends, then A sends a duplicate friend request. No crash, no duplicate friendship.',
  botCount: 2,
  timeout: 30_000,
  tags: [],
  steps: [
    {
      name: 'A sends friend request to B and they become friends',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        botA.sendFriendRequest(botB.identity.did);
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const [botA, botB] = ctx.bots;
        return botA.friendCount >= 1 && botB.friendCount >= 1;
      },
      timeout: 15_000,
    },
    {
      name: 'A sends a duplicate friend request to B',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        // Send another request even though they are already friends
        botA.sendFriendRequest(botB.identity.did);
        await sleep(1000);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const [botA, botB] = ctx.bots;
        // Should still have exactly 1 friend each, no duplicates
        return botA.friendCount === 1 && botB.friendCount === 1;
      },
      timeout: 10_000,
    },
  ],
};

const friendsOfflineRequest: Scenario = {
  name: 'friends-offline-request',
  description: 'A sends a friend request while B is offline. B reconnects and receives the request.',
  botCount: 2,
  timeout: 45_000,
  tags: ['resilience'],
  steps: [
    {
      name: 'Enable reconnect on B and disconnect B',
      action: async (ctx: ScenarioContext) => {
        const botB = ctx.bots[1];
        botB.relayClient.enableReconnect(5, 500);
        botB.relayClient.simulateDisconnect();
        // Wait for disconnect to take effect
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const botB = ctx.bots[1];
        return !botB.relayClient.connected;
      },
      timeout: 5_000,
    },
    {
      name: 'A sends friend request while B is offline',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        botA.sendFriendRequest(botB.identity.did);
        await sleep(500);
      },
      timeout: 5_000,
    },
    {
      name: 'B reconnects and they become friends',
      action: async (ctx: ScenarioContext) => {
        // B should auto-reconnect via enableReconnect.
        // Wait for B to be connected again.
        const botB = ctx.bots[1];
        const reconnected = await pollUntil(() => botB.relayClient.connected, 15_000);
        if (!reconnected) throw new Error('B failed to reconnect within timeout');
        // Give time for offline messages to be processed
        await sleep(2000);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const [botA, botB] = ctx.bots;
        const aHasB = botA.friendList.some((f) => f.did === botB.identity.did);
        const bHasA = botB.friendList.some((f) => f.did === botA.identity.did);
        return aHasB && bHasA;
      },
      timeout: 25_000,
    },
  ],
};

const friendsOfflineResponse: Scenario = {
  name: 'friends-offline-response',
  description: 'A sends request, B gets it, A goes offline, B accepts, A reconnects. Both become friends.',
  botCount: 2,
  timeout: 45_000,
  tags: ['resilience'],
  steps: [
    {
      name: 'Disable auto-accept on both bots, A sends request to B',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        (botA as any).config.autoAcceptFriends = false;
        (botB as any).config.autoAcceptFriends = false;
        botA.sendFriendRequest(botB.identity.did);
        await sleep(500);
      },
      timeout: 5_000,
    },
    {
      name: 'B receives the pending request',
      action: async (ctx: ScenarioContext) => {
        // Poll until B has the incoming request
        const botB = ctx.bots[1];
        const found = await pollUntil(() => {
          return botB.pendingRequestList.some((r) => r.direction === 'incoming');
        }, 10_000);
        if (!found) throw new Error('B did not receive the pending request');
      },
      timeout: 12_000,
    },
    {
      name: 'Disconnect A with reconnect enabled',
      action: async (ctx: ScenarioContext) => {
        const botA = ctx.bots[0];
        botA.relayClient.enableReconnect(5, 500);
        botA.relayClient.simulateDisconnect();
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        return !ctx.bots[0].relayClient.connected;
      },
      timeout: 5_000,
    },
    {
      name: 'B accepts the friend request while A is offline',
      action: async (ctx: ScenarioContext) => {
        const botB = ctx.bots[1];
        const incoming = botB.pendingRequestList.filter((r) => r.direction === 'incoming');
        if (incoming.length === 0) throw new Error('No incoming request on B');
        botB.acceptFriendRequest(incoming[0].id);
        await sleep(500);
      },
      timeout: 5_000,
    },
    {
      name: 'A reconnects and both are friends',
      action: async (ctx: ScenarioContext) => {
        const botA = ctx.bots[0];
        const reconnected = await pollUntil(() => botA.relayClient.connected, 15_000);
        if (!reconnected) throw new Error('A failed to reconnect within timeout');
        // Give time for offline messages to process
        await sleep(2000);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const [botA, botB] = ctx.bots;
        const aHasB = botA.friendList.some((f) => f.did === botB.identity.did);
        const bHasA = botB.friendList.some((f) => f.did === botA.identity.did);
        return aHasB && bHasA;
      },
      timeout: 20_000,
    },
  ],
};

const friendsRapidRequests: Scenario = {
  name: 'friends-rapid-requests',
  description: 'A sends 5 friend requests rapidly to B. Only 1 friendship should be established (no duplicates).',
  botCount: 2,
  timeout: 30_000,
  tags: ['stress'],
  steps: [
    {
      name: 'A sends 5 rapid friend requests to B',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        for (let i = 0; i < 5; i++) {
          botA.sendFriendRequest(botB.identity.did, `Request ${i + 1}`);
        }
        await sleep(2000);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const [botA, botB] = ctx.bots;
        // Exactly 1 friendship should be established, no duplicates
        return botA.friendCount === 1 && botB.friendCount === 1;
      },
      timeout: 15_000,
    },
  ],
};

const friendsThreeWay: Scenario = {
  name: 'friends-three-way',
  description: 'Three bots all befriend each other (A-B, A-C, B-C). Each ends up with 2 friends.',
  botCount: 3,
  timeout: 30_000,
  tags: ['smoke'],
  steps: [
    {
      name: 'All three bots send friend requests to each other',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB, botC] = ctx.bots;

        // A -> B, A -> C
        botA.sendFriendRequest(botB.identity.did);
        botA.sendFriendRequest(botC.identity.did);

        await sleep(300);

        // B -> C
        botB.sendFriendRequest(botC.identity.did);

        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const [botA, botB, botC] = ctx.bots;
        return botA.friendCount >= 2 && botB.friendCount >= 2 && botC.friendCount >= 2;
      },
      timeout: 20_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Suite Registration
// ─────────────────────────────────────────────────────────────────────────────

registerSuite({
  name: 'friends',
  description: 'Friend request lifecycle: send, accept, reject, offline delivery, deduplication, and multi-party.',
  scenarios: [
    friendsHappyPath,
    friendsRejection,
    friendsSimultaneous,
    friendsAlreadyFriends,
    friendsOfflineRequest,
    friendsOfflineResponse,
    friendsRapidRequests,
    friendsThreeWay,
  ],
});
