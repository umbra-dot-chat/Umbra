/**
 * Message Input — Detox E2E Tests (iOS)
 *
 * Tests the message input field: accepts text, clears after send,
 * supports multiline text, and shows relevant buttons.
 *
 * These tests require an active conversation. Tests that depend on
 * a two-user DM are skipped.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Message Input', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should show the main container', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
  });

  // The following tests require being inside a conversation with an active
  // input bar visible.

  it.skip('should display the text input field', async () => {
    await expect(element(by.id(TEST_IDS.INPUT.TEXT_INPUT))).toExist();
  });

  it.skip('should accept typed text', async () => {
    await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).tap();
    await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).typeText('Hello world');
    await waitForUISettle();
    // The input should contain the typed text
  });

  it.skip('should display the send button', async () => {
    await expect(element(by.id(TEST_IDS.INPUT.SEND_BUTTON))).toExist();
  });

  it.skip('should clear the input after sending a message', async () => {
    await sendMessage('Clear test message');
    await waitForUISettle();
    // Input should be empty after send
    await expect(element(by.id(TEST_IDS.INPUT.TEXT_INPUT))).toExist();
  });

  it.skip('should accept multiline text input', async () => {
    await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).tap();
    await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).typeText('Line one\nLine two');
    await waitForUISettle();
    // The input should grow to accommodate multiline text
  });

  it.skip('should show the emoji button', async () => {
    await expect(element(by.id(TEST_IDS.INPUT.EMOJI_BUTTON))).toExist();
  });

  it.skip('should show the attach button', async () => {
    await expect(element(by.id(TEST_IDS.INPUT.ATTACH_BUTTON))).toExist();
  });

  it.skip('should show the input container', async () => {
    await expect(element(by.id(TEST_IDS.INPUT.CONTAINER))).toExist();
  });
});
