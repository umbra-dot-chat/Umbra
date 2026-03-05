/**
 * Group Members — Detox E2E Tests (iOS)
 *
 * Tests the group member list: visibility, showing all members
 * of the group.
 *
 * Requires an existing group with members.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Group Members', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should show the main screen', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
  });

  // Requires navigating into a group conversation and opening the member list.
  // These tests are skipped because group creation requires two-user setup.

  it.skip('should open the member list in a group conversation', async () => {
    // Tap the members button in the group header
    await element(by.id(TEST_IDS.CHAT.MEMBERS_BUTTON)).tap();
    await waitForUISettle();
  });

  it.skip('should display the current user in the member list', async () => {
    await waitFor(element(by.text(FIXTURES.USER_A.displayName)))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it.todo('should display all group members in the member list');

  it.todo('should show member names and avatars');

  it.todo('should show the group creator or admin badge');

  it.todo('should allow scrolling through a long member list');

  it.todo('should close the member list panel');
});
