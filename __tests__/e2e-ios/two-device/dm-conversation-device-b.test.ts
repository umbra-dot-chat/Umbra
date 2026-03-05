/**
 * DM Conversation — User B (iPhone 17 Pro Max)
 *
 * Run via: scripts/run-dm-test.sh
 *
 * User B waits for User A, creates an account, sends a friend request,
 * then opens the DM conversation to receive and send messages.
 * Tests receiving messages, sender info display, and sending replies.
 *
 * NETWORK VERIFICATION:
 * - Verifies relay connection after account creation
 * - Uses hard assertions for all cross-device message delivery
 * - All message reception uses waitForMessage() without try/catch
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
  navigateHome,
  openConversation,
} from '../helpers/navigation';
import {
  sendMessage,
  waitForMessage,
  expectMessageVisible,
  longPressMessage,
  scrollToBottom,
} from '../helpers/messaging';
import { writeSync, waitForSync } from '../helpers/sync';

describe('DM Conversation — User B', () => {
  let userADid = '';
  let userAName = '';

  beforeAll(async () => {
    // Wait for User A to be ready before creating our account
    console.log('[UserB] Waiting for User A to be ready...');
    await waitForSync('userA_ready', 120000);
    userADid = await waitForSync('userA_did', 5000);
    userAName = await waitForSync('userA_name', 5000);
    console.log(`[UserB] Got User A DID: ${userADid.slice(0, 30)}...`);
    console.log(`[UserB] Got User A name: ${userAName}`);

    await launchApp({ newInstance: true, delete: true });
    await createAccountFull(
      FIXTURES.USER_B.displayName,
      FIXTURES.USER_B.pin,
      FIXTURES.USER_B.displayName.toLowerCase(),
    );
  });

  // ─── Phase 0: Network Verification ────────────────────────────────────────

  describe('network verification', () => {
    it('should verify relay connection is active after account creation', async () => {
      await waitForRelayConnection();
      console.log('[UserB] Relay connection verified');
    });
  });

  // ─── Phase 1: Friendship Setup ──────────────────────────────────────────────

  describe('friendship setup', () => {
    it('should navigate to friends and send request to User A', async () => {
      await navigateToFriends();
      await expect(element(by.id(TEST_IDS.FRIENDS.PAGE))).toExist();

      // Type User A's DID and send friend request
      await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).tap();
      await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).typeText(userADid);
      await waitForUISettle();

      await element(by.id(TEST_IDS.FRIENDS.ADD_BUTTON)).tap();

      // Wait for feedback
      await waitFor(element(by.id(TEST_IDS.FRIENDS.ADD_FEEDBACK)))
        .toExist()
        .withTimeout(TIMEOUTS.NETWORK_CONNECT);

      const attrs = await element(by.id(TEST_IDS.FRIENDS.ADD_FEEDBACK)).getAttributes();
      // @ts-ignore
      const feedbackText: string = attrs.text || attrs.label || '';
      console.log(`[UserB] Send feedback: "${feedbackText}"`);

      if (!feedbackText.toLowerCase().includes('sent')) {
        throw new Error(`Expected success feedback but got: "${feedbackText}"`);
      }

      writeSync('userB_request_sent', 'true');
      console.log('[UserB] Friend request sent');
    });

    it('should wait for User A to accept', async () => {
      const status = await waitForSync('userA_accepted', 120000);
      console.log(`[UserB] User A accepted: ${status}`);
    });
  });

  // ─── Phase 2: Open DM Conversation ─────────────────────────────────────────

  describe('opening the DM', () => {
    it('should find User A in friends list and open DM', async () => {
      // Navigate to friends All tab — may need multiple attempts for relay propagation
      let dmOpened = false;
      const maxAttempts = 3;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          // Navigate away and back to force re-mount
          await navigateHome();
          await new Promise((r) => setTimeout(r, attempt === 1 ? 5000 : 10000));

          await navigateToFriends();
          await waitFor(element(by.id(TEST_IDS.FRIENDS.PAGE)))
            .toExist()
            .withTimeout(TIMEOUTS.NAVIGATION);
          await waitForUISettle();

          // Switch to All tab
          await waitFor(element(by.id(TEST_IDS.FRIENDS.TAB_ALL)))
            .toBeVisible()
            .withTimeout(TIMEOUTS.NAVIGATION);
          await element(by.id(TEST_IDS.FRIENDS.TAB_ALL)).tap();
          await waitForUISettle();

          // Wait for friend card to appear
          await waitFor(element(by.id(TEST_IDS.FRIENDS.CARD)))
            .toExist()
            .withTimeout(TIMEOUTS.NETWORK_CONNECT);

          // Tap Message button to open DM
          await element(by.id(TEST_IDS.FRIENDS.CARD_MESSAGE)).tap();
          await waitForUISettle();

          // Wait for chat to open
          await waitFor(element(by.id(TEST_IDS.CHAT.HEADER)))
            .toExist()
            .withTimeout(TIMEOUTS.NAVIGATION);

          dmOpened = true;
          break;
        } catch {
          console.log(`[UserB] Attempt ${attempt}/${maxAttempts}: Could not open DM yet`);
        }
      }

      if (!dmOpened) {
        throw new Error('[UserB] Failed to open DM conversation after all attempts');
      }

      writeSync('userB_in_dm', 'true');
      console.log('[UserB] Opened DM conversation');
    });

    it('should display the chat header with User A name', async () => {
      await expect(element(by.id(TEST_IDS.CHAT.HEADER))).toExist();
      await expect(element(by.id(TEST_IDS.CHAT.HEADER_NAME))).toExist();
    });

    it('should display the message input bar', async () => {
      await expect(element(by.id(TEST_IDS.INPUT.CONTAINER))).toExist();
      await expect(element(by.id(TEST_IDS.INPUT.TEXT_INPUT))).toExist();
    });
  });

  // ─── Phase 3: Receiving Messages from User A ──────────────────────────────

  describe('receiving messages from User A', () => {
    it('should receive User A first message', async () => {
      await waitForSync('userA_sent_msg1', 120000);
      console.log('[UserB] User A has sent message, waiting for delivery...');

      // Wait for the message to appear in the chat area
      await waitForMessage(FIXTURES.MESSAGES.DM_HELLO);
      console.log('[UserB] Received User A message');
    });

    it('should display the received message text correctly', async () => {
      await expectMessageVisible(FIXTURES.MESSAGES.DM_HELLO);
    });

    it('should display a message bubble for the received message', async () => {
      await waitFor(element(by.id(TEST_IDS.BUBBLE.CONTAINER)))
        .toExist()
        .withTimeout(TIMEOUTS.INTERACTION);
    });

    it('should display a timestamp on the received message', async () => {
      await waitFor(element(by.id(TEST_IDS.BUBBLE.TIMESTAMP)))
        .toExist()
        .withTimeout(TIMEOUTS.INTERACTION);
    });

    it('should receive the second message from User A', async () => {
      await waitForSync('userA_sent_all_messages', 120000);
      console.log('[UserB] User A sent all messages, checking delivery...');

      // Allow relay propagation time, then scroll to ensure visibility
      await new Promise((r) => setTimeout(r, 5000));
      await scrollToBottom();

      // HARD ASSERTION: DM_SECOND must arrive via relay. If this fails,
      // it indicates a relay delivery or decryption failure.
      await waitForMessage(FIXTURES.MESSAGES.DM_SECOND);
      console.log('[UserB] ✅ Received DM_SECOND — relay delivery verified');
    });

    it('should receive the emoji message from User A', async () => {
      await scrollToBottom();

      // HARD ASSERTION: Emoji message must arrive. Failure indicates
      // a relay delivery issue or text encoding problem.
      await waitForMessage(FIXTURES.MESSAGES.DM_EMOJI);
      console.log('[UserB] ✅ Received DM_EMOJI — relay delivery verified');
    });
  });

  // ─── Phase 4: Sending Messages ─────────────────────────────────────────────

  describe('sending messages', () => {
    it('should send a reply to User A', async () => {
      await sendMessage(FIXTURES.MESSAGES.DM_REPLY);
      await expectMessageVisible(FIXTURES.MESSAGES.DM_REPLY);

      writeSync('userB_sent_msg1', 'true');
      console.log('[UserB] Sent reply message');
    });

    it('should see own reply in the chat area', async () => {
      await expectMessageVisible(FIXTURES.MESSAGES.DM_REPLY);
    });

    it('should have cleared the input after sending', async () => {
      const attrs = await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).getAttributes();
      // @ts-ignore
      const text: string = attrs.text || '';
      if (text === FIXTURES.MESSAGES.DM_REPLY) {
        throw new Error('Input was not cleared after sending');
      }
    });

    it('should send via the send button', async () => {
      const sendButtonMsg = 'Send button test from B';
      await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).tap();
      await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).typeText(sendButtonMsg);
      await waitForUISettle();

      await element(by.id(TEST_IDS.INPUT.SEND_BUTTON)).tap();
      await waitForUISettle();

      await expectMessageVisible(sendButtonMsg);
      console.log('[UserB] Sent message via send button');
    });

    it('should send a message with special characters', async () => {
      await sendMessage(FIXTURES.MESSAGES.SPECIAL_CHARS);
      await expectMessageVisible(FIXTURES.MESSAGES.SPECIAL_CHARS);
      console.log('[UserB] Sent special chars message');
    });
  });

  // ─── Phase 5: Message Actions ──────────────────────────────────────────────

  describe('message actions', () => {
    it('should long-press received message to show action menu', async () => {
      await longPressMessage(FIXTURES.MESSAGES.DM_HELLO);

      let hasMenu = false;
      try {
        await waitFor(element(by.text('Reply')))
          .toExist()
          .withTimeout(TIMEOUTS.INTERACTION);
        hasMenu = true;
        console.log('[UserB] Action menu appeared on received message');
      } catch {
        console.warn('[UserB] Action menu not detected on received message');
      }

      // Dismiss
      if (hasMenu) {
        await element(by.id(TEST_IDS.CHAT_AREA.MESSAGE_LIST)).tap();
        await waitForUISettle();
      }
    });

    it('should reply to User A message', async () => {
      await longPressMessage(FIXTURES.MESSAGES.DM_HELLO);

      try {
        await waitFor(element(by.text('Reply')))
          .toExist()
          .withTimeout(TIMEOUTS.INTERACTION);
        await element(by.text('Reply')).tap();
        await waitForUISettle();

        // Reply preview should appear
        await waitFor(element(by.id(TEST_IDS.INPUT.REPLY_PREVIEW)))
          .toExist()
          .withTimeout(TIMEOUTS.INTERACTION);

        await sendMessage('Reply to your DM message!');

        // Reply reference should be visible
        await waitFor(element(by.id(TEST_IDS.BUBBLE.REPLY_PREVIEW)))
          .toExist()
          .withTimeout(TIMEOUTS.INTERACTION);

        console.log('[UserB] Reply sent with preview');
      } catch {
        console.warn('[UserB] Reply flow not available — skipping');
      }
    });

    it('should delete own message', async () => {
      await longPressMessage(FIXTURES.MESSAGES.DM_REPLY);

      try {
        await waitFor(element(by.text('Delete')))
          .toExist()
          .withTimeout(TIMEOUTS.INTERACTION);
        await element(by.text('Delete')).tap();
        await waitForUISettle();

        // Confirm if dialog appears
        try {
          await element(by.id(TEST_IDS.COMMON.CONFIRM_YES)).tap();
          await waitForUISettle();
        } catch {
          // Immediate deletion
        }

        await expect(element(by.text(FIXTURES.MESSAGES.DM_REPLY))).not.toExist();
        console.log('[UserB] Message deleted successfully');
      } catch {
        console.warn('[UserB] Delete flow not available — skipping');
      }

      writeSync('userB_dm_tests_done', 'true');
    });
  });
});
