/**
 * Ollama LLM provider — calls the local Ollama HTTP API.
 *
 * Chat: POST /api/chat
 * Embed: POST /api/embed
 */

import type { ChatMessage, LLMProvider } from './provider.js';
import type { Logger } from '../config.js';

export class OllamaProvider implements LLMProvider {
  private baseUrl: string;
  private model: string;
  private embedModel: string;
  private log: Logger;

  constructor(baseUrl: string, model: string, embedModel: string, log: Logger) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
    this.embedModel = embedModel;
    this.log = log;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const startTime = Date.now();
    this.log.debug(`Calling Ollama chat (model: ${this.model}, messages: ${messages.length})`);

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: 1024,
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ollama chat error ${res.status}: ${text}`);
      }

      const data = (await res.json()) as { message: { content: string } };
      const elapsed = Date.now() - startTime;
      this.log.debug(`Ollama response in ${elapsed}ms (${data.message.content.length} chars)`);

      return data.message.content;
    } catch (err) {
      this.log.error('Ollama chat failed:', err);
      return "Sorry, I'm having trouble thinking right now. Try again in a moment! 🤔";
    }
  }

  async embed(text: string): Promise<number[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.embedModel,
          input: text,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Ollama embed error ${res.status}: ${errText}`);
      }

      const data = (await res.json()) as { embeddings: number[][] };
      return data.embeddings[0] ?? [];
    } catch (err) {
      this.log.error('Ollama embed failed:', err);
      return [];
    }
  }

  /** Check if Ollama is reachable and the model is available. */
  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) return false;
      const data = (await res.json()) as { models: { name: string }[] };
      const available = data.models.map((m) => m.name.split(':')[0]);
      this.log.info(`Ollama models available: ${available.join(', ')}`);
      return available.includes(this.model) || available.some((m) => m.startsWith(this.model));
    } catch {
      return false;
    }
  }
}
