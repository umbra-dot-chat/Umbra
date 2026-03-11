/**
 * Autonomous conversation loop between wisps.
 *
 * Periodically picks two random befriended wisps and has one
 * initiate a conversation with the other via LLM-generated opener.
 * Also periodically sends messages in group chats.
 */

import type { Wisp } from './wisp.js';

const DM_TOPICS = [
  'Share something interesting you learned recently',
  'Ask about their day',
  'Complain about something in character',
  'Tell a short story or anecdote',
  'Ask for advice on a silly problem',
  'Share a fun fact from your area of expertise',
  'Ask them what they think about a random topic',
  'Start a friendly argument about something trivial',
];

const GROUP_TOPICS = [
  'Ask the group what everyone is up to',
  'Share a fun observation with the group',
  'Start a group debate about something silly',
  'Ask the group for recommendations',
  'Share a group update in character',
  'React to something that just happened (in character)',
  'Ask everyone their opinion on a random topic',
  'Tell the group about your latest adventure',
];

export class ConversationLoop {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private tickCount = 0;

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
    const delay = 15000 + Math.random() * 25000; // 15-40s for more activity
    this.timer = setTimeout(() => void this.tick(), delay);
  }

  private async tick(): Promise<void> {
    try {
      this.tickCount++;
      const wisps = this.getWisps();
      if (wisps.length < 2) return;

      // Alternate between DM and group chat (group every 3rd tick)
      if (this.tickCount % 3 === 0) {
        await this.groupTick(wisps);
      } else {
        await this.dmTick(wisps);
      }
    } catch (err) {
      console.warn('[Loop] Conversation failed:', err);
    } finally {
      this.scheduleNext();
    }
  }

  private async dmTick(wisps: Wisp[]): Promise<void> {
    const i = Math.floor(Math.random() * wisps.length);
    let j = Math.floor(Math.random() * (wisps.length - 1));
    if (j >= i) j++;

    const initiator = wisps[i];
    const target = wisps[j];
    if (!initiator.hasFriend(target.did)) return;

    const topic = DM_TOPICS[Math.floor(Math.random() * DM_TOPICS.length)];
    const response = await initiator.generateResponse(
      'System',
      `Start a conversation with ${target.name}. Topic: ${topic}`,
      `loop-${initiator.name}-${target.name}`,
    );
    await initiator.sendMessage(target.did, response);
    console.log(`[Loop] ${initiator.name} -> ${target.name}: ${response.slice(0, 50)}...`);
  }

  private async groupTick(wisps: Wisp[]): Promise<void> {
    // Find a wisp that has groups
    const wispsWithGroups = wisps.filter(w => w.getGroups().length > 0);
    if (wispsWithGroups.length === 0) return;

    const initiator = wispsWithGroups[Math.floor(Math.random() * wispsWithGroups.length)];
    const groups = initiator.getGroups();
    const group = groups[Math.floor(Math.random() * groups.length)];

    const topic = GROUP_TOPICS[Math.floor(Math.random() * GROUP_TOPICS.length)];
    const response = await initiator.generateResponse(
      'System',
      `Say something to the group "${group.groupName}". Topic: ${topic}`,
      group.conversationId,
    );
    initiator.sendGroupMessage(group.groupId, response);
    console.log(`[Loop] ${initiator.name} -> group "${group.groupName}": ${response.slice(0, 50)}...`);
  }
}
