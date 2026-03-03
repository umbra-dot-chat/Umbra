/**
 * Edit / Delete / Reply — Detox E2E Tests (iOS)
 *
 * Tests replying to a message (shows preview), deleting a message
 * (removes from view), and editing a message (updates text).
 *
 * Requires an active conversation with at least one message.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Edit / Delete / Reply', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  describe('Reply', () => {
    it.skip('should show a reply preview when Reply action is selected', async () => {
      // Long-press a message and tap Reply
      await longPressMessage(FIXTURES.MESSAGES.HELLO);
      await waitFor(element(by.text('Reply')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.INTERACTION);
      await element(by.text('Reply')).tap();
      await waitForUISettle();

      // A reply preview should appear above the input
      await expect(element(by.id(TEST_IDS.INPUT.REPLY_PREVIEW))).toBeVisible();
    });

    it.skip('should dismiss the reply preview when close button is tapped', async () => {
      await expect(element(by.id(TEST_IDS.INPUT.REPLY_CLOSE))).toBeVisible();
      await element(by.id(TEST_IDS.INPUT.REPLY_CLOSE)).tap();
      await waitForUISettle();
      await expect(element(by.id(TEST_IDS.INPUT.REPLY_PREVIEW))).not.toBeVisible();
    });

    it.skip('should send a reply and show the reply reference on the message', async () => {
      // Trigger reply flow
      await longPressMessage(FIXTURES.MESSAGES.HELLO);
      await element(by.text('Reply')).tap();
      await waitForUISettle();

      // Type and send the reply
      await sendMessage(FIXTURES.MESSAGES.REPLY);

      // The sent reply should show a reply preview reference
      await waitFor(element(by.id(TEST_IDS.BUBBLE.REPLY_PREVIEW)))
        .toBeVisible()
        .withTimeout(TIMEOUTS.INTERACTION);
    });
  });

  describe('Delete', () => {
    it.skip('should delete a message and remove it from the chat', async () => {
      // Long-press a message and tap Delete
      await longPressMessage(FIXTURES.MESSAGES.HELLO);
      await waitFor(element(by.text('Delete')))
        .toBeVisible()
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

      // The message should no longer be visible
      await expect(element(by.text(FIXTURES.MESSAGES.HELLO))).not.toBeVisible();
    });
  });

  describe('Edit', () => {
    it.todo('should open edit mode for an own message');

    it.todo('should update the message text after editing');

    it.todo('should show an edited indicator on the modified message');

    it.todo('should cancel editing without changing the message');
  });
});
