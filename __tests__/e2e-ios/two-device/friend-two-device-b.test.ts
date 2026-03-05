/**
 * Two-Device Friend Request — User B (iPhone 17 Pro Max)
 *
 * Run via: scripts/run-two-device-test.sh
 *
 * User B waits for User A's DID, creates an account, then sends
 * a friend request to User A. After User A accepts, User B verifies
 * the friend appears in their list.
 *
 * NETWORK VERIFICATION:
 * - Relay connection verified before sending friend request
 * - Friend request feedback must contain "sent" (relay accepted the message)
 * - Outgoing request must appear in Pending tab (local state persistence)
 * - After User A accepts, friend MUST appear in All tab (relay propagation)
 *   This is a HARD assertion — if acceptance doesn't propagate, the test fails.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle, waitForRelayConnection } from '../helpers/app';
import { createAccountFull } from '../helpers/auth';
import { navigateToFriends, navigateHome } from '../helpers/navigation';
import { writeSync, waitForSync } from '../helpers/sync';

describe('Two-Device Friend Request — User B', () => {
  let userADid = '';

  beforeAll(async () => {
    // Wait for User A to publish their DID before creating our account
    console.log('[UserB] Waiting for User A to be ready...');
    await waitForSync('userA_ready', 120000);
    userADid = await waitForSync('userA_did', 5000);
    console.log(`[UserB] Got User A DID: ${userADid.slice(0, 30)}...`);

    await launchApp({ newInstance: true, delete: true });
    await createAccountFull(
      FIXTURES.USER_B.displayName,
      FIXTURES.USER_B.pin,
      FIXTURES.USER_B.displayName.toLowerCase(),
    );
  });

  it('should verify relay connection before sending friend request', async () => {
    // Verify relay is connected before attempting to send a friend request.
    // This catches network setup failures early rather than getting a
    // confusing "request failed" error later.
    await waitForRelayConnection();
  });

  it('should navigate to the friends page', async () => {
    await navigateToFriends();
    await expect(element(by.id(TEST_IDS.FRIENDS.PAGE))).toExist();
  });

  it('should type User A DID and send friend request', async () => {
    await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).tap();
    await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).typeText(userADid);
    await waitForUISettle();

    // Tap Send button
    await element(by.id(TEST_IDS.FRIENDS.ADD_BUTTON)).tap();

    // Wait for feedback — success or error
    await waitFor(element(by.id(TEST_IDS.FRIENDS.ADD_FEEDBACK)))
      .toExist()
      .withTimeout(TIMEOUTS.NETWORK_CONNECT);

    // Verify the feedback text confirms the relay accepted the request.
    // A "sent" message means the relay successfully queued the friend
    // request for delivery to User A's device.
    const attrs = await element(by.id(TEST_IDS.FRIENDS.ADD_FEEDBACK)).getAttributes();
    // @ts-ignore
    const feedbackText: string = attrs.text || attrs.label || '';
    console.log(`[UserB] Send feedback: "${feedbackText}"`);

    if (!feedbackText.toLowerCase().includes('sent')) {
      throw new Error(
        `Expected relay delivery confirmation ("sent") but got: "${feedbackText}". ` +
        'The relay may be unreachable or the friend request was rejected.',
      );
    }

    // Signal User A that we sent the request
    writeSync('userB_request_sent', 'true');
    console.log('[UserB] Friend request sent — relay confirmed delivery');
  });

  it('should show outgoing request in Pending tab', async () => {
    // Wait for feedback to clear
    await waitFor(element(by.id(TEST_IDS.FRIENDS.ADD_FEEDBACK)))
      .not.toExist()
      .withTimeout(TIMEOUTS.INTERACTION * 2);

    await element(by.id(TEST_IDS.FRIENDS.TAB_PENDING)).tap();
    await waitForUISettle();

    // Outgoing request should be visible — verifies local state persistence
    await waitFor(element(by.id(TEST_IDS.FRIENDS.CARD)))
      .toExist()
      .withTimeout(TIMEOUTS.MESSAGE_DELIVERY);
  });

  it('should wait for User A to accept the request', async () => {
    const status = await waitForSync('userA_accepted', 120000);
    console.log(`[UserB] User A accepted: ${status}`);
  });

  it('should verify User A appears in the All friends tab after acceptance', async () => {
    // The acceptance event must propagate through the relay back to User B.
    // This is a HARD assertion — if the relay doesn't deliver the acceptance
    // event, the test FAILS. This verifies the critical network path:
    //   User A accepts → relay broadcasts → User B receives → UI updates
    //
    // We retry with re-navigation to force the friends hook to re-mount
    // and re-fetch the latest state.
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Navigate away and back to force re-mount
        await navigateHome();
        await new Promise((r) => setTimeout(r, attempt === 1 ? 5000 : 10000));

        await navigateToFriends();
        await waitFor(element(by.id(TEST_IDS.FRIENDS.PAGE)))
          .toExist()
          .withTimeout(TIMEOUTS.NAVIGATION);
        await waitForUISettle();

        // Wait for and tap the All tab
        await waitFor(element(by.id(TEST_IDS.FRIENDS.TAB_ALL)))
          .toBeVisible()
          .withTimeout(TIMEOUTS.NAVIGATION);
        await element(by.id(TEST_IDS.FRIENDS.TAB_ALL)).tap();
        await waitForUISettle();

        // Check if the friend card appears — proves relay delivered acceptance
        await waitFor(element(by.id(TEST_IDS.FRIENDS.CARD)))
          .toExist()
          .withTimeout(TIMEOUTS.NETWORK_CONNECT);

        console.log('[UserB] ✅ Friend appeared in All tab — relay acceptance propagation verified');
        return; // Test passes
      } catch {
        console.log(
          `[UserB] Attempt ${attempt}/${maxAttempts}: Friend not found in All tab yet`,
        );
        if (attempt === maxAttempts) {
          // HARD FAIL — acceptance event did not propagate via the relay
          throw new Error(
            'Friend did not appear in All tab after User A accepted. ' +
            'The acceptance event failed to propagate via the relay within ' +
            `${maxAttempts} attempts. This is a relay delivery failure.`,
          );
        }
      }
    }
  });
});
