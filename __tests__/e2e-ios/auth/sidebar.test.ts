/**
 * T2.2 Sidebar (Conversations) — Detox E2E Tests (iOS)
 *
 * Mirrors the Playwright web tests for the ChatSidebar component:
 * sidebar visibility, search input, friends button, conversation list,
 * and empty state when no conversations exist.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin, skipPin } from '../helpers/auth';
import { navigateToSettings, navigateToFriends, navigateHome, openConversation } from '../helpers/navigation';

describe('T2.2 Sidebar', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
  });

  it('T2.2.1 — sidebar container is visible on main screen', async () => {
    await waitFor(element(by.id(TEST_IDS.SIDEBAR.CONTAINER)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T2.2.2 — search input is present in sidebar', async () => {
    await expect(element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT))).toBeVisible();
  });

  it('T2.2.3 — friends button is present in sidebar', async () => {
    await expect(element(by.id(TEST_IDS.SIDEBAR.FRIENDS_BUTTON))).toBeVisible();
  });

  it('T2.2.4 — friends button navigates to friends page', async () => {
    await navigateToFriends();
    await expect(element(by.id(TEST_IDS.FRIENDS.PAGE))).toBeVisible();

    // Navigate back to home
    await navigateHome();
  });

  it('T2.2.5 — conversation list container is present', async () => {
    await expect(element(by.id(TEST_IDS.SIDEBAR.CONVERSATION_LIST))).toBeVisible();
  });

  it('T2.2.6 — empty state shown when no conversations exist', async () => {
    // With a fresh account, there should be no conversations
    await waitFor(element(by.id(TEST_IDS.SIDEBAR.EMPTY_STATE)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it('T2.2.7 — new chat button is visible in sidebar', async () => {
    await expect(element(by.id(TEST_IDS.SIDEBAR.NEW_CHAT_BUTTON))).toBeVisible();
  });

  it('T2.2.8 — guide button is present in sidebar', async () => {
    await expect(element(by.id(TEST_IDS.SIDEBAR.GUIDE_BUTTON))).toBeVisible();
  });

  it('T2.2.9 — marketplace button is present in sidebar', async () => {
    await expect(element(by.id(TEST_IDS.SIDEBAR.MARKETPLACE_BUTTON))).toBeVisible();
  });
});
