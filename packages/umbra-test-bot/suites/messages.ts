/**
 * Messages Test Suite — 10 scenarios covering core messaging functionality.
 *
 * Covers: happy path, bidirectional, rapid-fire, large payloads, offline
 * delivery, offline dedup, status receipts, ordering, unicode, and broadcast.
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
// 1. messages-happy-path
// ─────────────────────────────────────────────────────────────────────────────

const messagesHappyPath: Scenario = {
  name: 'messages-happy-path',
  description: 'A sends a single message to B and B receives it with correct content.',
  botCount: 2,
  timeout: 30_000,
  tags: ['smoke', 'critical'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'A sends "Hello B!" to B',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        const msgId = a.sendMessage(b.identity.did, 'Hello B!');
        ctx.state.set('msgId', msgId);
        await sleep(200);
      },
    },
    {
      name: 'Validate B received the message with correct content',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const last = b.lastReceivedMessage;
        return last !== null && last.content === 'Hello B!';
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. messages-bidirectional
// ─────────────────────────────────────────────────────────────────────────────

const messagesBidirectional: Scenario = {
  name: 'messages-bidirectional',
  description: 'A sends to B, B sends to A — both receive each other\'s messages.',
  botCount: 2,
  timeout: 30_000,
  tags: ['smoke'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'A sends to B, then B sends to A',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        const msgA = a.sendMessage(b.identity.did, 'Message from A');
        await sleep(500);
        const msgB = b.sendMessage(a.identity.did, 'Message from B');
        ctx.state.set('msgA', msgA);
        ctx.state.set('msgB', msgB);
        await sleep(200);
      },
    },
    {
      name: 'Validate both received each other\'s messages',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        const bReceived = b.messageTracker.getReceivedFrom(a.identity.did);
        const aReceived = a.messageTracker.getReceivedFrom(b.identity.did);
        const bGotIt = bReceived.some((m) => m.content === 'Message from A');
        const aGotIt = aReceived.some((m) => m.content === 'Message from B');
        return bGotIt && aGotIt;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. messages-rapid-fire
// ─────────────────────────────────────────────────────────────────────────────

const messagesRapidFire: Scenario = {
  name: 'messages-rapid-fire',
  description: 'A sends 50 messages rapidly to B and all are received.',
  botCount: 2,
  timeout: 60_000,
  tags: ['stress'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'A sends 50 messages rapidly',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        for (let i = 0; i < 50; i++) {
          a.sendMessage(b.identity.did, `msg-${i}`);
        }
        await sleep(200);
      },
      timeout: 30_000,
    },
    {
      name: 'Validate B received all 50 messages',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        const received = b.messageTracker.getReceivedFrom(a.identity.did);
        return received.length >= 50;
      },
      timeout: 45_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. messages-large-payload
// ─────────────────────────────────────────────────────────────────────────────

const messagesLargePayload: Scenario = {
  name: 'messages-large-payload',
  description: 'A sends a 64KB message to B and B receives it with correct length.',
  botCount: 2,
  timeout: 30_000,
  tags: ['critical'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'A sends a 64KB message',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        const largePayload = 'x'.repeat(65536);
        const msgId = a.sendMessage(b.identity.did, largePayload);
        ctx.state.set('msgId', msgId);
        ctx.state.set('expectedLength', 65536);
        await sleep(200);
      },
    },
    {
      name: 'Validate B received the message with correct length',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const expectedLength = ctx.state.get('expectedLength') as number;
        const last = b.lastReceivedMessage;
        return last !== null && last.content.length === expectedLength;
      },
      timeout: 15_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. messages-offline-delivery
// ─────────────────────────────────────────────────────────────────────────────

const messagesOfflineDelivery: Scenario = {
  name: 'messages-offline-delivery',
  description: 'A sends 3 messages while B is offline; B reconnects and receives all 3.',
  botCount: 2,
  timeout: 45_000,
  tags: ['resilience', 'critical'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'Disconnect B from relay',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        b.relayClient.enableReconnect();
        b.relayClient.simulateDisconnect();
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        return !ctx.bots[1].relayClient.connected;
      },
      timeout: 10_000,
    },
    {
      name: 'A sends 3 messages while B is offline',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        const ids: string[] = [];
        ids.push(a.sendMessage(b.identity.did, 'offline-msg-1'));
        ids.push(a.sendMessage(b.identity.did, 'offline-msg-2'));
        ids.push(a.sendMessage(b.identity.did, 'offline-msg-3'));
        ctx.state.set('offlineMsgIds', ids);
        await sleep(500);
      },
    },
    {
      name: 'Reconnect B and validate all 3 messages received',
      action: async (ctx: ScenarioContext) => {
        // B will auto-reconnect since we enabled reconnect
        await pollUntil(() => ctx.bots[1].relayClient.connected, 15_000);
        await sleep(1000);
      },
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        const received = b.messageTracker.getReceivedFrom(a.identity.did);
        const contents = received.map((m) => m.content);
        return (
          contents.includes('offline-msg-1') &&
          contents.includes('offline-msg-2') &&
          contents.includes('offline-msg-3')
        );
      },
      timeout: 20_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. messages-offline-dedup (Bug #6)
// ─────────────────────────────────────────────────────────────────────────────

const messagesOfflineDedup: Scenario = {
  name: 'messages-offline-dedup',
  description: 'Bug #6: Messages are not duplicated after multiple disconnect/reconnect cycles.',
  botCount: 2,
  timeout: 60_000,
  tags: ['resilience', 'bug'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'Enable reconnect on B and disconnect',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        b.relayClient.enableReconnect();
        b.relayClient.simulateDisconnect();
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        return !ctx.bots[1].relayClient.connected;
      },
      timeout: 10_000,
    },
    {
      name: 'A sends 2 messages while B is offline',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        a.sendMessage(b.identity.did, 'dedup-msg-1');
        a.sendMessage(b.identity.did, 'dedup-msg-2');
        await sleep(500);
      },
    },
    {
      name: 'Reconnect B and wait for delivery',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        await pollUntil(() => b.relayClient.connected, 15_000);
        // Wait for messages to arrive
        await pollUntil(() => {
          const received = b.messageTracker.getReceivedFrom(ctx.bots[0].identity.did);
          return received.length >= 2;
        }, 10_000);
        // Record count after first reconnect
        const received = b.messageTracker.getReceivedFrom(ctx.bots[0].identity.did);
        ctx.state.set('countAfterFirstReconnect', received.length);
        await sleep(500);
      },
      timeout: 20_000,
    },
    {
      name: 'Disconnect B again, then reconnect',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        b.relayClient.simulateDisconnect();
        await sleep(1000);
        // Wait for auto-reconnect
        await pollUntil(() => b.relayClient.connected, 15_000);
        // Give time for any duplicate offline messages to arrive
        await sleep(2000);
      },
      timeout: 20_000,
    },
    {
      name: 'Validate no duplicate messages received',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        const received = b.messageTracker.getReceivedFrom(a.identity.did);
        const countAfterFirst = ctx.state.get('countAfterFirstReconnect') as number;
        // Total received should equal the count after first reconnect (no duplicates)
        return received.length === countAfterFirst;
      },
      timeout: 5_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. messages-status-receipts
// ─────────────────────────────────────────────────────────────────────────────

const messagesStatusReceipts: Scenario = {
  name: 'messages-status-receipts',
  description: 'A sends a message, then receives "delivered" and "read" status receipts from B.',
  botCount: 2,
  timeout: 30_000,
  tags: ['critical'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'A sends a message to B',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        const msgId = a.sendMessage(b.identity.did, 'Check my receipts');
        ctx.state.set('msgId', msgId);
        await sleep(200);
      },
    },
    {
      name: 'Validate A gets "delivered" status',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const msgId = ctx.state.get('msgId') as string;
        const status = a.getMessageStatus(msgId);
        return status === 'delivered' || status === 'read';
      },
      timeout: 10_000,
    },
    {
      name: 'Validate A gets "read" status',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const msgId = ctx.state.get('msgId') as string;
        return a.getMessageStatus(msgId) === 'read';
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. messages-ordering
// ─────────────────────────────────────────────────────────────────────────────

const messagesOrdering: Scenario = {
  name: 'messages-ordering',
  description: 'A sends m-1, m-2, m-3 rapidly and B receives them in order.',
  botCount: 2,
  timeout: 30_000,
  tags: ['critical'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'A sends m-1, m-2, m-3 rapidly',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        a.sendMessage(b.identity.did, 'm-1');
        a.sendMessage(b.identity.did, 'm-2');
        a.sendMessage(b.identity.did, 'm-3');
        await sleep(200);
      },
    },
    {
      name: 'Validate B received messages in order',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        const received = b.messageTracker.getReceivedFrom(a.identity.did);
        if (received.length < 3) return false;
        return (
          received[0].content === 'm-1' &&
          received[1].content === 'm-2' &&
          received[2].content === 'm-3'
        );
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. messages-unicode
// ─────────────────────────────────────────────────────────────────────────────

const messagesUnicode: Scenario = {
  name: 'messages-unicode',
  description: 'A sends emoji, CJK, and RTL messages; B receives all with correct content.',
  botCount: 2,
  timeout: 30_000,
  tags: [],
  steps: [
    befriendStep(0, 1),
    {
      name: 'A sends three unicode messages',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        a.sendMessage(b.identity.did, 'Hello \u{1F30D}\u{1F680}');
        await sleep(100);
        a.sendMessage(b.identity.did, '\u4F60\u597D\u4E16\u754C');
        await sleep(100);
        a.sendMessage(b.identity.did, '\u0645\u0631\u062D\u0628\u0627');
        await sleep(200);
      },
    },
    {
      name: 'Validate B received all 3 unicode messages with correct content',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        const received = b.messageTracker.getReceivedFrom(a.identity.did);
        if (received.length < 3) return false;
        const contents = received.map((m) => m.content);
        return (
          contents.includes('Hello \u{1F30D}\u{1F680}') &&
          contents.includes('\u4F60\u597D\u4E16\u754C') &&
          contents.includes('\u0645\u0631\u062D\u0628\u0627')
        );
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. messages-broadcast
// ─────────────────────────────────────────────────────────────────────────────

const messagesBroadcast: Scenario = {
  name: 'messages-broadcast',
  description: 'A befriends B and C, broadcasts a message, both B and C receive it.',
  botCount: 3,
  timeout: 30_000,
  tags: ['smoke'],
  steps: [
    {
      name: 'Befriend A with B and C',
      action: async (ctx: ScenarioContext) => {
        const [a, b, c] = ctx.bots;
        a.sendFriendRequest(b.identity.did);
        await sleep(300);
        a.sendFriendRequest(c.identity.did);
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        const [a, b, c] = ctx.bots;
        return a.friendCount >= 2 && b.friendCount >= 1 && c.friendCount >= 1;
      },
      timeout: 15_000,
    },
    {
      name: 'A broadcasts "Hello everyone!"',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        a.broadcastMessage('Hello everyone!');
        await sleep(200);
      },
    },
    {
      name: 'Validate both B and C received the broadcast',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b, c] = ctx.bots;
        const bReceived = b.messageTracker.getReceivedFrom(a.identity.did);
        const cReceived = c.messageTracker.getReceivedFrom(a.identity.did);
        const bGotIt = bReceived.some((m) => m.content === 'Hello everyone!');
        const cGotIt = cReceived.some((m) => m.content === 'Hello everyone!');
        return bGotIt && cGotIt;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Register suite
// ─────────────────────────────────────────────────────────────────────────────

registerSuite({
  name: 'messages',
  description: 'Core messaging scenarios: send, receive, offline delivery, ordering, unicode, broadcast.',
  scenarios: [
    messagesHappyPath,
    messagesBidirectional,
    messagesRapidFire,
    messagesLargePayload,
    messagesOfflineDelivery,
    messagesOfflineDedup,
    messagesStatusReceipts,
    messagesOrdering,
    messagesUnicode,
    messagesBroadcast,
  ],
});
