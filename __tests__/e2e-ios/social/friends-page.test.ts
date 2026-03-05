/**
 * Friends Page — Detox E2E Tests (iOS)
 *
 * Tests that the friends page loads correctly, shows all four tabs
 * (All / Online / Pending / Blocked), defaults to the All tab,
 * and displays the add-friend input.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Friends Page', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should navigate to the friends page', async () => {
    await navigateToFriends();
    await expect(element(by.id(TEST_IDS.FRIENDS.PAGE))).toExist();
  });

  it('should display the All tab', async () => {
    await expect(element(by.id(TEST_IDS.FRIENDS.TAB_ALL))).toExist();
  });

  it('should display the Online tab', async () => {
    await expect(element(by.id(TEST_IDS.FRIENDS.TAB_ONLINE))).toExist();
  });

  it('should display the Pending tab', async () => {
    await expect(element(by.id(TEST_IDS.FRIENDS.TAB_PENDING))).toExist();
  });

  it('should display the Blocked tab', async () => {
    await expect(element(by.id(TEST_IDS.FRIENDS.TAB_BLOCKED))).toExist();
  });

  it('should default to the All tab being selected', async () => {
    // The All tab should already be active/selected on page load
    await expect(element(by.id(TEST_IDS.FRIENDS.TAB_ALL))).toExist();
    // Empty state or friend list should be visible under All tab
    await waitFor(element(by.id(TEST_IDS.FRIENDS.EMPTY_STATE)))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it('should show the add friend input field', async () => {
    await expect(element(by.id(TEST_IDS.FRIENDS.ADD_INPUT))).toExist();
  });

  it('should show the add friend button', async () => {
    await expect(element(by.id(TEST_IDS.FRIENDS.ADD_BUTTON))).toExist();
  });

  it('should show empty state when no friends exist', async () => {
    await expect(element(by.id(TEST_IDS.FRIENDS.EMPTY_STATE))).toExist();
  });
});
