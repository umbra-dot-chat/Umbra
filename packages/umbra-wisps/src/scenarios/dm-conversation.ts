/**
 * DM Conversation scenario: two wisps have a 5-message exchange.
 */

import { registerScenario, type ScenarioContext } from './index.js';

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

registerScenario({
  name: 'dm-conversation',
  description: 'Two wisps have a 5-message back-and-forth DM conversation',
  steps: [
    {
      name: 'Pick two wisps',
      action: async (ctx: ScenarioContext) => {
        if (ctx.wisps.length < 2) throw new Error('Need at least 2 wisps');
        ctx.state.set('initiator', ctx.wisps[0]);
        ctx.state.set('responder', ctx.wisps[1]);
      },
    },
    {
      name: 'Verify friendship',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.state.get('initiator') as typeof ctx.wisps[0];
        const b = ctx.state.get('responder') as typeof ctx.wisps[0];
        if (!a.hasFriend(b.did)) {
          throw new Error(`${a.name} is not friends with ${b.name}`);
        }
      },
    },
    {
      name: 'Exchange 5 messages',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.state.get('initiator') as typeof ctx.wisps[0];
        const b = ctx.state.get('responder') as typeof ctx.wisps[0];
        const topics = [
          `Hey ${b.name}! What have you been up to?`,
          `Tell me something interesting about your day.`,
          `I have a question for you...`,
          `What do you think about this?`,
          `One last thought before I go.`,
        ];
        for (let i = 0; i < topics.length; i++) {
          const sender = i % 2 === 0 ? a : b;
          const receiver = i % 2 === 0 ? b : a;
          const response = await sender.generateResponse(
            receiver.name, topics[i], `scenario-dm-${a.name}-${b.name}`,
          );
          await sender.sendMessage(receiver.did, response);
          console.log(`[Scenario]     ${sender.name} -> ${receiver.name}: ${response.slice(0, 40)}...`);
          await sleep(1500);
        }
      },
    },
  ],
});
