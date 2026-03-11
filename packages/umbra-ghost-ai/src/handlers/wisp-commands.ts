/**
 * Wisp command detection — detects wisp-related intents in user messages
 * and calls the wisp orchestrator HTTP API to execute them.
 */

import type { Logger } from '../config.js';

const WISP_API_URL = process.env.WISP_API_URL || 'http://localhost:3334';

/** Pattern-to-action mappings for wisp intent detection */
const WISP_PATTERNS: { pattern: RegExp; action: string }[] = [
  { pattern: /bring\s+in\s+(the\s+)?wisps/i, action: 'summon' },
  { pattern: /summon\s+(the\s+)?wisps/i, action: 'summon' },
  { pattern: /invite\s+(the\s+)?wisps/i, action: 'summon' },
  { pattern: /release\s+the\s+(gremlins|goblins)/i, action: 'summon' },
  { pattern: /let\s+loose\s+the\s+wisps/i, action: 'summon' },
  { pattern: /add\s+(some\s+)?friends/i, action: 'befriend' },
  { pattern: /start\s+a?\s*group\s+chat/i, action: 'create-group' },
  { pattern: /run\s+(the\s+)?(\w+)\s+scenario/i, action: 'scenario' },
  { pattern: /wisp\s+status/i, action: 'status' },
];

export interface WispCommandResult {
  detected: boolean;
  action?: string;
  response?: string;
}

/**
 * Scan a user message for wisp-related intents. If one is found,
 * call the wisp orchestrator HTTP API and return a fun response.
 */
export async function detectAndExecuteWispCommand(
  message: string,
  userDid: string,
  log: Logger,
): Promise<WispCommandResult> {
  for (const { pattern, action } of WISP_PATTERNS) {
    const match = message.match(pattern);
    if (!match) continue;

    log.info(`Wisp command detected: action="${action}" from message`);

    try {
      switch (action) {
        case 'summon': {
          await fetch(`${WISP_API_URL}/wisps/summon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userDid }),
          });
          return {
            detected: true,
            action,
            response:
              'The wisps are on their way! You should receive friend requests ' +
              'from Nyx, Flicker, Bramble, and Pixel shortly. They\'re a quirky ' +
              'bunch — give them a moment to settle in.',
          };
        }

        case 'befriend': {
          await fetch(`${WISP_API_URL}/wisps/befriend-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ did: userDid }),
          });
          return {
            detected: true,
            action,
            response:
              'I\'ve sent the wisps your way! They\'ll each send you a friend ' +
              'request. Accept them and they\'ll chat with you in character. ' +
              'Fair warning — Flicker is... energetic.',
          };
        }

        case 'create-group': {
          await fetch(`${WISP_API_URL}/wisps/create-group`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Wisp Hollow', userDid }),
          });
          return {
            detected: true,
            action,
            response:
              'Done! I\'ve created a group called "Wisp Hollow" with all the ' +
              'wisps. You should see the invite pop up. It\'s... going to get ' +
              'chaotic in there.',
          };
        }

        case 'scenario': {
          const scenarioName = match[2] || 'day-in-the-life';
          await fetch(`${WISP_API_URL}/wisps/scenario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: scenarioName }),
          });
          return {
            detected: true,
            action,
            response:
              `Running the "${scenarioName}" scenario! The wisps are doing ` +
              'their thing. Check your messages in a moment.',
          };
        }

        case 'status': {
          const resp = await fetch(`${WISP_API_URL}/wisps/status`);
          const data = (await resp.json()) as {
            wispCount?: number;
            running?: boolean;
            wisps?: { name: string }[];
          };
          const names = data.wisps?.map((w) => w.name).join(', ') || 'none';
          const state = data.running ? 'running' : 'idle';
          return {
            detected: true,
            action,
            response:
              `Wisp swarm status: ${data.wispCount ?? 0} active wisps ` +
              `(${names}). All connected and ${state}.`,
          };
        }
      }
    } catch (err) {
      log.warn(`Wisp API call failed for action="${action}":`, err);
      return {
        detected: true,
        action,
        response:
          'Hmm, the wisps seem to be sleeping right now. Make sure the wisp ' +
          'swarm is running (`wisps start`) and try again!',
      };
    }
  }

  return { detected: false };
}
