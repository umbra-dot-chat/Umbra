/**
 * Groups Test Suite — 12 scenarios covering group messaging lifecycle.
 *
 * Covers: create + invite, decline invite, send message, multi-member,
 * member removal, key rotation (Bug #7), key rotation race (Bug #7),
 * concurrent operations, offline invite, bidirectional messages,
 * multiple groups, and admin operations.
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

/**
 * Befriend all bots via bot 0 sending friend requests to every other bot.
 * Polls until all bots have the expected friend count.
 */
function befriendAllStep(botCount: number, timeout = 15_000) {
  return {
    name: `Befriend all ${botCount} bots via bot 0`,
    action: async (ctx: ScenarioContext) => {
      const initiator = ctx.bots[0];
      for (let i = 1; i < ctx.bots.length; i++) {
        initiator.sendFriendRequest(ctx.bots[i].identity.did);
      }
      await sleep(2000);
    },
    validate: (ctx: ScenarioContext) => {
      // Bot 0 should have (botCount - 1) friends; each other bot should have >= 1
      if (ctx.bots[0].friendCount < botCount - 1) return false;
      for (let i = 1; i < ctx.bots.length; i++) {
        if (ctx.bots[i].friendCount < 1) return false;
      }
      return true;
    },
    timeout,
  };
}

/**
 * Befriend all bots pairwise (for scenarios where non-zero bots also need to
 * be friends with each other, e.g. B creates a group inviting A and C).
 * Bot 0 -> all others, then bot 1 -> bots 2..N, etc.
 */
function befriendAllPairwiseStep(botCount: number, timeout = 20_000) {
  return {
    name: `Befriend all ${botCount} bots pairwise`,
    action: async (ctx: ScenarioContext) => {
      for (let i = 0; i < ctx.bots.length; i++) {
        for (let j = i + 1; j < ctx.bots.length; j++) {
          ctx.bots[i].sendFriendRequest(ctx.bots[j].identity.did);
        }
      }
      await sleep(2000);
    },
    validate: (ctx: ScenarioContext) => {
      const expected = botCount - 1;
      return ctx.bots.every((bot) => bot.friendCount >= expected);
    },
    timeout,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. groups-create-invite
// ─────────────────────────────────────────────────────────────────────────────

const groupsCreateInvite: Scenario = {
  name: 'groups-create-invite',
  description: 'A befriends B, A creates a group. B auto-accepts invite and has groupCount >= 1.',
  botCount: 2,
  timeout: 30_000,
  tags: ['smoke', 'critical'],
  steps: [
    befriendAllStep(2),
    {
      name: 'A creates group and invites all friends',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const groupId = a.createGroupAndInviteAll('TestGroup');
        ctx.state.set('groupId', groupId);
        await sleep(500);
      },
    },
    {
      name: 'Validate B has joined the group (auto-accept)',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        return ctx.bots[1].groupCount >= 1;
      },
      timeout: 15_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. groups-invite-decline
// ─────────────────────────────────────────────────────────────────────────────

const groupsInviteDecline: Scenario = {
  name: 'groups-invite-decline',
  description: 'A creates a group, B has auto-accept disabled and declines the invite. B ends up with 0 groups.',
  botCount: 2,
  timeout: 30_000,
  tags: ['critical'],
  steps: [
    befriendAllStep(2),
    {
      name: 'Disable B auto-accept for group invites',
      action: async (ctx: ScenarioContext) => {
        (ctx.bots[1] as any).config.autoAcceptGroupInvites = false;
      },
    },
    {
      name: 'A creates group and invites all friends',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const groupId = a.createGroupAndInviteAll('DeclineGroup');
        ctx.state.set('groupId', groupId);
        await sleep(500);
      },
    },
    {
      name: 'Wait for B to have a pending group invite',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        return ctx.bots[1].pendingGroupInviteList.length >= 1;
      },
      timeout: 10_000,
    },
    {
      name: 'B declines the group invite',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const invite = b.pendingGroupInviteList[0];
        b.declineGroupInvite(invite.inviteId);
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        return ctx.bots[1].groupCount === 0;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. groups-send-message
// ─────────────────────────────────────────────────────────────────────────────

const groupsSendMessage: Scenario = {
  name: 'groups-send-message',
  description: 'A creates a group, sends "Hello group!" and B receives it.',
  botCount: 2,
  timeout: 30_000,
  tags: ['smoke', 'critical'],
  steps: [
    befriendAllStep(2),
    {
      name: 'A creates group and invites all friends',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const groupId = a.createGroupAndInviteAll('MsgGroup');
        ctx.state.set('groupId', groupId);
        await sleep(500);
      },
    },
    {
      name: 'Wait for both bots to be in the group',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const groupId = ctx.state.get('groupId') as string;
        const aInGroup = ctx.bots[0].getGroup(groupId) !== null;
        const bInGroup = ctx.bots[1].getGroup(groupId) !== null;
        return aInGroup && bInGroup;
      },
      timeout: 15_000,
    },
    {
      name: 'A sends "Hello group!" to the group',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const groupId = ctx.state.get('groupId') as string;
        const msgId = a.sendGroupMessage(groupId, 'Hello group!');
        ctx.state.set('groupMsgId', msgId);
        await sleep(500);
      },
    },
    {
      name: 'Validate B received the group message',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const received = b.messageTracker.getAllReceived();
        return received.some((m: any) => m.text === 'Hello group!' || m.content === 'Hello group!');
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. groups-multi-member
// ─────────────────────────────────────────────────────────────────────────────

const groupsMultiMember: Scenario = {
  name: 'groups-multi-member',
  description: 'Four bots all befriend each other, A creates group, sends message. B, C, D all receive it.',
  botCount: 4,
  timeout: 60_000,
  tags: ['critical'],
  steps: [
    befriendAllPairwiseStep(4),
    {
      name: 'A creates group and invites all friends',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const groupId = a.createGroupAndInviteAll('MultiGroup');
        ctx.state.set('groupId', groupId);
        await sleep(500);
      },
    },
    {
      name: 'Wait for all 4 bots to be in the group',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const groupId = ctx.state.get('groupId') as string;
        return ctx.bots.every((bot) => bot.getGroup(groupId) !== null);
      },
      timeout: 20_000,
    },
    {
      name: 'A sends "Multi hello!" to the group',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const groupId = ctx.state.get('groupId') as string;
        a.sendGroupMessage(groupId, 'Multi hello!');
        await sleep(500);
      },
    },
    {
      name: 'Validate B, C, D all received the message',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        for (let i = 1; i < ctx.bots.length; i++) {
          const received = ctx.bots[i].messageTracker.getAllReceived();
          const got = received.some((m: any) => m.text === 'Multi hello!' || m.content === 'Multi hello!');
          if (!got) return false;
        }
        return true;
      },
      timeout: 20_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. groups-member-removed
// ─────────────────────────────────────────────────────────────────────────────

const groupsMemberRemoved: Scenario = {
  name: 'groups-member-removed',
  description: 'A creates a 3-member group, removes B. B groupCount decreases, C stays in group.',
  botCount: 3,
  timeout: 45_000,
  tags: [],
  steps: [
    befriendAllStep(3),
    {
      name: 'A creates group and invites all friends',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const groupId = a.createGroupAndInviteAll('RemoveGroup');
        ctx.state.set('groupId', groupId);
        await sleep(500);
      },
    },
    {
      name: 'Wait for all 3 bots to be in the group',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const groupId = ctx.state.get('groupId') as string;
        return ctx.bots.every((bot) => bot.getGroup(groupId) !== null);
      },
      timeout: 15_000,
    },
    {
      name: 'Record B initial groupCount and A removes B',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        ctx.state.set('bGroupCountBefore', b.groupCount);
        const a = ctx.bots[0];
        const groupId = ctx.state.get('groupId') as string;
        a.removeGroupMember(groupId, b.identity.did);
        await sleep(1000);
      },
    },
    {
      name: 'Validate B was removed and C is still in the group',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const c = ctx.bots[2];
        const groupId = ctx.state.get('groupId') as string;
        const bGroupCountBefore = ctx.state.get('bGroupCountBefore') as number;
        const bRemoved = b.groupCount < bGroupCountBefore || b.getGroup(groupId) === null;
        const cStillIn = c.getGroup(groupId) !== null;
        return bRemoved && cStillIn;
      },
      timeout: 15_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. groups-key-rotation (Bug #7)
// ─────────────────────────────────────────────────────────────────────────────

const groupsKeyRotation: Scenario = {
  name: 'groups-key-rotation',
  description: 'Bug #7: After removing C, key rotates. B receives the new key and can still read messages from A.',
  botCount: 3,
  timeout: 45_000,
  tags: ['critical', 'bug'],
  steps: [
    befriendAllStep(3),
    {
      name: 'A creates group and invites all friends',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const groupId = a.createGroupAndInviteAll('KeyRotGroup');
        ctx.state.set('groupId', groupId);
        await sleep(500);
      },
    },
    {
      name: 'Wait for all 3 bots to be in the group',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const groupId = ctx.state.get('groupId') as string;
        return ctx.bots.every((bot) => bot.getGroup(groupId) !== null);
      },
      timeout: 15_000,
    },
    {
      name: 'Record B key version, then A removes C (triggers key rotation)',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const groupId = ctx.state.get('groupId') as string;
        const groupInfoB = b.getGroup(groupId);
        ctx.state.set('bKeyVersionBefore', groupInfoB?.keyVersion ?? 0);

        const a = ctx.bots[0];
        const c = ctx.bots[2];
        a.removeGroupMember(groupId, c.identity.did);
        await sleep(1000);
      },
    },
    {
      name: 'Wait for B to receive rotated key',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const groupId = ctx.state.get('groupId') as string;
        const bKeyVersionBefore = ctx.state.get('bKeyVersionBefore') as number;
        const groupInfoB = b.getGroup(groupId);
        return groupInfoB !== null && groupInfoB.keyVersion > bKeyVersionBefore;
      },
      timeout: 15_000,
    },
    {
      name: 'A sends message with new key',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const groupId = ctx.state.get('groupId') as string;
        a.sendGroupMessage(groupId, 'Post-rotation message');
        await sleep(500);
      },
    },
    {
      name: 'Validate B can still receive messages after key rotation',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const received = b.messageTracker.getAllReceived();
        return received.some((m: any) => m.text === 'Post-rotation message' || m.content === 'Post-rotation message');
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. groups-key-rotation-race (Bug #7)
// ─────────────────────────────────────────────────────────────────────────────

const groupsKeyRotationRace: Scenario = {
  name: 'groups-key-rotation-race',
  description: 'Bug #7: A sends a message AND removes C nearly simultaneously. B still receives the message.',
  botCount: 3,
  timeout: 45_000,
  tags: ['bug'],
  steps: [
    befriendAllStep(3),
    {
      name: 'A creates group and invites all friends',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const groupId = a.createGroupAndInviteAll('RaceGroup');
        ctx.state.set('groupId', groupId);
        await sleep(500);
      },
    },
    {
      name: 'Wait for all 3 bots to be in the group',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const groupId = ctx.state.get('groupId') as string;
        return ctx.bots.every((bot) => bot.getGroup(groupId) !== null);
      },
      timeout: 15_000,
    },
    {
      name: 'A sends message AND removes C nearly simultaneously',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const c = ctx.bots[2];
        const groupId = ctx.state.get('groupId') as string;
        // Fire both without waiting — race condition
        a.sendGroupMessage(groupId, 'Race message');
        a.removeGroupMember(groupId, c.identity.did);
        await sleep(1000);
      },
    },
    {
      name: 'Validate B still received the message despite key rotation',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const received = b.messageTracker.getAllReceived();
        return received.some((m: any) => m.text === 'Race message' || m.content === 'Race message');
      },
      timeout: 15_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. groups-concurrent-ops
// ─────────────────────────────────────────────────────────────────────────────

const groupsConcurrentOps: Scenario = {
  name: 'groups-concurrent-ops',
  description: 'A creates group with all 4, removes B, removes C. D remains, B and C are out.',
  botCount: 4,
  timeout: 60_000,
  tags: ['stress'],
  steps: [
    befriendAllPairwiseStep(4),
    {
      name: 'A creates group and invites all friends',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const groupId = a.createGroupAndInviteAll('ConcurrentGroup');
        ctx.state.set('groupId', groupId);
        await sleep(500);
      },
    },
    {
      name: 'Wait for all 4 bots to be in the group',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const groupId = ctx.state.get('groupId') as string;
        return ctx.bots.every((bot) => bot.getGroup(groupId) !== null);
      },
      timeout: 20_000,
    },
    {
      name: 'A removes B, then removes C',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const b = ctx.bots[1];
        const c = ctx.bots[2];
        const groupId = ctx.state.get('groupId') as string;
        a.removeGroupMember(groupId, b.identity.did);
        await sleep(1000);
        a.removeGroupMember(groupId, c.identity.did);
        await sleep(1000);
      },
    },
    {
      name: 'Validate D is still in group, B and C are not',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const c = ctx.bots[2];
        const d = ctx.bots[3];
        const groupId = ctx.state.get('groupId') as string;
        const bOut = b.getGroup(groupId) === null;
        const cOut = c.getGroup(groupId) === null;
        const dIn = d.getGroup(groupId) !== null;
        return bOut && cOut && dIn;
      },
      timeout: 20_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. groups-offline-invite
// ─────────────────────────────────────────────────────────────────────────────

const groupsOfflineInvite: Scenario = {
  name: 'groups-offline-invite',
  description: 'B is offline when A creates group. B reconnects and eventually joins.',
  botCount: 2,
  timeout: 45_000,
  tags: ['resilience'],
  steps: [
    befriendAllStep(2),
    {
      name: 'Enable reconnect on B and disconnect B',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        b.relayClient.enableReconnect(5, 500);
        b.relayClient.simulateDisconnect();
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        return !ctx.bots[1].relayClient.connected;
      },
      timeout: 5_000,
    },
    {
      name: 'A creates group while B is offline',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const groupId = a.createGroupAndInviteAll('OfflineGroup');
        ctx.state.set('groupId', groupId);
        await sleep(500);
      },
    },
    {
      name: 'B reconnects and eventually joins the group',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const reconnected = await pollUntil(() => b.relayClient.connected, 15_000);
        if (!reconnected) throw new Error('B failed to reconnect within timeout');
        await sleep(2000);
      },
      validate: (ctx: ScenarioContext) => {
        return ctx.bots[1].groupCount >= 1;
      },
      timeout: 25_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. groups-bidirectional-messages
// ─────────────────────────────────────────────────────────────────────────────

const groupsBidirectionalMessages: Scenario = {
  name: 'groups-bidirectional-messages',
  description: 'A, B, C all send messages to the same group. Each receives messages from the other two.',
  botCount: 3,
  timeout: 45_000,
  tags: ['smoke'],
  steps: [
    befriendAllPairwiseStep(3),
    {
      name: 'A creates group and invites all friends',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const groupId = a.createGroupAndInviteAll('BiDiGroup');
        ctx.state.set('groupId', groupId);
        await sleep(500);
      },
    },
    {
      name: 'Wait for all 3 bots to be in the group',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const groupId = ctx.state.get('groupId') as string;
        return ctx.bots.every((bot) => bot.getGroup(groupId) !== null);
      },
      timeout: 15_000,
    },
    {
      name: 'A, B, C each send a group message',
      action: async (ctx: ScenarioContext) => {
        const groupId = ctx.state.get('groupId') as string;
        ctx.bots[0].sendGroupMessage(groupId, 'From A');
        await sleep(300);
        ctx.bots[1].sendGroupMessage(groupId, 'From B');
        await sleep(300);
        ctx.bots[2].sendGroupMessage(groupId, 'From C');
        await sleep(500);
      },
    },
    {
      name: 'Validate each bot received messages from the other two',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const labels = ['From A', 'From B', 'From C'];
        for (let i = 0; i < ctx.bots.length; i++) {
          const received = ctx.bots[i].messageTracker.getAllReceived();
          // Bot i should have received messages from the other two bots
          for (let j = 0; j < labels.length; j++) {
            if (j === i) continue; // Skip own message
            const got = received.some((m: any) => m.text === labels[j] || m.content === labels[j]);
            if (!got) return false;
          }
        }
        return true;
      },
      timeout: 15_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 11. groups-multiple-groups
// ─────────────────────────────────────────────────────────────────────────────

const groupsMultipleGroups: Scenario = {
  name: 'groups-multiple-groups',
  description: 'A creates Group-1, B creates Group-2. A and C end up in 2 groups each.',
  botCount: 3,
  timeout: 45_000,
  tags: [],
  steps: [
    befriendAllPairwiseStep(3),
    {
      name: 'A creates "Group-1" (invites B and C)',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const groupId1 = a.createGroupAndInviteAll('Group-1');
        ctx.state.set('groupId1', groupId1);
        await sleep(500);
      },
    },
    {
      name: 'Wait for all bots to join Group-1',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const groupId1 = ctx.state.get('groupId1') as string;
        return ctx.bots.every((bot) => bot.getGroup(groupId1) !== null);
      },
      timeout: 15_000,
    },
    {
      name: 'B creates "Group-2" (invites A and C)',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const groupId2 = b.createGroupAndInviteAll('Group-2');
        ctx.state.set('groupId2', groupId2);
        await sleep(500);
      },
    },
    {
      name: 'Validate A and C are in 2 groups',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const c = ctx.bots[2];
        return a.groupCount >= 2 && c.groupCount >= 2;
      },
      timeout: 15_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 12. groups-admin-operations
// ─────────────────────────────────────────────────────────────────────────────

const groupsAdminOperations: Scenario = {
  name: 'groups-admin-operations',
  description: 'A (admin) creates group, all join. A removes C. Validate C was removed.',
  botCount: 3,
  timeout: 30_000,
  tags: [],
  steps: [
    befriendAllStep(3),
    {
      name: 'A creates group (A is admin)',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const groupId = a.createGroupAndInviteAll('AdminGroup');
        ctx.state.set('groupId', groupId);
        await sleep(500);
      },
    },
    {
      name: 'Wait for all 3 bots to join the group',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const groupId = ctx.state.get('groupId') as string;
        return ctx.bots.every((bot) => bot.getGroup(groupId) !== null);
      },
      timeout: 15_000,
    },
    {
      name: 'A (admin) removes C from the group',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        const c = ctx.bots[2];
        const groupId = ctx.state.get('groupId') as string;
        a.removeGroupMember(groupId, c.identity.did);
        await sleep(1000);
      },
    },
    {
      name: 'Validate C was removed from the group',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const c = ctx.bots[2];
        const groupId = ctx.state.get('groupId') as string;
        return c.getGroup(groupId) === null;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Suite Registration
// ─────────────────────────────────────────────────────────────────────────────

registerSuite({
  name: 'groups',
  description: 'Group messaging scenarios',
  scenarios: [
    groupsCreateInvite,
    groupsInviteDecline,
    groupsSendMessage,
    groupsMultiMember,
    groupsMemberRemoved,
    groupsKeyRotation,
    groupsKeyRotationRace,
    groupsConcurrentOps,
    groupsOfflineInvite,
    groupsBidirectionalMessages,
    groupsMultipleGroups,
    groupsAdminOperations,
  ],
});
