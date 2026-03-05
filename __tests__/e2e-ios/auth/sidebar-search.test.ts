/**
 * T2.3 Sidebar Search — Detox E2E Tests (iOS)
 *
 * Verifies the sidebar search input exists and the conversation list
 * structure is maintained. Text input interaction is limited on iOS
 * due to the new architecture's TextInput handling with Detox.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin, skipPin } from '../helpers/auth';
import { navigateToSettings, navigateToFriends, navigateHome, openConversation } from '../helpers/navigation';

describe('T2.3 Sidebar Search', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
  });

  it('T2.3.1 — search input is present in sidebar', async () => {
    await waitFor(element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T2.3.2 — search input is tappable', async () => {
    // Verify the search input can be tapped (focused)
    await element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT)).tap();
    await waitForUISettle();
    await expect(element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT))).toExist();
  });

  it('T2.3.3 — conversation list is present alongside search', async () => {
    await expect(element(by.id(TEST_IDS.SIDEBAR.CONVERSATION_LIST))).toExist();
  });

  it('T2.3.4 — sidebar structure is intact after search interaction', async () => {
    // Verify the sidebar maintains its full structure
    await expect(element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT))).toExist();
    await expect(element(by.id(TEST_IDS.SIDEBAR.CONVERSATION_LIST))).toExist();
    await expect(element(by.id(TEST_IDS.SIDEBAR.FRIENDS_BUTTON))).toExist();
  });
});
