/**
 * Message Actions — Detox E2E Tests (iOS)
 *
 * Tests the long-press context menu on messages: verifying that
 * copy, reply, and delete options are presented.
 *
 * Requires an active conversation with at least one sent message.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Message Actions', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should show the main screen', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
  });

  // Requires being inside a conversation with a sent message.

  it.skip('should long-press a message to show the action menu', async () => {
    await longPressMessage(FIXTURES.MESSAGES.HELLO);
    // An action menu / context menu should appear
  });

  it.skip('should display the copy option in the action menu', async () => {
    await longPressMessage(FIXTURES.MESSAGES.HELLO);
    await waitFor(element(by.text('Copy')))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it.skip('should display the reply option in the action menu', async () => {
    await longPressMessage(FIXTURES.MESSAGES.HELLO);
    await waitFor(element(by.text('Reply')))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it.skip('should display the delete option in the action menu', async () => {
    await longPressMessage(FIXTURES.MESSAGES.HELLO);
    await waitFor(element(by.text('Delete')))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it.skip('should dismiss the action menu when tapping outside', async () => {
    await longPressMessage(FIXTURES.MESSAGES.HELLO);
    await waitForUISettle();
    // Tap outside the menu to dismiss it
    await element(by.id(TEST_IDS.CHAT_AREA.CONTAINER)).tap();
    await waitForUISettle();
  });

  it.todo('should copy message text to clipboard when Copy is tapped');
});
