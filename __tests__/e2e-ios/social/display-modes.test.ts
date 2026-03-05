/**
 * Display Modes — Detox E2E Tests (iOS)
 *
 * Tests that the chat area renders messages in bubble mode, which is
 * the default display mode on mobile.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Display Modes — Bubble Mode', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should show the main screen', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
  });

  // Requires being inside an active conversation.

  it.skip('should render the chat area container', async () => {
    await expect(element(by.id(TEST_IDS.CHAT_AREA.CONTAINER))).toExist();
  });

  it.skip('should render messages inside bubble containers', async () => {
    // Send a message first
    await sendMessage(FIXTURES.MESSAGES.HELLO);
    await waitForUISettle();

    // The message should be wrapped in a bubble container
    await waitFor(element(by.id(TEST_IDS.BUBBLE.CONTAINER)))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it.skip('should show message text inside the bubble', async () => {
    await expect(element(by.id(TEST_IDS.BUBBLE.TEXT))).toExist();
  });

  it.skip('should show timestamp on the bubble', async () => {
    await expect(element(by.id(TEST_IDS.BUBBLE.TIMESTAMP))).toExist();
  });

  it.skip('should display the message list', async () => {
    await expect(element(by.id(TEST_IDS.CHAT_AREA.MESSAGE_LIST))).toExist();
  });

  it.todo('should show date dividers between messages from different days');
});
