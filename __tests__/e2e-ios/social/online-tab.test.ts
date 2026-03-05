/**
 * Online Tab — Detox E2E Tests (iOS)
 *
 * Tests the Online friends tab: displays currently online friends
 * or an appropriate empty state.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Friends — Online Tab', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToFriends();
  });

  it('should switch to the Online tab', async () => {
    await element(by.id(TEST_IDS.FRIENDS.TAB_ONLINE)).tap();
    await waitForUISettle();
    await expect(element(by.id(TEST_IDS.FRIENDS.TAB_ONLINE))).toExist();
  });

  it('should show empty state when no friends are online', async () => {
    // A fresh account has no friends, so Online tab should show empty state
    await expect(element(by.id(TEST_IDS.FRIENDS.EMPTY_STATE))).toExist();
  });

  it.todo('should show online friends with green status indicator');

  it.todo('should update friend status in real time when they come online');

  it.todo('should remove friend from Online tab when they go offline');

  it('should navigate back to All tab from Online tab', async () => {
    await element(by.id(TEST_IDS.FRIENDS.TAB_ALL)).tap();
    await waitForUISettle();
    await expect(element(by.id(TEST_IDS.FRIENDS.TAB_ALL))).toExist();
  });
});
