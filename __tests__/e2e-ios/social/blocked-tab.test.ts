/**
 * Blocked Tab — Detox E2E Tests (iOS)
 *
 * Tests the Blocked friends tab: displays blocked users or empty state,
 * and the unblock option.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Friends — Blocked Tab', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToFriends();
  });

  it('should switch to the Blocked tab', async () => {
    await element(by.id(TEST_IDS.FRIENDS.TAB_BLOCKED)).tap();
    await waitForUISettle();
    await expect(element(by.id(TEST_IDS.FRIENDS.TAB_BLOCKED))).toBeVisible();
  });

  it('should show empty state when no users are blocked', async () => {
    await expect(element(by.id(TEST_IDS.FRIENDS.EMPTY_STATE))).toBeVisible();
  });

  it.todo('should display blocked user card with username');

  it.todo('should show unblock button on blocked user card');

  it.todo('should unblock a user and remove them from the Blocked list');

  it.todo('should not show blocked users in the All friends tab');

  it('should navigate back to All tab from Blocked tab', async () => {
    await element(by.id(TEST_IDS.FRIENDS.TAB_ALL)).tap();
    await waitForUISettle();
    await expect(element(by.id(TEST_IDS.FRIENDS.TAB_ALL))).toBeVisible();
  });
});
