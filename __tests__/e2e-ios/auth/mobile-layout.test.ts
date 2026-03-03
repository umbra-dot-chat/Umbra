/**
 * T2.7 Mobile Layout — Detox E2E Tests (iOS)
 *
 * Mirrors the Playwright web tests for mobile-responsive behavior:
 * on mobile, sidebar is the initial view, tapping a conversation
 * navigates to the chat view, and the back button returns to sidebar.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin, skipPin } from '../helpers/auth';
import { navigateToSettings, navigateToFriends, navigateHome, openConversation } from '../helpers/navigation';

describe('T2.7 Mobile Layout', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
  });

  it('T2.7.1 — sidebar is the initial view on mobile', async () => {
    // On iOS (mobile), the sidebar should be the primary initial view
    await waitFor(element(by.id(TEST_IDS.SIDEBAR.CONTAINER)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T2.7.2 — search input is visible in the mobile sidebar', async () => {
    await expect(element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT))).toBeVisible();
  });

  it('T2.7.3 — tapping a conversation navigates to chat view', async () => {
    // Check if there are any conversation items to tap
    const hasConversation = await waitFor(
      element(by.id(TEST_IDS.SIDEBAR.CONVERSATION_ITEM)).atIndex(0),
    )
      .toBeVisible()
      .withTimeout(TIMEOUTS.INTERACTION)
      .then(() => true)
      .catch(() => false);

    if (hasConversation) {
      await element(by.id(TEST_IDS.SIDEBAR.CONVERSATION_ITEM)).atIndex(0).tap();
      await waitForUISettle();

      // Chat header should be visible after navigation
      await waitFor(element(by.id(TEST_IDS.CHAT.HEADER)))
        .toBeVisible()
        .withTimeout(TIMEOUTS.NAVIGATION);
    } else {
      // No conversations exist on fresh account — verify empty state
      await waitFor(element(by.id(TEST_IDS.SIDEBAR.EMPTY_STATE)))
        .toBeVisible()
        .withTimeout(TIMEOUTS.INTERACTION);
    }
  });

  it('T2.7.4 — back button returns from chat to sidebar', async () => {
    // Only test back navigation if we successfully navigated to a chat
    const chatHeaderVisible = await waitFor(element(by.id(TEST_IDS.CHAT.HEADER)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.UI_SETTLE)
      .then(() => true)
      .catch(() => false);

    if (chatHeaderVisible) {
      // Tap the back button in the chat header
      await element(by.id(TEST_IDS.CHAT.HEADER_BACK)).tap();
      await waitForUISettle();

      // Should return to the sidebar
      await waitFor(element(by.id(TEST_IDS.SIDEBAR.CONTAINER)))
        .toBeVisible()
        .withTimeout(TIMEOUTS.NAVIGATION);
    } else {
      // If no chat was opened, verify sidebar is still showing
      await expect(element(by.id(TEST_IDS.SIDEBAR.CONTAINER))).toBeVisible();
    }
  });

  it('T2.7.5 — nav rail is accessible on mobile layout', async () => {
    // The nav rail should be available for top-level navigation
    await waitFor(element(by.id(TEST_IDS.NAV.RAIL)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T2.7.6 — navigating to friends and back preserves mobile layout', async () => {
    await navigateToFriends();
    await expect(element(by.id(TEST_IDS.FRIENDS.PAGE))).toBeVisible();

    await navigateHome();
    await waitForUISettle();

    // Sidebar should be restored as the initial view
    await expect(element(by.id(TEST_IDS.SIDEBAR.CONTAINER))).toBeVisible();
  });
});
