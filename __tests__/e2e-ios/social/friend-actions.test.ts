/**
 * Friend Actions — Detox E2E Tests (iOS)
 *
 * Tests the action buttons on friend cards: message button opens
 * a conversation, block/remove buttons are accessible.
 *
 * Note: Most actions require an existing friendship. Single-device
 * tests validate UI presence; two-user interaction tests are stubbed.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Friend Actions', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToFriends();
  });

  it('should show the friends page with All tab active', async () => {
    await expect(element(by.id(TEST_IDS.FRIENDS.PAGE))).toBeVisible();
    await expect(element(by.id(TEST_IDS.FRIENDS.TAB_ALL))).toBeVisible();
  });

  it('should show empty state when no friends exist (no action cards)', async () => {
    // Without friends, no friend cards with action buttons should be present
    await expect(element(by.id(TEST_IDS.FRIENDS.EMPTY_STATE))).toBeVisible();
  });

  // TWO-USER: These tests require an established friendship so friend cards
  // with action buttons are rendered.

  it.todo('should display friend card with user name');

  it.todo('should show message button on friend card');

  it.todo('should open a DM conversation when tapping the message button');

  it.todo('should show block button on friend card');

  it.todo('should show remove button on friend card');

  it.todo('should block a friend and move them to the Blocked tab');

  it.todo('should remove a friend and they disappear from the list');
});
