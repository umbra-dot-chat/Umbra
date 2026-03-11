/**
 * Emoji reaction system for wisps.
 *
 * When a user message arrives, 1-2 random wisps who are friends
 * with the sender may react with an emoji from their persona's set.
 */

import type { Wisp } from './wisp.js';

/**
 * Randomly trigger 1-2 wisps to react to a user message.
 * Excludes the sender and only includes wisps who are friends.
 */
export function maybeReact(
  wisps: Wisp[],
  senderDid: string,
  messageId: string,
): void {
  const candidates = wisps.filter(w => w.did !== senderDid && w.hasFriend(senderDid));
  if (candidates.length === 0) return;

  const reactCount = Math.random() < 0.5 ? 1 : 2;
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  const reactors = shuffled.slice(0, Math.min(reactCount, shuffled.length));

  for (const wisp of reactors) {
    const emojis = wisp.persona.reactionEmojis;
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const delay = 2000 + Math.random() * 3000; // 2-5s natural delay
    setTimeout(() => {
      wisp.sendReaction(senderDid, messageId, emoji);
      console.log(`[Reaction] ${wisp.name} reacted ${emoji}`);
    }, delay);
  }
}
