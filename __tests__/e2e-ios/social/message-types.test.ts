/**
 * Message Types — Detox E2E Tests (iOS)
 *
 * Tests that different message types render correctly: text messages
 * render with the standard bubble appearance, and system messages
 * render with a distinct style.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Message Types', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should show the main screen', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toBeVisible();
  });

  describe('Text Messages', () => {
    it.skip('should render a text message in a bubble', async () => {
      await sendMessage(FIXTURES.MESSAGES.HELLO);
      await waitForUISettle();

      await waitFor(element(by.id(TEST_IDS.BUBBLE.CONTAINER)))
        .toBeVisible()
        .withTimeout(TIMEOUTS.INTERACTION);
      await expect(element(by.id(TEST_IDS.BUBBLE.TEXT))).toBeVisible();
    });

    it.skip('should display the message text correctly', async () => {
      await expectMessageVisible(FIXTURES.MESSAGES.HELLO);
    });

    it.skip('should show a timestamp on the text message', async () => {
      await expect(element(by.id(TEST_IDS.BUBBLE.TIMESTAMP))).toBeVisible();
    });
  });

  describe('System Messages', () => {
    // System messages (e.g., "User joined", "Encryption established") render
    // differently from regular text messages. They typically appear centered
    // and without a bubble container.

    it.todo('should render system messages with a distinct style');

    it.todo('should not show a bubble container for system messages');

    it.todo('should center system messages in the chat area');

    it.todo('should render system messages with a muted color');
  });
});
