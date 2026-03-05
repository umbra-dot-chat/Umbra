/**
 * Emoji Picker — Detox E2E Tests (iOS)
 *
 * Tests the emoji picker button and behavior. On mobile, the emoji
 * picker may use the native keyboard emoji view or a custom overlay.
 * These tests are partially stubbed until the picker implementation
 * is confirmed.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Emoji Picker', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should show the main screen', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
  });

  // Requires an active conversation with the input bar visible.

  it.skip('should display the emoji button in the input bar', async () => {
    await expect(element(by.id(TEST_IDS.INPUT.EMOJI_BUTTON))).toExist();
  });

  it.skip('should open the emoji picker when the emoji button is tapped', async () => {
    await element(by.id(TEST_IDS.INPUT.EMOJI_BUTTON)).tap();
    await waitForUISettle();
    // Emoji picker overlay or keyboard emoji panel should appear
    // Implementation-specific: assert on picker visibility
  });

  it.todo('should insert an emoji into the message input when selected');

  it.todo('should close the emoji picker after selecting an emoji');

  it.todo('should close the emoji picker when tapping outside');

  it.todo('should send a message containing an emoji');
});
