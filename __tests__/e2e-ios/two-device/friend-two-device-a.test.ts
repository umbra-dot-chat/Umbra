/**
 * Two-Device Friend Request — User A (iPhone 17 Pro)
 *
 * Run via: scripts/run-two-device-test.sh
 *
 * User A creates an account, publishes their DID via a sync file,
 * then waits for User B to send a friend request. Once received,
 * User A accepts the request and verifies the friend appears.
 *
 * NETWORK VERIFICATION:
 * - Relay connection verified after account creation
 * - DID read from settings (proves identity was created)
 * - Incoming friend request card in Pending tab (relay delivered the request)
 * - Friend card in All tab after acceptance (local state updated)
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle, waitForRelayConnection } from '../helpers/app';
import { createAccountFull } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, closeSettings } from '../helpers/navigation';
import { writeSync, waitForSync, resetSync } from '../helpers/sync';

describe('Two-Device Friend Request — User A', () => {
  let myDid = '';

  beforeAll(async () => {
    // Reset sync state — User A starts first
    resetSync();
    await launchApp({ newInstance: true, delete: true });
    await createAccountFull(
      FIXTURES.USER_A.displayName,
      FIXTURES.USER_A.pin,
      FIXTURES.USER_A.displayName.toLowerCase(),
    );
  });

  it('should verify relay connection after account creation', async () => {
    // Verify relay is connected after creating an account. This confirms
    // the WebSocket connection was established and the app is ready to
    // receive friend requests from User B.
    await waitForRelayConnection();
  });

  it('should read own DID from settings', async () => {
    await navigateToSettings();
    await waitFor(element(by.id(TEST_IDS.SETTINGS.DID_DISPLAY)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);

    const attrs = await element(by.id(TEST_IDS.SETTINGS.DID_DISPLAY)).getAttributes();
    // @ts-ignore — accessibilityValue.text has the full (non-truncated) DID
    myDid = attrs.value || attrs.text || attrs.label || '';

    if (!myDid.startsWith('did:key:z6Mk') || myDid.length < 48) {
      throw new Error(`Invalid DID read from settings: "${myDid}"`);
    }

    console.log(`[UserA] My DID: ${myDid.slice(0, 30)}...`);
    await closeSettings();
  });

  it('should publish DID to sync file for User B', async () => {
    writeSync('userA_did', myDid);
    writeSync('userA_name', FIXTURES.USER_A.displayName);
    writeSync('userA_ready', 'true');
    console.log('[UserA] Published DID to sync file');
  });

  it('should wait for User B to send friend request', async () => {
    // Wait up to 120 seconds for User B to create account and send request
    const status = await waitForSync('userB_request_sent', 120000);
    console.log(`[UserA] User B sent friend request: ${status}`);
  });

  it('should navigate to friends and check for incoming request', async () => {
    await navigateToFriends();
    await waitForUISettle();

    // Switch to Pending tab to see incoming requests
    await element(by.id(TEST_IDS.FRIENDS.TAB_PENDING)).tap();
    await waitForUISettle();

    // Wait for the incoming request to appear — may need time for relay delivery
    await waitFor(element(by.id(TEST_IDS.FRIENDS.CARD)))
      .toExist()
      .withTimeout(TIMEOUTS.MESSAGE_DELIVERY);
  });

  it('should accept the incoming friend request', async () => {
    // Tap the accept button on the incoming request card
    await element(by.id(TEST_IDS.FRIENDS.CARD_ACCEPT)).tap();
    await waitForUISettle();

    // Signal to User B that we accepted
    writeSync('userA_accepted', 'true');
    console.log('[UserA] Accepted friend request');
  });

  it('should show User B in the All friends tab', async () => {
    // Switch to All tab
    await element(by.id(TEST_IDS.FRIENDS.TAB_ALL)).tap();
    await waitForUISettle();

    // Wait for the friend to appear in the list
    await waitFor(element(by.id(TEST_IDS.FRIENDS.CARD)))
      .toExist()
      .withTimeout(TIMEOUTS.MESSAGE_DELIVERY);

    console.log('[UserA] Friend appeared in All tab — test complete');
  });
});
