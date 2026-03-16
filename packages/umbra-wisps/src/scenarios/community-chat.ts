/**
 * Community Chat scenario: wisps chat in a mock community channel.
 */

import { registerScenario, type ScenarioContext } from './index.js';

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

registerScenario({
  name: 'community-chat',
  description: 'Wisps chat in a mock community channel',
  steps: [
    {
      name: 'Simulate community messages',
      action: async (ctx: ScenarioContext) => {
        for (const wisp of ctx.wisps) {
          const msg = await wisp.generateResponse(
            'Community',
            'Say something interesting in the #general channel of a community. Be in character.',
            'scenario-community',
          );
          console.log(`[Scenario] ${wisp.name} → #general: ${msg.slice(0, 60)}...`);
          await sleep(2000);
        }
      },
    },
  ],
});
