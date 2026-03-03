/**
 * Receiving Messages — Detox E2E Tests (iOS)
 *
 * [TWO-USER STUB] Tests that messages sent from User A are received
 * by User B, displayed with the correct sender name, and appear
 * in the chat area in real time.
 *
 * All tests require multi-device infrastructure and are stubbed.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Receiving Messages [TWO-USER]', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should load the main screen for the receiving user', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toBeVisible();
  });

  // All receiving tests require a second device/user.

  it.todo('should receive a message from User A in real time');

  it.todo('should display the sender name on the received message bubble');

  it.todo('should display the received message text correctly');

  it.todo('should show the received message timestamp');

  it.todo('should show an incoming message notification if chat is not focused');

  it.todo('should auto-scroll to the newest received message');

  it.todo('should display the sender avatar on received messages');
});
