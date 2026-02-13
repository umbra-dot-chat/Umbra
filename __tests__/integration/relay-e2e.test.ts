/**
 * Relay E2E Integration Tests
 *
 * Tests the live relay server at relay.deepspaceshipping.co to validate:
 * - WebSocket connection and registration
 * - Message sending/receiving between two clients
 * - Offline message queuing and delivery
 * - Signaling session creation and joining
 * - Health and stats endpoints
 * - Envelope routing for all message types
 *
 * These tests require the relay to be deployed and accessible.
 * Run with: npx jest __tests__/integration/relay-e2e.test.ts --forceExit
 */

const RELAY_URL = 'wss://relay.deepspaceshipping.co/ws';
const RELAY_HTTP = 'https://relay.deepspaceshipping.co';

// Use ws package for Node.js environment
const NodeWebSocket = require('ws');

// Helper: create a WebSocket connection and wait for open
function connectWs(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const ws = new NodeWebSocket(url);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket connection timeout'));
    }, 10000);
    ws.on('open', () => {
      clearTimeout(timeout);
      resolve(ws);
    });
    ws.on('error', (err: any) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// Helper: send JSON message
function send(ws: any, msg: object) {
  ws.send(JSON.stringify(msg));
}

// Helper: wait for next message matching a predicate
// The `ws` package passes raw data (Buffer/string) to `on('message', cb)`
function waitForMessage(
  ws: any,
  predicate: (msg: any) => boolean,
  timeoutMs = 5000,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.off('message', handler);
      reject(new Error('Timed out waiting for message'));
    }, timeoutMs);

    function handler(rawData: any) {
      try {
        const str = typeof rawData === 'string' ? rawData : rawData.toString('utf-8');
        const data = JSON.parse(str);
        if (predicate(data)) {
          clearTimeout(timeout);
          ws.off('message', handler);
          resolve(data);
        }
      } catch {
        // ignore parse errors
      }
    }

    ws.on('message', handler);
  });
}

// Generate a unique test DID
function testDid(label: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `did:key:z6Mk${label}${rand}${Date.now()}`;
}

// Helper: register a client and wait for confirmation
async function registerClient(ws: any, did: string): Promise<any> {
  const promise = waitForMessage(ws, (m) => m.type === 'registered');
  send(ws, { type: 'register', did });
  return promise;
}

// Cleanup helper
function closeWs(ws: any) {
  try {
    if (ws && ws.readyState <= 1) {
      ws.close();
    }
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Relay Server E2E Tests', () => {
  // ── HTTP Endpoints ──────────────────────────────────────────────────────

  describe('HTTP Endpoints', () => {
    test('GET /health returns ok status', async () => {
      const res = await fetch(`${RELAY_HTTP}/health`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('umbra-relay');
      expect(data.version).toBeDefined();
    });

    test('GET /stats returns server statistics', async () => {
      const res = await fetch(`${RELAY_HTTP}/stats`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(typeof data.online_clients).toBe('number');
      expect(typeof data.offline_queue_size).toBe('number');
      expect(typeof data.active_sessions).toBe('number');
    });
  });

  // ── WebSocket Connection & Registration ─────────────────────────────────

  describe('WebSocket Connection & Registration', () => {
    let ws: any;

    afterEach(() => closeWs(ws));

    test('connects to relay WebSocket', async () => {
      ws = await connectWs(RELAY_URL);
      expect(ws.readyState).toBe(1); // OPEN
    });

    test('registers with a DID and receives confirmation', async () => {
      ws = await connectWs(RELAY_URL);
      const did = testDid('RegTest');

      const response = await registerClient(ws, did);
      expect(response.type).toBe('registered');
      expect(response.did).toBe(did);
    });

    test('ping/pong keeps connection alive', async () => {
      ws = await connectWs(RELAY_URL);
      const did = testDid('Ping');
      await registerClient(ws, did);

      const pongPromise = waitForMessage(ws, (m) => m.type === 'pong');
      send(ws, { type: 'ping' });
      const pong = await pongPromise;
      expect(pong.type).toBe('pong');
    });
  });

  // ── Real-Time Message Delivery ──────────────────────────────────────────

  describe('Real-Time Message Delivery', () => {
    let alice: any;
    let bob: any;
    let aliceDid: string;
    let bobDid: string;

    beforeEach(async () => {
      aliceDid = testDid('Alice');
      bobDid = testDid('Bob');

      alice = await connectWs(RELAY_URL);
      bob = await connectWs(RELAY_URL);

      await registerClient(alice, aliceDid);
      await registerClient(bob, bobDid);
    });

    afterEach(() => {
      closeWs(alice);
      closeWs(bob);
    });

    test('Alice sends a message to Bob and Bob receives it', async () => {
      const payload = JSON.stringify({
        envelope: 'chat_message',
        version: 1,
        payload: {
          messageId: 'test-msg-1',
          conversationId: 'test-conv-1',
          senderDid: aliceDid,
          contentEncrypted: 'dGVzdCBlbmNyeXB0ZWQ=',
          nonce: 'abc123',
          timestamp: Date.now(),
        },
      });

      const bobMessagePromise = waitForMessage(
        bob,
        (m) => m.type === 'message' && m.from_did === aliceDid,
      );

      send(alice, { type: 'send', to_did: bobDid, payload });

      const received = await bobMessagePromise;
      expect(received.type).toBe('message');
      expect(received.from_did).toBe(aliceDid);
      expect(received.payload).toBe(payload);
    });

    test('Bob sends a message back to Alice', async () => {
      const payload = JSON.stringify({
        envelope: 'chat_message',
        version: 1,
        payload: { messageId: 'test-msg-2', content: 'hello from bob' },
      });

      const aliceMessagePromise = waitForMessage(
        alice,
        (m) => m.type === 'message' && m.from_did === bobDid,
      );

      send(bob, { type: 'send', to_did: aliceDid, payload });

      const received = await aliceMessagePromise;
      expect(received.type).toBe('message');
      expect(received.from_did).toBe(bobDid);
    });

    test('sends friend_request envelope and routes correctly', async () => {
      const payload = JSON.stringify({
        envelope: 'friend_request',
        version: 1,
        payload: {
          fromDid: aliceDid,
          displayName: 'Alice',
          message: 'Let\'s be friends!',
          signingKey: 'abc',
          encryptionKey: 'def',
        },
      });

      const bobReceivePromise = waitForMessage(
        bob,
        (m) => m.type === 'message' && m.from_did === aliceDid,
      );

      send(alice, { type: 'send', to_did: bobDid, payload });

      const received = await bobReceivePromise;
      const receivedPayload = JSON.parse(received.payload);
      expect(receivedPayload.envelope).toBe('friend_request');
    });

    test('sends friend_response envelope and routes correctly', async () => {
      const payload = JSON.stringify({
        envelope: 'friend_response',
        version: 1,
        payload: {
          fromDid: bobDid,
          accepted: true,
          displayName: 'Bob',
          signingKey: 'ghi',
          encryptionKey: 'jkl',
        },
      });

      const aliceReceivePromise = waitForMessage(
        alice,
        (m) => m.type === 'message' && m.from_did === bobDid,
      );

      send(bob, { type: 'send', to_did: aliceDid, payload });

      const received = await aliceReceivePromise;
      const receivedPayload = JSON.parse(received.payload);
      expect(receivedPayload.envelope).toBe('friend_response');
    });

    test('sends friend_accept_ack envelope', async () => {
      const payload = JSON.stringify({
        envelope: 'friend_accept_ack',
        version: 1,
        payload: { senderDid: aliceDid, timestamp: Date.now() },
      });

      const bobReceivePromise = waitForMessage(
        bob,
        (m) => m.type === 'message' && m.from_did === aliceDid,
      );

      send(alice, { type: 'send', to_did: bobDid, payload });

      const received = await bobReceivePromise;
      const receivedPayload = JSON.parse(received.payload);
      expect(receivedPayload.envelope).toBe('friend_accept_ack');
    });

    test('sends typing_indicator envelope', async () => {
      const payload = JSON.stringify({
        envelope: 'typing_indicator',
        version: 1,
        payload: {
          conversationId: 'conv-1',
          senderDid: aliceDid,
          senderName: 'Alice',
          isTyping: true,
          timestamp: Date.now(),
        },
      });

      const bobReceivePromise = waitForMessage(
        bob,
        (m) => m.type === 'message' && m.from_did === aliceDid,
      );

      send(alice, { type: 'send', to_did: bobDid, payload });

      const received = await bobReceivePromise;
      const receivedPayload = JSON.parse(received.payload);
      expect(receivedPayload.envelope).toBe('typing_indicator');
      expect(receivedPayload.payload.isTyping).toBe(true);
    });

    test('sends message_status envelope', async () => {
      const payload = JSON.stringify({
        envelope: 'message_status',
        version: 1,
        payload: {
          messageId: 'msg-123',
          conversationId: 'conv-1',
          status: 'delivered',
          timestamp: Date.now(),
        },
      });

      const aliceReceivePromise = waitForMessage(
        alice,
        (m) => m.type === 'message' && m.from_did === bobDid,
      );

      send(bob, { type: 'send', to_did: aliceDid, payload });

      const received = await aliceReceivePromise;
      const receivedPayload = JSON.parse(received.payload);
      expect(receivedPayload.envelope).toBe('message_status');
      expect(receivedPayload.payload.status).toBe('delivered');
    });

    test('sends group_invite envelope', async () => {
      const payload = JSON.stringify({
        envelope: 'group_invite',
        version: 1,
        payload: {
          inviteId: 'inv-1',
          groupId: 'grp-1',
          groupName: 'Test Group',
          inviterDid: aliceDid,
          inviterName: 'Alice',
          encryptedGroupKey: 'enc-key-data',
          nonce: 'inv-nonce',
          membersJson: '[]',
        },
      });

      const bobReceivePromise = waitForMessage(
        bob,
        (m) => m.type === 'message' && m.from_did === aliceDid,
      );

      send(alice, { type: 'send', to_did: bobDid, payload });

      const received = await bobReceivePromise;
      const receivedPayload = JSON.parse(received.payload);
      expect(receivedPayload.envelope).toBe('group_invite');
      expect(receivedPayload.payload.groupName).toBe('Test Group');
    });
  });

  // ── Offline Message Queuing ─────────────────────────────────────────────

  describe('Offline Message Queuing', () => {
    test('messages to offline recipients are queued and delivered on connect', async () => {
      const aliceDid = testDid('OffAlice');
      const bobDid = testDid('OffBob');

      // Alice connects and sends to offline Bob
      const alice = await connectWs(RELAY_URL);
      await registerClient(alice, aliceDid);

      const payload = JSON.stringify({
        envelope: 'chat_message',
        version: 1,
        payload: { messageId: 'offline-msg-1', content: 'Hey Bob, are you there?' },
      });

      send(alice, { type: 'send', to_did: bobDid, payload });

      // Wait for ack (message was queued)
      await waitForMessage(alice, (m) => m.type === 'ack', 5000);

      // Now Bob comes online and fetches offline messages
      const bob = await connectWs(RELAY_URL);
      await registerClient(bob, bobDid);

      const offlinePromise = waitForMessage(
        bob,
        (m) => m.type === 'offline_messages',
        5000,
      );

      send(bob, { type: 'fetch_offline' });

      const offline = await offlinePromise;
      expect(offline.type).toBe('offline_messages');
      expect(Array.isArray(offline.messages)).toBe(true);

      // Find our message
      const ourMsg = offline.messages.find(
        (m: any) => m.from_did === aliceDid,
      );
      expect(ourMsg).toBeDefined();
      expect(ourMsg.payload).toBe(payload);

      closeWs(alice);
      closeWs(bob);
    });

    test('multiple offline messages are delivered in order', async () => {
      const senderDid = testDid('MultiSend');
      const receiverDid = testDid('MultiRecv');

      const sender = await connectWs(RELAY_URL);
      await registerClient(sender, senderDid);

      // Send 3 messages to offline recipient
      for (let i = 0; i < 3; i++) {
        const payload = JSON.stringify({
          envelope: 'chat_message',
          version: 1,
          payload: { messageId: `multi-msg-${i}`, index: i },
        });
        send(sender, { type: 'send', to_did: receiverDid, payload });
        // Wait for ack
        await waitForMessage(sender, (m) => m.type === 'ack', 3000);
      }

      // Receiver comes online
      const receiver = await connectWs(RELAY_URL);
      await registerClient(receiver, receiverDid);

      const offlinePromise = waitForMessage(
        receiver,
        (m) => m.type === 'offline_messages',
        5000,
      );
      send(receiver, { type: 'fetch_offline' });

      const offline = await offlinePromise;
      const fromSender = offline.messages.filter(
        (m: any) => m.from_did === senderDid,
      );
      expect(fromSender.length).toBe(3);

      closeWs(sender);
      closeWs(receiver);
    });
  });

  // ── Signaling Sessions ──────────────────────────────────────────────────

  describe('Signaling Sessions', () => {
    let alice: any;
    let aliceDid: string;

    beforeEach(async () => {
      aliceDid = testDid('SigAlice');
      alice = await connectWs(RELAY_URL);
      await registerClient(alice, aliceDid);
    });

    afterEach(() => closeWs(alice));

    test('creates a signaling session', async () => {
      const sessionPromise = waitForMessage(
        alice,
        (m) => m.type === 'session_created',
      );

      send(alice, {
        type: 'create_session',
        offer_payload: JSON.stringify({ sdp: 'test-sdp-offer', type: 'offer' }),
      });

      const session = await sessionPromise;
      expect(session.type).toBe('session_created');
      expect(typeof session.session_id).toBe('string');
      expect(session.session_id.length).toBeGreaterThan(0);
    });

    test('Bob joins a session and both receive signals', async () => {
      // Alice creates session
      const sessionPromise = waitForMessage(
        alice,
        (m) => m.type === 'session_created',
      );
      send(alice, {
        type: 'create_session',
        offer_payload: JSON.stringify({ sdp: 'alice-offer', type: 'offer' }),
      });
      const session = await sessionPromise;

      // Bob connects and joins
      const bobDid = testDid('SigBob');
      const bob = await connectWs(RELAY_URL);
      await registerClient(bob, bobDid);

      // Bob should receive the offer when joining
      const bobOfferPromise = waitForMessage(
        bob,
        (m) => m.type === 'session_offer',
      );

      // Alice should receive the answer when Bob joins
      const aliceAnswerPromise = waitForMessage(
        alice,
        (m) => m.type === 'session_joined',
      );

      send(bob, {
        type: 'join_session',
        session_id: session.session_id,
        answer_payload: JSON.stringify({ sdp: 'bob-answer', type: 'answer' }),
      });

      const bobOffer = await bobOfferPromise;
      expect(bobOffer.type).toBe('session_offer');
      expect(bobOffer.session_id).toBe(session.session_id);

      const aliceAnswer = await aliceAnswerPromise;
      expect(aliceAnswer.type).toBe('session_joined');
      expect(aliceAnswer.session_id).toBe(session.session_id);

      closeWs(bob);
    });
  });

  // ── Signal Forwarding ──────────────────────────────────────────────────

  describe('Signal Forwarding (WebRTC SDP)', () => {
    let alice: any;
    let bob: any;
    let aliceDid: string;
    let bobDid: string;

    beforeEach(async () => {
      aliceDid = testDid('SdpAlice');
      bobDid = testDid('SdpBob');
      alice = await connectWs(RELAY_URL);
      bob = await connectWs(RELAY_URL);
      await registerClient(alice, aliceDid);
      await registerClient(bob, bobDid);
    });

    afterEach(() => {
      closeWs(alice);
      closeWs(bob);
    });

    test('forwards SDP signal from Alice to Bob', async () => {
      const sdpPayload = JSON.stringify({
        sdp: 'v=0\r\no=- 123 1 IN IP4 127.0.0.1\r\n...',
        type: 'offer',
      });

      const bobSignalPromise = waitForMessage(
        bob,
        (m) => m.type === 'signal' && m.from_did === aliceDid,
      );

      send(alice, {
        type: 'signal',
        to_did: bobDid,
        payload: sdpPayload,
      });

      const received = await bobSignalPromise;
      expect(received.type).toBe('signal');
      expect(received.from_did).toBe(aliceDid);
      expect(received.payload).toBe(sdpPayload);
    });
  });

  // ── Error Handling ──────────────────────────────────────────────────────

  describe('Error Handling', () => {
    test('sending to unregistered DID queues as offline', async () => {
      const aliceDid = testDid('ErrAlice');
      const unknownDid = testDid('Unknown');

      const alice = await connectWs(RELAY_URL);
      await registerClient(alice, aliceDid);

      const payload = JSON.stringify({ test: 'data' });

      // Should get an ack (message queued for offline delivery)
      const ackPromise = waitForMessage(alice, (m) => m.type === 'ack', 3000);
      send(alice, { type: 'send', to_did: unknownDid, payload });

      const ack = await ackPromise;
      expect(ack.type).toBe('ack');

      closeWs(alice);
    });
  });

  // ── Concurrent Messaging ───────────────────────────────────────────────

  describe('Concurrent Messaging', () => {
    test('both clients send messages simultaneously without issues', async () => {
      const aliceDid = testDid('ConcAlice');
      const bobDid = testDid('ConcBob');

      const alice = await connectWs(RELAY_URL);
      const bob = await connectWs(RELAY_URL);
      await registerClient(alice, aliceDid);
      await registerClient(bob, bobDid);

      // Both send at the same time
      const aliceReceivePromise = waitForMessage(
        alice,
        (m) => m.type === 'message' && m.from_did === bobDid,
      );
      const bobReceivePromise = waitForMessage(
        bob,
        (m) => m.type === 'message' && m.from_did === aliceDid,
      );

      const alicePayload = JSON.stringify({ from: 'alice', msg: 'hi bob' });
      const bobPayload = JSON.stringify({ from: 'bob', msg: 'hi alice' });

      send(alice, { type: 'send', to_did: bobDid, payload: alicePayload });
      send(bob, { type: 'send', to_did: aliceDid, payload: bobPayload });

      const [aliceReceived, bobReceived] = await Promise.all([
        aliceReceivePromise,
        bobReceivePromise,
      ]);

      expect(aliceReceived.payload).toBe(bobPayload);
      expect(bobReceived.payload).toBe(alicePayload);

      closeWs(alice);
      closeWs(bob);
    });
  });
});
