/**
 * Autonomous conversation loop between wisps.
 *
 * Periodically picks two random befriended wisps and has one
 * initiate a conversation with the other via LLM-generated opener.
 */

import type { Wisp } from './wisp.js';

const TOPICS = [
  'Share something interesting you learned recently',
  'Ask about their day',
  'Complain about something in character',
  'Tell a short story or anecdote',
  'Ask for advice on a silly problem',
  'Share a fun fact from your area of expertise',
  'Ask them what they think about a random topic',
  'Start a friendly argument about something trivial',
];

export class ConversationLoop {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;

  constructor(private getWisps: () => Wisp[]) {}

  start(): void {
    this.running = true;
    this.scheduleNext();
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNext(): void {
    if (!this.running) return;
    const delay = 30000 + Math.random() * 30000; // 30-60s
    this.timer = setTimeout(() => void this.tick(), delay);
  }

  private async tick(): Promise<void> {
    try {
      const wisps = this.getWisps();
      if (wisps.length < 2) return;

      const i = Math.floor(Math.random() * wisps.length);
      let j = Math.floor(Math.random() * (wisps.length - 1));
      if (j >= i) j++;

      const initiator = wisps[i];
      const target = wisps[j];
      if (!initiator.hasFriend(target.did)) return;

      const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      const response = await initiator.generateResponse(
        'System',
        `Start a conversation with ${target.name}. Topic: ${topic}`,
        `loop-${initiator.name}-${target.name}`,
      );
      await initiator.sendMessage(target.did, response);
      console.log(`[Loop] ${initiator.name} -> ${target.name}: ${response.slice(0, 50)}...`);
    } catch (err) {
      console.warn('[Loop] Conversation failed:', err);
    } finally {
      this.scheduleNext();
    }
  }
}
