/**
 * Receipts Test Suite — 5 scenarios covering message receipt lifecycle.
 *
 * Covers: delivered/read status flow, unknown message resilience,
 * out-of-order receipts, offline delivery, and batch receipt handling.
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

const receiptsDeliveredRead: Scenario = {
  name: 'receipts-delivered-read',
  description: 'A sends a message to B. B auto-sends delivered and read receipts. A should see the status progress to read.',
  botCount: 2,
  timeout: 30_000,
  tags: ['smoke', 'critical'],
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
      name: 'A sends a message to B',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        const msgId = botA.sendMessage(botB.identity.did, 'Hello from A');
        ctx.state.set('messageId', msgId);
        await sleep(500);
      },
      timeout: 5_000,
    },
    {
      name: 'B sends delivered receipt to A',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        const msgId = ctx.state.get('messageId') as string;
        botB.sendMessageStatus(msgId, botA.identity.did, 'delivered');
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const botA = ctx.bots[0];
        const msgId = ctx.state.get('messageId') as string;
        const status = botA.getMessageStatus(msgId);
        return status === 'delivered' || status === 'read';
      },
      timeout: 10_000,
    },
    {
      name: 'B sends read receipt to A and A sees read status',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        const msgId = ctx.state.get('messageId') as string;
        botB.sendMessageStatus(msgId, botA.identity.did, 'read');
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const botA = ctx.bots[0];
        const msgId = ctx.state.get('messageId') as string;
        return botA.getMessageStatus(msgId) === 'read';
      },
      timeout: 10_000,
    },
  ],
};

const receiptsUnknownMessage: Scenario = {
  name: 'receipts-unknown-message',
  description: 'B sends a status receipt for a fake messageId to A. Neither bot should crash.',
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
      name: 'B sends a receipt for a non-existent message',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        const fakeMessageId = 'non-existent-message-id-12345';
        botB.sendMessageStatus(fakeMessageId, botA.identity.did, 'delivered');
        await sleep(1000);
      },
      validate: (ctx: ScenarioContext): boolean => {
        // Both bots should still be running (connected to relay)
        const [botA, botB] = ctx.bots;
        return botA.relayClient.connected && botB.relayClient.connected;
      },
      timeout: 10_000,
    },
  ],
};

const receiptsOutOfOrder: Scenario = {
  name: 'receipts-out-of-order',
  description: 'A sends a message. B sends a read receipt before a delivered receipt. A should handle it without crashing.',
  botCount: 2,
  timeout: 30_000,
  tags: ['bug'],
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
      name: 'A sends a message to B',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        const msgId = botA.sendMessage(botB.identity.did, 'Testing out-of-order receipts');
        ctx.state.set('messageId', msgId);
        await sleep(500);
      },
      timeout: 5_000,
    },
    {
      name: 'B sends read receipt before delivered receipt',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        const msgId = ctx.state.get('messageId') as string;
        // Send read first (out of order — skipping delivered)
        botB.sendMessageStatus(msgId, botA.identity.did, 'read');
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        // A should receive the status update without crashing
        const botA = ctx.bots[0];
        const msgId = ctx.state.get('messageId') as string;
        const status = botA.getMessageStatus(msgId);
        return status === 'read' || status === 'delivered';
      },
      timeout: 10_000,
    },
  ],
};

const receiptsOffline: Scenario = {
  name: 'receipts-offline',
  description: 'A goes offline. B sends a delivered receipt. A reconnects and receives the receipt.',
  botCount: 2,
  timeout: 45_000,
  tags: ['resilience'],
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
      name: 'A sends a message to B while both are online',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        const msgId = botA.sendMessage(botB.identity.did, 'Message before disconnect');
        ctx.state.set('messageId', msgId);
        await sleep(500);
      },
      timeout: 5_000,
    },
    {
      name: 'Enable reconnect on A and disconnect A',
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
      name: 'B sends delivered receipt while A is offline',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        const msgId = ctx.state.get('messageId') as string;
        botB.sendMessageStatus(msgId, botA.identity.did, 'delivered');
        await sleep(500);
      },
      timeout: 5_000,
    },
    {
      name: 'A reconnects and receives the delivered receipt',
      action: async (ctx: ScenarioContext) => {
        const botA = ctx.bots[0];
        const reconnected = await pollUntil(() => botA.relayClient.connected, 15_000);
        if (!reconnected) throw new Error('A failed to reconnect within timeout');
        // Give time for offline messages to be processed
        await sleep(2000);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const botA = ctx.bots[0];
        const msgId = ctx.state.get('messageId') as string;
        const status = botA.getMessageStatus(msgId);
        return status === 'delivered' || status === 'read';
      },
      timeout: 25_000,
    },
  ],
};

const receiptsBatch: Scenario = {
  name: 'receipts-batch',
  description: 'A sends 10 messages to B. B auto-sends delivered receipts. A should see delivered status for all 10.',
  botCount: 2,
  timeout: 45_000,
  tags: ['stress'],
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
      name: 'A sends 10 messages to B',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        const messageIds: string[] = [];
        for (let i = 0; i < 10; i++) {
          const msgId = botA.sendMessage(botB.identity.did, `Batch message ${i + 1}`);
          messageIds.push(msgId);
        }
        ctx.state.set('messageIds', messageIds);
        await sleep(1000);
      },
      timeout: 10_000,
    },
    {
      name: 'B sends delivered receipts for all 10 messages',
      action: async (ctx: ScenarioContext) => {
        const [botA, botB] = ctx.bots;
        const messageIds = ctx.state.get('messageIds') as string[];
        for (const msgId of messageIds) {
          botB.sendMessageStatus(msgId, botA.identity.did, 'delivered');
        }
        await sleep(1000);
      },
      timeout: 10_000,
    },
    {
      name: 'A sees delivered status for all 10 messages',
      action: async (ctx: ScenarioContext) => {
        // Just wait for propagation
        await sleep(500);
      },
      validate: (ctx: ScenarioContext): boolean => {
        const botA = ctx.bots[0];
        const messageIds = ctx.state.get('messageIds') as string[];
        return messageIds.every((msgId) => {
          const status = botA.getMessageStatus(msgId);
          return status === 'delivered' || status === 'read';
        });
      },
      timeout: 15_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Suite Registration
// ─────────────────────────────────────────────────────────────────────────────

registerSuite({
  name: 'receipts',
  description: 'Message receipt scenarios',
  scenarios: [
    receiptsDeliveredRead,
    receiptsUnknownMessage,
    receiptsOutOfOrder,
    receiptsOffline,
    receiptsBatch,
  ],
});
