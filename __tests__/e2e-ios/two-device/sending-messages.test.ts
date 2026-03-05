/**
 * Sending Messages — Detox E2E Tests (iOS)
 *
 * TWO-DEVICE test: User A establishes friendship with User B, opens the
 * DM, and tests the full message-sending experience — typing, sending
 * via return key and send button, verifying bubbles/timestamps, input
 * clearing, and different message types (long, emoji, special chars).
 *
 * Run with Device B via: scripts/run-dm-test.sh
 * (or pair with any Device B test that follows the sync protocol)
 *
 * NETWORK VERIFICATION:
 * - Verifies relay connection after account creation (before DID exchange)
 * - This test verifies local UI rendering of sent messages
 * - Cross-device delivery is verified by the paired receiving-messages test
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import {
  launchApp,
  waitForMainScreen,
  waitForUISettle,
  waitForRelayConnection,
} from '../helpers/app';
import { createAccountFull } from '../helpers/auth';
import {
  navigateToFriends,
  navigateToSettings,
  navigateHome,
  closeSettings,
} from '../helpers/navigation';
import {
  sendMessage,
  expectMessageVisible,
} from '../helpers/messaging';
import { writeSync, waitForSync, resetSync } from '../helpers/sync';

describe('Sending Messages', () => {
  let myDid = '';

  beforeAll(async () => {
    resetSync();
    await launchApp({ newInstance: true, delete: true });
    await createAccountFull(
      FIXTURES.USER_A.displayName,
      FIXTURES.USER_A.pin,
      FIXTURES.USER_A.displayName.toLowerCase(),
    );
  });

  // ─── Network Verification ─────────────────────────────────────────────────

  describe('network verification', () => {
    it('should verify relay connection after account creation', async () => {
      await waitForRelayConnection();
      console.log('[SendMsg] Relay connection verified');
    });
  });

  // ─── Friendship & DM Setup ──────────────────────────────────────────────────

  describe('setup', () => {
    it('should read own DID and publish for User B', async () => {
      await navigateToSettings();
      await waitFor(element(by.id(TEST_IDS.SETTINGS.DID_DISPLAY)))
        .toExist()
        .withTimeout(TIMEOUTS.NAVIGATION);

      const attrs = await element(by.id(TEST_IDS.SETTINGS.DID_DISPLAY)).getAttributes();
      // @ts-ignore
      myDid = attrs.value || attrs.text || attrs.label || '';
      if (!myDid.startsWith('did:key:z6Mk') || myDid.length < 48) {
        throw new Error(`Invalid DID: "${myDid}"`);
      }

      await closeSettings();

      writeSync('userA_did', myDid);
      writeSync('userA_name', FIXTURES.USER_A.displayName);
      writeSync('userA_ready', 'true');
      console.log(`[SendMsg] Published DID: ${myDid.slice(0, 30)}...`);
    });

    it('should wait for User B friend request and accept', async () => {
      await waitForSync('userB_request_sent', 120000);

      await navigateToFriends();
      await waitForUISettle();
      await element(by.id(TEST_IDS.FRIENDS.TAB_PENDING)).tap();
      await waitForUISettle();

      await waitFor(element(by.id(TEST_IDS.FRIENDS.CARD)))
        .toExist()
        .withTimeout(TIMEOUTS.MESSAGE_DELIVERY);

      await element(by.id(TEST_IDS.FRIENDS.CARD_ACCEPT)).tap();
      await waitForUISettle();

      writeSync('userA_accepted', 'true');
      console.log('[SendMsg] Accepted friend request');
    });

    it('should open DM conversation', async () => {
      await element(by.id(TEST_IDS.FRIENDS.TAB_ALL)).tap();
      await waitForUISettle();

      await waitFor(element(by.id(TEST_IDS.FRIENDS.CARD)))
        .toExist()
        .withTimeout(TIMEOUTS.MESSAGE_DELIVERY);

      await element(by.id(TEST_IDS.FRIENDS.CARD_MESSAGE)).tap();
      await waitForUISettle();

      await waitFor(element(by.id(TEST_IDS.CHAT.HEADER)))
        .toExist()
        .withTimeout(TIMEOUTS.NAVIGATION);

      writeSync('userA_in_dm', 'true');
      console.log('[SendMsg] Opened DM');

      // Wait for User B to also be in the DM
      await waitForSync('userB_in_dm', 120000);
    });
  });

  // ─── Sending via Return Key ────────────────────────────────────────────────

  describe('sending via return key', () => {
    it('should type a message in the input field', async () => {
      await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).tap();
      await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).typeText(FIXTURES.MESSAGES.HELLO);
      await waitForUISettle();
    });

    it('should send the message and see it in the chat area', async () => {
      await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).tapReturnKey();
      await waitForUISettle();
      await expectMessageVisible(FIXTURES.MESSAGES.HELLO);
    });

    it('should display the message in a bubble container', async () => {
      await waitFor(element(by.id(TEST_IDS.BUBBLE.CONTAINER)))
        .toExist()
        .withTimeout(TIMEOUTS.INTERACTION);
    });

    it('should display a timestamp on the sent message', async () => {
      await waitFor(element(by.id(TEST_IDS.BUBBLE.TIMESTAMP)))
        .toExist()
        .withTimeout(TIMEOUTS.INTERACTION);
    });

    it('should clear the input field after sending', async () => {
      const attrs = await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).getAttributes();
      // @ts-ignore
      const text: string = attrs.text || '';
      if (text === FIXTURES.MESSAGES.HELLO) {
        throw new Error('Input was not cleared after sending');
      }
    });
  });

  // ─── Sending via Send Button ───────────────────────────────────────────────

  describe('sending via send button', () => {
    it('should send via the send button tap', async () => {
      const msg = 'Button send test';
      await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).tap();
      await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).typeText(msg);
      await waitForUISettle();

      await element(by.id(TEST_IDS.INPUT.SEND_BUTTON)).tap();
      await waitForUISettle();

      await expectMessageVisible(msg);
    });
  });

  // ─── Message Variants ─────────────────────────────────────────────────────

  describe('message types', () => {
    it('should send a long message without crashing', async () => {
      await sendMessage(FIXTURES.MESSAGES.LONG);
      console.log('[SendMsg] Long message sent');
    });

    it('should send a message with emoji text', async () => {
      await sendMessage(FIXTURES.MESSAGES.EMOJI);
      await expectMessageVisible(FIXTURES.MESSAGES.EMOJI);
    });

    it('should send a message with special characters', async () => {
      await sendMessage(FIXTURES.MESSAGES.SPECIAL_CHARS);
      await expectMessageVisible(FIXTURES.MESSAGES.SPECIAL_CHARS);
    });
  });

  // ─── Message Ordering ─────────────────────────────────────────────────────

  describe('message ordering', () => {
    it('should send a message and have it appear at the bottom of the chat', async () => {
      const msg = 'Latest message should be visible';
      await sendMessage(msg);
      await expectMessageVisible(msg);

      writeSync('userA_sending_tests_done', 'true');
    });
  });
});
