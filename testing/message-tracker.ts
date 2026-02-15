/**
 * MessageTracker — In-memory tracker for sent/received messages.
 *
 * Allows bots to reference message IDs for thread replies, reactions,
 * and message status receipts. Uses a circular buffer (last 200 messages).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TrackedMessage {
  messageId: string;
  conversationId: string;
  content: string;
  timestamp: number;
  senderDid: string;
  recipientDid: string;
  threadId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MessageTracker
// ─────────────────────────────────────────────────────────────────────────────

const MAX_MESSAGES = 200;

export class MessageTracker {
  private sent: TrackedMessage[] = [];
  private received: TrackedMessage[] = [];

  /**
   * Track an outgoing message.
   */
  trackSent(msg: TrackedMessage): void {
    this.sent.push(msg);
    if (this.sent.length > MAX_MESSAGES) {
      this.sent.shift();
    }
  }

  /**
   * Track an incoming message.
   */
  trackReceived(msg: TrackedMessage): void {
    this.received.push(msg);
    if (this.received.length > MAX_MESSAGES) {
      this.received.shift();
    }
  }

  /**
   * Get the last sent message, optionally filtered by conversationId.
   */
  getLastSent(conversationId?: string): TrackedMessage | null {
    if (conversationId) {
      for (let i = this.sent.length - 1; i >= 0; i--) {
        if (this.sent[i].conversationId === conversationId) return this.sent[i];
      }
      return null;
    }
    return this.sent.length > 0 ? this.sent[this.sent.length - 1] : null;
  }

  /**
   * Get the last received message, optionally filtered by conversationId or senderDid.
   */
  getLastReceived(filter?: { conversationId?: string; senderDid?: string }): TrackedMessage | null {
    for (let i = this.received.length - 1; i >= 0; i--) {
      const m = this.received[i];
      if (filter?.conversationId && m.conversationId !== filter.conversationId) continue;
      if (filter?.senderDid && m.senderDid !== filter.senderDid) continue;
      return m;
    }
    return this.received.length > 0 && !filter ? this.received[this.received.length - 1] : null;
  }

  /**
   * Get all tracked messages (sent + received), optionally filtered by conversationId.
   * Sorted by timestamp ascending.
   */
  getAll(conversationId?: string): TrackedMessage[] {
    const all = [...this.sent, ...this.received];
    const filtered = conversationId
      ? all.filter((m) => m.conversationId === conversationId)
      : all;
    return filtered.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get all sent messages.
   */
  getAllSent(): TrackedMessage[] {
    return [...this.sent];
  }

  /**
   * Get all received messages.
   */
  getAllReceived(): TrackedMessage[] {
    return [...this.received];
  }

  /**
   * Get the last N messages (combined sent + received), most recent first.
   */
  getRecent(count: number): TrackedMessage[] {
    const all = [...this.sent, ...this.received];
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all.slice(0, count);
  }

  /**
   * Find a message by ID.
   */
  getById(messageId: string): TrackedMessage | null {
    return (
      this.sent.find((m) => m.messageId === messageId) ??
      this.received.find((m) => m.messageId === messageId) ??
      null
    );
  }

  /**
   * Get all messages in a thread (sent + received with matching threadId).
   */
  getByThread(threadId: string): TrackedMessage[] {
    const all = [...this.sent, ...this.received];
    return all
      .filter((m) => m.threadId === threadId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get all received messages from a specific sender.
   */
  getReceivedFrom(senderDid: string): TrackedMessage[] {
    return this.received.filter((m) => m.senderDid === senderDid);
  }

  /**
   * Get total message count.
   */
  get totalCount(): number {
    return this.sent.length + this.received.length;
  }
}
