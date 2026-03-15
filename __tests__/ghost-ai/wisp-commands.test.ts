/**
 * Ghost AI wisp-commands.ts — unit tests for wisp intent detection.
 */

import { detectAndExecuteWispCommand } from '../../packages/umbra-ghost-ai/src/handlers/wisp-commands';

// ---------------------------------------------------------------------------
// Mock fetch globally — we don't want real HTTP calls
// ---------------------------------------------------------------------------

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

const mockLog = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const TEST_DID = 'did:key:zTestUser123';

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
});

// ---------------------------------------------------------------------------
// Detection tests
// ---------------------------------------------------------------------------

describe('detectAndExecuteWispCommand — detection', () => {
  it('detects "summon the wisps"', async () => {
    const result = await detectAndExecuteWispCommand('summon the wisps', TEST_DID, mockLog);
    expect(result.detected).toBe(true);
    expect(result.action).toBe('summon');
    expect(result.response).toBeDefined();
  });

  it('detects "bring in the wisps"', async () => {
    const result = await detectAndExecuteWispCommand('bring in the wisps', TEST_DID, mockLog);
    expect(result.detected).toBe(true);
    expect(result.action).toBe('summon');
  });

  it('detects "release the gremlins"', async () => {
    const result = await detectAndExecuteWispCommand('release the gremlins', TEST_DID, mockLog);
    expect(result.detected).toBe(true);
    expect(result.action).toBe('summon');
  });

  it('detects "add some friends"', async () => {
    const result = await detectAndExecuteWispCommand('add some friends', TEST_DID, mockLog);
    expect(result.detected).toBe(true);
    expect(result.action).toBe('befriend');
  });

  it('detects "start a group chat"', async () => {
    const result = await detectAndExecuteWispCommand('start a group chat', TEST_DID, mockLog);
    expect(result.detected).toBe(true);
    expect(result.action).toBe('create-group');
  });

  it('detects "run the chaos scenario"', async () => {
    const result = await detectAndExecuteWispCommand('run the chaos scenario', TEST_DID, mockLog);
    expect(result.detected).toBe(true);
    expect(result.action).toBe('scenario');
  });

  it('detects "wisp status"', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ wispCount: 4, running: true, wisps: [{ name: 'Nyx' }] }),
    });
    const result = await detectAndExecuteWispCommand('wisp status', TEST_DID, mockLog);
    expect(result.detected).toBe(true);
    expect(result.action).toBe('status');
    expect(result.response).toContain('Nyx');
  });

  it('returns { detected: false } for unrelated messages', async () => {
    const result = await detectAndExecuteWispCommand('hello, how are you?', TEST_DID, mockLog);
    expect(result.detected).toBe(false);
    expect(result.action).toBeUndefined();
    expect(result.response).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('detectAndExecuteWispCommand — error handling', () => {
  it('returns a fallback response when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
    const result = await detectAndExecuteWispCommand('summon the wisps', TEST_DID, mockLog);
    expect(result.detected).toBe(true);
    expect(result.action).toBe('summon');
    expect(result.response).toContain('sleeping');
  });
});
