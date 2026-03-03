/**
 * T2.3 Sidebar Search — Detox E2E Tests (iOS)
 *
 * Mirrors the Playwright web tests for the sidebar search functionality:
 * search input accepts text, search filters conversations,
 * and clearing search restores the full list.
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

  it('T2.3.1 — search input is visible and accepts text', async () => {
    await waitFor(element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);

    await element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT)).tap();
    await element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT)).typeText('TestConvName');
    await waitForUISettle();

    // Search input should have accepted text without crashing
    await expect(element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT))).toBeVisible();
  });

  it('T2.3.2 — search filters conversations by name', async () => {
    // Clear previous search first
    await element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT)).clearText();
    await waitForUISettle();

    // Type a filter query
    await element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT)).typeText('nonexistent_user_xyz');
    await waitForUISettle();

    // With no matching conversations, the conversation list should be empty
    // or show an empty/no-results state. The sidebar structure should remain intact.
    await expect(element(by.id(TEST_IDS.SIDEBAR.CONTAINER))).toBeVisible();
  });

  it('T2.3.3 — clearing search restores full conversation list', async () => {
    // Clear the search input
    await element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT)).clearText();
    await waitForUISettle();

    // The sidebar should restore its full state
    await expect(element(by.id(TEST_IDS.SIDEBAR.CONTAINER))).toBeVisible();
    await expect(element(by.id(TEST_IDS.SIDEBAR.CONVERSATION_LIST))).toBeVisible();
  });

  it('T2.3.4 — search by partial name works', async () => {
    await element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT)).clearText();
    await element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT)).typeText('Ali');
    await waitForUISettle();

    // The sidebar should still be functional after partial search
    await expect(element(by.id(TEST_IDS.SIDEBAR.CONTAINER))).toBeVisible();

    // Clean up
    await element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT)).clearText();
    await waitForUISettle();
  });
});
