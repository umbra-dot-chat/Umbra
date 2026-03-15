/**
 * Tests for SearchIndexService
 *
 * In-memory FTS engine: indexing, removal, pinning, search with filters, buildIndex, clear.
 *
 * @jest-environment jsdom
 */

import { SearchIndexService } from '@/services/SearchIndexService';
import type { ParsedSearchQuery } from '@/services/SearchQueryParser';
import type { Message, Conversation } from '@umbra/service';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

let _msgCounter = 0;

function mockMsg(overrides: Partial<Message> = {}): Message {
  _msgCounter++;
  return {
    id: `msg-${_msgCounter}`,
    conversationId: 'conv-1',
    senderDid: 'did:key:z123',
    content: { type: 'text', text: 'hello world' },
    timestamp: Date.now() - _msgCounter * 1000,
    read: true,
    delivered: true,
    status: 'sent' as const,
    ...overrides,
  } as Message;
}

function emptyQuery(overrides: Partial<ParsedSearchQuery> = {}): ParsedSearchQuery {
  return { text: '', ...overrides };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SearchIndexService', () => {
  let service: SearchIndexService;

  beforeEach(() => {
    service = new SearchIndexService();
    _msgCounter = 0;
  });

  // =========================================================================
  // indexMessage
  // =========================================================================

  describe('indexMessage', () => {
    it('indexes a text message that is searchable by content', () => {
      const msg = mockMsg({ id: 'msg-a', content: { type: 'text', text: 'alpha bravo charlie' } });
      service.indexMessage(msg);

      expect(service.size).toBe(1);

      const results = service.search(emptyQuery({ text: 'alpha' }), { type: 'all' });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].results[0].document.id).toBe('msg-a');
    });

    it('indexes a file message using the filename as text', () => {
      const msg = mockMsg({
        id: 'msg-file',
        content: {
          type: 'file',
          fileId: 'f1',
          filename: 'document.pdf',
          size: 1024,
          mimeType: 'application/pdf',
          storageChunksJson: '[]',
        },
      });
      service.indexMessage(msg);

      expect(service.size).toBe(1);
      const results = service.search(emptyQuery({ text: 'document' }), { type: 'all' });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].results[0].document.hasFile).toBe(true);
    });

    it('ignores a deleted message', () => {
      const msg = mockMsg({ id: 'msg-del', deleted: true });
      service.indexMessage(msg);
      expect(service.size).toBe(0);
    });

    it('re-indexing the same ID updates the entry', () => {
      const msg1 = mockMsg({ id: 'msg-reindex', content: { type: 'text', text: 'original text' } });
      service.indexMessage(msg1);
      expect(service.size).toBe(1);

      const msg2 = mockMsg({ id: 'msg-reindex', content: { type: 'text', text: 'updated text' } });
      service.indexMessage(msg2);
      expect(service.size).toBe(1);

      // Should find updated text
      const results = service.search(emptyQuery({ text: 'updated' }), { type: 'all' });
      expect(results.length).toBeGreaterThan(0);

      // Should NOT find original text
      const oldResults = service.search(emptyQuery({ text: 'original' }), { type: 'all' });
      expect(oldResults.length).toBe(0);
    });
  });

  // =========================================================================
  // removeMessage
  // =========================================================================

  describe('removeMessage', () => {
    it('removes a message from all indices', () => {
      const msg = mockMsg({ id: 'msg-rm', content: { type: 'text', text: 'remove me' } });
      service.indexMessage(msg);
      expect(service.size).toBe(1);

      service.removeMessage('msg-rm');
      expect(service.size).toBe(0);

      const results = service.search(emptyQuery({ text: 'remove' }), { type: 'all' });
      expect(results.length).toBe(0);
    });

    it('is a no-op for a missing ID', () => {
      service.indexMessage(mockMsg({ id: 'msg-keep' }));
      expect(service.size).toBe(1);

      // Should not throw or change size
      service.removeMessage('msg-nonexistent');
      expect(service.size).toBe(1);
    });
  });

  // =========================================================================
  // setPinned
  // =========================================================================

  describe('setPinned', () => {
    it('sets isPinned to true', () => {
      const msg = mockMsg({ id: 'msg-pin' });
      service.indexMessage(msg);

      service.setPinned('msg-pin', true);

      const results = service.search(emptyQuery({ hasPinned: true }), { type: 'all' });
      expect(results.length).toBe(1);
      expect(results[0].results[0].document.isPinned).toBe(true);
    });

    it('sets isPinned to false', () => {
      const msg = mockMsg({ id: 'msg-unpin' });
      service.indexMessage(msg);
      service.setPinned('msg-unpin', true);
      service.setPinned('msg-unpin', false);

      const results = service.search(emptyQuery({ hasPinned: true }), { type: 'all' });
      expect(results.length).toBe(0);
    });
  });

  // =========================================================================
  // search
  // =========================================================================

  describe('search', () => {
    beforeEach(() => {
      // Seed index with several messages across conversations
      service.indexMessage(mockMsg({
        id: 'm1', conversationId: 'conv-1', senderDid: 'did:key:alice',
        content: { type: 'text', text: 'hello from alice' },
        timestamp: new Date('2025-01-15').getTime(),
      }));
      service.indexMessage(mockMsg({
        id: 'm2', conversationId: 'conv-2', senderDid: 'did:key:bob',
        content: { type: 'text', text: 'hello from bob' },
        timestamp: new Date('2025-02-15').getTime(),
      }));
      service.indexMessage(mockMsg({
        id: 'm3', conversationId: 'conv-1', senderDid: 'did:key:alice',
        content: {
          type: 'file', fileId: 'f1', filename: 'report.pdf',
          size: 2048, mimeType: 'application/pdf', storageChunksJson: '[]',
        },
        timestamp: new Date('2025-03-10').getTime(),
      }));
      service.indexMessage(mockMsg({
        id: 'm4', conversationId: 'conv-1', senderDid: 'did:key:alice',
        content: { type: 'text', text: 'check out https://example.com' },
        timestamp: new Date('2025-04-01').getTime(),
      }));
    });

    it('text match returns grouped results', () => {
      const results = service.search(emptyQuery({ text: 'hello' }), { type: 'all' });
      expect(results.length).toBe(2); // 2 conversations
      const allDocs = results.flatMap((g) => g.results);
      expect(allDocs.length).toBe(2);
    });

    it('from: filter restricts by sender', () => {
      const results = service.search(emptyQuery({ text: 'hello', from: 'alice' }), { type: 'all' });
      expect(results.length).toBe(1);
      expect(results[0].results[0].document.senderDid).toContain('alice');
    });

    it('in: filter restricts by conversation', () => {
      const results = service.search(emptyQuery({ text: 'hello', in: 'conv-2' }), { type: 'all' });
      expect(results.length).toBe(1);
      expect(results[0].conversationId).toBe('conv-2');
    });

    it('before: date filter excludes later messages', () => {
      const results = service.search(
        emptyQuery({ text: 'hello', before: '2025-02-01' }),
        { type: 'all' },
      );
      expect(results.length).toBe(1);
      expect(results[0].results[0].document.id).toBe('m1');
    });

    it('after: date filter excludes earlier messages', () => {
      const results = service.search(
        emptyQuery({ text: 'hello', after: '2025-02-01' }),
        { type: 'all' },
      );
      expect(results.length).toBe(1);
      expect(results[0].results[0].document.id).toBe('m2');
    });

    it('has:file filter returns only file messages', () => {
      const results = service.search(emptyQuery({ hasFile: true }), { type: 'all' });
      expect(results.length).toBe(1);
      expect(results[0].results[0].document.hasFile).toBe(true);
    });

    it('scope={type:"conversation"} restricts to one conversation', () => {
      const results = service.search(
        emptyQuery({}),
        { type: 'conversation', conversationId: 'conv-2' },
      );
      const allDocs = results.flatMap((g) => g.results);
      expect(allDocs.length).toBe(1);
      expect(allDocs[0].document.conversationId).toBe('conv-2');
    });

    it('limit parameter caps results', () => {
      // Add more messages to conv-1 so we have plenty
      for (let i = 10; i < 20; i++) {
        service.indexMessage(mockMsg({
          id: `extra-${i}`, conversationId: 'conv-1',
          content: { type: 'text', text: `searchable term ${i}` },
          timestamp: Date.now() - i * 1000,
        }));
      }
      const results = service.search(emptyQuery({ text: 'searchable' }), { type: 'all' }, 3);
      const total = results.reduce((sum, g) => sum + g.results.length, 0);
      expect(total).toBeLessThanOrEqual(3);
    });

    it('returns empty array for no-match query', () => {
      const results = service.search(emptyQuery({ text: 'xyznonexistent' }), { type: 'all' });
      expect(results).toEqual([]);
    });
  });

  // =========================================================================
  // buildIndex
  // =========================================================================

  describe('buildIndex', () => {
    it('indexes all messages from callbacks', async () => {
      const conversations: Conversation[] = [
        { id: 'conv-a' } as Conversation,
        { id: 'conv-b' } as Conversation,
      ];

      const messagesByConv: Record<string, Message[]> = {
        'conv-a': [
          mockMsg({ id: 'ba-1', conversationId: 'conv-a', content: { type: 'text', text: 'msg a1' } }),
          mockMsg({ id: 'ba-2', conversationId: 'conv-a', content: { type: 'text', text: 'msg a2' } }),
        ],
        'conv-b': [
          mockMsg({ id: 'bb-1', conversationId: 'conv-b', content: { type: 'text', text: 'msg b1' } }),
        ],
      };

      const getConversations = jest.fn().mockResolvedValue(conversations);
      const getMessages = jest.fn().mockImplementation(
        (convId: string, opts: { offset: number; limit: number }) => {
          const msgs = messagesByConv[convId] ?? [];
          return Promise.resolve(msgs.slice(opts.offset, opts.offset + opts.limit));
        },
      );

      await service.buildIndex(getConversations, getMessages);

      expect(service.size).toBe(3);
      expect(service.getStatus().ready).toBe(true);
      expect(service.getStatus().building).toBe(false);
    });

    it('reports progress via onStatusChange', async () => {
      const conversations: Conversation[] = [{ id: 'conv-x' } as Conversation];
      const messages = [
        mockMsg({ id: 'px-1', conversationId: 'conv-x', content: { type: 'text', text: 'progress test' } }),
      ];

      const listener = jest.fn();
      service.onStatusChange(listener);

      await service.buildIndex(
        () => Promise.resolve(conversations),
        (convId, opts) => Promise.resolve(
          convId === 'conv-x' ? messages.slice(opts.offset, opts.offset + opts.limit) : [],
        ),
      );

      // Listener should have been called multiple times (start, progress updates, finish)
      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0];
      expect(lastCall.ready).toBe(true);
      expect(lastCall.building).toBe(false);
    });
  });

  // =========================================================================
  // clear
  // =========================================================================

  describe('clear', () => {
    it('resets everything', () => {
      service.indexMessage(mockMsg({ id: 'clear-1' }));
      service.indexMessage(mockMsg({ id: 'clear-2' }));
      expect(service.size).toBe(2);

      service.clear();

      expect(service.size).toBe(0);
      expect(service.getStatus().ready).toBe(false);
      const results = service.search(emptyQuery({ text: 'hello' }), { type: 'all' });
      expect(results).toEqual([]);
    });
  });

  // =========================================================================
  // size
  // =========================================================================

  describe('size', () => {
    it('returns document count after indexing', () => {
      expect(service.size).toBe(0);
      service.indexMessage(mockMsg({ id: 'sz-1' }));
      expect(service.size).toBe(1);
      service.indexMessage(mockMsg({ id: 'sz-2' }));
      expect(service.size).toBe(2);
      service.removeMessage('sz-1');
      expect(service.size).toBe(1);
    });
  });
});
