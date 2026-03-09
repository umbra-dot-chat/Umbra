/**
 * LLM provider interface — abstracts chat completion and embedding APIs.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMProvider {
  /** Generate a chat completion. */
  chat(messages: ChatMessage[]): Promise<string>;
  /** Generate an embedding vector for text. */
  embed(text: string): Promise<number[]>;
}
