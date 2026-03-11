/**
 * Minimal Ollama LLM client for wisp chat responses.
 *
 * Follows the pattern from umbra-ghost-ai/src/llm/ollama.ts
 * but simplified — wisps only need basic chat completion.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class WispLLMClient {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(
    baseUrl: string = 'http://localhost:11434',
    model: string = 'llama3.2:1b',
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
  }

  /** Send a chat completion request. Returns the assistant response. */
  async chat(messages: ChatMessage[]): Promise<string> {
    const resp = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
        options: {
          num_predict: 128, // Short responses for wisps
          temperature: 0.8,
          top_p: 0.9,
        },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Ollama error ${resp.status}: ${text}`);
    }

    const data = (await resp.json()) as {
      message?: { content: string };
    };
    return data.message?.content ?? '';
  }

  /** Check if Ollama is reachable and list available models. */
  async healthCheck(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.baseUrl}/api/tags`);
      return resp.ok;
    } catch {
      return false;
    }
  }
}
