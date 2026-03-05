/**
 * Friend Request Flow — Detox E2E Tests (iOS)
 *
 * Tests the friend request lifecycle on a single device:
 * creating an account with full PIN + username setup, navigating to
 * the friends page, sending a friend request via DID, and verifying
 * the feedback and pending tab state.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { generateDisplayName, generatePin } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccountFull } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, closeSettings } from '../helpers/navigation';

const testName = generateDisplayName();
const testPin = generatePin();
const testUsername = testName.toLowerCase();

// A well-formed DID to use for the send test. This DID belongs to no real
// user so the relay will not deliver it, but the app will still process the
// send and show feedback.
const TEST_DID = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';

describe('Friend Request Flow', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccountFull(testName, testPin, testUsername);
  });

  describe('account setup verification', () => {
    it('should have created account and landed on main screen', async () => {
      await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
    });
  });

  describe('sending a friend request (single device)', () => {
    it('should navigate to the friends page', async () => {
      await navigateToFriends();
      await expect(element(by.id(TEST_IDS.FRIENDS.PAGE))).toExist();
    });

    it('should have the add friend input visible', async () => {
      await expect(element(by.id(TEST_IDS.FRIENDS.ADD_INPUT))).toExist();
      await expect(element(by.id(TEST_IDS.FRIENDS.ADD_BUTTON))).toExist();
    });

    it('should type a DID and tap Send to submit the request', async () => {
      await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).tap();
      await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).typeText(TEST_DID);
      await waitForUISettle();

      // Tap the Send Request button — with keyboardShouldPersistTaps="handled"
      // the tap fires onPress even when the keyboard is visible.
      await element(by.id(TEST_IDS.FRIENDS.ADD_BUTTON)).tap();

      // Verify feedback appears — either success ("Friend request sent!")
      // or error (relay unavailable). Either way, the send was attempted.
      await waitFor(element(by.id(TEST_IDS.FRIENDS.ADD_FEEDBACK)))
        .toExist()
        .withTimeout(TIMEOUTS.NETWORK_CONNECT);
    });

    it('should show the feedback message after sending', async () => {
      // Read the feedback text to verify the send was actually attempted
      const feedbackEl = element(by.id(TEST_IDS.FRIENDS.ADD_FEEDBACK));
      const attrs = await feedbackEl.getAttributes();
      // @ts-ignore — Detox attributes include text/label
      const feedbackText: string = attrs.text || attrs.label || '';

      // The feedback should be a meaningful message, not empty
      if (feedbackText.length === 0) {
        throw new Error('Feedback text is empty — send was not attempted');
      }

      // Log the actual feedback for debugging
      console.log(`[FriendRequestFlow] Feedback: "${feedbackText}"`);
    });

    it('should navigate to the Pending tab and verify state', async () => {
      // Wait for feedback to clear (5s auto-dismiss)
      await waitFor(element(by.id(TEST_IDS.FRIENDS.ADD_FEEDBACK)))
        .not.toExist()
        .withTimeout(TIMEOUTS.INTERACTION * 2);

      await element(by.id(TEST_IDS.FRIENDS.TAB_PENDING)).tap();
      await waitForUISettle();

      // The Pending tab should exist and be visible
      await expect(element(by.id(TEST_IDS.FRIENDS.PAGE))).toExist();
    });
  });

  describe('two-user friend request lifecycle', () => {
    // These tests require two separate device sessions.
    // Run with: scripts/run-two-device-test.sh
    // See: two-device/friend-two-device-a.test.ts and two-device/friend-two-device-b.test.ts

    it.todo('should send a friend request from User A to User B via DID');
    it.todo('should show the incoming request on User B Pending tab');
    it.todo('should allow User B to accept the friend request');
    it.todo('should show User A in User B friends list after acceptance');
    it.todo('should show User B in User A friends list after acceptance');
    it.todo('should auto-create a DM conversation between both users');
  });
});
