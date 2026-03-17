/**
 * SearchIndexService — In-memory full-text search index for DM messages.
 *
 * Since DM messages are encrypted at rest, FTS must happen JS-side after
 * decryption. This service builds an index from decrypted messages and
 * provides fast text search with filtering.
 *
 * For Phase 8, community messages will use native FTS5 in Rust/SQLite.
 * This service handles DM indexing and acts as the unified query layer.
 */

import type { ParsedSearchQuery } from './SearchQueryParser';
import type { Message, Conversation } from '@umbra/service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single indexed document in the search index. */
export interface IndexedDocument {
  /** Message ID */
  id: string;
  /** Conversation ID this message belongs to */
  conversationId: string;
  /** Sender DID */
  senderDid: string;
  /** Plaintext content (text messages only) */
  text: string;
  /** Unix timestamp in ms */
  timestamp: number;
  /** Whether the message has file attachments */
  hasFile: boolean;
  /** Whether the message has reactions */
  hasReaction: boolean;
  /** Whether the message is pinned */
  isPinned: boolean;
  /** Whether the message contains URLs */
  hasLink: boolean;
}

/** A search result with relevance metadata. */
export interface UnifiedSearchResult {
  /** The indexed document */
  document: IndexedDocument;
  /** Matched text snippets (for highlighting) */
  matchedTerms: string[];
}

/** Results grouped by conversation. */
export interface GroupedSearchResults {
  conversationId: string;
  results: UnifiedSearchResult[];
}

/** Index build progress. */
export interface IndexStatus {
  /** Whether the index is currently being built */
  building: boolean;
  /** Progress 0-1 */
  progress: number;
  /** Total messages to index */
  total: number;
  /** Messages indexed so far */
  indexed: number;
  /** Whether the index has been built at least once */
  ready: boolean;
}

/** Scope for search queries. */
export type SearchScope =
  | { type: 'all' }
  | { type: 'conversation'; conversationId: string };

// ---------------------------------------------------------------------------
// URL detection regex
// ---------------------------------------------------------------------------

const URL_REGEX = /https?:\/\/[^\s]+/i;

// ---------------------------------------------------------------------------
// SearchIndexService
// ---------------------------------------------------------------------------

export class SearchIndexService {
  /** In-memory index: messageId -> IndexedDocument */
  private documents = new Map<string, IndexedDocument>();

  /** Inverted index: term -> Set<messageId> */
  private invertedIndex = new Map<string, Set<string>>();

  /** Conversation index: conversationId -> Set<messageId> */
  private conversationIndex = new Map<string, Set<string>>();

  /** Build status */
  private status: IndexStatus = {
    building: false,
    progress: 0,
    total: 0,
    indexed: 0,
    ready: false,
  };

  /** Status change listeners */
  private statusListeners = new Set<(status: IndexStatus) => void>();

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  getStatus(): IndexStatus {
    return { ...this.status };
  }

  onStatusChange(listener: (status: IndexStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  /**
   * Build the index from all conversations.
   * Fetches messages in batches and indexes them.
   */
  async buildIndex(
    getConversations: () => Promise<Conversation[]>,
    getMessages: (convId: string, opts: { offset: number; limit: number }) => Promise<Message[]>,
  ): Promise<void> {
    this.status = { building: true, progress: 0, total: 0, indexed: 0, ready: false };
    this.notifyStatusListeners();

    try {
      const conversations = await getConversations();
      // Estimate total — we'll refine as we go
      this.status.total = conversations.length * 50; // rough estimate
      this.notifyStatusListeners();

      let totalIndexed = 0;

      for (const conv of conversations) {
        let offset = 0;
        const pageSize = 50;

        while (true) {
          const messages = await getMessages(conv.id, { offset, limit: pageSize });
          if (messages.length === 0) break;

          for (const msg of messages) {
            this.indexMessage(msg);
            totalIndexed++;
          }

          offset += pageSize;

          // Update progress
          this.status.indexed = totalIndexed;
          this.status.progress = Math.min(totalIndexed / Math.max(this.status.total, 1), 0.99);
          this.notifyStatusListeners();

          // Yield to main thread every batch
          await yieldToMainThread();

          if (messages.length < pageSize) break;
        }
      }

      this.status = {
        building: false,
        progress: 1,
        total: totalIndexed,
        indexed: totalIndexed,
        ready: true,
      };
      this.notifyStatusListeners();
    } catch (err) {
      console.error('[SearchIndex] Build failed:', err);
      this.status.building = false;
      this.notifyStatusListeners();
    }
  }

  /**
   * Index a single message (for real-time updates on new messages).
   */
  indexMessage(msg: Message): void {
    if (msg.deleted) return;

    const text = extractText(msg);
    if (!text) return;

    const doc: IndexedDocument = {
      id: msg.id,
      conversationId: msg.conversationId,
      senderDid: msg.senderDid,
      text,
      timestamp: msg.timestamp,
      hasFile: msg.content?.type === 'file' || msg.content?.type === 'shared_folder',
      hasReaction: (msg.reactions?.length ?? 0) > 0,
      isPinned: false, // Updated separately via events
      hasLink: URL_REGEX.test(text),
    };

    // Remove old version if exists
    this.removeMessage(msg.id);

    // Store document
    this.documents.set(doc.id, doc);

    // Update conversation index
    let convSet = this.conversationIndex.get(doc.conversationId);
    if (!convSet) {
      convSet = new Set();
      this.conversationIndex.set(doc.conversationId, convSet);
    }
    convSet.add(doc.id);

    // Update inverted index
    const terms = tokenize(text);
    for (const term of terms) {
      let termSet = this.invertedIndex.get(term);
      if (!termSet) {
        termSet = new Set();
        this.invertedIndex.set(term, termSet);
      }
      termSet.add(doc.id);
    }
  }

  /**
   * Remove a message from the index.
   */
  removeMessage(messageId: string): void {
    const existing = this.documents.get(messageId);
    if (!existing) return;

    // Remove from conversation index
    this.conversationIndex.get(existing.conversationId)?.delete(messageId);

    // Remove from inverted index
    const terms = tokenize(existing.text);
    for (const term of terms) {
      this.invertedIndex.get(term)?.delete(messageId);
    }

    this.documents.delete(messageId);
  }

  /**
   * Mark a message as pinned/unpinned.
   */
  setPinned(messageId: string, pinned: boolean): void {
    const doc = this.documents.get(messageId);
    if (doc) doc.isPinned = pinned;
  }

  /**
   * Search the index with parsed query and scope.
   */
  search(query: ParsedSearchQuery, scope: SearchScope, limit = 200): GroupedSearchResults[] {
    // Start with all documents in scope
    let candidateIds: Set<string>;

    if (scope.type === 'conversation') {
      candidateIds = new Set(this.conversationIndex.get(scope.conversationId) ?? []);
    } else {
      candidateIds = new Set(this.documents.keys());
    }

    // Apply text search (intersect with inverted index matches)
    if (query.text) {
      const textTerms = tokenize(query.text);
      for (const term of textTerms) {
        const termMatches = this.findTermMatches(term);
        candidateIds = intersect(candidateIds, termMatches);
      }
    }

    // Apply filters
    const filtered: UnifiedSearchResult[] = [];
    const matchedTerms = query.text ? tokenize(query.text) : [];

    for (const id of candidateIds) {
      if (filtered.length >= limit) break;

      const doc = this.documents.get(id);
      if (!doc) continue;

      if (!matchesFilters(doc, query)) continue;

      filtered.push({ document: doc, matchedTerms });
    }

    // Sort by timestamp descending (most recent first)
    filtered.sort((a, b) => b.document.timestamp - a.document.timestamp);

    // Group by conversation
    return groupByConversation(filtered);
  }

  /**
   * Get total number of indexed documents.
   */
  get size(): number {
    return this.documents.size;
  }

  /**
   * Clear the entire index.
   */
  clear(): void {
    this.documents.clear();
    this.invertedIndex.clear();
    this.conversationIndex.clear();
    this.status = { building: false, progress: 0, total: 0, indexed: 0, ready: false };
    this.notifyStatusListeners();
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  /** Find all document IDs matching a term (prefix match for partial terms). */
  private findTermMatches(term: string): Set<string> {
    // Exact match first
    const exact = this.invertedIndex.get(term);
    if (exact && exact.size > 0) return exact;

    // Prefix match for partial typing
    const matches = new Set<string>();
    for (const [key, ids] of this.invertedIndex) {
      if (key.startsWith(term)) {
        for (const id of ids) matches.add(id);
      }
    }
    return matches;
  }

  private notifyStatusListeners(): void {
    const snapshot = this.getStatus();
    for (const listener of this.statusListeners) {
      listener(snapshot);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract searchable text from a message. */
function extractText(msg: Message): string {
  if (!msg.content) return '';
  switch (msg.content.type) {
    case 'text':
      return msg.content.text;
    case 'file':
      return msg.content.filename;
    case 'shared_folder':
      return msg.content.folderName;
    default:
      return '';
  }
}

/** Tokenize text into lowercase terms for indexing. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** Intersect two sets. */
function intersect(a: Set<string>, b: Set<string>): Set<string> {
  const result = new Set<string>();
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  for (const item of smaller) {
    if (larger.has(item)) result.add(item);
  }
  return result;
}

/** Check if a document matches non-text filters. */
function matchesFilters(doc: IndexedDocument, query: ParsedSearchQuery): boolean {
  if (query.from) {
    // Will be resolved to DID by the context layer — for now match on senderDid
    if (!doc.senderDid.toLowerCase().includes(query.from.toLowerCase())) {
      return false;
    }
  }

  if (query.in) {
    // Will be resolved to conversationId by the context layer
    if (!doc.conversationId.toLowerCase().includes(query.in.toLowerCase())) {
      return false;
    }
  }

  if (query.before) {
    const beforeTs = new Date(query.before).getTime();
    if (!isNaN(beforeTs) && doc.timestamp >= beforeTs) return false;
  }

  if (query.after) {
    const afterTs = new Date(query.after).getTime();
    if (!isNaN(afterTs) && doc.timestamp <= afterTs) return false;
  }

  if (query.hasFile && !doc.hasFile) return false;
  if (query.hasReaction && !doc.hasReaction) return false;
  if (query.hasPinned && !doc.isPinned) return false;
  if (query.hasLink && !doc.hasLink) return false;

  return true;
}

/** Group results by conversation. */
function groupByConversation(results: UnifiedSearchResult[]): GroupedSearchResults[] {
  const groups = new Map<string, UnifiedSearchResult[]>();

  for (const result of results) {
    const convId = result.document.conversationId;
    let group = groups.get(convId);
    if (!group) {
      group = [];
      groups.set(convId, group);
    }
    group.push(result);
  }

  return Array.from(groups.entries()).map(([conversationId, groupResults]) => ({
    conversationId,
    results: groupResults,
  }));
}

/** Yield to the main thread to avoid blocking UI during index build. */
function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}
