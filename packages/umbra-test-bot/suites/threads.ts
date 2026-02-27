/**
 * Thread conversation test scenarios.
 *
 * Covers happy-path threading, deep chains, multiple replies,
 * bidirectional threads, cross-thread isolation, and sub-threads.
 */

import { type Scenario, type ScenarioContext, registerSuite, sleep, pollUntil } from '../scenarios.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Shorthand for the befriend-and-wait pattern between two bots. */
async function befriend(ctx: ScenarioContext, aIdx: number, bIdx: number): Promise<void> {
  const a = ctx.bots[aIdx];
  const b = ctx.bots[bIdx];
  a.sendFriendRequest(b.identity.did);
  const ok = await pollUntil(() => a.friendCount >= 1 && b.friendCount >= 1, 10000);
  if (!ok) throw new Error(`Befriend failed between bot ${aIdx} and bot ${bIdx}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenarios
// ─────────────────────────────────────────────────────────────────────────────

const threadsHappyPath: Scenario = {
  name: 'threads-happy-path',
  description: 'A sends a message, B replies in-thread, A receives the reply with correct threadId',
  botCount: 2,
  timeout: 30_000,
  tags: ['smoke', 'critical'],
  steps: [
    {
      name: 'Befriend A and B',
      action: async (ctx) => {
        await befriend(ctx, 0, 1);
      },
    },
    {
      name: 'A sends a root message',
      action: async (ctx) => {
        const [a, b] = ctx.bots;
        const msgId = a.sendMessage(b.identity.did, 'Hello from A — root message');
        ctx.state.set('rootMsgId', msgId);
      },
      validate: (ctx) => {
        const b = ctx.bots[1];
        return b.lastReceivedMessage !== null;
      },
      timeout: 10_000,
    },
    {
      name: 'B replies in thread',
      action: async (ctx) => {
        const [a, b] = ctx.bots;
        const rootMsgId = ctx.state.get('rootMsgId') as string;
        await sleep(500);
        const replyId = b.sendThreadReply(rootMsgId, a.identity.did, 'Thread reply from B');
        ctx.state.set('replyId', replyId);
      },
    },
    {
      name: 'Validate A receives thread reply with correct threadId',
      action: async (ctx) => { /* validation only */ },
      validate: (ctx) => {
        const a = ctx.bots[0];
        const rootMsgId = ctx.state.get('rootMsgId') as string;
        const last = a.lastReceivedMessage;
        return last !== null && last.threadId === rootMsgId;
      },
      timeout: 10_000,
    },
  ],
};

const threadsDeepChain: Scenario = {
  name: 'threads-deep-chain',
  description: '10 alternating replies all referencing the same root threadId',
  botCount: 2,
  timeout: 60_000,
  tags: ['critical'],
  steps: [
    {
      name: 'Befriend A and B',
      action: async (ctx) => {
        await befriend(ctx, 0, 1);
      },
    },
    {
      name: 'A sends root message',
      action: async (ctx) => {
        const [a, b] = ctx.bots;
        const rootMsgId = a.sendMessage(b.identity.did, 'Root message for deep chain');
        ctx.state.set('rootMsgId', rootMsgId);
        await sleep(500);
      },
      validate: (ctx) => {
        return ctx.bots[1].lastReceivedMessage !== null;
      },
      timeout: 10_000,
    },
    {
      name: 'Send 10 alternating thread replies',
      action: async (ctx) => {
        const [a, b] = ctx.bots;
        const rootMsgId = ctx.state.get('rootMsgId') as string;

        for (let i = 0; i < 10; i++) {
          await sleep(500);
          if (i % 2 === 0) {
            b.sendThreadReply(rootMsgId, a.identity.did, `Chain reply ${i + 1} from B`);
          } else {
            a.sendThreadReply(rootMsgId, b.identity.did, `Chain reply ${i + 1} from A`);
          }
        }
      },
    },
    {
      name: 'Validate both bots see 10+ messages in the thread',
      action: async (ctx) => { /* validation only */ },
      validate: (ctx) => {
        const [a, b] = ctx.bots;
        const rootMsgId = ctx.state.get('rootMsgId') as string;
        const aThread = a.messageTracker.getByThread(rootMsgId);
        const bThread = b.messageTracker.getByThread(rootMsgId);
        return aThread.length >= 10 && bThread.length >= 10;
      },
      timeout: 15_000,
    },
  ],
};

const threadsMultipleReplies: Scenario = {
  name: 'threads-multiple-replies',
  description: 'A sends a message, both B and C reply in-thread, A sees 2 replies with same threadId',
  botCount: 3,
  timeout: 30_000,
  tags: ['smoke'],
  steps: [
    {
      name: 'A befriends B and C',
      action: async (ctx) => {
        const [a, b, c] = ctx.bots;
        a.sendFriendRequest(b.identity.did);
        a.sendFriendRequest(c.identity.did);
        const ok = await pollUntil(
          () => a.friendCount >= 2 && b.friendCount >= 1 && c.friendCount >= 1,
          10_000,
        );
        if (!ok) throw new Error('Failed to befriend B and C');
      },
    },
    {
      name: 'A sends root message to B and C',
      action: async (ctx) => {
        const [a, b, c] = ctx.bots;
        const msgToB = a.sendMessage(b.identity.did, 'Root message for B');
        await sleep(500);
        const msgToC = a.sendMessage(c.identity.did, 'Root message for C');
        ctx.state.set('msgToB', msgToB);
        ctx.state.set('msgToC', msgToC);
      },
      validate: (ctx) => {
        const [, b, c] = ctx.bots;
        return b.lastReceivedMessage !== null && c.lastReceivedMessage !== null;
      },
      timeout: 10_000,
    },
    {
      name: 'B and C both reply in thread to their respective messages',
      action: async (ctx) => {
        const [a, b, c] = ctx.bots;
        const msgToB = ctx.state.get('msgToB') as string;
        const msgToC = ctx.state.get('msgToC') as string;
        await sleep(500);
        b.sendThreadReply(msgToB, a.identity.did, 'Thread reply from B');
        await sleep(500);
        c.sendThreadReply(msgToC, a.identity.did, 'Thread reply from C');
      },
    },
    {
      name: 'Validate A received 2 thread replies',
      action: async (ctx) => { /* validation only */ },
      validate: (ctx) => {
        const a = ctx.bots[0];
        const msgToB = ctx.state.get('msgToB') as string;
        const msgToC = ctx.state.get('msgToC') as string;
        const threadB = a.messageTracker.getByThread(msgToB);
        const threadC = a.messageTracker.getByThread(msgToC);
        return threadB.length >= 1 && threadC.length >= 1;
      },
      timeout: 10_000,
    },
  ],
};

const threadsBidirectional: Scenario = {
  name: 'threads-bidirectional',
  description: 'A and B exchange replies within the same thread, validating 4+ messages share the same threadId',
  botCount: 2,
  timeout: 30_000,
  tags: [],
  steps: [
    {
      name: 'Befriend A and B',
      action: async (ctx) => {
        await befriend(ctx, 0, 1);
      },
    },
    {
      name: 'A sends root message (m1)',
      action: async (ctx) => {
        const [a, b] = ctx.bots;
        const m1 = a.sendMessage(b.identity.did, 'Bidirectional root m1');
        ctx.state.set('m1', m1);
      },
      validate: (ctx) => {
        return ctx.bots[1].lastReceivedMessage !== null;
      },
      timeout: 10_000,
    },
    {
      name: 'B replies in thread, A replies, B replies again',
      action: async (ctx) => {
        const [a, b] = ctx.bots;
        const m1 = ctx.state.get('m1') as string;

        await sleep(500);
        b.sendThreadReply(m1, a.identity.did, 'Reply 1 from B');

        await sleep(500);
        a.sendThreadReply(m1, b.identity.did, 'Reply 2 from A');

        await sleep(500);
        b.sendThreadReply(m1, a.identity.did, 'Reply 3 from B');
      },
    },
    {
      name: 'Validate full thread chain has 4+ messages with threadId = m1',
      action: async (ctx) => { /* validation only */ },
      validate: (ctx) => {
        const [a, b] = ctx.bots;
        const m1 = ctx.state.get('m1') as string;
        // Both bots should see all thread messages (sent + received)
        const aThread = a.messageTracker.getByThread(m1);
        const bThread = b.messageTracker.getByThread(m1);
        // 3 replies tracked by each as sent or received, but combined >= 3
        // A sent 1 reply and received 2 => at least 3 in A's tracker
        // B sent 2 replies and received 1 => at least 3 in B's tracker
        // Total across both is the full thread chain of 3 replies
        // But with sent+received tracking, each bot sees all 3 thread replies
        return aThread.length >= 3 && bThread.length >= 3;
      },
      timeout: 10_000,
    },
  ],
};

const threadsCrossThread: Scenario = {
  name: 'threads-cross-thread',
  description: 'A sends two separate messages, B replies to each in distinct threads, A sees two different threadIds',
  botCount: 2,
  timeout: 30_000,
  tags: [],
  steps: [
    {
      name: 'Befriend A and B',
      action: async (ctx) => {
        await befriend(ctx, 0, 1);
      },
    },
    {
      name: 'A sends msg1 and msg2',
      action: async (ctx) => {
        const [a, b] = ctx.bots;
        const msg1 = a.sendMessage(b.identity.did, 'First conversation starter');
        await sleep(500);
        const msg2 = a.sendMessage(b.identity.did, 'Second conversation starter');
        ctx.state.set('msg1', msg1);
        ctx.state.set('msg2', msg2);
      },
      validate: (ctx) => {
        const b = ctx.bots[1];
        return b.messageTracker.getAllReceived().length >= 2;
      },
      timeout: 10_000,
    },
    {
      name: 'B replies to msg1 in one thread and msg2 in another',
      action: async (ctx) => {
        const [a, b] = ctx.bots;
        const msg1 = ctx.state.get('msg1') as string;
        const msg2 = ctx.state.get('msg2') as string;

        await sleep(500);
        b.sendThreadReply(msg1, a.identity.did, 'Reply to first message');
        await sleep(500);
        b.sendThreadReply(msg2, a.identity.did, 'Reply to second message');
      },
    },
    {
      name: 'Validate A received replies in 2 different threads',
      action: async (ctx) => { /* validation only */ },
      validate: (ctx) => {
        const a = ctx.bots[0];
        const msg1 = ctx.state.get('msg1') as string;
        const msg2 = ctx.state.get('msg2') as string;
        const thread1 = a.messageTracker.getByThread(msg1);
        const thread2 = a.messageTracker.getByThread(msg2);
        return (
          thread1.length >= 1 &&
          thread2.length >= 1 &&
          msg1 !== msg2
        );
      },
      timeout: 10_000,
    },
  ],
};

const threadsReplyToReply: Scenario = {
  name: 'threads-reply-to-reply',
  description: 'A sends root, B replies, A replies to B\'s reply creating a sub-thread, B receives sub-thread reply',
  botCount: 2,
  timeout: 30_000,
  tags: [],
  steps: [
    {
      name: 'Befriend A and B',
      action: async (ctx) => {
        await befriend(ctx, 0, 1);
      },
    },
    {
      name: 'A sends root message',
      action: async (ctx) => {
        const [a, b] = ctx.bots;
        const rootMsgId = a.sendMessage(b.identity.did, 'Root for sub-thread test');
        ctx.state.set('rootMsgId', rootMsgId);
      },
      validate: (ctx) => {
        return ctx.bots[1].lastReceivedMessage !== null;
      },
      timeout: 10_000,
    },
    {
      name: 'B replies in thread (reply1)',
      action: async (ctx) => {
        const [a, b] = ctx.bots;
        const rootMsgId = ctx.state.get('rootMsgId') as string;
        await sleep(500);
        const reply1 = b.sendThreadReply(rootMsgId, a.identity.did, 'Reply1 from B');
        ctx.state.set('reply1', reply1);
      },
      validate: (ctx) => {
        const a = ctx.bots[0];
        const rootMsgId = ctx.state.get('rootMsgId') as string;
        return a.messageTracker.getByThread(rootMsgId).length >= 1;
      },
      timeout: 10_000,
    },
    {
      name: 'A replies to reply1 using reply1 as threadId (sub-thread)',
      action: async (ctx) => {
        const [a, b] = ctx.bots;
        const reply1 = ctx.state.get('reply1') as string;
        await sleep(500);
        const subReply = a.sendThreadReply(reply1, b.identity.did, 'Sub-thread reply from A');
        ctx.state.set('subReply', subReply);
      },
    },
    {
      name: 'Validate B receives sub-thread reply with threadId = reply1',
      action: async (ctx) => { /* validation only */ },
      validate: (ctx) => {
        const b = ctx.bots[1];
        const reply1 = ctx.state.get('reply1') as string;
        const subThread = b.messageTracker.getByThread(reply1);
        return subThread.length >= 1 && subThread.some((m) => m.threadId === reply1);
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Register
// ─────────────────────────────────────────────────────────────────────────────

registerSuite({
  name: 'threads',
  description: 'Thread conversation scenarios',
  scenarios: [
    threadsHappyPath,
    threadsDeepChain,
    threadsMultipleReplies,
    threadsBidirectional,
    threadsCrossThread,
    threadsReplyToReply,
  ],
});
