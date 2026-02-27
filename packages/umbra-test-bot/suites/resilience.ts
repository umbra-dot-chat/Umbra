/**
 * Resilience Test Suite — 8 scenarios covering disconnect/reconnect behavior,
 * malformed data handling, and error recovery.
 *
 * Covers: disconnect-reconnect, message queuing, offline batch delivery,
 * malformed envelopes, invalid JSON, wrong encryption, rapid reconnect,
 * and reconnect during an active call.
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
// 1. resilience-disconnect-reconnect (Bug #1)
// ─────────────────────────────────────────────────────────────────────────────

const resilienceDisconnectReconnect: Scenario = {
  name: 'resilience-disconnect-reconnect',
  description: 'Bug #1: B disconnects, A sends a message, B reconnects and receives it.',
  botCount: 2,
  timeout: 45_000,
  tags: ['critical', 'bug'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'Enable reconnect on B and disconnect',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        b.relayClient.enableReconnect(3, 500);
        b.relayClient.simulateDisconnect();
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        return !ctx.bots[1].relayClient.connected;
      },
      timeout: 5_000,
    },
    {
      name: 'A sends a message while B is disconnected',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        a.sendMessage(b.identity.did, 'reconnect-test');
        await sleep(500);
      },
      timeout: 5_000,
    },
    {
      name: 'Wait for B to reconnect',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const reconnected = await pollUntil(() => b.relayClient.connected, 15_000);
        if (!reconnected) throw new Error('B failed to reconnect within timeout');
        await sleep(1000);
      },
      timeout: 20_000,
    },
    {
      name: 'Validate B received the message after reconnect',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        const received = b.messageTracker.getAllReceived();
        return received.some((m) => m.content === 'reconnect-test');
      },
      timeout: 15_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. resilience-message-queue (Bug #5)
// ─────────────────────────────────────────────────────────────────────────────

const resilienceMessageQueue: Scenario = {
  name: 'resilience-message-queue',
  description: 'Bug #5: A disconnects, sends a message (queued), reconnects, and B receives it.',
  botCount: 2,
  timeout: 45_000,
  tags: ['critical', 'bug'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'Enable reconnect on A and disconnect',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        a.relayClient.enableReconnect(3, 500);
        a.relayClient.simulateDisconnect();
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        return !ctx.bots[0].relayClient.connected;
      },
      timeout: 5_000,
    },
    {
      name: 'A sends a message while disconnected (should queue)',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        a.sendMessage(b.identity.did, 'queued-message');
        await sleep(200);
      },
      timeout: 5_000,
    },
    {
      name: 'Wait for A to reconnect and flush the queue',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const reconnected = await pollUntil(() => a.relayClient.connected, 15_000);
        if (!reconnected) throw new Error('A failed to reconnect within timeout');
        await sleep(2000);
      },
      timeout: 20_000,
    },
    {
      name: 'Validate B received the queued message',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const received = b.messageTracker.getAllReceived();
        return received.some((m) => m.content === 'queued-message');
      },
      timeout: 15_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. resilience-offline-batch
// ─────────────────────────────────────────────────────────────────────────────

const resilienceOfflineBatch: Scenario = {
  name: 'resilience-offline-batch',
  description: 'B goes offline, A sends 5 messages, B reconnects and receives all 5.',
  botCount: 2,
  timeout: 60_000,
  tags: ['resilience'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'Enable reconnect on B and disconnect',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        b.relayClient.enableReconnect(3, 500);
        b.relayClient.simulateDisconnect();
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        return !ctx.bots[1].relayClient.connected;
      },
      timeout: 5_000,
    },
    {
      name: 'A sends 5 messages while B is offline',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        for (let i = 0; i < 5; i++) {
          a.sendMessage(b.identity.did, `offline-batch-${i}`);
        }
        await sleep(500);
      },
      timeout: 10_000,
    },
    {
      name: 'Wait for B to reconnect',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const reconnected = await pollUntil(() => b.relayClient.connected, 15_000);
        if (!reconnected) throw new Error('B failed to reconnect within timeout');
        await sleep(2000);
      },
      timeout: 20_000,
    },
    {
      name: 'Validate B received all 5 messages',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        const received = b.messageTracker.getAllReceived();
        const contents = received.map((m) => m.content);
        return (
          contents.includes('offline-batch-0') &&
          contents.includes('offline-batch-1') &&
          contents.includes('offline-batch-2') &&
          contents.includes('offline-batch-3') &&
          contents.includes('offline-batch-4')
        );
      },
      timeout: 20_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. resilience-malformed-envelope
// ─────────────────────────────────────────────────────────────────────────────

const resilienceMalformedEnvelope: Scenario = {
  name: 'resilience-malformed-envelope',
  description: 'B sends malformed and incomplete envelopes to A. A does not crash.',
  botCount: 2,
  timeout: 20_000,
  tags: ['critical'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'B sends a malformed envelope with unknown type',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        b.relayClient.sendEnvelope(a.identity.did, {
          envelope: 'unknown_type',
          version: 1,
          payload: {},
        });
        await sleep(500);
      },
      timeout: 5_000,
    },
    {
      name: 'B sends an envelope missing required fields',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        b.relayClient.sendEnvelope(a.identity.did, {
          envelope: 'chat_message',
          version: 1,
          payload: {
            // Missing messageId, conversationId, senderDid, contentEncrypted, nonce, timestamp
          },
        });
        await sleep(500);
      },
      timeout: 5_000,
    },
    {
      name: 'Validate A is still running and did not crash',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        return a.isRunning === true;
      },
      timeout: 5_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. resilience-invalid-json
// ─────────────────────────────────────────────────────────────────────────────

const resilienceInvalidJson: Scenario = {
  name: 'resilience-invalid-json',
  description: 'B sends raw non-JSON data to the relay. Neither bot crashes.',
  botCount: 2,
  timeout: 20_000,
  steps: [
    befriendStep(0, 1),
    {
      name: 'B sends raw non-JSON data to relay',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        b.relayClient.sendRaw('this is not json {{{');
        await sleep(1000);
      },
      timeout: 5_000,
    },
    {
      name: 'Validate both bots are still running',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return a.isRunning === true && b.isRunning === true;
      },
      timeout: 5_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. resilience-wrong-encryption
// ─────────────────────────────────────────────────────────────────────────────

const resilienceWrongEncryption: Scenario = {
  name: 'resilience-wrong-encryption',
  description: 'B sends a chat_message with bogus ciphertext/nonce to A. A does not crash.',
  botCount: 2,
  timeout: 20_000,
  steps: [
    befriendStep(0, 1),
    {
      name: 'B sends a chat_message with bogus ciphertext and nonce to A',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        b.relayClient.sendEnvelope(a.identity.did, {
          envelope: 'chat_message',
          version: 1,
          payload: {
            messageId: 'bogus-msg-id',
            conversationId: 'bogus-conversation',
            senderDid: b.identity.did,
            contentEncrypted: 'AAAAAAAAAA_not_real_ciphertext_AAAAAAAAAA',
            nonce: 'BBBBBBBBBBBBBBBBBBBBBBBB',
            timestamp: Date.now(),
          },
        });
        await sleep(1000);
      },
      timeout: 5_000,
    },
    {
      name: 'Validate A is still running and did not crash',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        return a.isRunning === true;
      },
      timeout: 5_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. resilience-rapid-reconnect
// ─────────────────────────────────────────────────────────────────────────────

const resilienceRapidReconnect: Scenario = {
  name: 'resilience-rapid-reconnect',
  description: 'B disconnects and reconnects 3 times rapidly. Validates B is connected at end and can receive messages.',
  botCount: 2,
  timeout: 45_000,
  tags: ['stress'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'Enable fast reconnect on B',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        b.relayClient.enableReconnect(3, 300);
        await sleep(200);
      },
      timeout: 3_000,
    },
    {
      name: 'Disconnect and reconnect B — cycle 1',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        b.relayClient.simulateDisconnect();
        const reconnected = await pollUntil(() => b.relayClient.connected, 10_000);
        if (!reconnected) throw new Error('B failed to reconnect in cycle 1');
        await sleep(5000);
      },
      timeout: 20_000,
    },
    {
      name: 'Disconnect and reconnect B — cycle 2',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        b.relayClient.simulateDisconnect();
        const reconnected = await pollUntil(() => b.relayClient.connected, 10_000);
        if (!reconnected) throw new Error('B failed to reconnect in cycle 2');
        await sleep(5000);
      },
      timeout: 20_000,
    },
    {
      name: 'Disconnect and reconnect B — cycle 3',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        b.relayClient.simulateDisconnect();
        const reconnected = await pollUntil(() => b.relayClient.connected, 10_000);
        if (!reconnected) throw new Error('B failed to reconnect in cycle 3');
        await sleep(1000);
      },
      timeout: 15_000,
    },
    {
      name: 'Validate B is connected and can receive a message',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        a.sendMessage(b.identity.did, 'after-rapid-reconnect');
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const received = b.messageTracker.getAllReceived();
        return b.relayClient.connected && received.some((m) => m.content === 'after-rapid-reconnect');
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. resilience-reconnect-during-call
// ─────────────────────────────────────────────────────────────────────────────

const resilienceReconnectDuringCall: Scenario = {
  name: 'resilience-reconnect-during-call',
  description: 'A calls B (voice), B\'s relay disconnects mid-call, B reconnects. WebRTC may survive since ICE is peer-to-peer.',
  botCount: 2,
  timeout: 45_000,
  tags: ['bug'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'A calls B (voice)',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        await a.startCall(b.identity.did, 'voice');
        await sleep(500);
      },
      timeout: 10_000,
    },
    {
      name: 'Wait for call to be connected',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        return a.currentCall?.status === 'connected';
      },
      timeout: 15_000,
    },
    {
      name: 'Disconnect B\'s relay while call is active',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        b.relayClient.enableReconnect(3, 500);
        b.relayClient.simulateDisconnect();
        await sleep(3000);
      },
      timeout: 10_000,
    },
    {
      name: 'Wait for B to reconnect',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const reconnected = await pollUntil(() => b.relayClient.connected, 15_000);
        if (!reconnected) throw new Error('B failed to reconnect during call');
        await sleep(1000);
      },
      timeout: 20_000,
    },
    {
      name: 'Validate call state — WebRTC connection may survive relay disconnect',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        // B should be reconnected to relay
        const bReconnected = b.relayClient.connected;
        // The call may still be active (WebRTC is peer-to-peer, survives relay disconnect)
        // or it may have ended — either is acceptable, as long as nothing crashed
        const aCallClean = a.currentCall === null || a.currentCall.status === 'connected';
        const bCallClean = b.currentCall === null || b.currentCall.status === 'connected';
        return bReconnected && aCallClean && bCallClean;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Register suite
// ─────────────────────────────────────────────────────────────────────────────

registerSuite({
  name: 'resilience',
  description: 'Resilience and error handling scenarios',
  scenarios: [
    resilienceDisconnectReconnect,
    resilienceMessageQueue,
    resilienceOfflineBatch,
    resilienceMalformedEnvelope,
    resilienceInvalidJson,
    resilienceWrongEncryption,
    resilienceRapidReconnect,
    resilienceReconnectDuringCall,
  ],
});
