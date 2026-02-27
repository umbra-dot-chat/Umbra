/**
 * Typing Indicator Test Suite — 4 scenarios covering typing indicator lifecycle.
 *
 * Covers: basic typing visibility, start/stop flow, persistence without
 * explicit stop, and multiple concurrent typing users.
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

const typingBasic: Scenario = {
  name: 'typing-basic',
  description: 'A sends a typing indicator to B. B should see A as typing.',
  botCount: 2,
  timeout: 20_000,
  tags: ['smoke'],
  steps: [
    {
      name: 'A and B become friends',
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
      name: 'Resolve conversation ID between A and B',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        const friend = botB.friendList.find((f) => f.did === botA.identity.did);
        if (!friend?.conversationId) throw new Error('No conversationId found for A on B');
        ctx.state.set('convIdOnB', friend.conversationId);
      },
      timeout: 5_000,
    },
    {
      name: 'A starts typing and B sees it',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        botA.sendTypingIndicator(botB.identity.did, true);
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const botB = ctx.bots[1];
        const convId = ctx.state.get('convIdOnB') as string;
        return botB.isUserTyping(convId, ctx.bots[0].identity.did);
      },
      timeout: 10_000,
    },
  ],
};

const typingStartStop: Scenario = {
  name: 'typing-start-stop',
  description: 'A starts typing, waits 1s, then stops typing. B should no longer see A as typing.',
  botCount: 2,
  timeout: 20_000,
  tags: ['critical'],
  steps: [
    {
      name: 'A and B become friends',
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
      name: 'Resolve conversation ID between A and B',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        const friend = botB.friendList.find((f) => f.did === botA.identity.did);
        if (!friend?.conversationId) throw new Error('No conversationId found for A on B');
        ctx.state.set('convIdOnB', friend.conversationId);
      },
      timeout: 5_000,
    },
    {
      name: 'A starts typing',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        botA.sendTypingIndicator(botB.identity.did, true);
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const botB = ctx.bots[1];
        const convId = ctx.state.get('convIdOnB') as string;
        return botB.isUserTyping(convId, ctx.bots[0].identity.did);
      },
      timeout: 10_000,
    },
    {
      name: 'A stops typing after 1s and B no longer sees A typing',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        await sleep(1000);
        botA.sendTypingIndicator(botB.identity.did, false);
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const botB = ctx.bots[1];
        const convId = ctx.state.get('convIdOnB') as string;
        return !botB.isUserTyping(convId, ctx.bots[0].identity.did);
      },
      timeout: 10_000,
    },
  ],
};

const typingAutoTimeout: Scenario = {
  name: 'typing-auto-timeout',
  description: 'A starts typing and never explicitly stops. After 10s the typing indicator should still be tracked (no auto-cleanup).',
  botCount: 2,
  timeout: 20_000,
  tags: [],
  steps: [
    {
      name: 'A and B become friends',
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
      name: 'Resolve conversation ID between A and B',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        const friend = botB.friendList.find((f) => f.did === botA.identity.did);
        if (!friend?.conversationId) throw new Error('No conversationId found for A on B');
        ctx.state.set('convIdOnB', friend.conversationId);
      },
      timeout: 5_000,
    },
    {
      name: 'A starts typing and B receives the indicator',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        botA.sendTypingIndicator(botB.identity.did, true);
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const botB = ctx.bots[1];
        const convId = ctx.state.get('convIdOnB') as string;
        return botB.isUserTyping(convId, ctx.bots[0].identity.did);
      },
      timeout: 5_000,
    },
    {
      name: 'Wait 10s and verify typing indicator persists',
      action: async (ctx: ScenarioContext) => {
        // A never sends isTyping=false — wait and check persistence
        await sleep(10_000);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const botB = ctx.bots[1];
        const convId = ctx.state.get('convIdOnB') as string;
        // Typing state should persist since there was no explicit stop
        return botB.isUserTyping(convId, ctx.bots[0].identity.did);
      },
      timeout: 15_000,
    },
  ],
};

const typingMultipleUsers: Scenario = {
  name: 'typing-multiple-users',
  description: 'A befriends B and C. B and C both start typing to A. A should see typing indicators in both conversations.',
  botCount: 3,
  timeout: 30_000,
  tags: [],
  steps: [
    {
      name: 'A befriends B and C',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB, botC] = ctx.bots;
        botA.sendFriendRequest(botB.identity.did);
        botA.sendFriendRequest(botC.identity.did);
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const [botA, botB, botC] = ctx.bots;
        return botA.friendCount >= 2 && botB.friendCount >= 1 && botC.friendCount >= 1;
      },
      timeout: 15_000,
    },
    {
      name: 'Resolve conversation IDs for A with B and C',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB, botC] = ctx.bots;

        const friendB = botA.friendList.find((f) => f.did === botB.identity.did);
        if (!friendB?.conversationId) throw new Error('No conversationId found for B on A');
        ctx.state.set('convIdAB', friendB.conversationId);

        const friendC = botA.friendList.find((f) => f.did === botC.identity.did);
        if (!friendC?.conversationId) throw new Error('No conversationId found for C on A');
        ctx.state.set('convIdAC', friendC.conversationId);
      },
      timeout: 5_000,
    },
    {
      name: 'B and C both start typing to A',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB, botC] = ctx.bots;
        botB.sendTypingIndicator(botA.identity.did, true);
        botC.sendTypingIndicator(botA.identity.did, true);
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const [botA, botB, botC] = ctx.bots;
        const convIdAB = ctx.state.get('convIdAB') as string;
        const convIdAC = ctx.state.get('convIdAC') as string;

        const bTyping = botA.isUserTyping(convIdAB, botB.identity.did);
        const cTyping = botA.isUserTyping(convIdAC, botC.identity.did);
        return bTyping && cTyping;
      },
      timeout: 10_000,
    },
    {
      name: 'A sees 2 typing users across conversations',
      action: async (ctx: ScenarioContext) => {
        // Already validated in previous step, this is an additional check
        await sleep(200);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const [botA, botB, botC] = ctx.bots;
        const convIdAB = ctx.state.get('convIdAB') as string;
        const convIdAC = ctx.state.get('convIdAC') as string;

        const typingInAB = botA.getTypingUsers(convIdAB);
        const typingInAC = botA.getTypingUsers(convIdAC);

        // Each conversation should have exactly 1 typing user
        return typingInAB.length === 1 && typingInAC.length === 1;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Suite Registration
// ─────────────────────────────────────────────────────────────────────────────

registerSuite({
  name: 'typing',
  description: 'Typing indicator scenarios',
  scenarios: [
    typingBasic,
    typingStartStop,
    typingAutoTimeout,
    typingMultipleUsers,
  ],
});
