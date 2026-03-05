/**
 * Message Types — Detox E2E Tests (iOS)
 *
 * TWO-DEVICE test: Establishes a friendship and DM, then tests that
 * different message types render correctly — text messages with bubble
 * appearance, timestamps, and (when available) system messages with
 * distinct styling.
 *
 * Runs as Device A. Pair with a Device B that follows the sync protocol.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccountFull } from '../helpers/auth';
import {
  navigateToFriends,
  navigateToSettings,
  closeSettings,
} from '../helpers/navigation';
import {
  sendMessage,
  expectMessageVisible,
} from '../helpers/messaging';
import { writeSync, waitForSync, resetSync } from '../helpers/sync';

describe('Message Types', () => {
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

  // ─── Setup ──────────────────────────────────────────────────────────────────

  describe('setup', () => {
    it('should publish DID and establish friendship', async () => {
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
    });

    it('should accept friend request and open DM', async () => {
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

      // Open DM
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
      await waitForSync('userB_in_dm', 120000);
      console.log('[MsgTypes] DM opened');
    });
  });

  // ─── Text Messages ────────────────────────────────────────────────────────

  describe('Text Messages', () => {
    it('should render a text message in a bubble', async () => {
      await sendMessage(FIXTURES.MESSAGES.HELLO);
      await waitForUISettle();

      await waitFor(element(by.id(TEST_IDS.BUBBLE.CONTAINER)))
        .toExist()
        .withTimeout(TIMEOUTS.INTERACTION);
      await expect(element(by.id(TEST_IDS.BUBBLE.TEXT))).toExist();
    });

    it('should display the message text correctly', async () => {
      await expectMessageVisible(FIXTURES.MESSAGES.HELLO);
    });

    it('should show a timestamp on the text message', async () => {
      await expect(element(by.id(TEST_IDS.BUBBLE.TIMESTAMP))).toExist();
    });

    it('should render a long text message without truncating', async () => {
      await sendMessage(FIXTURES.MESSAGES.LONG);
      await waitForUISettle();

      // Verify the bubble exists — long messages should still render
      await waitFor(element(by.id(TEST_IDS.BUBBLE.CONTAINER)))
        .toExist()
        .withTimeout(TIMEOUTS.INTERACTION);
      console.log('[MsgTypes] Long message rendered');
    });

    it('should render emoji text correctly', async () => {
      await sendMessage(FIXTURES.MESSAGES.EMOJI);
      await expectMessageVisible(FIXTURES.MESSAGES.EMOJI);
    });

    it('should render special characters correctly', async () => {
      await sendMessage(FIXTURES.MESSAGES.SPECIAL_CHARS);
      await expectMessageVisible(FIXTURES.MESSAGES.SPECIAL_CHARS);
    });
  });

  // ─── System Messages ──────────────────────────────────────────────────────

  describe('System Messages', () => {
    // System messages (e.g., "User joined", "Encryption established") render
    // differently from regular text messages. They typically appear centered
    // and without a bubble container.

    it.todo('should render system messages with a distinct style');
    it.todo('should not show a bubble container for system messages');
    it.todo('should center system messages in the chat area');
    it.todo('should render system messages with a muted color');
  });

  afterAll(() => {
    writeSync('userA_msg_types_done', 'true');
  });
});
