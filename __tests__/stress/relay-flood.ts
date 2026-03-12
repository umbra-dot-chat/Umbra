#!/usr/bin/env npx tsx
/**
 * Relay Message Flood Harness
 *
 * Connects directly to the Umbra relay via WebSocket and sends
 * configurable numbers of messages at configurable rates.
 *
 * Usage:
 *   npx tsx __tests__/stress/relay-flood.ts --target <DID> --count 200 --rate 10
 *
 * Options:
 *   --relay    Relay WebSocket URL (default: ws://localhost:8080/ws)
 *   --target   Target DID to send messages to (required)
 *   --sender   Sender DID (default: generates a fake one)
 *   --count    Number of messages to send (default: 200)
 *   --rate     Messages per second (default: 10)
 *   --payload  Message payload size in bytes (default: 100)
 *   --friend   Send a friend request first, then messages (race condition test)
 *   --verbose  Show each message sent
 */

import WebSocket from 'ws';

// ─── CLI Args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--') && i + 1 < args.length) {
      opts[args[i].slice(2)] = args[i + 1];
      i++;
    } else if (args[i].startsWith('--')) {
      opts[args[i].slice(2)] = 'true';
    }
  }
  return opts;
}

const opts = parseArgs();
const RELAY_URL = opts.relay || 'ws://localhost:8080/ws';
const TARGET_DID = opts.target;
const SENDER_DID = opts.sender || `did:key:z6MkStressTest${Date.now().toString(36)}`;
const MSG_COUNT = parseInt(opts.count || '200', 10);
const MSG_RATE = parseInt(opts.rate || '10', 10);
const PAYLOAD_SIZE = parseInt(opts.payload || '100', 10);
const SEND_FRIEND_FIRST = opts.friend === 'true';
const VERBOSE = opts.verbose === 'true';

if (!TARGET_DID) {
  console.error('Error: --target <DID> is required');
  console.error('Usage: npx tsx __tests__/stress/relay-flood.ts --target did:key:z6Mk...');
  process.exit(1);
}

// ─── Message Generation ──────────────────────────────────────────────────────

function generatePayload(size: number): string {
  // Generate a base64-like string of the requested size
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < size; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function makeRegisterMsg(did: string): string {
  return JSON.stringify({ type: 'register', did });
}

function makeSendMsg(toDid: string, payload: string): string {
  return JSON.stringify({ type: 'send', to_did: toDid, payload });
}

function makeFriendRequest(toDid: string, fromDid: string): string {
  // Simulate a friend request envelope
  const envelope = {
    envelope: 'friend_request',
    version: 1,
    payload: {
      id: `fr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fromDid,
      toDid,
      message: 'Stress test friend request',
      fromDisplayName: 'StressBot',
      fromAvatar: null,
      fromSigningKey: 'fake-signing-key',
      fromEncryptionKey: 'fake-encryption-key',
      createdAt: Date.now(),
    },
  };
  return JSON.stringify({ type: 'send', to_did: toDid, payload: JSON.stringify(envelope) });
}

function makeChatMessage(toDid: string, fromDid: string, msgNum: number, payloadSize: number): string {
  const envelope = {
    envelope: 'chat_message',
    version: 1,
    payload: {
      messageId: `msg-${Date.now()}-${msgNum}`,
      conversationId: `conv-${fromDid}-${toDid}`.slice(0, 40),
      senderDid: fromDid,
      contentEncrypted: generatePayload(payloadSize),
      nonce: generatePayload(24),
      timestamp: Date.now(),
    },
  };
  return JSON.stringify({ type: 'send', to_did: toDid, payload: JSON.stringify(envelope) });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║          RELAY FLOOD HARNESS                    ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║ Relay:    ${RELAY_URL.padEnd(39)}║`);
  console.log(`║ Target:   ${TARGET_DID.slice(0, 30).padEnd(39)}║`);
  console.log(`║ Sender:   ${SENDER_DID.slice(0, 30).padEnd(39)}║`);
  console.log(`║ Messages: ${String(MSG_COUNT).padEnd(39)}║`);
  console.log(`║ Rate:     ${(MSG_RATE + '/sec').padEnd(39)}║`);
  console.log(`║ Payload:  ${(PAYLOAD_SIZE + ' bytes').padEnd(39)}║`);
  console.log(`║ Friend:   ${String(SEND_FRIEND_FIRST).padEnd(39)}║`);
  console.log('╚══════════════════════════════════════════════════╝');

  const ws = new WebSocket(RELAY_URL);

  await new Promise<void>((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
    setTimeout(() => reject(new Error('Connection timeout')), 10_000);
  });

  console.log('\n[Connected to relay]');

  // Register
  ws.send(makeRegisterMsg(SENDER_DID));
  console.log(`[Registered as ${SENDER_DID.slice(0, 20)}...]`);

  // Wait for registration ack
  await new Promise(r => setTimeout(r, 500));

  // Optionally send friend request first (race condition test)
  if (SEND_FRIEND_FIRST) {
    console.log('\n[Sending friend request...]');
    ws.send(makeFriendRequest(TARGET_DID, SENDER_DID));
    // Small delay before flooding — this is the race condition we're testing
    await new Promise(r => setTimeout(r, 100));
    console.log('[Friend request sent, starting message flood after 100ms...]');
  }

  // Send messages at the configured rate
  const interval = 1000 / MSG_RATE;
  let sent = 0;
  const startTime = Date.now();

  console.log(`\n[Starting flood: ${MSG_COUNT} messages at ${MSG_RATE}/sec...]`);

  await new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      if (sent >= MSG_COUNT) {
        clearInterval(timer);
        resolve();
        return;
      }

      ws.send(makeChatMessage(TARGET_DID, SENDER_DID, sent, PAYLOAD_SIZE));
      sent++;

      if (VERBOSE || sent % 50 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const actualRate = sent / elapsed;
        console.log(`  [${sent}/${MSG_COUNT}] ${elapsed.toFixed(1)}s elapsed, ${actualRate.toFixed(1)} msg/s actual`);
      }
    }, interval);
  });

  const elapsed = (Date.now() - startTime) / 1000;
  const actualRate = MSG_COUNT / elapsed;

  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║ FLOOD COMPLETE                                   ║`);
  console.log(`╠══════════════════════════════════════════════════╣`);
  console.log(`║ Messages sent: ${String(MSG_COUNT).padEnd(34)}║`);
  console.log(`║ Duration:      ${(elapsed.toFixed(1) + 's').padEnd(34)}║`);
  console.log(`║ Actual rate:   ${(actualRate.toFixed(1) + ' msg/s').padEnd(34)}║`);
  console.log(`╚══════════════════════════════════════════════════╝`);

  // Wait for messages to be delivered
  console.log('\n[Waiting 5s for delivery...]');
  await new Promise(r => setTimeout(r, 5000));

  ws.close();
  console.log('[Done]');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
