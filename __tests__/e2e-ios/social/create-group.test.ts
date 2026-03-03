/**
 * Create Group — Detox E2E Tests (iOS)
 *
 * Tests the Create Group dialog: opening it, filling in name and
 * description, member picker visibility, and the create button
 * flow.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Create Group', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should show the new chat button in the sidebar', async () => {
    await expect(element(by.id(TEST_IDS.SIDEBAR.NEW_CHAT_BUTTON))).toBeVisible();
  });

  it('should open the create group dialog', async () => {
    // Tap the new chat button to reveal the menu
    await element(by.id(TEST_IDS.SIDEBAR.NEW_CHAT_BUTTON)).tap();
    await waitForUISettle();

    // Tap the "New Group" option
    await waitFor(element(by.text('New Group')))
      .toBeVisible()
      .withTimeout(TIMEOUTS.INTERACTION);
    await element(by.text('New Group')).tap();
    await waitForUISettle();

    // The create group dialog should be visible
    await waitFor(element(by.id(TEST_IDS.GROUPS.CREATE_DIALOG)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('should display the group name input', async () => {
    await expect(element(by.id(TEST_IDS.GROUPS.NAME_INPUT))).toBeVisible();
  });

  it('should accept text in the group name input', async () => {
    await element(by.id(TEST_IDS.GROUPS.NAME_INPUT)).tap();
    await element(by.id(TEST_IDS.GROUPS.NAME_INPUT)).typeText(FIXTURES.GROUPS.NAME);
    await waitForUISettle();
  });

  it('should display the description input', async () => {
    await expect(element(by.id(TEST_IDS.GROUPS.DESCRIPTION_INPUT))).toBeVisible();
  });

  it('should accept text in the description input', async () => {
    await element(by.id(TEST_IDS.GROUPS.DESCRIPTION_INPUT)).tap();
    await element(by.id(TEST_IDS.GROUPS.DESCRIPTION_INPUT)).typeText(
      FIXTURES.GROUPS.DESCRIPTION,
    );
    await waitForUISettle();
  });

  it('should display the member picker area', async () => {
    await expect(element(by.id(TEST_IDS.GROUPS.MEMBER_PICKER))).toBeVisible();
  });

  it('should show the create button', async () => {
    await expect(element(by.id(TEST_IDS.GROUPS.CREATE_BUTTON))).toBeVisible();
  });

  it('should show the cancel button', async () => {
    await expect(element(by.id(TEST_IDS.GROUPS.CANCEL_BUTTON))).toBeVisible();
  });

  it('should close the dialog when cancel is tapped', async () => {
    await element(by.id(TEST_IDS.GROUPS.CANCEL_BUTTON)).tap();
    await waitForUISettle();

    await expect(element(by.id(TEST_IDS.GROUPS.CREATE_DIALOG))).not.toBeVisible();
  });

  // TWO-USER: Creating a group requires selecting at least one friend
  // from the member picker. The following tests need friendship setup.

  it.todo('should show friends in the member picker after befriending');

  it.todo('should select a friend in the member picker');

  it.todo('should create a group and show success feedback');

  it.todo('should show the new group in the sidebar conversation list');
});
