/**
 * Typing Receipts — Detox E2E Tests (iOS)
 *
 * [TWO-USER STUB] Tests that a typing indicator appears when the
 * other user is typing. All tests require multi-device infrastructure.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Typing Receipts [TWO-USER]', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should load the main screen', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toBeVisible();
  });

  it.todo('should show typing indicator when the other user starts typing');

  it.todo('should hide typing indicator when the other user stops typing');

  it.todo('should hide typing indicator when the other user sends a message');

  it.todo('should not show typing indicator for your own typing');

  it.todo('should show typing indicator in the correct conversation only');
});
