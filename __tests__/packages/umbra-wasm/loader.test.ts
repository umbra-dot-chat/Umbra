/**
 * Tests for the mock WASM module loader.
 *
 * Verifies all mock WASM functions in packages/umbra-wasm/loader.ts
 * including identity, messaging (edit/delete/pin/react/forward/thread),
 * and friend request direction.
 */

const wasmModule = require('@umbra/wasm');

// The @umbra/wasm mock returns null for getWasm. We test the contract
// indirectly through UmbraService mock (which delegates to WASM).
// These tests verify the mock module exports are correct.

describe('WASM loader mock', () => {
  test('initUmbraWasm resolves', async () => {
    await expect(wasmModule.initUmbraWasm()).resolves.toBeDefined();
  });

  test('getWasm returns null in test env', () => {
    expect(wasmModule.getWasm()).toBeNull();
  });

  test('isWasmReady returns false in test env', () => {
    expect(wasmModule.isWasmReady()).toBe(false);
  });

  test('eventBridge has connect/onAll/disconnect', () => {
    expect(typeof wasmModule.eventBridge.connect).toBe('function');
    expect(typeof wasmModule.eventBridge.onAll).toBe('function');
    expect(typeof wasmModule.eventBridge.disconnect).toBe('function');
  });
});

/**
 * Tests for new messaging methods via the UmbraService mock.
 * The mock mirrors what real WASM would return.
 */
const { UmbraService } = require('@umbra/service');

describe('WASM mock messaging methods (via UmbraService)', () => {
  let svc: any;

  beforeAll(async () => {
    await UmbraService.initialize();
    svc = UmbraService.instance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('editMessage updates content and sets edited flag', async () => {
    const result = await svc.editMessage('msg-1', 'Edited text');
    expect(result.id).toBe('msg-1');
    expect(result.content.text).toBe('Edited text');
    expect(result.edited).toBe(true);
  });

  test('deleteMessage resolves', async () => {
    await expect(svc.deleteMessage('msg-1')).resolves.not.toThrow();
  });

  test('pinMessage sets pinned flag', async () => {
    const result = await svc.pinMessage('msg-5');
    expect(result.id).toBe('msg-5');
    expect(result.pinned).toBe(true);
    expect(result.pinnedBy).toBeDefined();
  });

  test('unpinMessage resolves', async () => {
    await expect(svc.unpinMessage('msg-5')).resolves.not.toThrow();
  });

  test('addReaction returns reactions array with emoji', async () => {
    const reactions = await svc.addReaction('msg-1', '🔥');
    expect(Array.isArray(reactions)).toBe(true);
    expect(reactions[0].emoji).toBe('🔥');
    expect(reactions[0].count).toBe(1);
  });

  test('removeReaction returns array', async () => {
    const result = await svc.removeReaction('msg-1', '🔥');
    expect(Array.isArray(result)).toBe(true);
  });

  test('forwardMessage creates new message in target conversation', async () => {
    const result = await svc.forwardMessage('msg-1', 'conv-target');
    expect(result.conversationId).toBe('conv-target');
    expect(result.forwarded).toBe(true);
    expect(typeof result.id).toBe('string');
  });

  test('getThreadReplies returns array', async () => {
    const result = await svc.getThreadReplies('msg-parent-1');
    expect(Array.isArray(result)).toBe(true);
  });

  test('sendThreadReply returns message with reply text', async () => {
    const result = await svc.sendThreadReply('msg-parent-1', 'reply content');
    expect(result.content.text).toBe('reply content');
    expect(typeof result.id).toBe('string');
  });

  test('getPinnedMessages returns array', async () => {
    const result = await svc.getPinnedMessages('conv-1');
    expect(Array.isArray(result)).toBe(true);
  });

  test('sendMessage returns message with correct structure', async () => {
    const result = await svc.sendMessage('conv-1', 'Hello');
    expect(result.conversationId).toBe('conv-1');
    expect(result.content.type).toBe('text');
    expect(result.content.text).toBe('Hello');
    expect(result.status).toBe('sent');
  });

  test('sendFriendRequest returns outgoing request', async () => {
    const result = await svc.sendFriendRequest('did:key:z6MkTarget', 'Hello');
    expect(result.direction).toBe('outgoing');
    expect(result.toDid).toBe('did:key:z6MkTarget');
    expect(result.status).toBe('pending');
  });
});

/**
 * Tests for network signaling methods via UmbraService mock.
 * These mirror the real WebRTC signaling flow.
 */
describe('WASM mock signaling methods (via UmbraService)', () => {
  let svc: any;

  beforeAll(async () => {
    await UmbraService.initialize();
    svc = UmbraService.instance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createOffer returns JSON with SDP offer', async () => {
    const offerJson = await svc.createOffer();
    expect(typeof offerJson).toBe('string');

    const offer = JSON.parse(offerJson);
    expect(offer.sdp_type).toBe('offer');
    expect(typeof offer.sdp).toBe('string');
    expect(Array.isArray(offer.ice_candidates)).toBe(true);
  });

  test('acceptOffer takes offer and returns JSON with SDP answer', async () => {
    const offerJson = await svc.createOffer();
    const answerJson = await svc.acceptOffer(offerJson);
    expect(typeof answerJson).toBe('string');

    const answer = JSON.parse(answerJson);
    expect(answer.sdp_type).toBe('answer');
  });

  test('completeHandshake resolves to true', async () => {
    const result = await svc.completeHandshake('{}');
    expect(result).toBe(true);
  });

  test('completeAnswerer resolves to true', async () => {
    const result = await svc.completeAnswerer();
    expect(result).toBe(true);
  });

  test('startNetwork resolves without error', async () => {
    await expect(svc.startNetwork()).resolves.not.toThrow();
  });

  test('stopNetwork resolves without error', async () => {
    await expect(svc.stopNetwork()).resolves.not.toThrow();
  });

  test('getNetworkStatus has expected fields', async () => {
    const status = await svc.getNetworkStatus();
    expect(typeof status.isRunning).toBe('boolean');
    expect(typeof status.peerCount).toBe('number');
    expect(Array.isArray(status.listenAddresses)).toBe(true);
  });
});
