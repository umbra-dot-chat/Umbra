/**
 * Quick script to test bot-initiated calls.
 * Starts a bot, befriends Alice, waits for friendship, then calls her.
 */

import { TestBot } from './test-bot.js';

const TARGET_DID = process.argv[2] || 'did:key:z6MkhbPzZDuagC6mouD8FDB2Hjc4gDiwLTPZG2MNDGWWbTeT';
const CALL_TYPE = (process.argv[3] as 'voice' | 'video') || 'voice';
const RELAY = 'wss://relay.umbra.chat/ws';

async function main() {
  const bot = new TestBot({
    name: 'CallBot',
    relayUrl: RELAY,
    autoAcceptFriends: true,
    autoAcceptCalls: false,
    autoReact: false,
    autoThread: false,
    echoMessages: false,
    audioMode: 'sine',
    logLevel: 'debug',
  });

  await bot.start();
  bot.sendFriendRequest(TARGET_DID);

  // Wait for friendship to be established
  await new Promise<void>((resolve) => {
    const check = () => {
      if (bot.friendList.some((f) => f.did === TARGET_DID)) {
        resolve();
      } else {
        setTimeout(check, 500);
      }
    };
    // Also listen for event
    bot.events.on('friendAdded', (data: any) => {
      if (data.did === TARGET_DID) resolve();
    });
    check();
  });

  console.log('\n[call-test] Friendship established. Waiting 2s before calling...\n');
  await new Promise((r) => setTimeout(r, 2000));

  console.log(`[call-test] Initiating ${CALL_TYPE} call to ${TARGET_DID.slice(0, 30)}...\n`);
  await bot.startCall(TARGET_DID, CALL_TYPE);

  // Keep running for 30s then hang up
  await new Promise((r) => setTimeout(r, 30000));
  console.log('\n[call-test] Ending call after 30s...\n');
  bot.endCall();

  await new Promise((r) => setTimeout(r, 2000));
  process.exit(0);
}

main().catch((err) => {
  console.error('[call-test] Fatal:', err);
  process.exit(1);
});
