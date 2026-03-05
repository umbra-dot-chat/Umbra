/**
 * Pending Tab — Detox E2E Tests (iOS)
 *
 * Tests the Pending friends tab: incoming/outgoing request display,
 * accept and reject button functionality.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Friends — Pending Tab', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToFriends();
  });

  it('should switch to the Pending tab', async () => {
    await element(by.id(TEST_IDS.FRIENDS.TAB_PENDING)).tap();
    await waitForUISettle();
    await expect(element(by.id(TEST_IDS.FRIENDS.TAB_PENDING))).toExist();
  });

  it('should show empty state when no pending requests', async () => {
    await expect(element(by.id(TEST_IDS.FRIENDS.EMPTY_STATE))).toExist();
  });

  // TWO-USER STUBS: These tests require a second device/user to generate
  // incoming friend requests. They are stubbed with it.todo until multi-device
  // Detox infrastructure is available.

  it.todo('should show incoming friend request with sender name');

  it.todo('should show outgoing friend request with recipient name');

  it.todo('should display accept button on incoming request card');

  it.todo('should display reject button on incoming request card');

  it.todo('should accept an incoming friend request and move user to All tab');

  it.todo('should reject an incoming friend request and remove it from list');

  it('should switch back to All tab after viewing Pending', async () => {
    await element(by.id(TEST_IDS.FRIENDS.TAB_ALL)).tap();
    await waitForUISettle();
    await expect(element(by.id(TEST_IDS.FRIENDS.TAB_ALL))).toExist();
  });
});
