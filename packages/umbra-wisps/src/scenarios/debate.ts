/**
 * Debate scenario: two wisps with opposing personas debate a random topic.
 * 8-message exchange with LLM-generated arguments.
 */

import { registerScenario, type ScenarioContext } from './index.js';

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const DEBATE_TOPICS = [
  'Whether order or chaos is more productive',
  'Whether strategy or instinct leads to better outcomes',
  'Whether art has more value than science',
  'Whether patience or urgency drives progress',
  'Whether solitude or collaboration produces the best work',
];

registerScenario({
  name: 'debate',
  description: 'Two wisps debate a random topic with 8 exchanges',
  steps: [
    {
      name: 'Pick debaters and topic',
      action: async (ctx: ScenarioContext) => {
        if (ctx.wisps.length < 2) throw new Error('Need at least 2 wisps');
        // Pick wisps with contrasting personas (first and last)
        const a = ctx.wisps[0];
        const b = ctx.wisps[ctx.wisps.length - 1];
        const topic = DEBATE_TOPICS[
          Math.floor(Math.random() * DEBATE_TOPICS.length)
        ];
        ctx.state.set('debaterA', a);
        ctx.state.set('debaterB', b);
        ctx.state.set('topic', topic);
        console.log(`[Scenario]     Topic: "${topic}"`);
        console.log(`[Scenario]     ${a.name} vs ${b.name}`);
      },
    },
    {
      name: 'Opening statements',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.state.get('debaterA') as typeof ctx.wisps[0];
        const b = ctx.state.get('debaterB') as typeof ctx.wisps[0];
        const topic = ctx.state.get('topic') as string;
        const convId = `scenario-debate-${a.name}-${b.name}`;
        ctx.state.set('convId', convId);

        const openA = await a.generateResponse(
          'Moderator',
          `Debate topic: "${topic}". Give your opening argument FOR this position.`,
          convId,
        );
        await a.sendMessage(b.did, openA);
        console.log(`[Scenario]     ${a.name}: ${openA.slice(0, 50)}...`);
        await sleep(2000);

        const openB = await b.generateResponse(
          a.name,
          `Debate topic: "${topic}". ${a.name} argued: "${openA.slice(0, 80)}..." Give your counter-argument.`,
          convId,
        );
        await b.sendMessage(a.did, openB);
        console.log(`[Scenario]     ${b.name}: ${openB.slice(0, 50)}...`);
        await sleep(2000);
      },
    },
    {
      name: 'Exchange 6 more arguments',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.state.get('debaterA') as typeof ctx.wisps[0];
        const b = ctx.state.get('debaterB') as typeof ctx.wisps[0];
        const convId = ctx.state.get('convId') as string;

        for (let i = 0; i < 6; i++) {
          const sender = i % 2 === 0 ? a : b;
          const receiver = i % 2 === 0 ? b : a;
          const response = await sender.generateResponse(
            receiver.name,
            `Continue the debate. Respond to ${receiver.name}'s last point with a strong counter-argument. Keep it concise.`,
            convId,
          );
          await sender.sendMessage(receiver.did, response);
          console.log(`[Scenario]     ${sender.name}: ${response.slice(0, 50)}...`);
          await sleep(1500);
        }
      },
    },
  ],
});
