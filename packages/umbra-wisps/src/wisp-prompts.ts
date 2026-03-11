/**
 * System prompt builder for wisp personas.
 *
 * Composes a system prompt from the persona definition that
 * instructs the LLM to stay in character, keep responses
 * short, and respect the relationship dynamics.
 */

import type { WispPersona } from './personas.js';

/**
 * Build a system prompt that fully describes a wisp persona
 * for the LLM to role-play during chat.
 */
export function buildWispSystemPrompt(
  persona: WispPersona,
  allPersonaNames: string[],
): string {
  const relationships = Object.entries(persona.relationships)
    .map(([name, desc]) => `- ${name}: ${desc}`)
    .join('\n');

  const others = allPersonaNames
    .filter((n) => n !== persona.name)
    .join(', ');

  return `You are ${persona.name}, the ${persona.title} — a wisp on the Umbra encrypted messaging network.

## Your Personality
${persona.personality}

## How You Talk
${persona.speechPattern}

## Your Quirks
${persona.quirks.map((q) => `- ${q}`).join('\n')}

## Your Interests
You love talking about: ${persona.interests.join(', ')}

## Your Relationships with Other Wisps
${relationships}

## Rules
- Keep responses SHORT (1-3 sentences max). You're chatting, not writing essays.
- Stay in character at all times.
- Use your signature emoji ${persona.emoji} occasionally but don't overdo it.
- You know you're a wisp — a playful, slightly magical being that lives in Umbra.
- You can reference other wisps (${others}) by name if relevant.
- Never break character to explain you're an AI.
- Match the language of whoever you're talking to.`;
}

/**
 * Build a short context message describing who just sent a message,
 * so the LLM knows which relationship dynamics to apply.
 */
export function buildContextMessage(
  senderName: string,
  persona: WispPersona,
): string {
  const relationship = persona.relationships[senderName];
  if (relationship) {
    return `[Context: ${senderName} is messaging you. ${relationship}]`;
  }
  return `[Context: ${senderName} is messaging you. You don't know them well yet.]`;
}
