/**
 * Discovery — Detox E2E Tests (iOS)
 *
 * Tests the connection link / discovery panel on the friends page:
 * visibility, copy link button functionality.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Discovery — Connection Link', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToFriends();
  });

  it('should display the connection link panel on the friends page', async () => {
    await waitFor(element(by.id(TEST_IDS.FRIENDS.CONNECTION_LINK)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('should show the copy link button', async () => {
    await expect(element(by.id(TEST_IDS.FRIENDS.COPY_LINK))).toBeVisible();
  });

  it('should tap the copy link button without error', async () => {
    await element(by.id(TEST_IDS.FRIENDS.COPY_LINK)).tap();
    await waitForUISettle();

    // A toast or visual feedback should confirm the link was copied
    await waitFor(element(by.id(TEST_IDS.COMMON.TOAST)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it('should still show the friends page after copying the link', async () => {
    await expect(element(by.id(TEST_IDS.FRIENDS.PAGE))).toBeVisible();
  });
});
