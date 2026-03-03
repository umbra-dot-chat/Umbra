/**
 * Sending Messages — Detox E2E Tests (iOS)
 *
 * Tests the core message-sending experience: typing in the input,
 * sending a message, verifying it appears in the chat area, and
 * confirming timestamps are displayed.
 *
 * TWO-USER: Requires an established DM conversation. Multi-device
 * tests are stubbed; single-device UI validation is included.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Sending Messages', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should show the main screen after account creation', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toBeVisible();
  });

  // The following tests require an active DM conversation.
  // In a two-user setup, User A would open a DM with User B.

  it.skip('should type a message in the input field', async () => {
    await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).tap();
    await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).typeText(FIXTURES.MESSAGES.HELLO);
    await waitForUISettle();
  });

  it.skip('should send the message and see it in the chat area', async () => {
    await sendMessage(FIXTURES.MESSAGES.HELLO);
    await expectMessageVisible(FIXTURES.MESSAGES.HELLO);
  });

  it.skip('should display the message in a bubble container', async () => {
    await waitFor(element(by.id(TEST_IDS.BUBBLE.CONTAINER)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it.skip('should display a timestamp on the sent message', async () => {
    await waitFor(element(by.id(TEST_IDS.BUBBLE.TIMESTAMP)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it.skip('should clear the input field after sending', async () => {
    // After sending, the input should be empty and ready for the next message
    await expect(element(by.id(TEST_IDS.INPUT.TEXT_INPUT))).toBeVisible();
  });

  it.skip('should send via the send button tap', async () => {
    await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).tap();
    await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).typeText('Button send test');
    await element(by.id(TEST_IDS.INPUT.SEND_BUTTON)).tap();
    await waitForUISettle();
    await expectMessageVisible('Button send test');
  });

  it.todo('should send a message and have it appear at the bottom of the chat');
});
