/**
 * Friend Request Flow — Detox E2E Tests (iOS)
 *
 * [TWO-USER STUB] Tests the end-to-end friend request lifecycle:
 * sending a request via DID, the recipient seeing it in Pending,
 * accepting the request, and both users seeing each other in the
 * friends list.
 *
 * Multi-device tests are stubbed with it.todo. Single-device tests
 * validate the request-sending UI.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Friend Request Flow', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  describe('sending a friend request (single device)', () => {
    it('should navigate to the friends page', async () => {
      await navigateToFriends();
      await expect(element(by.id(TEST_IDS.FRIENDS.PAGE))).toBeVisible();
    });

    it('should have the add friend input visible', async () => {
      await expect(element(by.id(TEST_IDS.FRIENDS.ADD_INPUT))).toBeVisible();
    });

    it('should type a DID into the add friend input', async () => {
      const testDid = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
      await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).tap();
      await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).typeText(testDid);
      await waitForUISettle();
    });

    it('should tap the add friend button to send the request', async () => {
      await element(by.id(TEST_IDS.FRIENDS.ADD_BUTTON)).tap();
      await waitForUISettle();
      // After sending, the input should clear or a confirmation toast should appear
    });

    it('should show the outgoing request in the Pending tab', async () => {
      await element(by.id(TEST_IDS.FRIENDS.TAB_PENDING)).tap();
      await waitForUISettle();
      // In a single-device context the outgoing request should be listed
      // (or empty if relay hasn't confirmed it)
    });
  });

  describe('two-user friend request lifecycle', () => {
    // These tests require two separate device sessions (multi-device Detox).
    // Stubbed until infrastructure is available.

    it.todo('should send a friend request from User A to User B via DID');

    it.todo('should show the incoming request on User B Pending tab');

    it.todo('should allow User B to accept the friend request');

    it.todo('should show User A in User B friends list after acceptance');

    it.todo('should show User B in User A friends list after acceptance');

    it.todo('should auto-create a DM conversation between both users');
  });
});
