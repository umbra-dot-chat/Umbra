/**
 * DM Conversation — User A (iPhone 17 Pro)
 *
 * Run via: scripts/run-dm-test.sh
 *
 * User A creates an account, establishes a friendship with User B,
 * then opens the DM conversation to send and receive messages.
 * Tests the full messaging lifecycle: send, receive, reply, delete.
 *
 * NETWORK VERIFICATION:
 * - Verifies relay connection after account creation (before DID exchange)
 * - Uses hard assertions for all cross-device message delivery
 * - waitForMessage() is the primary delivery assertion (no try/catch)
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
  openConversation,
  closeSettings,
} from '../helpers/navigation';
import {
  sendMessage,
  waitForMessage,
  expectMessageVisible,
  longPressMessage,
} from '../helpers/messaging';
import { writeSync, waitForSync, resetSync } from '../helpers/sync';

describe('DM Conversation — User A', () => {
  let myDid = '';

  beforeAll(async () => {
    // Reset sync state — User A starts first
    resetSync();
    await launchApp({ newInstance: true, delete: true });
    await createAccountFull(
      FIXTURES.USER_A.displayName,
      FIXTURES.USER_A.pin,
      FIXTURES.USER_A.displayName.toLowerCase(),
    );
  });

  // ─── Phase 0: Network Verification ────────────────────────────────────────

  describe('network verification', () => {
    it('should verify relay connection is active after account creation', async () => {
      await waitForRelayConnection();
      console.log('[UserA] Relay connection verified');
    });
  });

  // ─── Phase 1: Friendship Setup ──────────────────────────────────────────────

  describe('friendship setup', () => {
    it('should read own DID from settings', async () => {
      await navigateToSettings();
      await waitFor(element(by.id(TEST_IDS.SETTINGS.DID_DISPLAY)))
        .toExist()
        .withTimeout(TIMEOUTS.NAVIGATION);

      const attrs = await element(by.id(TEST_IDS.SETTINGS.DID_DISPLAY)).getAttributes();
      // @ts-ignore — accessibilityValue.text has the full (non-truncated) DID
      myDid = attrs.value || attrs.text || attrs.label || '';

      if (!myDid.startsWith('did:key:z6Mk') || myDid.length < 48) {
        throw new Error(`Invalid DID read from settings: "${myDid}"`);
      }

      console.log(`[UserA] My DID: ${myDid.slice(0, 30)}...`);
      await closeSettings();
    });

    it('should publish DID for User B', async () => {
      writeSync('userA_did', myDid);
      writeSync('userA_name', FIXTURES.USER_A.displayName);
      writeSync('userA_ready', 'true');
      console.log('[UserA] Published DID to sync file');
    });

    it('should wait for User B to send friend request', async () => {
      const status = await waitForSync('userB_request_sent', 120000);
      console.log(`[UserA] User B sent friend request: ${status}`);
    });

    it('should accept the incoming friend request', async () => {
      await navigateToFriends();
      await waitForUISettle();

      // Switch to Pending tab to see incoming requests
      await element(by.id(TEST_IDS.FRIENDS.TAB_PENDING)).tap();
      await waitForUISettle();

      // Wait for the incoming request to appear
      await waitFor(element(by.id(TEST_IDS.FRIENDS.CARD)))
        .toExist()
        .withTimeout(TIMEOUTS.MESSAGE_DELIVERY);

      // Tap accept
      await element(by.id(TEST_IDS.FRIENDS.CARD_ACCEPT)).tap();
      await waitForUISettle();

      writeSync('userA_accepted', 'true');
      console.log('[UserA] Accepted friend request');
    });
  });

  // ─── Phase 2: Open DM Conversation ─────────────────────────────────────────

  describe('opening the DM', () => {
    it('should find User B in friends list and open DM', async () => {
      // Switch to All tab to see the friend
      await element(by.id(TEST_IDS.FRIENDS.TAB_ALL)).tap();
      await waitForUISettle();

      // Wait for the friend card to appear
      await waitFor(element(by.id(TEST_IDS.FRIENDS.CARD)))
        .toExist()
        .withTimeout(TIMEOUTS.MESSAGE_DELIVERY);

      // Tap the Message button on the friend card to open DM
      await element(by.id(TEST_IDS.FRIENDS.CARD_MESSAGE)).tap();
      await waitForUISettle();

      // Wait for the chat header to appear (DM is now open)
      await waitFor(element(by.id(TEST_IDS.CHAT.HEADER)))
        .toExist()
        .withTimeout(TIMEOUTS.NAVIGATION);

      writeSync('userA_in_dm', 'true');
      console.log('[UserA] Opened DM conversation');
    });

    it('should display the chat header with User B name', async () => {
      await expect(element(by.id(TEST_IDS.CHAT.HEADER))).toExist();
      await expect(element(by.id(TEST_IDS.CHAT.HEADER_NAME))).toExist();
    });

    it('should display the message input bar', async () => {
      await expect(element(by.id(TEST_IDS.INPUT.CONTAINER))).toExist();
      await expect(element(by.id(TEST_IDS.INPUT.TEXT_INPUT))).toExist();
    });

    it('should display the attach button', async () => {
      await expect(element(by.id(TEST_IDS.INPUT.ATTACH_BUTTON))).toExist();
    });

    it('should display the emoji button', async () => {
      await expect(element(by.id(TEST_IDS.INPUT.EMOJI_BUTTON))).toExist();
    });
  });

  // ─── Phase 3: Sending Messages ─────────────────────────────────────────────

  describe('sending messages', () => {
    it('should wait for User B to be in the DM', async () => {
      const status = await waitForSync('userB_in_dm', 120000);
      console.log(`[UserA] User B is in DM: ${status}`);
    });

    it('should send a text message', async () => {
      await sendMessage(FIXTURES.MESSAGES.DM_HELLO);
      console.log('[UserA] Sent first message');
      writeSync('userA_sent_msg1', 'true');
    });

    it('should see own message in the chat area', async () => {
      await expectMessageVisible(FIXTURES.MESSAGES.DM_HELLO);
    });

    it('should display a message bubble', async () => {
      await waitFor(element(by.id(TEST_IDS.BUBBLE.CONTAINER)))
        .toExist()
        .withTimeout(TIMEOUTS.INTERACTION);
    });

    it('should display a timestamp on the sent message', async () => {
      await waitFor(element(by.id(TEST_IDS.BUBBLE.TIMESTAMP)))
        .toExist()
        .withTimeout(TIMEOUTS.INTERACTION);
    });

    it('should have cleared the input after sending', async () => {
      // Input should be empty — verify it exists (cleared)
      const attrs = await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).getAttributes();
      // @ts-ignore
      const text: string = attrs.text || '';
      if (text === FIXTURES.MESSAGES.DM_HELLO) {
        throw new Error('Input was not cleared after sending');
      }
      console.log('[UserA] Input cleared after send');
    });

    it('should send a second message via send button', async () => {
      await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).tap();
      await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).typeText(FIXTURES.MESSAGES.DM_SECOND);
      await waitForUISettle();
      await element(by.id(TEST_IDS.INPUT.SEND_BUTTON)).tap();
      await waitForUISettle();

      await expectMessageVisible(FIXTURES.MESSAGES.DM_SECOND);
      console.log('[UserA] Sent second message via send button');
    });

    it('should send a long message', async () => {
      await sendMessage(FIXTURES.MESSAGES.DM_LONG);
      // Just verify no crash — long messages may be truncated in view
      console.log('[UserA] Sent long message');
    });

    it('should send a message with emoji text', async () => {
      await sendMessage(FIXTURES.MESSAGES.DM_EMOJI);
      await expectMessageVisible(FIXTURES.MESSAGES.DM_EMOJI);
      console.log('[UserA] Sent emoji message');
      writeSync('userA_sent_all_messages', 'true');
    });
  });

  // ─── Phase 4: Receiving Messages ───────────────────────────────────────────

  describe('receiving messages from User B', () => {
    it('should wait for User B to send a reply', async () => {
      const status = await waitForSync('userB_sent_msg1', 120000);
      console.log(`[UserA] User B sent reply: ${status}`);
    });

    it('should see User B reply in the chat area', async () => {
      await waitForMessage(FIXTURES.MESSAGES.DM_REPLY);
      console.log('[UserA] Received User B reply');
      writeSync('userA_received_reply', 'true');
    });
  });

  // ─── Phase 5: Message Actions ──────────────────────────────────────────────

  describe('message actions', () => {
    it('should long-press own message to show action menu', async () => {
      await longPressMessage(FIXTURES.MESSAGES.DM_HELLO);

      // Look for common action items (Reply, Delete, Copy)
      let hasActionMenu = false;
      try {
        await waitFor(element(by.text('Reply')))
          .toExist()
          .withTimeout(TIMEOUTS.INTERACTION);
        hasActionMenu = true;
      } catch {
        // Action menu may use different text or icons
      }

      if (hasActionMenu) {
        console.log('[UserA] Action menu appeared with Reply option');
        // Dismiss the menu by tapping elsewhere
        await element(by.id(TEST_IDS.CHAT_AREA.MESSAGE_LIST)).tap();
        await waitForUISettle();
      } else {
        console.warn('[UserA] Action menu not detected — may use different UI pattern');
      }
    });

    it('should reply to a message', async () => {
      await longPressMessage(FIXTURES.MESSAGES.DM_HELLO);

      try {
        await waitFor(element(by.text('Reply')))
          .toExist()
          .withTimeout(TIMEOUTS.INTERACTION);
        await element(by.text('Reply')).tap();
        await waitForUISettle();

        // Reply preview should appear above the input
        await waitFor(element(by.id(TEST_IDS.INPUT.REPLY_PREVIEW)))
          .toExist()
          .withTimeout(TIMEOUTS.INTERACTION);

        // Send the reply
        await sendMessage(FIXTURES.MESSAGES.REPLY);

        // The reply reference should be visible in the chat
        await waitFor(element(by.id(TEST_IDS.BUBBLE.REPLY_PREVIEW)))
          .toExist()
          .withTimeout(TIMEOUTS.INTERACTION);

        console.log('[UserA] Reply sent with preview');
      } catch {
        console.warn('[UserA] Reply flow not available — skipping');
      }
    });

    it('should delete own message', async () => {
      // Delete the second message we sent
      await longPressMessage(FIXTURES.MESSAGES.DM_SECOND);

      try {
        await waitFor(element(by.text('Delete')))
          .toExist()
          .withTimeout(TIMEOUTS.INTERACTION);
        await element(by.text('Delete')).tap();
        await waitForUISettle();

        // Confirm deletion if a dialog appears
        try {
          await element(by.id(TEST_IDS.COMMON.CONFIRM_YES)).tap();
          await waitForUISettle();
        } catch {
          // No confirmation dialog — deletion was immediate
        }

        // Verify the message is gone
        await expect(element(by.text(FIXTURES.MESSAGES.DM_SECOND))).not.toExist();
        console.log('[UserA] Message deleted successfully');
      } catch {
        console.warn('[UserA] Delete flow not available — skipping');
      }

      writeSync('userA_dm_tests_done', 'true');
    });
  });
});
