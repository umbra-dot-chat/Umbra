/**
 * Group Header — Detox E2E Tests (iOS)
 *
 * Tests the group conversation header: displays group name, member
 * count, and settings button.
 *
 * Requires an existing group conversation to be open.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Group Header', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should show the main screen', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
  });

  // Requires navigating into a group conversation. These tests are skipped
  // because creating a group requires at least one friend (two-user setup).

  it.skip('should display the chat header in a group conversation', async () => {
    await expect(element(by.id(TEST_IDS.CHAT.HEADER))).toExist();
  });

  it.skip('should show the group name in the header', async () => {
    await expect(element(by.id(TEST_IDS.CHAT.HEADER_NAME))).toExist();
  });

  it.skip('should show the members button in the group header', async () => {
    await expect(element(by.id(TEST_IDS.CHAT.MEMBERS_BUTTON))).toExist();
  });

  it.skip('should show the settings button in the group header', async () => {
    await expect(element(by.id(TEST_IDS.CHAT.SETTINGS_BUTTON))).toExist();
  });

  it.skip('should navigate back from the group conversation', async () => {
    await element(by.id(TEST_IDS.CHAT.HEADER_BACK)).tap();
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.SIDEBAR.CONTAINER)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it.todo('should display the member count in the group header');

  it.todo('should open group settings when the settings button is tapped');
});
