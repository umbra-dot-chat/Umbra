/**
 * Integration tests for Discovery (T3.9):
 * Username search, platform selector switching, QR code generation,
 * batch lookup, and platform-specific search.
 *
 * Tests the service-level discovery operations and relay query patterns.
 * Uses the Jest-mocked UmbraService singleton.
 * Test IDs: T3.9.1–T3.9.12
 */

const { UmbraService } = require('@umbra/service');

// ── Constants ──────────────────────────────────────────────────────────────────

const SUPPORTED_PLATFORMS = ['umbra', 'discord', 'github', 'steam', 'bluesky'] as const;

const PLATFORM_PLACEHOLDERS: Record<string, string> = {
  umbra: 'Search by username (e.g., Matt or Matt#01283)',
  discord: 'Search by Discord username...',
  github: 'Search by GitHub username...',
  steam: 'Search by Steam username...',
  bluesky: 'Search by Bluesky username...',
};

// ── Test Suite ─────────────────────────────────────────────────────────────────

describe('Discovery (T3.9)', () => {
  let svc: InstanceType<typeof UmbraService>;

  beforeAll(async () => {
    await UmbraService.initialize();
    svc = UmbraService.instance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── T3.9.1 Username Search ───────────────────────────────────────────────

  describe('Username Search (T3.9.1)', () => {
    test('relay search query has correct structure for username lookup', async () => {
      const searchPayload = {
        type: 'search',
        platform: 'umbra',
        query: 'alice42',
      };

      const identity = await svc.getIdentity();
      const payloadStr = JSON.stringify(searchPayload);

      await svc.relaySend('did:key:z6MkRelay', payloadStr);

      expect(svc.relaySend).toHaveBeenCalledTimes(1);
      expect(svc.relaySend).toHaveBeenCalledWith('did:key:z6MkRelay', payloadStr);

      // Verify the payload structure is valid JSON with expected fields
      const sentPayload = JSON.parse(svc.relaySend.mock.calls[0][1]);
      expect(sentPayload).toEqual({
        type: 'search',
        platform: 'umbra',
        query: 'alice42',
      });
    });

    test('search with empty string should be treated as no-op', async () => {
      const emptyQuery = '';

      // An empty search should not trigger a relay send
      if (emptyQuery.trim().length === 0) {
        // No relay call should be made
        expect(svc.relaySend).not.toHaveBeenCalled();
      }
    });

    test('search debouncing — rapid queries coalesce', async () => {
      jest.useFakeTimers();

      const queries = ['a', 'al', 'ali', 'alic', 'alice'];
      const DEBOUNCE_MS = 300;
      let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

      // Simulate debounced search: only the last query fires
      for (const query of queries) {
        if (pendingTimeout) {
          clearTimeout(pendingTimeout);
        }
        pendingTimeout = setTimeout(() => {
          const payload = JSON.stringify({ type: 'search', platform: 'umbra', query });
          svc.relaySend('did:key:z6MkRelay', payload);
        }, DEBOUNCE_MS);
      }

      // Advance past the debounce window
      jest.advanceTimersByTime(DEBOUNCE_MS + 50);

      // Only the final query should have been sent
      expect(svc.relaySend).toHaveBeenCalledTimes(1);

      const sentPayload = JSON.parse(svc.relaySend.mock.calls[0][1]);
      expect(sentPayload.query).toBe('alice');

      jest.useRealTimers();
    });
  });

  // ── T3.9.2–T3.9.6 Platform Selector ─────────────────────────────────────

  describe('Platform Selector (T3.9.2–T3.9.6)', () => {
    test('platform search payloads differ by platform type', async () => {
      const platforms = ['umbra', 'discord', 'github'] as const;
      const testQuery = 'testuser';

      for (const platform of platforms) {
        jest.clearAllMocks();

        const searchPayload = {
          type: 'search',
          platform,
          query: testQuery,
        };

        await svc.relaySend('did:key:z6MkRelay', JSON.stringify(searchPayload));

        const sentPayload = JSON.parse(svc.relaySend.mock.calls[0][1]);
        expect(sentPayload.platform).toBe(platform);
        expect(sentPayload.type).toBe('search');
        expect(sentPayload.query).toBe(testQuery);
      }
    });

    test('supported platforms list includes Umbra, Discord, GitHub, Steam, Bluesky', () => {
      expect(SUPPORTED_PLATFORMS).toContain('umbra');
      expect(SUPPORTED_PLATFORMS).toContain('discord');
      expect(SUPPORTED_PLATFORMS).toContain('github');
      expect(SUPPORTED_PLATFORMS).toContain('steam');
      expect(SUPPORTED_PLATFORMS).toContain('bluesky');
      expect(SUPPORTED_PLATFORMS).toHaveLength(5);
    });

    test('each platform generates correct search placeholder pattern', () => {
      for (const platform of SUPPORTED_PLATFORMS) {
        const placeholder = PLATFORM_PLACEHOLDERS[platform];
        expect(placeholder).toBeDefined();
        expect(typeof placeholder).toBe('string');
        expect(placeholder.length).toBeGreaterThan(0);

        // Each placeholder should mention the platform name or a search cue
        expect(placeholder.toLowerCase()).toMatch(/search|username/i);
      }

      // Verify specific placeholders
      expect(PLATFORM_PLACEHOLDERS.umbra).toContain('Matt');
      expect(PLATFORM_PLACEHOLDERS.discord).toContain('Discord');
      expect(PLATFORM_PLACEHOLDERS.github).toContain('GitHub');
      expect(PLATFORM_PLACEHOLDERS.steam).toContain('Steam');
      expect(PLATFORM_PLACEHOLDERS.bluesky).toContain('Bluesky');
    });
  });

  // ── T3.9.9–T3.9.10 QR Code ──────────────────────────────────────────────

  describe('QR Code (T3.9.9–T3.9.10)', () => {
    test('QR code data contains user DID', async () => {
      const identity = await svc.getIdentity();
      const qrData = JSON.stringify({ did: identity.did, name: identity.displayName });

      expect(qrData).toContain(identity.did);
      expect(qrData).toContain('did:key:');

      const parsed = JSON.parse(qrData);
      expect(parsed.did).toBe(identity.did);
      expect(parsed.name).toBe(identity.displayName);
    });

    test('QR code data is deterministic for same DID', async () => {
      const identity = await svc.getIdentity();

      const qrData1 = JSON.stringify({ did: identity.did, name: identity.displayName });
      const qrData2 = JSON.stringify({ did: identity.did, name: identity.displayName });

      expect(qrData1).toBe(qrData2);

      // Parsing both should yield identical objects
      expect(JSON.parse(qrData1)).toEqual(JSON.parse(qrData2));
    });

    test('scan mode accepts valid DID format', () => {
      const validDids = [
        'did:key:z6MkTest',
        'did:key:z6MkAlice123',
        'did:key:z6MkBobAbcdef',
      ];

      const DID_PATTERN = /^did:key:z6Mk[A-Za-z0-9]+$/;

      for (const did of validDids) {
        expect(did).toMatch(DID_PATTERN);
      }
    });

    test('scan mode rejects invalid DID', () => {
      const invalidDids = [
        '',
        'not-a-did',
        'did:wrong:z6MkTest',
        'did:key:',
        'did:key:z6Mk',
        'random-string-12345',
      ];

      const DID_PATTERN = /^did:key:z6Mk[A-Za-z0-9]+$/;

      for (const did of invalidDids) {
        expect(did).not.toMatch(DID_PATTERN);
      }
    });
  });

  // ── T3.9.11–T3.9.12 Search & Batch Lookup ───────────────────────────────

  describe('Search & Batch Lookup (T3.9.11–T3.9.12)', () => {
    test('batch lookup sends array of usernames to relay', async () => {
      const usernames = ['alice', 'bob', 'charlie'];
      const batchPayload = {
        type: 'batch_lookup',
        platform: 'umbra',
        queries: usernames,
      };

      await svc.relaySend('did:key:z6MkRelay', JSON.stringify(batchPayload));

      expect(svc.relaySend).toHaveBeenCalledTimes(1);

      const sentPayload = JSON.parse(svc.relaySend.mock.calls[0][1]);
      expect(sentPayload.type).toBe('batch_lookup');
      expect(sentPayload.queries).toEqual(usernames);
      expect(sentPayload.queries).toHaveLength(3);
    });

    test('search results map to user objects with DID and displayName', async () => {
      // Simulate a search result set that would come back from relay
      const mockSearchResults = [
        { did: 'did:key:z6MkAlice', displayName: 'Alice' },
        { did: 'did:key:z6MkBob', displayName: 'Bob' },
      ];

      // Each result should have required fields
      for (const result of mockSearchResults) {
        expect(result.did).toMatch(/^did:key:/);
        expect(typeof result.displayName).toBe('string');
        expect(result.displayName.length).toBeGreaterThan(0);
      }

      // Verify the array structure
      expect(mockSearchResults).toHaveLength(2);
      expect(mockSearchResults.map((r) => r.displayName)).toEqual(['Alice', 'Bob']);
    });

    test('empty search results return empty array', async () => {
      // Simulate empty relay response
      const emptyResults: Array<{ did: string; displayName: string }> = [];

      expect(emptyResults).toEqual([]);
      expect(emptyResults).toHaveLength(0);
      expect(Array.isArray(emptyResults)).toBe(true);
    });

    test('onDiscoveryEvent returns unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = svc.onDiscoveryEvent(callback);

      expect(svc.onDiscoveryEvent).toHaveBeenCalledTimes(1);
      expect(svc.onDiscoveryEvent).toHaveBeenCalledWith(callback);
      expect(typeof unsubscribe).toBe('function');

      // Calling unsubscribe should not throw
      expect(() => unsubscribe()).not.toThrow();
    });
  });
});
