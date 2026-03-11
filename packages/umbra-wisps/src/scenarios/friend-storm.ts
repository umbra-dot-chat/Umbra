/**
 * Friend Storm scenario: all wisps send friend requests to a target user.
 * Useful for testing the app's friend request list UI.
 */

import { registerScenario, type ScenarioContext } from './index.js';

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

registerScenario({
  name: 'friend-storm',
  description: 'All wisps send friend requests to a target user DID',
  steps: [
    {
      name: 'Validate target DID',
      action: async (ctx: ScenarioContext) => {
        const targetDid = ctx.state.get('targetDid') as string | undefined;
        if (!targetDid) {
          throw new Error('Set state.targetDid before running friend-storm');
        }
      },
    },
    {
      name: 'Send friend requests',
      action: async (ctx: ScenarioContext) => {
        const targetDid = ctx.state.get('targetDid') as string;
        for (const wisp of ctx.wisps) {
          if (!wisp.hasFriend(targetDid)) {
            wisp.sendFriendRequest(targetDid);
            console.log(`[Scenario]     ${wisp.name} sent friend request`);
            await sleep(500);
          }
        }
      },
    },
  ],
});
