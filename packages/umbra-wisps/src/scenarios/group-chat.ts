/**
 * Group Chat scenario: create a group and have each wisp introduce themselves.
 */

import { registerScenario, type ScenarioContext } from './index.js';

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

registerScenario({
  name: 'group-chat',
  description: 'Create a group with all wisps, each sends an introduction',
  steps: [
    {
      name: 'Create group',
      action: async (ctx: ScenarioContext) => {
        const creator = ctx.wisps[0];
        const groupId = await ctx.orchestrator.createGroup(
          'Wisp Hangout', creator.name,
        );
        ctx.state.set('groupId', groupId);
        await sleep(2000); // Wait for invites to be processed
      },
    },
    {
      name: 'Each wisp introduces themselves',
      action: async (ctx: ScenarioContext) => {
        const groupId = ctx.state.get('groupId') as string;
        for (const wisp of ctx.wisps) {
          const group = wisp.getGroup(groupId);
          if (!group) {
            console.warn(`[Scenario]     ${wisp.name} not in group yet, skipping`);
            continue;
          }
          const intro = await wisp.generateResponse(
            'System',
            'Introduce yourself to the group in 1-2 sentences, in character.',
            `scenario-group-${groupId}`,
          );
          wisp.sendGroupMessage(groupId, intro);
          console.log(`[Scenario]     ${wisp.name}: ${intro.slice(0, 50)}...`);
          await sleep(1000);
        }
      },
    },
  ],
});
