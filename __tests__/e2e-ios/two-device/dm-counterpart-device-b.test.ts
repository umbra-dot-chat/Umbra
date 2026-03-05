/**
 * DM Counterpart — Device B (iPhone 17 Pro Max)
 *
 * Generic Device B test that pairs with any Device A test following the
 * standard sync protocol (userA_ready → userB_request_sent → userA_accepted).
 *
 * User B creates an account, sends a friend request to User A, opens
 * the DM, and stays in the conversation to act as the receiving end.
 *
 * Use this as the Device B side when running:
 *   - sending-messages.test.ts
 *   - edit-delete-reply.test.ts
 *   - file-attachments.test.ts
 *   - message-types.test.ts
 *
 * Example:
 *   Terminal 1: npx detox test --configuration ios.release __tests__/e2e-ios/two-device/sending-messages.test.ts
 *   Terminal 2: npx detox test --configuration ios.release.userB __tests__/e2e-ios/two-device/dm-counterpart-device-b.test.ts
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccountFull } from '../helpers/auth';
import { navigateToFriends, navigateHome } from '../helpers/navigation';
import {
  sendMessage,
  waitForMessage,
  expectMessageVisible,
} from '../helpers/messaging';
import { writeSync, waitForSync } from '../helpers/sync';

describe('DM Counterpart — User B', () => {
  let userADid = '';
  let userAName = '';

  beforeAll(async () => {
    console.log('[CounterB] Waiting for User A to be ready...');
    await waitForSync('userA_ready', 120000);
    userADid = await waitForSync('userA_did', 5000);
    userAName = await waitForSync('userA_name', 5000);
    console.log(`[CounterB] Got User A DID: ${userADid.slice(0, 30)}...`);
    console.log(`[CounterB] Got User A name: ${userAName}`);

    await launchApp({ newInstance: true, delete: true });
    await createAccountFull(
      FIXTURES.USER_B.displayName,
      FIXTURES.USER_B.pin,
      FIXTURES.USER_B.displayName.toLowerCase(),
    );
  });

  it('should send friend request to User A', async () => {
    await navigateToFriends();
    await expect(element(by.id(TEST_IDS.FRIENDS.PAGE))).toExist();

    await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).tap();
    await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).typeText(userADid);
    await waitForUISettle();
    await element(by.id(TEST_IDS.FRIENDS.ADD_BUTTON)).tap();

    await waitFor(element(by.id(TEST_IDS.FRIENDS.ADD_FEEDBACK)))
      .toExist()
      .withTimeout(TIMEOUTS.NETWORK_CONNECT);

    const attrs = await element(by.id(TEST_IDS.FRIENDS.ADD_FEEDBACK)).getAttributes();
    // @ts-ignore
    const feedbackText: string = attrs.text || attrs.label || '';
    if (!feedbackText.toLowerCase().includes('sent')) {
      throw new Error(`Expected success but got: "${feedbackText}"`);
    }

    writeSync('userB_request_sent', 'true');
    console.log('[CounterB] Friend request sent');
  });

  it('should wait for User A to accept', async () => {
    await waitForSync('userA_accepted', 120000);
    console.log('[CounterB] User A accepted');
  });

  it('should open the DM conversation', async () => {
    let dmOpened = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await navigateHome();
        await new Promise((r) => setTimeout(r, attempt === 1 ? 5000 : 10000));

        await navigateToFriends();
        await waitFor(element(by.id(TEST_IDS.FRIENDS.PAGE)))
          .toExist()
          .withTimeout(TIMEOUTS.NAVIGATION);
        await waitForUISettle();

        await waitFor(element(by.id(TEST_IDS.FRIENDS.TAB_ALL)))
          .toBeVisible()
          .withTimeout(TIMEOUTS.NAVIGATION);
        await element(by.id(TEST_IDS.FRIENDS.TAB_ALL)).tap();
        await waitForUISettle();

        await waitFor(element(by.id(TEST_IDS.FRIENDS.CARD)))
          .toExist()
          .withTimeout(TIMEOUTS.NETWORK_CONNECT);

        await element(by.id(TEST_IDS.FRIENDS.CARD_MESSAGE)).tap();
        await waitForUISettle();

        await waitFor(element(by.id(TEST_IDS.CHAT.HEADER)))
          .toExist()
          .withTimeout(TIMEOUTS.NAVIGATION);

        dmOpened = true;
        break;
      } catch {
        console.log(`[CounterB] Attempt ${attempt}/3: Could not open DM yet`);
      }
    }

    if (!dmOpened) {
      throw new Error('Failed to open DM conversation');
    }

    writeSync('userB_in_dm', 'true');
    console.log('[CounterB] Opened DM — ready as counterpart');
  });

  it('should stay in DM and verify chat UI elements', async () => {
    await expect(element(by.id(TEST_IDS.CHAT.HEADER))).toExist();
    await expect(element(by.id(TEST_IDS.INPUT.CONTAINER))).toExist();
    await expect(element(by.id(TEST_IDS.INPUT.TEXT_INPUT))).toExist();
  });

  it('should wait for User A to complete their tests', async () => {
    // This test stays alive while User A runs their tests.
    // We wait for a generous timeout — User A will signal when done.
    // Try multiple possible completion signals.
    const signals = [
      'userA_sending_tests_done',
      'userA_edit_del_reply_done',
      'userA_file_attach_done',
      'userA_msg_types_done',
      'userA_dm_tests_done',
    ];

    let anyComplete = false;
    const startTime = Date.now();
    const maxWaitMs = 300000; // 5 minutes

    while (Date.now() - startTime < maxWaitMs) {
      for (const signal of signals) {
        try {
          const fs = require('fs');
          const data = JSON.parse(fs.readFileSync('/tmp/umbra-e2e-sync.json', 'utf8'));
          if (data[signal]) {
            console.log(`[CounterB] User A completed: ${signal}`);
            anyComplete = true;
            break;
          }
        } catch {
          // File not readable yet
        }
      }
      if (anyComplete) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (!anyComplete) {
      console.warn('[CounterB] User A did not signal completion within timeout');
    }
  });
});
